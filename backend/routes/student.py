from fastapi import APIRouter, Depends, HTTPException
from database import get_database
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from core.config import settings

router = APIRouter(prefix="/student", tags=["Student"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_student(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "student":
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/dashboard-stats")
async def get_student_dashboard(student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]
    
    # Fetch full student profile to check approval status
    from bson import ObjectId
    user = await db["users"].find_one({"_id": ObjectId(student_id)})
    
    college_id = user.get("college_id")
    is_approved = user.get("is_college_approved", False)
    
    recommended_jobs = []
    recent_applications = []
    stats = {
        "total_applications": 0,
        "in_review": 0,
        "shortlisted": 0,
        "rejected": 0
    }
    
    if is_approved and not user.get("is_suspended", False):
        apps_cursor = db["applications"].find({"student_id": student_id}).sort("created_at", -1)
        applied_job_ids = set()
        async for app in apps_cursor:
            app["_id"] = str(app["_id"])
            app["id"] = str(app["_id"])
            if "created_at" in app and app["created_at"]:
                app["created_at"] = app["created_at"].isoformat() if hasattr(app["created_at"], "isoformat") else str(app["created_at"])
            recent_applications.append(app)
            applied_job_ids.add(app.get("job_id"))
            
            stats["total_applications"] += 1
            status = app.get("status", "In Review")
            if status == "In Review":
                stats["in_review"] += 1
            elif status in ["Shortlisted", "Offer Sent", "Hired", "Accepted"]:
                stats["shortlisted"] += 1
            elif status == "Rejected":
                stats["rejected"] += 1
                
        # Fetch jobs visible to this student: public OR targeted to student's college
        query = {
            "status": "active",
            "$or": [
                {"visibility": "public"},
                {"visibility": {"$exists": False}},
                {"visibility": "requested_college", "target_colleges": college_id}
            ]
        }
        jobs_cursor = db["jobs"].find(query).sort("created_at", -1).limit(20)
        async for job in jobs_cursor:
            job["_id"] = str(job["_id"])
            job["id"] = str(job["_id"])
            if "created_at" in job and job["created_at"]:
                job["created_at"] = job["created_at"].isoformat() if hasattr(job["created_at"], "isoformat") else str(job["created_at"])
            job["has_applied"] = str(job["_id"]) in applied_job_ids
            recommended_jobs.append(job)

    return {
        "is_college_approved": is_approved,
        "college_id": college_id,
        "stats": stats,
        "recommended_jobs": recommended_jobs,
        "recent_applications": recent_applications
    }

@router.post("/apply/{job_id}")
async def apply_job(job_id: str, student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]
    
    from bson import ObjectId
    user = await db["users"].find_one({"_id": ObjectId(student_id)})
    
    if user.get("is_suspended", False):
        raise HTTPException(status_code=403, detail="You are suspended and cannot apply for jobs")
        
    if not user.get("is_college_approved", False):
        raise HTTPException(status_code=403, detail="Your college has not approved your account yet")
        
    job = await db["jobs"].find_one({"_id": ObjectId(job_id)})
    if not job or job.get("status") != "active":
        raise HTTPException(status_code=404, detail="Job not found or is no longer active")
        
    visibility = job.get("visibility", "public")
    if visibility == "requested_college":
        target_colleges = job.get("target_colleges", [])
        if user.get("college_id") not in target_colleges:
            raise HTTPException(status_code=403, detail="This job opportunity is restricted to students of specific invited colleges.")
            
    existing_app = await db["applications"].find_one({"job_id": job_id, "student_id": student_id})
    if existing_app:
        raise HTTPException(status_code=400, detail="You have already applied for this job")
        
    from datetime import datetime
    application_dict = {
        "job_id": job_id,
        "job_title": job.get("title", "Unknown Job"),
        "company_id": job.get("company_id"),
        "company_name": job.get("company_name", "Company"),
        "student_id": student_id,
        "student_name": user.get("name", user.get("email")),
        "student_email": user.get("email"),
        "college_id": user.get("college_id"),
        "status": "In Review",
        "created_at": datetime.utcnow()
    }
    
    await db["applications"].insert_one(application_dict)
    await db["jobs"].update_one({"_id": ObjectId(job_id)}, {"$inc": {"applications_count": 1}})
    
    from database import log_activity
    await log_activity(
        user_id=student_id,
        user_name=user.get("name", user.get("email")),
        role="student",
        action_type="job_apply",
        details=f"Applied for job: {job.get('title')} at {job.get('company_name', 'Company')}"
    )
    
    return {"message": "Successfully applied for job"}
