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
        # Load college-specific job eligibility rules if student belongs to a college
        college_rules_map = {}
        if college_id:
            async for rule in db["college_job_rules"].find({"college_id": college_id}):
                college_rules_map[rule["job_id"]] = rule

        from routes.college import _student_matches_rule

        jobs_cursor = db["jobs"].find(query).sort("created_at", -1).limit(50)
        async for job in jobs_cursor:
            jid = str(job["_id"])
            visibility = job.get("visibility", "public")
            rule = college_rules_map.get(jid)

            if visibility == "requested_college":
                # Campus drives ONLY distribute to students AFTER the college accepts & sets criteria,
                # and ONLY show to students matching those criteria!
                if not rule or not rule.get("criteria_configured", False) or rule.get("is_open", False) is False:
                    continue
                is_eligible, reason = _student_matches_rule(user, rule)
                if not is_eligible:
                    continue
            else:
                # Public opportunities are open to ALL approved students across all colleges
                if rule and rule.get("is_open", True) is False:
                    continue
                is_eligible, reason = _student_matches_rule(user, rule) if rule else (True, "")
                if not is_eligible:
                    continue

            criteria_tags = []
            if rule:
                if rule.get("min_cgpa"):
                    criteria_tags.append(f"CGPA ≥ {rule['min_cgpa']}")
                if rule.get("allowed_batches"):
                    criteria_tags.append(f"Batch {', '.join(rule['allowed_batches'])}")
                if rule.get("allowed_branches"):
                    criteria_tags.append(f"Branch {', '.join(rule['allowed_branches'])}")
                if rule.get("max_backlogs") is not None:
                    criteria_tags.append(f"Max Backlogs: {rule['max_backlogs']}")
                if rule.get("specific_student_ids"):
                    criteria_tags.append("Selected Students Only")

            job["_id"] = jid
            job["id"] = jid
            if "created_at" in job and job["created_at"]:
                job["created_at"] = job["created_at"].isoformat() if hasattr(job["created_at"], "isoformat") else str(job["created_at"])
            job["has_applied"] = jid in applied_job_ids
            job["college_eligible"] = True
            job["eligibility_reason"] = ""
            job["college_criteria_tags"] = criteria_tags
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

        college_rule = await db["college_job_rules"].find_one({
            "college_id": user.get("college_id"),
            "job_id": job_id,
        })
        if not college_rule or not college_rule.get("criteria_configured", False) or college_rule.get("is_open", False) is False:
            raise HTTPException(
                status_code=403,
                detail="This campus drive has not been opened by your college placement cell yet.",
            )
        from routes.college import _student_matches_rule
        is_eligible, reason = _student_matches_rule(user, college_rule)
        if not is_eligible:
            raise HTTPException(status_code=403, detail=reason or "You do not meet your college's eligibility criteria for this drive.")
    elif user.get("college_id"):
        # Public job: open to all unless college explicitly closed/restricted it
        college_rule = await db["college_job_rules"].find_one({
            "college_id": user.get("college_id"),
            "job_id": job_id,
        })
        if college_rule:
            from routes.college import _student_matches_rule
            is_eligible, reason = _student_matches_rule(user, college_rule)
            if not is_eligible:
                raise HTTPException(status_code=403, detail=reason or "You do not meet your college's eligibility criteria for this job.")
            
    existing_app = await db["applications"].find_one({"job_id": job_id, "student_id": student_id})
    if existing_app:
        raise HTTPException(status_code=400, detail="You have already applied for this job")

    # Enforce admin max active applications limit if configured
    controls = await db["settings"].find_one({"type": "platform_controls"}) or {}
    max_apps = int(controls.get("max_active_applications_per_student") or 0)
    if max_apps > 0:
        active_app_count = await db["applications"].count_documents({
            "student_id": student_id,
            "status": {"$ne": "Rejected"},
        })
        if active_app_count >= max_apps:
            raise HTTPException(
                status_code=400,
                detail=f"Application limit reached ({max_apps} active applications allowed by platform policy).",
            )
        
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
