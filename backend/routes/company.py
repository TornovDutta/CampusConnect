from fastapi import APIRouter, Depends, HTTPException
from database import get_database
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from core.config import settings
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/company", tags=["Company"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_company(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "company":
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

from typing import Optional, List, Union
from bson import ObjectId

class JobCreate(BaseModel):
    title: str
    location: str
    description: str
    job_type: str
    employment_type: str
    stipend: Optional[str] = None
    working_hours: Optional[str] = None
    prerequisites: Optional[Union[List[str], str]] = None
    visibility: str = "public"  # "public" or "requested_college"
    target_colleges: Optional[List[str]] = []
    apply_type: str = "easy_apply"  # "easy_apply" or "external_link"
    external_link: Optional[str] = None

@router.get("/dashboard-stats")
async def get_company_dashboard(company=Depends(get_current_company)):
    db = get_database()
    jobs_collection = db["jobs"]
    applications_collection = db["applications"]
    company_id = company.get("sub")
    
    active_jobs = await jobs_collection.count_documents({"company_id": company_id, "status": "active"})
    total_applications = await applications_collection.count_documents({"company_id": company_id})
    offers_sent = await applications_collection.count_documents({"company_id": company_id, "status": "Offer Sent"})
    
    recent_jobs_cursor = jobs_collection.find({"company_id": company_id}).sort("created_at", -1).limit(10)
    recent_jobs = []
    async for job in recent_jobs_cursor:
        job["_id"] = str(job["_id"])
        count = await applications_collection.count_documents({"job_id": str(job["_id"])})
        job["applications_count"] = count
        recent_jobs.append(job)
        
    return {
        "stats": {
            "active_jobs": active_jobs,
            "total_applications": total_applications,
            "offers_sent": offers_sent
        },
        "recent_jobs": recent_jobs
    }

@router.post("/jobs")
async def create_job(job_in: JobCreate, company=Depends(get_current_company)):
    db = get_database()
    jobs_collection = db["jobs"]
    users_collection = db["users"]
    
    company_id = company.get("sub")
    company_user = await users_collection.find_one({"_id": ObjectId(company_id)})
    company_name = company_user.get("name") if company_user and company_user.get("name") else company_user.get("email", "Company") if company_user else "Company"

    job_dict = job_in.model_dump()
    clean_colleges = [str(c).strip() for c in (job_in.target_colleges or []) if str(c).strip()]
    if job_in.visibility == "requested_college":
        if not clean_colleges:
            raise HTTPException(status_code=400, detail="Please select at least one target college for a Campus Drive.")
        job_dict["target_colleges"] = clean_colleges
        job_dict["college_responses"] = {cid: "pending" for cid in clean_colleges}
    else:
        job_dict["visibility"] = "public"
        job_dict["target_colleges"] = []
        job_dict["college_responses"] = {}

    job_dict["company_id"] = company_id
    job_dict["company_name"] = company_name
    job_dict["status"] = "active"
    job_dict["applications_count"] = 0
    job_dict["created_at"] = datetime.utcnow()
    
    result = await jobs_collection.insert_one(job_dict)
    job_id_str = str(result.inserted_id)

    # Notify invited colleges (for campus drives) or students (for public opportunities)
    try:
        now = datetime.utcnow()
        if job_dict["visibility"] == "requested_college" and clean_colleges:
            notif_docs = [
                {
                    "recipient_id": cid,
                    "title": f"New Campus Drive Invitation: {job_in.title}",
                    "message": f"{company_name} invited your college to a campus drive for '{job_in.title}'. Review the invitation and set student eligibility criteria (CGPA/batch/branch) to open applications.",
                    "type": "announcement",
                    "priority": "high",
                    "job_id": job_id_str,
                    "read_by": [],
                    "dismissed_by": [],
                    "is_read": False,
                    "created_at": now,
                }
                for cid in clean_colleges
            ]
            await db["notifications"].insert_many(notif_docs)
        elif job_dict["visibility"] == "public":
            await db["notifications"].insert_one({
                "recipient_role": "student",
                "title": f"New Public Job Open: {job_in.title}",
                "message": f"{company_name} posted a public opportunity for '{job_in.title}' ({job_in.location}). Open to all verified students!",
                "type": "announcement",
                "priority": "normal",
                "job_id": job_id_str,
                "read_by": [],
                "dismissed_by": [],
                "is_read": False,
                "created_at": now,
            })
    except Exception as e:
        print(f"Failed to create job notifications: {e}")
    
    if job_in.prerequisites:
        pre_list = job_in.prerequisites if isinstance(job_in.prerequisites, list) else [job_in.prerequisites]
        for p in pre_list:
            if p and isinstance(p, str) and p.strip():
                await db["prerequisites"].update_one(
                    {"name": p.strip()},
                    {"$set": {"name": p.strip()}},
                    upsert=True
                )
    
    from database import log_activity
    await log_activity(
        user_id=company_id,
        user_name=company_name,
        role="company",
        action_type="job_post",
        details=f"Posted a new {job_in.visibility} job: {job_in.title}"
    )
    
    return {"message": "Job posted successfully", "job_id": str(result.inserted_id)}

