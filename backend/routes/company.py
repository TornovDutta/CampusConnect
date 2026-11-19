from fastapi import APIRouter, Depends, HTTPException, Query
from database import get_database, log_activity
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from core.config import settings
from pydantic import BaseModel
from typing import Optional, List, Union, Dict, Any
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/company", tags=["Company"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def _safe_iso(val) -> str:
    if isinstance(val, datetime):
        return val.isoformat()
    return str(val) if val else ""

async def get_current_company(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "company":
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

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

# =====================================================================
# REQUEST MODELS FOR ADVANCED COMPANY OPERATIONS
# =====================================================================

class UpdateStatusRequest(BaseModel):
    status: str
    interview_date: Optional[str] = None
    interview_time: Optional[str] = None
    interview_link: Optional[str] = None
    interview_mode: Optional[str] = None
    interview_instructions: Optional[str] = None
    feedback: Optional[str] = None

class ScheduleInterviewRequest(BaseModel):
    interview_date: str
    interview_time: str
    interview_mode: Optional[str] = "Virtual (In-Portal / Google Meet)"
    interview_link: Optional[str] = "https://meet.google.com/new"
    round_type: Optional[str] = "Technical Round"  # "Technical Round", "Behavioral & HR Round", "Final Culture Fit"
    interview_instructions: Optional[str] = "Please join 5 minutes early with your camera enabled and code editor ready."

class EvaluateInterviewRequest(BaseModel):
    round_type: str  # "technical" | "behavioral" | "mixed"
    technical_scores: Optional[Dict[str, int]] = None  # problem_solving, dsa, code_quality, system_design (1-5)
    behavioral_scores: Optional[Dict[str, int]] = None  # communication, culture_fit, leadership, star_method (1-5)
    recommendation: str  # "strong_hire" | "hire" | "next_round" | "reject"
    technical_notes: Optional[str] = None
    behavioral_notes: Optional[str] = None
    overall_feedback: Optional[str] = None
    next_stage: Optional[str] = None

class CompanyMessageRequest(BaseModel):
    message: str

class OfferLetterRequest(BaseModel):
    designation: str
    ctc_or_stipend: str
    joining_date: str
    offer_notes: Optional[str] = None

class TalentInviteRequest(BaseModel):
    job_id: str
    message: Optional[str] = None


# =====================================================================
# 1. APPLICATION MONITORING & TRACKING PIPELINE
# =====================================================================

@router.get("/all-applications")
async def get_all_applications(
    job_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    company=Depends(get_current_company)
):
    db = get_database()
    company_id = company.get("sub")
    
    query: dict = {"company_id": company_id}
    if job_id and job_id.strip():
        query["job_id"] = job_id.strip()
    if status and status.strip() and status.lower() != "all":
        query["status"] = {"$regex": f"^{status.strip()}$", "$options": "i"}

    cursor = db["applications"].find(query).sort("created_at", -1).limit(200)
    applications = []

    # Cache college names for quick lookup
    college_names = {}
    async for c in db["users"].find({"role": "college"}, {"name": 1, "email": 1}):
        college_names[str(c["_id"])] = c.get("name", "College")

    async for app in cursor:
        app_id = str(app["_id"])
        student_id = app.get("student_id")

        # Fetch student details for deep candidate tracking
        student_doc = None
        if student_id:
            try:
                student_doc = await db["users"].find_one({"_id": ObjectId(student_id)})
            except Exception:
                pass

        cid = app.get("college_id") or (student_doc.get("college_id") if student_doc else None)
        college_name = college_names.get(cid, "Registered College")

        # Search filter if provided
        if search and search.strip():
            sq = search.strip().lower()
            cand_name = (app.get("student_name") or (student_doc.get("name") if student_doc else "")).lower()
            cand_email = (app.get("student_email") or (student_doc.get("email") if student_doc else "")).lower()
            job_title = (app.get("job_title") or "").lower()
            if sq not in cand_name and sq not in cand_email and sq not in job_title and sq not in college_name.lower():
                continue

        applications.append({
            "_id": app_id,
            "id": app_id,
            "job_id": app.get("job_id"),
            "job_title": app.get("job_title", "Position"),
            "company_name": app.get("company_name", "Company"),
            "student_id": student_id,
            "student_name": app.get("student_name") or (student_doc.get("name") if student_doc else "Candidate"),
            "student_email": app.get("student_email") or (student_doc.get("email") if student_doc else ""),
            "student_phone": app.get("student_phone") or (student_doc.get("phone") if student_doc else ""),
            "student_cgpa": app.get("student_cgpa") if app.get("student_cgpa") is not None else (student_doc.get("cgpa") if student_doc else None),
            "student_branch": app.get("student_branch") or (student_doc.get("branch") if student_doc else ""),
            "student_batch": app.get("student_batch") or (student_doc.get("batch") if student_doc else ""),
            "student_roll_number": student_doc.get("roll_number") if student_doc else "",
            "college_id": cid,
            "college_name": college_name,
            "status": app.get("status", "In Review"),
            "cover_note": app.get("cover_note", ""),
            "resume_url": app.get("resume_url") or (student_doc.get("resume_url") if student_doc else ""),
            "resume_filename": app.get("resume_filename") or (student_doc.get("resume_filename") if student_doc else "Resume.pdf"),
            "skills": (student_doc.get("skills") if student_doc else []) or [],
            "interview_date": app.get("interview_date"),
            "interview_time": app.get("interview_time"),
            "interview_link": app.get("interview_link"),
            "interview_mode": app.get("interview_mode", "Virtual"),
            "interview_instructions": app.get("interview_instructions"),
            "round_type": app.get("round_type", "Technical Round"),
            "latest_scorecard": app.get("latest_scorecard"),
            "offer_details": app.get("offer_details"),
            "timeline": app.get("timeline") or [],
            "created_at": _safe_iso(app.get("created_at")),
            "updated_at": _safe_iso(app.get("updated_at")),
        })

    return applications


@router.get("/applications/{application_id}")
async def get_application_dossier(application_id: str, company=Depends(get_current_company)):
    db = get_database()
    company_id = company.get("sub")
    
    app = await db["applications"].find_one({"_id": ObjectId(application_id), "company_id": company_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    student_id = app.get("student_id")
    student_doc = await db["users"].find_one({"_id": ObjectId(student_id)}) if student_id else None
    job_doc = await db["jobs"].find_one({"_id": ObjectId(app.get("job_id"))}) if app.get("job_id") else None

    # Fetch college
    cid = app.get("college_id") or (student_doc.get("college_id") if student_doc else None)
    college_doc = await db["users"].find_one({"_id": ObjectId(cid)}) if cid else None

    return {
        "id": str(app["_id"]),
        "_id": str(app["_id"]),
        "job_id": app.get("job_id"),
        "job_title": app.get("job_title"),
        "job_details": job_doc,
        "company_name": app.get("company_name"),
        "student_id": student_id,
        "student_name": app.get("student_name") or (student_doc.get("name") if student_doc else ""),
        "student_email": app.get("student_email") or (student_doc.get("email") if student_doc else ""),
        "student_phone": student_doc.get("phone") if student_doc else "",
        "student_cgpa": student_doc.get("cgpa") if student_doc else None,
        "student_branch": student_doc.get("branch") if student_doc else "",
        "student_batch": student_doc.get("batch") if student_doc else "",
        "student_roll_number": student_doc.get("roll_number") if student_doc else "",
        "skills": student_doc.get("skills", []) if student_doc else [],
        "bio": student_doc.get("bio", "") if student_doc else "",
        "github_url": student_doc.get("github_url", "") if student_doc else "",
        "linkedin_url": student_doc.get("linkedin_url", "") if student_doc else "",
        "college_id": cid,
        "college_name": college_doc.get("name", "College") if college_doc else "College",
        "status": app.get("status", "In Review"),
        "cover_note": app.get("cover_note", ""),
        "resume_url": app.get("resume_url") or (student_doc.get("resume_url") if student_doc else ""),
        "resume_filename": app.get("resume_filename") or (student_doc.get("resume_filename") if student_doc else "Resume.pdf"),
        "interview_date": app.get("interview_date"),
        "interview_time": app.get("interview_time"),
        "interview_link": app.get("interview_link"),
        "interview_mode": app.get("interview_mode"),
        "round_type": app.get("round_type"),
        "latest_scorecard": app.get("latest_scorecard"),
        "offer_details": app.get("offer_details"),
        "timeline": app.get("timeline") or [],
        "created_at": _safe_iso(app.get("created_at")),
    }


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
            notif_title = f"🎉 Job Offer: {app.get('job_title')}"
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


# =====================================================================
# 2. IN-PORTAL INTERVIEW CONDUCTOR (TECHNICAL & BEHAVIORAL)
# =====================================================================

@router.post("/applications/{application_id}/interview/schedule")
async def schedule_candidate_interview(
    application_id: str,
    req: ScheduleInterviewRequest,
    company=Depends(get_current_company)
):
    db = get_database()
    company_id = company.get("sub")

    app = await db["applications"].find_one({"_id": ObjectId(application_id), "company_id": company_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")

    now = datetime.utcnow()
    new_status = "Interview Scheduled"

    timeline_entry = {
        "status": new_status,
        "title": f"{req.round_type} Scheduled",
        "description": f"Scheduled on {req.interview_date} at {req.interview_time}. Mode: {req.interview_mode}. {req.interview_instructions}",
        "interview_date": req.interview_date,
        "interview_time": req.interview_time,
        "interview_link": req.interview_link,
        "round_type": req.round_type,
        "timestamp": now.isoformat()
    }

    await db["applications"].update_one(
        {"_id": ObjectId(application_id)},
        {
            "$set": {
                "status": new_status,
                "interview_date": req.interview_date,
                "interview_time": req.interview_time,
                "interview_mode": req.interview_mode,
                "interview_link": req.interview_link,
                "round_type": req.round_type,
                "interview_instructions": req.interview_instructions,
                "updated_at": now
            },
            "$push": {"timeline": timeline_entry}
        }
    )

    # Notify student directly
    student_id = app.get("student_id")
    if student_id:
        try:
            await db["notifications"].insert_one({
                "recipient_id": student_id,
                "title": f"Interview Scheduled: {req.round_type}",
                "message": f"{app.get('company_name')} scheduled your {req.round_type} for '{app.get('job_title')}' on {req.interview_date} at {req.interview_time}.",
                "type": "interview",
                "priority": "high",
                "job_id": app.get("job_id"),
                "application_id": application_id,
                "read_by": [],
                "dismissed_by": [],
                "is_read": False,
                "created_at": now
            })
        except Exception:
            pass

    return {"message": f"Successfully scheduled {req.round_type}"}


@router.post("/applications/{application_id}/interview/evaluate")
async def evaluate_candidate_interview(
    application_id: str,
    req: EvaluateInterviewRequest,
    company=Depends(get_current_company)
):
    db = get_database()
    company_id = company.get("sub")

    app = await db["applications"].find_one({"_id": ObjectId(application_id), "company_id": company_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")

    now = datetime.utcnow()
    tech = req.technical_scores or {}
    behav = req.behavioral_scores or {}

    # Calculate overall numerical score out of 5
    all_scores = list(tech.values()) + list(behav.values())
    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 3.5

    # Determine status progression based on recommendation
    if req.recommendation in ["strong_hire", "hire"]:
        new_status = req.next_stage or ("Behavioral Passed" if req.round_type == "behavioral" else "Technical Passed")
    elif req.recommendation == "next_round":
        new_status = "Next Interview Needed"
    else:
        new_status = "Rejected"

    scorecard = {
        "round_type": req.round_type,
        "recommendation": req.recommendation,
        "average_score": avg_score,
        "technical_scores": tech,
        "behavioral_scores": behav,
        "technical_notes": req.technical_notes or "",
        "behavioral_notes": req.behavioral_notes or "",
        "overall_feedback": req.overall_feedback or "",
        "evaluated_at": now.isoformat()
    }

    timeline_entry = {
        "status": new_status,
        "title": f"{req.round_type.title()} Evaluation Complete",
        "description": f"Recommendation: {req.recommendation.replace('_', ' ').title()} (Score: {avg_score}/5.0). Notes: {req.overall_feedback or 'Evaluated by hiring team.'}",
        "scorecard": scorecard,
        "timestamp": now.isoformat()
    }

    await db["applications"].update_one(
        {"_id": ObjectId(application_id)},
        {
            "$set": {
                "status": new_status,
                "latest_scorecard": scorecard,
                "feedback": req.overall_feedback,
                "updated_at": now
            },
            "$push": {
                "timeline": timeline_entry,
                "interview_evaluations": scorecard
            }
        }
    )

    # Notify student
    student_id = app.get("student_id")
    if student_id:
        notif_msg = f"Your {req.round_type} evaluation for '{app.get('job_title')}' has been finalized: Stage updated to '{new_status}'."
        try:
            await db["notifications"].insert_one({
                "recipient_id": student_id,
                "title": f"Interview Evaluation: {req.round_type.title()}",
                "message": notif_msg,
                "type": "application",
                "priority": "normal",
                "job_id": app.get("job_id"),
                "application_id": application_id,
                "read_by": [],
                "dismissed_by": [],
                "is_read": False,
                "created_at": now
            })
        except Exception:
            pass

    return {
        "message": "Evaluation recorded successfully",
        "new_status": new_status,
        "scorecard": scorecard
    }


# =====================================================================
# 3. DIRECT MESSAGING: COMPANY RECRUITER <-> CANDIDATE
# =====================================================================

@router.get("/applications/{application_id}/messages")
async def get_application_messages(application_id: str, company=Depends(get_current_company)):
    db = get_database()
    company_id = company.get("sub")

    app = await db["applications"].find_one({"_id": ObjectId(application_id), "company_id": company_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")

    # Mark candidate messages as read by company
    await db["company_student_messages"].update_many(
        {"application_id": application_id, "sender_role": "student", "read_by_company": {"$ne": True}},
        {"$set": {"read_by_company": True}}
    )

    cursor = db["company_student_messages"].find({"application_id": application_id}).sort("created_at", 1).limit(200)
    messages = []
    async for m in cursor:
        messages.append({
            "id": str(m["_id"]),
            "sender_role": m.get("sender_role", "company"),
            "sender_name": m.get("sender_name", ""),
            "message": m.get("message", ""),
            "created_at": _safe_iso(m.get("created_at")),
        })

    return {
        "application_id": application_id,
        "student_name": app.get("student_name", "Candidate"),
        "student_email": app.get("student_email", ""),
        "job_title": app.get("job_title", ""),
        "messages": messages
    }


@router.post("/applications/{application_id}/messages")
async def send_candidate_message(
    application_id: str,
    req: CompanyMessageRequest,
    company=Depends(get_current_company)
):
    text = req.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    db = get_database()
    company_id = company.get("sub")

    app = await db["applications"].find_one({"_id": ObjectId(application_id), "company_id": company_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")

    comp_user = await db["users"].find_one({"_id": ObjectId(company_id)})
    company_name = comp_user.get("name") if comp_user and comp_user.get("name") else "Recruiting Team"

    student_id = app.get("student_id")
    now = datetime.utcnow()

    msg_doc = {
        "application_id": application_id,
        "company_id": company_id,
        "company_name": company_name,
        "student_id": student_id,
        "student_name": app.get("student_name", "Candidate"),
        "student_email": app.get("student_email", ""),
        "job_title": app.get("job_title", ""),
        "sender_role": "company",
        "sender_id": company_id,
        "sender_name": company_name,
        "message": text,
        "read_by_company": True,
        "read_by_student": False,
        "created_at": now
    }
    res = await db["company_student_messages"].insert_one(msg_doc)

    # Notify student directly
    if student_id:
        try:
            await db["notifications"].insert_one({
                "recipient_id": student_id,
                "title": f"Message from {company_name}",
                "message": f"[{app.get('job_title')}] {text[:140]}",
                "type": "recruiter_message",
                "priority": "normal",
                "application_id": application_id,
                "read_by": [],
                "dismissed_by": [],
                "is_read": False,
                "created_at": now
            })
        except Exception:
            pass

    return {
        "id": str(res.inserted_id),
        "sender_role": "company",
        "sender_name": company_name,
        "message": text,
        "created_at": now.isoformat()
    }


@router.get("/candidate-threads")
async def get_company_candidate_threads(company=Depends(get_current_company)):
    db = get_database()
    company_id = company.get("sub")

    pipeline = [
        {"$match": {"company_id": company_id}},
        {"$sort": {"created_at": -1}},
        {
            "$group": {
                "_id": "$application_id",
                "student_name": {"$first": "$student_name"},
                "student_email": {"$first": "$student_email"},
                "job_title": {"$first": "$job_title"},
                "last_message": {"$first": "$message"},
                "last_message_time": {"$first": "$created_at"},
                "last_sender_role": {"$first": "$sender_role"},
                "unread_count": {
                    "$sum": {
                        "$cond": [
                            {"$and": [{"$eq": ["$sender_role", "student"]}, {"$ne": ["$read_by_company", True]}]},
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {"$sort": {"last_message_time": -1}}
    ]

    threads = []
    async for doc in db["company_student_messages"].aggregate(pipeline):
        threads.append({
            "application_id": doc["_id"],
            "student_name": doc.get("student_name") or "Candidate",
            "student_email": doc.get("student_email") or "",
            "job_title": doc.get("job_title") or "Position",
            "last_message": doc.get("last_message", ""),
            "last_message_time": _safe_iso(doc.get("last_message_time")),
            "last_sender_role": doc.get("last_sender_role", "student"),
            "unread_count": doc.get("unread_count", 0)
        })

    return threads


# =====================================================================
# 4. FORMAL OFFER DISPATCHER
# =====================================================================

@router.post("/applications/{application_id}/offer")
async def dispatch_offer_letter(
    application_id: str,
    req: OfferLetterRequest,
    company=Depends(get_current_company)
):
    db = get_database()
    company_id = company.get("sub")

    app = await db["applications"].find_one({"_id": ObjectId(application_id), "company_id": company_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")

    now = datetime.utcnow()
    new_status = "Offer Sent"

    offer_data = {
        "designation": req.designation,
        "ctc_or_stipend": req.ctc_or_stipend,
        "joining_date": req.joining_date,
        "offer_notes": req.offer_notes or "",
        "dispatched_at": now.isoformat()
    }

    timeline_entry = {
        "status": new_status,
        "title": f"Offer Extended: {req.designation}",
        "description": f"Package: {req.ctc_or_stipend}. Expected Joining: {req.joining_date}. {req.offer_notes or ''}",
        "offer_details": offer_data,
        "timestamp": now.isoformat()
    }

    await db["applications"].update_one(
        {"_id": ObjectId(application_id)},
        {
            "$set": {
                "status": new_status,
                "offer_details": offer_data,
                "updated_at": now
            },
            "$push": {"timeline": timeline_entry}
        }
    )

    # Notify student with high priority
    student_id = app.get("student_id")
    if student_id:
        try:
            await db["notifications"].insert_one({
                "recipient_id": student_id,
                "title": f"🎉 Offer Letter: {app.get('company_name')}",
                "message": f"Congratulations! {app.get('company_name')} has officially extended an offer for '{req.designation}' ({req.ctc_or_stipend}).",
                "type": "application",
                "priority": "high",
                "job_id": app.get("job_id"),
                "application_id": application_id,
                "read_by": [],
                "dismissed_by": [],
                "is_read": False,
                "created_at": now
            })
        except Exception:
            pass

    return {"message": "Offer letter successfully dispatched to candidate"}


# =====================================================================
# 5. CAMPUS TALENT POOL & DIRECT INVITATIONS
# =====================================================================

@router.get("/talent-pool")
async def search_talent_pool(
    skill: Optional[str] = Query(None),
    min_cgpa: Optional[float] = Query(None),
    branch: Optional[str] = Query(None),
    batch: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    company=Depends(get_current_company)
):
    db = get_database()
    
    query: dict = {
        "role": "student",
        "is_college_approved": True,
        "is_suspended": {"$ne": True}
    }

    if min_cgpa:
        query["cgpa"] = {"$gte": float(min_cgpa)}
    if branch and branch.strip():
        query["branch"] = {"$regex": f"^{branch.strip()}$", "$options": "i"}
    if batch and batch.strip():
        query["batch"] = batch.strip()
    if skill and skill.strip():
        query["skills"] = {"$regex": f"^{skill.strip()}$", "$options": "i"}

    cursor = db["users"].find(query).limit(100)
    candidates = []

    # Map college names
    college_names = {}
    async for c in db["users"].find({"role": "college"}, {"name": 1}):
        college_names[str(c["_id"])] = c.get("name", "College")

    async for u in cursor:
        uid = str(u["_id"])
        c_name = college_names.get(u.get("college_id"), "Registered College")

        if search and search.strip():
            sq = search.strip().lower()
            name_val = (u.get("name") or "").lower()
            skills_val = " ".join(u.get("skills", [])).lower()
            if sq not in name_val and sq not in skills_val and sq not in c_name.lower():
                continue

        candidates.append({
            "id": uid,
            "name": u.get("name") or "Candidate",
            "email": u.get("email"),
            "cgpa": u.get("cgpa"),
            "branch": u.get("branch", ""),
            "batch": u.get("batch", ""),
            "roll_number": u.get("roll_number", ""),
            "college_id": u.get("college_id"),
            "college_name": c_name,
            "skills": u.get("skills", []),
            "bio": u.get("bio", ""),
            "resume_url": u.get("resume_url", ""),
            "resume_filename": u.get("resume_filename", ""),
            "github_url": u.get("github_url", ""),
            "linkedin_url": u.get("linkedin_url", "")
        })

    return candidates


@router.post("/talent-pool/{student_id}/invite")
async def invite_talent_to_job(
    student_id: str,
    req: TalentInviteRequest,
    company=Depends(get_current_company)
):
    db = get_database()
    company_id = company.get("sub")

    comp_user = await db["users"].find_one({"_id": ObjectId(company_id)})
    company_name = comp_user.get("name") if comp_user and comp_user.get("name") else "Recruiting Team"

    job = await db["jobs"].find_one({"_id": ObjectId(req.job_id), "company_id": company_id})
    if not job:
        raise HTTPException(status_code=404, detail="Active job not found or unauthorized")

    student = await db["users"].find_one({"_id": ObjectId(student_id), "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    now = datetime.utcnow()
    invite_msg = req.message or f"Hello {student.get('name', 'Student')}, our recruitment team at {company_name} reviewed your profile and invites you to apply for '{job.get('title')}'!"

    # Send direct notification
    await db["notifications"].insert_one({
        "recipient_id": student_id,
        "title": f"Direct Drive Invite: {company_name}",
        "message": invite_msg,
        "type": "announcement",
        "priority": "high",
        "job_id": req.job_id,
        "read_by": [],
        "dismissed_by": [],
        "is_read": False,
        "created_at": now
    })

    return {"message": f"Direct invitation dispatched to {student.get('name')}"}


# =====================================================================
# 6. RECRUITMENT FUNNEL & CONVERSION ANALYTICS
# =====================================================================

@router.get("/analytics")
async def get_company_recruitment_analytics(company=Depends(get_current_company)):
    db = get_database()
    company_id = company.get("sub")

    total_apps = await db["applications"].count_documents({"company_id": company_id})
    in_review = await db["applications"].count_documents({"company_id": company_id, "status": "In Review"})
    shortlisted = await db["applications"].count_documents({"company_id": company_id, "status": "Shortlisted"})
    interviews = await db["applications"].count_documents({"company_id": company_id, "status": {"$in": ["Interview Scheduled", "Technical Round", "Behavioral Round"]}})
    tech_passed = await db["applications"].count_documents({"company_id": company_id, "status": "Technical Passed"})
    behav_passed = await db["applications"].count_documents({"company_id": company_id, "status": "Behavioral Passed"})
    offers = await db["applications"].count_documents({"company_id": company_id, "status": "Offer Sent"})
    hired = await db["applications"].count_documents({"company_id": company_id, "status": {"$in": ["Hired", "Accepted", "Selected"]}})
    rejected = await db["applications"].count_documents({"company_id": company_id, "status": "Rejected"})

    funnel_stages = [
        {"stage": "Total Applied", "count": total_apps, "fill": "#6366f1"},
        {"stage": "In Review", "count": in_review, "fill": "#f59e0b"},
        {"stage": "Shortlisted", "count": shortlisted, "fill": "#3b82f6"},
        {"stage": "Interviewing", "count": interviews + tech_passed + behav_passed, "fill": "#8b5cf6"},
        {"stage": "Offers Extended", "count": offers, "fill": "#10b981"},
        {"stage": "Hired", "count": hired, "fill": "#059669"},
        {"stage": "Closed / Rejected", "count": rejected, "fill": "#ef4444"}
    ]

    # College distribution breakdown
    college_pipeline = [
        {"$match": {"company_id": company_id}},
        {
            "$group": {
                "_id": "$college_id",
                "applications": {"$sum": 1},
                "shortlisted": {"$sum": {"$cond": [{"$in": ["$status", ["Shortlisted", "Technical Passed", "Behavioral Passed", "Offer Sent", "Hired"]]}, 1, 0]}},
                "offers": {"$sum": {"$cond": [{"$in": ["$status", ["Offer Sent", "Hired"]]}, 1, 0]}}
            }
        },
        {"$sort": {"applications": -1}},
        {"$limit": 8}
    ]

    college_names = {}
    async for c in db["users"].find({"role": "college"}, {"name": 1}):
        college_names[str(c["_id"])] = c.get("name", "College")

    college_metrics = []
    async for row in db["applications"].aggregate(college_pipeline):
        cid = row["_id"]
        college_metrics.append({
            "college_name": college_names.get(cid, "Registered College"),
            "applications": row.get("applications", 0),
            "shortlisted": row.get("shortlisted", 0),
            "offers": row.get("offers", 0)
        })

    return {
        "overview": {
            "total_applications": total_apps,
            "in_review": in_review,
            "active_interviews": interviews,
            "offers_extended": offers,
            "hired": hired,
            "rejected": rejected
        },
        "funnel": funnel_stages,
        "college_breakdown": college_metrics
    }


