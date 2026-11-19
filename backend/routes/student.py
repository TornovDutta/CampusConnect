from fastapi import APIRouter, Depends, HTTPException, Query
from database import get_database, log_activity
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from core.config import settings
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import re

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


def _safe_iso(val) -> str:
    if isinstance(val, datetime):
        return val.isoformat()
    return str(val) if val else ""


# -----------------------------------------------------------------------------
# Request & Response Models
# -----------------------------------------------------------------------------

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class ResumeUploadRequest(BaseModel):
    filename: str
    content_base64: Optional[str] = None
    file_type: Optional[str] = "application/pdf"
    skills: Optional[List[str]] = None


class ApplyJobRequest(BaseModel):
    cover_note: Optional[str] = None
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None


class StudentCollegeMessageRequest(BaseModel):
    message: str
    category: Optional[str] = "general"


class InterviewRSVPRequest(BaseModel):
    attending: bool
    note: Optional[str] = None


class MockEvaluateRequest(BaseModel):
    question_id: str
    topic: str
    question: str
    answer: str
    time_spent_seconds: Optional[int] = 0


# -----------------------------------------------------------------------------
# 1. DASHBOARD & STATS
# -----------------------------------------------------------------------------

@router.get("/dashboard-stats")
async def get_student_dashboard(student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]

    user = await db["users"].find_one({"_id": ObjectId(student_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Student user not found")

    college_id = user.get("college_id")
    is_approved = user.get("is_college_approved", False)

    recommended_jobs = []
    recent_applications = []
    stats = {
        "total_applications": 0,
        "in_review": 0,
        "shortlisted": 0,
        "rejected": 0,
        "interviews_scheduled": 0,
        "offers_received": 0,
        "bookmarked_jobs": len(user.get("saved_jobs", [])),
    }

    if is_approved and not user.get("is_suspended", False):
        apps_cursor = db["applications"].find({"student_id": student_id}).sort("created_at", -1)
        applied_job_ids = set()
        async for app in apps_cursor:
            app["_id"] = str(app["_id"])
            app["id"] = str(app["_id"])
            app["created_at"] = _safe_iso(app.get("created_at"))
            recent_applications.append(app)
            applied_job_ids.add(app.get("job_id"))

            stats["total_applications"] += 1
            status = app.get("status", "In Review")
            if status == "In Review" or status == "Applied":
                stats["in_review"] += 1
            elif status in ["Shortlisted", "Interview Scheduled", "Interview"]:
                stats["shortlisted"] += 1
                if status == "Interview Scheduled" or app.get("interview_date"):
                    stats["interviews_scheduled"] += 1
            elif status in ["Offer Sent", "Hired", "Accepted", "Selected"]:
                stats["offers_received"] += 1
                stats["shortlisted"] += 1
            elif status == "Rejected":
                stats["rejected"] += 1

        # Fetch visible jobs
        query = {
            "status": "active",
            "$or": [
                {"visibility": "public"},
                {"visibility": {"$exists": False}},
                {"visibility": "requested_college", "target_colleges": college_id},
            ],
        }

        college_rules_map = {}
        if college_id:
            async for rule in db["college_job_rules"].find({"college_id": college_id}):
                college_rules_map[rule["job_id"]] = rule

        from routes.college import _student_matches_rule

        saved_jobs_set = set(user.get("saved_jobs", []))
        jobs_cursor = db["jobs"].find(query).sort("created_at", -1).limit(60)

        async for job in jobs_cursor:
            jid = str(job["_id"])
            visibility = job.get("visibility", "public")
            rule = college_rules_map.get(jid)

            if visibility == "requested_college":
                if not rule or not rule.get("criteria_configured", False) or rule.get("is_open", False) is False:
                    continue
                is_eligible, reason = _student_matches_rule(user, rule)
                if not is_eligible:
                    continue
            else:
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

            job["_id"] = jid
            job["id"] = jid
            job["created_at"] = _safe_iso(job.get("created_at"))
            job["has_applied"] = jid in applied_job_ids
            job["is_bookmarked"] = jid in saved_jobs_set
            job["college_eligible"] = True
            job["eligibility_reason"] = ""
            job["college_criteria_tags"] = criteria_tags
            recommended_jobs.append(job)

    # Next upcoming interview (if any)
    upcoming_interview = None
    for app in recent_applications:
        if app.get("interview_date"):
            upcoming_interview = {
                "application_id": app["id"],
                "job_title": app.get("job_title", ""),
                "company_name": app.get("company_name", ""),
                "interview_date": app.get("interview_date"),
                "interview_time": app.get("interview_time"),
                "interview_link": app.get("interview_link"),
                "interview_mode": app.get("interview_mode", "Online"),
            }
            break

    # Unread notifications count
    unread_notifs_count = await db["notifications"].count_documents({
        "$and": [
            {
                "$or": [
                    {"recipient_id": student_id},
                    {"recipient_role": "student"},
                    {"recipient_role": "all"},
                ]
            },
            {"read_by": {"$ne": student_id}},
            {"dismissed_by": {"$ne": student_id}},
            {"is_read": {"$ne": True}},
        ]
    })

    # Unread college messages
    unread_messages_count = await db["college_student_messages"].count_documents({
        "student_id": student_id,
        "sender_role": "college",
        "read_by_student": {"$ne": True},
    })

    return {
        "is_college_approved": is_approved,
        "college_id": college_id,
        "stats": stats,
        "upcoming_interview": upcoming_interview,
        "unread_notifications_count": unread_notifs_count,
        "unread_messages_count": unread_messages_count,
        "has_resume": bool(user.get("resume_url") or user.get("resume_data")),
        "resume_filename": user.get("resume_filename", ""),
        "skills": user.get("skills", []),
        "recommended_jobs": recommended_jobs,
        "recent_applications": recent_applications[:10],
    }


# -----------------------------------------------------------------------------
# 2. PROFILE & RESUME SERVICES
# -----------------------------------------------------------------------------

@router.get("/profile")
async def get_student_profile(student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]
    user = await db["users"].find_one({"_id": ObjectId(student_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    college_name = ""
    if user.get("college_id"):
        college_doc = await db["users"].find_one({"_id": ObjectId(user["college_id"])})
        if college_doc:
            college_name = college_doc.get("name", "")

    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "student"),
        "college_id": user.get("college_id"),
        "college_name": college_name,
        "is_college_approved": user.get("is_college_approved", False),
        "is_suspended": user.get("is_suspended", False),
        "roll_number": user.get("roll_number", ""),
        "cgpa": user.get("cgpa"),
        "batch": user.get("batch", ""),
        "branch": user.get("branch", ""),
        "backlogs": user.get("backlogs", 0),
        "phone": user.get("phone", ""),
        "bio": user.get("bio", ""),
        "skills": user.get("skills", []),
        "github_url": user.get("github_url", ""),
        "linkedin_url": user.get("linkedin_url", ""),
        "portfolio_url": user.get("portfolio_url", ""),
        "resume_filename": user.get("resume_filename", ""),
        "resume_url": user.get("resume_url", ""),
        "resume_updated_at": _safe_iso(user.get("resume_updated_at")),
        "saved_jobs": user.get("saved_jobs", []),
    }


@router.put("/profile")
async def update_student_profile(data: ProfileUpdateRequest, student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]

    update_fields: dict = {}
    if data.name is not None:
        update_fields["name"] = data.name.strip()
    if data.phone is not None:
        update_fields["phone"] = data.phone.strip()
    if data.bio is not None:
        update_fields["bio"] = data.bio.strip()
    if data.skills is not None:
        # Clean skills: strip whitespace and filter out empties
        cleaned_skills = list(dict.fromkeys([s.strip() for s in data.skills if s and s.strip()]))
        update_fields["skills"] = cleaned_skills
    if data.github_url is not None:
        update_fields["github_url"] = data.github_url.strip()
    if data.linkedin_url is not None:
        update_fields["linkedin_url"] = data.linkedin_url.strip()
    if data.portfolio_url is not None:
        update_fields["portfolio_url"] = data.portfolio_url.strip()

    if update_fields:
        update_fields["updated_at"] = datetime.utcnow()
        await db["users"].update_one({"_id": ObjectId(student_id)}, {"$set": update_fields})

    return {"message": "Profile updated successfully"}


@router.post("/resume/upload")
async def upload_resume(data: ResumeUploadRequest, student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]

    if not data.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    now = datetime.utcnow()
    update_doc: dict = {
        "resume_filename": data.filename,
        "resume_data": data.content_base64 or "",
        "resume_url": data.content_base64 or f"/uploads/resumes/{student_id}_{data.filename}",
        "resume_updated_at": now,
    }

    # If additional skills were passed, merge them
    if data.skills:
        user = await db["users"].find_one({"_id": ObjectId(student_id)}, {"skills": 1})
        existing_skills = (user.get("skills") if user else []) or []
        combined = list(dict.fromkeys(existing_skills + [s.strip() for s in data.skills if s.strip()]))
        update_doc["skills"] = combined

    await db["users"].update_one({"_id": ObjectId(student_id)}, {"$set": update_doc})

    await log_activity(
        user_id=student_id,
        user_name=student.get("email"),
        role="student",
        action_type="resume_upload",
        details=f"Uploaded resume: {data.filename}",
    )

    return {
        "message": "Resume uploaded successfully",
        "resume_filename": data.filename,
        "resume_updated_at": now.isoformat(),
    }


@router.get("/resume")
async def get_student_resume(student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]
    user = await db["users"].find_one({"_id": ObjectId(student_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    return {
        "resume_filename": user.get("resume_filename", ""),
        "resume_url": user.get("resume_url", ""),
        "resume_data": user.get("resume_data", ""),
        "resume_updated_at": _safe_iso(user.get("resume_updated_at")),
        "skills": user.get("skills", []),
    }


# -----------------------------------------------------------------------------
# 3. APPLY FOR JOBS & ELIGIBILITY CHECK
# -----------------------------------------------------------------------------

@router.get("/eligibility-check/{job_id}")
async def check_job_eligibility(job_id: str, student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]
    user = await db["users"].find_one({"_id": ObjectId(student_id)})
    job = await db["jobs"].find_one({"_id": ObjectId(job_id)})

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    college_id = user.get("college_id")
    rule = None
    if college_id:
        rule = await db["college_job_rules"].find_one({"college_id": college_id, "job_id": job_id})

    from routes.college import _student_matches_rule

    checks = []
    # 1. College approval check
    is_approved = user.get("is_college_approved", False)
    checks.append({
        "criterion": "College Approval",
        "required": "Approved profile",
        "actual": "Approved" if is_approved else "Pending Approval",
        "passed": is_approved,
    })

    # 2. Minimum CGPA
    student_cgpa = user.get("cgpa")
    min_cgpa = rule.get("min_cgpa") if rule else None
    if min_cgpa is not None:
        passed = (student_cgpa is not None) and (float(student_cgpa) >= float(min_cgpa))
        checks.append({
            "criterion": "Minimum CGPA",
            "required": f"≥ {min_cgpa}",
            "actual": str(student_cgpa) if student_cgpa is not None else "Not specified",
            "passed": passed,
        })

    # 3. Batch
    allowed_batches = rule.get("allowed_batches") if rule else None
    if allowed_batches:
        passed = str(user.get("batch", "")) in allowed_batches
        checks.append({
            "criterion": "Graduating Batch",
            "required": ", ".join(allowed_batches),
            "actual": str(user.get("batch", "Not specified")),
            "passed": passed,
        })

    # 4. Branch
    allowed_branches = rule.get("allowed_branches") if rule else None
    if allowed_branches:
        student_branch = (user.get("branch") or "").upper().strip()
        passed = any(student_branch == b.upper().strip() for b in allowed_branches)
        checks.append({
            "criterion": "Branch / Major",
            "required": ", ".join(allowed_branches),
            "actual": user.get("branch") or "Not specified",
            "passed": passed,
        })

    # 5. Backlogs
    max_backlogs = rule.get("max_backlogs") if rule else None
    if max_backlogs is not None:
        actual_backlogs = int(user.get("backlogs") or 0)
        passed = actual_backlogs <= int(max_backlogs)
        checks.append({
            "criterion": "Active Backlogs",
            "required": f"Max {max_backlogs}",
            "actual": str(actual_backlogs),
            "passed": passed,
        })

    is_overall_eligible, reason = _student_matches_rule(user, rule) if rule else (is_approved, "")
    if not is_approved:
        is_overall_eligible = False
        reason = "College approval required"

    existing_app = await db["applications"].find_one({"job_id": job_id, "student_id": student_id})

    return {
        "job_id": job_id,
        "job_title": job.get("title", ""),
        "company_name": job.get("company_name", ""),
        "is_eligible": is_overall_eligible,
        "reason": reason,
        "has_applied": existing_app is not None,
        "criteria_checks": checks,
    }


@router.post("/apply/{job_id}")
async def apply_job(job_id: str, apply_req: Optional[ApplyJobRequest] = None, student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]

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
            raise HTTPException(status_code=403, detail="This opportunity is restricted to students of specific invited colleges.")

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
            "status": {"$nin": ["Rejected", "Withdrawn"]},
        })
        if active_app_count >= max_apps:
            raise HTTPException(
                status_code=400,
                detail=f"Application limit reached ({max_apps} active applications allowed by platform policy).",
            )

    now = datetime.utcnow()
    resume_url = (apply_req.resume_url if apply_req else None) or user.get("resume_url", "")
    resume_filename = (apply_req.resume_filename if apply_req else None) or user.get("resume_filename", "Resume.pdf")
    cover_note = (apply_req.cover_note if apply_req else "") or ""

    initial_timeline = [
        {
            "status": "Applied",
            "title": "Application Submitted",
            "description": f"Applied for {job.get('title')} at {job.get('company_name', 'Company')}",
            "timestamp": now.isoformat(),
        },
        {
            "status": "In Review",
            "title": "In Screening",
            "description": "Your profile and credentials are under review by the recruitment team.",
            "timestamp": now.isoformat(),
        },
    ]

    application_dict = {
        "job_id": job_id,
        "job_title": job.get("title", "Unknown Job"),
        "company_id": job.get("company_id"),
        "company_name": job.get("company_name", "Company"),
        "student_id": student_id,
        "student_name": user.get("name", user.get("email")),
        "student_email": user.get("email"),
        "student_phone": user.get("phone", ""),
        "student_cgpa": user.get("cgpa"),
        "student_branch": user.get("branch", ""),
        "student_batch": user.get("batch", ""),
        "college_id": user.get("college_id"),
        "status": "In Review",
        "cover_note": cover_note,
        "resume_url": resume_url,
        "resume_filename": resume_filename,
        "timeline": initial_timeline,
        "interview_date": None,
        "interview_time": None,
        "interview_link": None,
        "interview_mode": None,
        "interview_instructions": None,
        "created_at": now,
        "updated_at": now,
    }

    res = await db["applications"].insert_one(application_dict)
    await db["jobs"].update_one({"_id": ObjectId(job_id)}, {"$inc": {"applications_count": 1}})

    # Direct notification to Student
    try:
        await db["notifications"].insert_one({
            "recipient_id": student_id,
            "title": f"Applied: {job.get('title')}",
            "message": f"Successfully applied for {job.get('title')} at {job.get('company_name', 'Company')}. Track your progress anytime.",
            "type": "application",
            "priority": "normal",
            "job_id": job_id,
            "application_id": str(res.inserted_id),
            "read_by": [],
            "dismissed_by": [],
            "is_read": False,
            "created_at": now,
        })
    except Exception:
        pass

    # Direct notification to Company
    company_id_val = job.get("company_id")
    if company_id_val:
        try:
            await db["notifications"].insert_one({
                "recipient_id": str(company_id_val),
                "title": f"New Applicant: {user.get('name') or user.get('email')}",
                "message": f"{user.get('name')} applied for {job.get('title')}.",
                "type": "application",
                "priority": "normal",
                "job_id": job_id,
                "read_by": [],
                "dismissed_by": [],
                "is_read": False,
                "created_at": now,
            })
        except Exception:
            pass

    await log_activity(
        user_id=student_id,
        user_name=user.get("name", user.get("email")),
        role="student",
        action_type="job_apply",
        details=f"Applied for job: {job.get('title')} at {job.get('company_name', 'Company')}",
    )

    return {"message": "Successfully applied for job", "application_id": str(res.inserted_id)}


# -----------------------------------------------------------------------------
# 4. TRACK & MANAGE APPLICATIONS
# -----------------------------------------------------------------------------

@router.get("/applications")
async def get_student_applications(
    status: Optional[str] = Query(None),
    student=Depends(get_current_student)
):
    db = get_database()
    student_id = student["sub"]

    query: dict = {"student_id": student_id}
    if status and status.lower() != "all":
        query["status"] = {"$regex": f"^{status}$", "$options": "i"}

    cursor = db["applications"].find(query).sort("created_at", -1)
    applications = []

    async for app in cursor:
        app_id = str(app["_id"])
        job_id = app.get("job_id")
        job = await db["jobs"].find_one({"_id": ObjectId(job_id)}) if job_id else None

        # Build timeline fallback if older application document lacked timeline
        timeline = app.get("timeline")
        if not timeline:
            curr_status = app.get("status", "In Review")
            timeline = [
                {
                    "status": "Applied",
                    "title": "Application Submitted",
                    "description": "Application submitted via CampusConnect",
                    "timestamp": _safe_iso(app.get("created_at")),
                }
            ]
            if curr_status != "Applied":
                timeline.append({
                    "status": curr_status,
                    "title": f"Status: {curr_status}",
                    "description": f"Recruitment stage updated to {curr_status}",
                    "timestamp": _safe_iso(app.get("updated_at") or app.get("created_at")),
                })

        applications.append({
            "id": app_id,
            "_id": app_id,
            "job_id": job_id,
            "job_title": app.get("job_title") or (job.get("title") if job else "Position"),
            "company_name": app.get("company_name") or (job.get("company_name") if job else "Company"),
            "location": job.get("location") if job else "Flexible",
            "job_type": job.get("job_type") if job else "Full Time",
            "stipend": job.get("stipend") if job else None,
            "status": app.get("status", "In Review"),
            "cover_note": app.get("cover_note", ""),
            "resume_url": app.get("resume_url", ""),
            "resume_filename": app.get("resume_filename", ""),
            "interview_date": app.get("interview_date"),
            "interview_time": app.get("interview_time"),
            "interview_link": app.get("interview_link"),
            "interview_mode": app.get("interview_mode", "Online"),
            "interview_instructions": app.get("interview_instructions"),
            "feedback": app.get("feedback") or app.get("interview_feedback"),
            "timeline": timeline,
            "can_withdraw": app.get("status") in ["In Review", "Applied"],
            "created_at": _safe_iso(app.get("created_at")),
            "updated_at": _safe_iso(app.get("updated_at")),
        })

    return applications


@router.get("/applications/{application_id}")
async def get_application_detail(application_id: str, student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]
    app = await db["applications"].find_one({"_id": ObjectId(application_id), "student_id": student_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    job_id = app.get("job_id")
    job = await db["jobs"].find_one({"_id": ObjectId(job_id)}) if job_id else None

    app["id"] = str(app["_id"])
    app["_id"] = str(app["_id"])
    app["created_at"] = _safe_iso(app.get("created_at"))
    app["updated_at"] = _safe_iso(app.get("updated_at"))
    app["job_details"] = job
    return app


@router.delete("/applications/{application_id}/withdraw")
async def withdraw_application(application_id: str, student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]

    app = await db["applications"].find_one({"_id": ObjectId(application_id), "student_id": student_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if app.get("status") not in ["In Review", "Applied"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot withdraw application after it has been shortlisted, scheduled for interview, or accepted.",
        )

    job_id = app.get("job_id")
    await db["applications"].delete_one({"_id": ObjectId(application_id)})

    if job_id:
        await db["jobs"].update_one({"_id": ObjectId(job_id)}, {"$inc": {"applications_count": -1}})

    await log_activity(
        user_id=student_id,
        user_name=app.get("student_name", "Student"),
        role="student",
        action_type="job_withdraw",
        details=f"Withdrew application for: {app.get('job_title')}",
    )

    return {"message": "Application withdrawn successfully"}


# -----------------------------------------------------------------------------
# 5. INTERVIEW CENTER & RSVP
# -----------------------------------------------------------------------------

@router.get("/interviews")
async def get_student_interviews(student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]

    cursor = db["applications"].find({
        "student_id": student_id,
        "$or": [
            {"status": {"$in": ["Interview Scheduled", "Shortlisted", "Selected", "Offer Sent"]}},
            {"interview_date": {"$ne": None, "$ne": ""}},
        ]
    }).sort("created_at", -1)

    interviews = []
    async for app in cursor:
        app_id = str(app["_id"])
        interviews.append({
            "id": app_id,
            "application_id": app_id,
            "job_id": app.get("job_id"),
            "job_title": app.get("job_title", "Software Engineer"),
            "company_name": app.get("company_name", "Tech Company"),
            "status": app.get("status", "Interview Scheduled"),
            "interview_date": app.get("interview_date") or "TBD",
            "interview_time": app.get("interview_time") or "TBD",
            "interview_link": app.get("interview_link") or "https://meet.google.com/new",
            "interview_mode": app.get("interview_mode", "Google Meet (Online)"),
            "interview_instructions": app.get("interview_instructions") or "Please join 5 minutes early with your camera enabled and resume handy.",
            "rsvp_status": app.get("rsvp_status", "pending"),
            "feedback": app.get("feedback") or app.get("interview_feedback"),
            "created_at": _safe_iso(app.get("created_at")),
        })

    return interviews


@router.post("/interviews/{application_id}/rsvp")
async def rsvp_interview(application_id: str, req: InterviewRSVPRequest, student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]

    app = await db["applications"].find_one({"_id": ObjectId(application_id), "student_id": student_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    status_str = "Confirmed (Attending)" if req.attending else "Declined / Clash"
    await db["applications"].update_one(
        {"_id": ObjectId(application_id)},
        {
            "$set": {
                "rsvp_status": "attending" if req.attending else "declined",
                "rsvp_note": req.note or "",
                "updated_at": datetime.utcnow(),
            },
            "$push": {
                "timeline": {
                    "status": "RSVP",
                    "title": f"Candidate RSVP: {status_str}",
                    "description": req.note or ("Candidate confirmed attendance." if req.attending else "Candidate reported a conflict."),
                    "timestamp": datetime.utcnow().isoformat(),
                }
            }
        }
    )

    return {"message": f"RSVP marked as {status_str}"}


# -----------------------------------------------------------------------------
# 6. JOB APPLICATION CALENDAR
# -----------------------------------------------------------------------------

@router.get("/calendar-events")
async def get_student_calendar_events(student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]
    user = await db["users"].find_one({"_id": ObjectId(student_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    college_id = user.get("college_id")
    events = []

    # 1. Interviews from applications
    apps_cursor = db["applications"].find({"student_id": student_id})
    async for app in apps_cursor:
        app_id = str(app["_id"])
        # If interview date is set
        if app.get("interview_date"):
            events.append({
                "id": f"int_{app_id}",
                "title": f"Interview: {app.get('job_title')} ({app.get('company_name')})",
                "event_type": "interview",
                "date": app.get("interview_date"),
                "time": app.get("interview_time", "10:00 AM"),
                "company_name": app.get("company_name", ""),
                "job_title": app.get("job_title", ""),
                "link": app.get("interview_link", ""),
                "mode": app.get("interview_mode", "Online"),
                "application_id": app_id,
                "badge_color": "green",
            })
        # Application milestone
        if app.get("created_at"):
            app_date = _safe_iso(app.get("created_at"))[:10]
            events.append({
                "id": f"app_{app_id}",
                "title": f"Applied: {app.get('job_title')}",
                "event_type": "application",
                "date": app_date,
                "time": "Submitted",
                "company_name": app.get("company_name", ""),
                "job_title": app.get("job_title", ""),
                "application_id": app_id,
                "badge_color": "blue",
            })

    # 2. Upcoming job deadlines and campus drives
    query = {
        "status": "active",
        "$or": [
            {"visibility": "public"},
            {"visibility": {"$exists": False}},
            {"visibility": "requested_college", "target_colleges": college_id},
        ],
    }

    jobs_cursor = db["jobs"].find(query).sort("created_at", -1).limit(40)
    async for job in jobs_cursor:
        jid = str(job["_id"])
        # Registration deadline if available or synthetic deadline 14 days after creation
        job_created = job.get("created_at")
        deadline = job.get("deadline")
        if not deadline and job_created and isinstance(job_created, datetime):
            deadline = (job_created + timedelta(days=14)).strftime("%Y-%m-%d")
        elif not deadline:
            deadline = (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d")

        is_campus_drive = job.get("visibility") == "requested_college"
        events.append({
            "id": f"job_dl_{jid}",
            "title": f"Deadline: {job.get('title')} ({job.get('company_name')})",
            "event_type": "drive_deadline" if is_campus_drive else "deadline",
            "date": str(deadline)[:10],
            "time": "11:59 PM",
            "company_name": job.get("company_name", ""),
            "job_title": job.get("title", ""),
            "job_id": jid,
            "badge_color": "purple" if is_campus_drive else "amber",
        })

    # Sort events by date
    events.sort(key=lambda x: str(x.get("date", "")))
    return events


# -----------------------------------------------------------------------------
# 7. MESSAGE THE COLLEGE (2-WAY CHAT)
# -----------------------------------------------------------------------------

@router.get("/college-messages")
async def get_student_college_messages(student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]
    user = await db["users"].find_one({"_id": ObjectId(student_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    college_id = user.get("college_id")
    if not college_id:
        return {"college": None, "messages": [], "unread_count": 0}

    college_doc = await db["users"].find_one({"_id": ObjectId(college_id)}) or {}
    college_name = college_doc.get("name") or "Placement Cell"

    # Mark college messages as read by student
    await db["college_student_messages"].update_many(
        {"student_id": student_id, "sender_role": "college", "read_by_student": {"$ne": True}},
        {"$set": {"read_by_student": True}},
    )

    cursor = db["college_student_messages"].find(
        {"student_id": student_id, "college_id": college_id}
    ).sort("created_at", 1).limit(200)

    messages = []
    async for m in cursor:
        messages.append({
            "id": str(m["_id"]),
            "sender_role": m.get("sender_role", "student"),
            "sender_name": m.get("sender_name", ""),
            "message": m.get("message", ""),
            "category": m.get("category", "general"),
            "created_at": _safe_iso(m.get("created_at")),
        })

    return {
        "college": {
            "id": college_id,
            "name": college_name,
            "email": college_doc.get("email", ""),
        },
        "messages": messages,
    }


@router.post("/college-messages")
async def send_message_to_college(req: StudentCollegeMessageRequest, student=Depends(get_current_student)):
    text = req.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    db = get_database()
    student_id = student["sub"]
    user = await db["users"].find_one({"_id": ObjectId(student_id)})
    college_id = user.get("college_id")
    if not college_id:
        raise HTTPException(status_code=400, detail="You are not associated with any college yet")

    college_doc = await db["users"].find_one({"_id": ObjectId(college_id)}) or {}
    college_name = college_doc.get("name") or "College Placement Cell"

    student_name = user.get("name") or user.get("email")

    now = datetime.utcnow()
    msg_doc = {
        "college_id": college_id,
        "college_name": college_name,
        "student_id": student_id,
        "student_name": student_name,
        "student_email": user.get("email", ""),
        "sender_role": "student",
        "sender_id": student_id,
        "sender_name": student_name,
        "category": req.category or "general",
        "message": text,
        "read_by_college": False,
        "read_by_student": True,
        "created_at": now,
    }
    res = await db["college_student_messages"].insert_one(msg_doc)

    # Notify College Placement Cell
    try:
        await db["notifications"].insert_one({
            "recipient_id": college_id,
            "title": f"Student Message: {student_name}",
            "message": f"[{req.category.replace('_', ' ').title()}] {text[:140]}",
            "type": "student_message",
            "priority": "normal",
            "sender_name": student_name,
            "student_id": student_id,
            "read_by": [],
            "dismissed_by": [],
            "is_read": False,
            "created_at": now,
        })
    except Exception:
        pass

    return {
        "id": str(res.inserted_id),
        "sender_role": "student",
        "sender_name": student_name,
        "message": text,
        "category": req.category,
        "created_at": now.isoformat(),
    }


@router.get("/company-messages/{application_id}")
async def get_student_company_messages(application_id: str, student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]

    app = await db["applications"].find_one({"_id": ObjectId(application_id), "student_id": student_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Mark recruiter messages as read by student
    await db["company_student_messages"].update_many(
        {"application_id": application_id, "sender_role": "company", "read_by_student": {"$ne": True}},
        {"$set": {"read_by_student": True}}
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
        "company_name": app.get("company_name", "Recruiter"),
        "job_title": app.get("job_title", ""),
        "messages": messages
    }


@router.post("/company-messages/{application_id}")
async def send_message_to_company(application_id: str, req: StudentCollegeMessageRequest, student=Depends(get_current_student)):
    text = req.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    db = get_database()
    student_id = student["sub"]
    user = await db["users"].find_one({"_id": ObjectId(student_id)})
    app = await db["applications"].find_one({"_id": ObjectId(application_id), "student_id": student_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    student_name = user.get("name") or user.get("email")
    company_id = app.get("company_id")
    company_name = app.get("company_name", "Company")

    now = datetime.utcnow()
    msg_doc = {
        "application_id": application_id,
        "company_id": str(company_id),
        "company_name": company_name,
        "student_id": student_id,
        "student_name": student_name,
        "student_email": user.get("email", ""),
        "job_title": app.get("job_title", ""),
        "sender_role": "student",
        "sender_id": student_id,
        "sender_name": student_name,
        "message": text,
        "read_by_company": False,
        "read_by_student": True,
        "created_at": now
    }
    res = await db["company_student_messages"].insert_one(msg_doc)

    # Notify company
    if company_id:
        try:
            await db["notifications"].insert_one({
                "recipient_id": str(company_id),
                "title": f"Candidate Reply: {student_name}",
                "message": f"[{app.get('job_title')}] {text[:140]}",
                "type": "candidate_reply",
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
        "sender_role": "student",
        "sender_name": student_name,
        "message": text,
        "created_at": now.isoformat()
    }


# -----------------------------------------------------------------------------
# 8. BOOKMARK / SAVED JOBS
# -----------------------------------------------------------------------------

@router.post("/jobs/{job_id}/bookmark")
async def toggle_save_job(job_id: str, student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]
    user = await db["users"].find_one({"_id": ObjectId(student_id)})
    saved = user.get("saved_jobs", []) or []

    if job_id in saved:
        await db["users"].update_one({"_id": ObjectId(student_id)}, {"$pull": {"saved_jobs": job_id}})
        return {"is_bookmarked": False, "message": "Job removed from bookmarks"}
    else:
        await db["users"].update_one({"_id": ObjectId(student_id)}, {"$addToSet": {"saved_jobs": job_id}})
        return {"is_bookmarked": True, "message": "Job saved to bookmarks"}


@router.get("/saved-jobs")
async def get_saved_jobs(student=Depends(get_current_student)):
    db = get_database()
    student_id = student["sub"]
    user = await db["users"].find_one({"_id": ObjectId(student_id)})
    saved_ids = user.get("saved_jobs", []) or []

    if not saved_ids:
        return []

    obj_ids = []
    for sid in saved_ids:
        try:
            obj_ids.append(ObjectId(sid))
        except Exception:
            pass

    cursor = db["jobs"].find({"_id": {"$in": obj_ids}})
    saved_jobs = []
    async for job in cursor:
        jid = str(job["_id"])
        job["_id"] = jid
        job["id"] = jid
        job["created_at"] = _safe_iso(job.get("created_at"))
        job["is_bookmarked"] = True
        saved_jobs.append(job)

    return saved_jobs


# -----------------------------------------------------------------------------
# 9. MOCK INTERVIEW SIMULATOR & PREPARATION
# -----------------------------------------------------------------------------

QUESTION_BANK = {
    "frontend": [
        {
            "id": "fe_1",
            "topic": "Frontend Engineering",
            "difficulty": "Intermediate",
            "question": "Explain how React's Virtual DOM works and compare it to the browser's Real DOM. What is reconciliation?",
            "key_points": [
                "Virtual DOM is an in-memory lightweight representation of the Real DOM",
                "Diffing algorithm determines minimal changes required",
                "Batch updates minimize expensive browser layout and repaint cycles",
                "Reconciliation uses key props to track identity across renders"
            ],
            "sample_answer": "The Virtual DOM is a lightweight JavaScript object representation of the real DOM. When state changes in React, a new Virtual DOM tree is created. React computes the minimal difference (diffing) between the old and new trees via Reconciliation, and batches the necessary DOM mutations in a single commit, dramatically reducing expensive browser layout recalculations."
        },
        {
            "id": "fe_2",
            "topic": "Frontend Engineering",
            "difficulty": "Advanced",
            "question": "How do you optimize initial page load performance and Core Web Vitals (LCP, FID/INP, CLS) in a modern web app?",
            "key_points": [
                "Code splitting via dynamic imports and lazy loading",
                "Optimizing images with modern formats (WebP/AVIF) and explicit aspect ratios",
                "Minimizing main-thread blocking scripts with defer/async",
                "Efficient caching and server-side rendering or edge caching"
            ],
            "sample_answer": "To optimize Core Web Vitals, I implement route-based code splitting with React.lazy, serve modern responsive images with explicit dimension attributes to prevent CLS, preconnect critical origins, minimize render-blocking CSS/JS, and use caching headers alongside CDN delivery."
        }
    ],
    "backend": [
        {
            "id": "be_1",
            "topic": "Backend Engineering",
            "difficulty": "Intermediate",
            "question": "Compare relational databases (SQL) with document databases (MongoDB). When would you choose one over the other?",
            "key_points": [
                "SQL has strict schemas, ACID guarantees, and relational foreign key joins",
                "MongoDB offers flexible schema, rapid prototyping, and horizontal sharding",
                "Relational is best for complex multi-table transactional domains (banking, orders)",
                "Document store is ideal for hierarchical data, high write throughput, and evolving schemas"
            ],
            "sample_answer": "Relational databases enforce fixed schemas and ACID compliance across multiple tables with foreign keys, making them great for strict financial and transactional systems. Document databases like MongoDB store denormalized JSON-like documents, excelling in rapid schema evolution, nested structures, and horizontal scalability."
        },
        {
            "id": "be_2",
            "topic": "Backend Engineering",
            "difficulty": "Advanced",
            "question": "How do JWT authentication tokens work? What are the security risks and how do you implement token revocation?",
            "key_points": [
                "Header, payload, and HMAC/RSA cryptographic signature",
                "Stateless verification reduces database hits per request",
                "Risks include XSS theft from localStorage and inability to revoke immediately",
                "Mitigation: short-lived access tokens with HttpOnly secure refresh cookies and Redis blacklist"
            ],
            "sample_answer": "JWTs contain a header, payload, and cryptographic signature. Because they are stateless, verifying them doesn't require querying a session database on every request. However, revoking compromised tokens is difficult; we mitigate this by using short expiration times (e.g., 15 minutes) for access tokens paired with HttpOnly refresh tokens stored with a Redis revocation blacklist."
        }
    ],
    "hr": [
        {
            "id": "hr_1",
            "topic": "HR & Behavioral",
            "difficulty": "Essential",
            "question": "Tell me about a challenging technical roadblock you encountered in a project and how you resolved it.",
            "key_points": [
                "Structured response using the STAR method (Situation, Task, Action, Result)",
                "Honest explanation of the technical problem",
                "Demonstration of systematic debugging and teamwork",
                "Concrete metrics or outcome of the resolution"
            ],
            "sample_answer": "In our team capstone project, our real-time messaging pipeline stalled when concurrent users reached 100. Using profiling tools, I discovered unindexed queries in MongoDB and blocking I/O calls. I refactored the connection to asynchronous Motor, added compound indexes, and load-tested again, which reduced latency by 85%."
        },
        {
            "id": "hr_2",
            "topic": "HR & Behavioral",
            "difficulty": "Essential",
            "question": "Why are you interested in joining our campus drive, and where do you see your technical trajectory in the next 3 years?",
            "key_points": [
                "Specific alignment with company values or engineering culture",
                "Eagerness to learn production standards, testing, and system architecture",
                "Clear path from junior contributor to technical ownership",
                "Passion for continuous improvement"
            ],
            "sample_answer": "I admire how your company solves real problems at scale. Over the next three years, my goal is to transition from mastering production-grade full-stack features to architecting resilient distributed components, taking ownership of product verticals, and mentoring upcoming interns."
        }
    ]
}


@router.get("/mock-interview/questions")
async def get_mock_interview_questions(topic: Optional[str] = Query("all")):
    if topic and topic.lower() in QUESTION_BANK:
        return QUESTION_BANK[topic.lower()]

    all_questions = []
    for t_list in QUESTION_BANK.values():
        all_questions.extend(t_list)
    return all_questions


@router.post("/mock-interview/evaluate")
async def evaluate_mock_interview(req: MockEvaluateRequest, student=Depends(get_current_student)):
    ans = req.answer.strip()
    if len(ans) < 15:
        return {
            "score": 30,
            "readiness": "Needs Expansion",
            "feedback": "Your response is very short. Elaborate with specific technical details, real-world examples, or use the STAR method.",
            "strengths": ["Clear attempt"],
            "improvements": ["Provide a concrete code or design example", "Explain trade-offs"],
            "model_answer": "A strong response directly names key concepts, explains the 'why', and illustrates with a past project.",
        }

    word_count = len(ans.split())
    # Scoring heuristic based on depth, technical buzzwords, structure
    score = 65
    if word_count > 40:
        score += 15
    if word_count > 80:
        score += 10
    if any(k in ans.lower() for k in ["for example", "specifically", "because", "trade-off", "performance", "result"]):
        score += 10

    score = min(score, 98)

    strengths = [
        "Well-articulated explanation with relevant context",
        "Demonstrated understanding of core technical concepts",
    ]
    improvements = [
        "Mention potential failure modes or edge cases",
        "Cite quantitative metrics where applicable (latency, throughput, memory)",
    ]

    return {
        "score": score,
        "readiness": "Interview Ready" if score >= 80 else "Good Foundation",
        "word_count": word_count,
        "strengths": strengths,
        "improvements": improvements,
        "feedback": f"Great delivery! Your response scored {score}/100 with clear problem framing.",
        "model_answer": "Keep this structured approach and always highlight why you chose that particular technical solution over alternatives.",
    }