@router.get("/prerequisites")
async def get_prerequisites(company=Depends(get_current_company)):
    db = get_database()
    prereq_collection = db["prerequisites"]
    count = await prereq_collection.count_documents({})
    if count == 0:
        default_skills = [
            "B.Tech / B.E.", "M.Tech / M.E.", "MCA / MSc IT", "BSc / BCA", "MBA / PGDM",
            "Final Year Student", "Pre-final Year Student", "No Active Backlogs",
            "Min 7.0 CGPA / 70%", "Min 8.0 CGPA / 80%",
            "Python", "Java", "C++", "React.js", "Node.js", "JavaScript", "TypeScript",
            "SQL / MongoDB", "Machine Learning / AI", "Data Structures & Algorithms", "Cloud / DevOps"
        ]
        for skill in default_skills:
            await prereq_collection.update_one({"name": skill}, {"$set": {"name": skill}}, upsert=True)
            
    cursor = prereq_collection.find().sort("name", 1)
    suggestions = []
    async for doc in cursor:
        if "name" in doc and doc["name"]:
            suggestions.append(doc["name"])
    return suggestions

@router.get("/jobs/{job_id}/candidates")
async def get_job_candidates(job_id: str, company=Depends(get_current_company)):
    db = get_database()
    applications_collection = db["applications"]
    company_id = company.get("sub")
    
    cursor = applications_collection.find({"job_id": job_id, "company_id": company_id}).sort("created_at", -1)
    candidates = []
    async for app in cursor:
        app["_id"] = str(app["_id"])
        candidates.append(app)
    return candidates

@router.get("/jobs/{job_id}")
async def get_job(job_id: str, company=Depends(get_current_company)):
    db = get_database()
    jobs_collection = db["jobs"]
    company_id = company.get("sub")
    
    job = await jobs_collection.find_one({"_id": ObjectId(job_id), "company_id": company_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job["_id"] = str(job["_id"])
    return job

@router.put("/jobs/{job_id}")
async def update_job(job_id: str, job_in: JobCreate, company=Depends(get_current_company)):
    db = get_database()
    jobs_collection = db["jobs"]
    company_id = company.get("sub")
    
    # Check if job exists and belongs to company
    existing_job = await jobs_collection.find_one({"_id": ObjectId(job_id), "company_id": company_id})
    if not existing_job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    update_data = job_in.model_dump()
    clean_colleges = [str(c).strip() for c in (job_in.target_colleges or []) if str(c).strip()]
    existing_responses = existing_job.get("college_responses", {}) or {}
    newly_invited = []

    if job_in.visibility == "requested_college":
        if not clean_colleges:
            raise HTTPException(status_code=400, detail="Please select at least one target college for a Campus Drive.")
        update_data["target_colleges"] = clean_colleges
        new_responses = {}
        for cid in clean_colleges:
            if cid in existing_responses:
                new_responses[cid] = existing_responses[cid]
            else:
                new_responses[cid] = "pending"
                newly_invited.append(cid)
        update_data["college_responses"] = new_responses
    else:
        update_data["visibility"] = "public"
        update_data["target_colleges"] = []
        update_data["college_responses"] = {}

    update_data["updated_at"] = datetime.utcnow()
    
    result = await jobs_collection.update_one(
        {"_id": ObjectId(job_id), "company_id": company_id},
        {"$set": update_data}
    )

    if newly_invited:
        try:
            now = datetime.utcnow()
            company_name = existing_job.get("company_name", "Company")
            await db["notifications"].insert_many([
                {
                    "recipient_id": cid,
                    "title": f"New Campus Drive Invitation: {job_in.title}",
                    "message": f"{company_name} invited your college to '{job_in.title}'. Review and set student criteria to open applications.",
                    "type": "announcement",
                    "priority": "high",
                    "job_id": job_id,
                    "read_by": [],
                    "dismissed_by": [],
                    "is_read": False,
                    "created_at": now,
                }
                for cid in newly_invited
            ])
        except Exception as e:
            print(f"Failed to notify newly invited colleges: {e}")
    
    if job_in.prerequisites:
        pre_list = job_in.prerequisites if isinstance(job_in.prerequisites, list) else [job_in.prerequisites]
        for p in pre_list:
            if p and isinstance(p, str) and p.strip():
                await db["prerequisites"].update_one(
                    {"name": p.strip()},
                    {"$set": {"name": p.strip()}},
                    upsert=True
                )
    
    from database import log_activity
    await log_activity(
        user_id=company_id,
        user_name=existing_job.get("company_name", "Company"),
        role="company",
        action_type="job_update",
        details=f"Updated job posting: {job_in.title}"
    )
    
    return {"message": "Job updated successfully"}

@router.get("/all-jobs")
async def get_all_jobs(company=Depends(get_current_company)):
    db = get_database()
    jobs_collection = db["jobs"]
    applications_collection = db["applications"]
    company_id = company.get("sub")

    # Map college names for status badges
    college_names = {}
    async for c in db["users"].find({"role": "college"}, {"name": 1, "email": 1}):
        college_names[str(c["_id"])] = c.get("name") or c.get("email") or "College"

    cursor = jobs_collection.find({"company_id": company_id}).sort("created_at", -1)
    jobs = []
    async for job in cursor:
        jid = str(job["_id"])
        job["_id"] = jid
        count = await applications_collection.count_documents({"job_id": jid})
        job["applications_count"] = count

        # Include live per-college distribution status for requested_college drives
        college_statuses = []
        if job.get("visibility") == "requested_college":
            responses = job.get("college_responses", {}) or {}
            rules_by_college = {}
            async for rule in db["college_job_rules"].find({"job_id": jid}):
                rules_by_college[rule.get("college_id")] = rule
            for cid in (job.get("target_colleges") or []):
                rule = rules_by_college.get(cid)
                is_live = bool(rule and rule.get("is_open", True) and rule.get("criteria_configured", False))
                decision = responses.get(cid, "accepted" if is_live else "pending")
                college_statuses.append({
                    "college_id": cid,
                    "college_name": college_names.get(cid, "College"),
                    "decision": decision,
                    "is_live": is_live,
                })
        job["college_statuses"] = college_statuses
        jobs.append(job)
    return jobs

@router.get("/all-applications")
async def get_all_applications(company=Depends(get_current_company)):
    db = get_database()
    applications_collection = db["applications"]
    company_id = company.get("sub")
    
    cursor = applications_collection.find({"company_id": company_id}).sort("created_at", -1)
    applications = []
    async for app in cursor:
        app["_id"] = str(app["_id"])
        applications.append(app)
    return applications

class UpdateStatusRequest(BaseModel):
    status: str
    interview_date: Optional[str] = None
    interview_time: Optional[str] = None
    interview_link: Optional[str] = None
    interview_mode: Optional[str] = None
    interview_instructions: Optional[str] = None
    feedback: Optional[str] = None

@router.patch("/applications/{application_id}/status")
async def update_application_status(application_id: str, status_in: UpdateStatusRequest, company=Depends(get_current_company)):
    db = get_database()
    company_id = company.get("sub")
    
    app = await db["applications"].find_one({"_id": ObjectId(application_id), "company_id": company_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")
        
    now = datetime.utcnow()
    update_data: dict = {
        "status": status_in.status,
        "updated_at": now
    }
    
    if status_in.interview_date is not None:
        update_data["interview_date"] = status_in.interview_date
    if status_in.interview_time is not None:
        update_data["interview_time"] = status_in.interview_time
    if status_in.interview_link is not None:
        update_data["interview_link"] = status_in.interview_link
    if status_in.interview_mode is not None:
        update_data["interview_mode"] = status_in.interview_mode
    if status_in.interview_instructions is not None:
        update_data["interview_instructions"] = status_in.interview_instructions
    if status_in.feedback is not None:
        update_data["feedback"] = status_in.feedback

    timeline_entry = {
        "status": status_in.status,
        "title": f"Status updated to {status_in.status}",
        "description": status_in.feedback or f"Candidate application status progressed to {status_in.status}.",
        "interview_date": status_in.interview_date,
        "interview_time": status_in.interview_time,
        "interview_link": status_in.interview_link,
        "timestamp": now.isoformat()
    }
    
    result = await db["applications"].update_one(
        {"_id": ObjectId(application_id), "company_id": company_id},
        {
            "$set": update_data,
            "$push": {"timeline": timeline_entry}
        }
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Application update failed")

    # Send direct notification to candidate
    student_id = app.get("student_id")
    if student_id:
        notif_title = f"Application Update: {app.get('job_title', 'Job')}"
        notif_msg = f"Your application for {app.get('job_title')} at {app.get('company_name', 'Company')} has been updated to '{status_in.status}'."
        if status_in.status.lower() in ["interview scheduled", "interview"]:
            notif_title = f"Interview Scheduled: {app.get('job_title')}"
            notif_msg = f"An interview has been scheduled on {status_in.interview_date or 'TBD'} at {status_in.interview_time or 'TBD'}. Mode: {status_in.interview_mode or 'Online'}."
        elif status_in.status.lower() in ["offer sent", "selected", "hired"]:
            notif_title = f"Job Offer: {app.get('job_title')}"
            notif_msg = f"Congratulations! {app.get('company_name', 'Company')} has extended an offer for {app.get('job_title')}!"

        try:
            await db["notifications"].insert_one({
                "recipient_id": student_id,
                "title": notif_title,
                "message": notif_msg,
                "type": "application",
                "priority": "high",
                "job_id": app.get("job_id"),
                "application_id": str(app["_id"]),
                "read_by": [],
                "dismissed_by": [],
                "is_read": False,
                "created_at": now
            })
        except Exception:
            pass

    return {"message": "Status updated successfully"}

