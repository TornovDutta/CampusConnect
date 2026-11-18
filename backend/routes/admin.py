from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import time
from bson import ObjectId
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr

from database import get_database, log_activity, log_system_issue
from core.config import settings
from core.security import get_password_hash


class ContactInfo(BaseModel):
    email: str = ""
    phone: str = ""
    github: str = ""
    linkedin: str = ""


class CustomNotificationRequest(BaseModel):
    target_type: str  # "specific_user" | "college" | "company" | "role" | "all"
    target_id: Optional[str] = None
    target_role: Optional[str] = None  # "student" | "college" | "company" | "all"
    include_college_students: bool = False
    title: str
    message: str
    category: str = "announcement"  # "announcement" | "update" | "warning" | "alert" | "system"
    priority: str = "normal"  # "normal" | "high" | "urgent"


class IssueReportRequest(BaseModel):
    feature: str = "Frontend"
    message: str
    source: str = "frontend"
    severity: str = "error"  # "warning" | "error" | "critical"
    endpoint: Optional[str] = None
    method: Optional[str] = None
    status_code: Optional[int] = None
    error_type: Optional[str] = None
    stack_trace: Optional[str] = None


class IssueUpdateRequest(BaseModel):
    status: str  # "open" | "investigating" | "resolved"
    resolution_note: Optional[str] = None


class JobModerationRequest(BaseModel):
    status: str  # "active" | "closed" | "flagged"
    reason: Optional[str] = None


class AnnouncementBannerRequest(BaseModel):
    enabled: bool = False
    title: str = ""
    message: str = ""
    variant: str = "info"  # "info" | "success" | "warning"
    target_role: str = "all"  # "all" | "student" | "college" | "company"


router = APIRouter(prefix="/admin", tags=["Admin"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        role: str = payload.get("role")
        if role != "super_admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _safe_iso(val) -> str:
    if isinstance(val, datetime):
        return val.isoformat()
    return str(val) if val else ""


def _parse_dt(val) -> Optional[datetime]:
    if isinstance(val, datetime):
        return val
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            return None
    return None


@router.get("/dashboard-stats")
async def get_admin_dashboard(admin=Depends(get_current_admin)):
    db = get_database()
    users_collection = db["users"]
    jobs_collection = db["jobs"]
    applications_collection = db["applications"]
    issues_collection = db["system_issues"]

    total_users = await users_collection.count_documents({})
    total_students = await users_collection.count_documents({"role": "student"})
    total_colleges = await users_collection.count_documents({"role": "college"})
    total_companies = await users_collection.count_documents({"role": "company"})
    suspended_users = await users_collection.count_documents({"is_suspended": True})
    pending_company_approvals = await users_collection.count_documents({"role": "company", "is_approved": False})
    pending_student_approvals = await users_collection.count_documents({"role": "student", "is_college_approved": False})

    total_jobs = await jobs_collection.count_documents({})
    active_jobs = await jobs_collection.count_documents({"status": "active"})
    total_applications = await applications_collection.count_documents({})
    placed_applications = await applications_collection.count_documents({
        "status": {"$in": ["Shortlisted", "Offer Sent", "Hired", "Accepted"]}
    })
    open_issues = await issues_collection.count_documents({"status": {"$in": ["open", "investigating"]}})

    # Get all colleges and companies for management
    orgs_cursor = users_collection.find({
        "role": {"$in": ["college", "company"]}
    }).sort("created_at", -1)

    organizations = []
    async for org in orgs_cursor:
        org["_id"] = str(org["_id"])
        org.pop("hashed_password", None)
        if "created_at" in org and org["created_at"]:
            org["created_at"] = _safe_iso(org["created_at"])
        organizations.append(org)

    return {
        "stats": {
            "total_users": total_users,
            "total_students": total_students,
            "total_colleges": total_colleges,
            "total_companies": total_companies,
            "suspended_users": suspended_users,
            "pending_approvals": pending_company_approvals + pending_student_approvals,
            "pending_company_approvals": pending_company_approvals,
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": total_applications,
            "placed_applications": placed_applications,
            "open_issues": open_issues,
        },
        "organizations": organizations,
    }


@router.get("/analytics")
async def get_admin_analytics(days: int = Query(14, ge=7, le=90), admin=Depends(get_current_admin)):
    db = get_database()
    users_col = db["users"]
    jobs_col = db["jobs"]
    apps_col = db["applications"]
    activities_col = db["activities"]
    issues_col = db["system_issues"]

    # 1. User distribution
    total_students = await users_col.count_documents({"role": "student"})
    total_colleges = await users_col.count_documents({"role": "college"})
    total_companies = await users_col.count_documents({"role": "company"})
    total_admins = await users_col.count_documents({"role": "super_admin"})
    total_users = total_students + total_colleges + total_companies + total_admins

    approved_students = await users_col.count_documents({"role": "student", "is_college_approved": True})
    approved_companies = await users_col.count_documents({"role": "company", "is_approved": {"$ne": False}})
    suspended_users = await users_col.count_documents({"is_suspended": True})

    user_distribution = [
        {"name": "Students", "value": total_students, "key": "student"},
        {"name": "Colleges", "value": total_colleges, "key": "college"},
        {"name": "Companies", "value": total_companies, "key": "company"},
        {"name": "Admins", "value": total_admins, "key": "super_admin"},
    ]

    # 2. Multi-day trends (signups, logins, jobs, applications)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = today - timedelta(days=days - 1)
    trends_map: Dict[str, dict] = {}
    for i in range(days):
        d = start_date + timedelta(days=i)
        key = d.strftime("%Y-%m-%d")
        trends_map[key] = {
            "date": key,
            "label": d.strftime("%b %d"),
            "signups": 0,
            "logins": 0,
            "jobs": 0,
            "applications": 0,
        }

    async for u in users_col.find({"created_at": {"$gte": start_date}}, {"created_at": 1}):
        dt = _parse_dt(u.get("created_at"))
        if dt:
            k = dt.strftime("%Y-%m-%d")
            if k in trends_map:
                trends_map[k]["signups"] += 1

    async for act in activities_col.find({"created_at": {"$gte": start_date}, "type": "login"}, {"created_at": 1}):
        dt = _parse_dt(act.get("created_at"))
        if dt:
            k = dt.strftime("%Y-%m-%d")
            if k in trends_map:
                trends_map[k]["logins"] += 1

    async for job in jobs_col.find({"created_at": {"$gte": start_date}}, {"created_at": 1}):
        dt = _parse_dt(job.get("created_at"))
        if dt:
            k = dt.strftime("%Y-%m-%d")
            if k in trends_map:
                trends_map[k]["jobs"] += 1

    async for app in apps_col.find({"created_at": {"$gte": start_date}}, {"created_at": 1}):
        dt = _parse_dt(app.get("created_at"))
        if dt:
            k = dt.strftime("%Y-%m-%d")
            if k in trends_map:
                trends_map[k]["applications"] += 1

    daily_trends = list(trends_map.values())

    # 3. Recruitment Funnel / Applications by status
    funnel_counts = {
        "In Review": 0,
        "Shortlisted": 0,
        "Offer Sent": 0,
        "Hired": 0,
        "Rejected": 0,
    }
    college_apps: Dict[str, int] = {}
    college_placements: Dict[str, int] = {}
    company_apps: Dict[str, int] = {}
    company_hires: Dict[str, int] = {}
    total_applications = 0

    async for app in apps_col.find({}, {"status": 1, "college_id": 1, "company_id": 1}):
        total_applications += 1
        st = app.get("status", "In Review")
        if st == "Accepted":
            st = "Hired"
        if st in funnel_counts:
            funnel_counts[st] += 1
        else:
            funnel_counts["In Review"] += 1

        cid = app.get("college_id")
        if cid:
            college_apps[cid] = college_apps.get(cid, 0) + 1
            if st in ("Shortlisted", "Offer Sent", "Hired"):
                college_placements[cid] = college_placements.get(cid, 0) + 1

        comp_id = app.get("company_id")
        if comp_id:
            company_apps[comp_id] = company_apps.get(comp_id, 0) + 1
            if st in ("Offer Sent", "Hired"):
                company_hires[comp_id] = company_hires.get(comp_id, 0) + 1

    application_funnel = [{"stage": k, "count": v} for k, v in funnel_counts.items()]
    placed_total = funnel_counts["Shortlisted"] + funnel_counts["Offer Sent"] + funnel_counts["Hired"]
    placement_rate = round((placed_total / total_applications) * 100, 1) if total_applications > 0 else 0.0

    # 4. Job Breakdown (visibility, employment type, status)
    visibility_counts = {"Public": 0, "College-Targeted": 0}
    employment_counts: Dict[str, int] = {}
    job_status_counts = {"active": 0, "closed": 0, "flagged": 0}
    company_jobs: Dict[str, int] = {}
    company_active_jobs: Dict[str, int] = {}
    total_jobs = 0

    async for job in jobs_col.find({}, {"visibility": 1, "employment_type": 1, "job_type": 1, "status": 1, "company_id": 1}):
        total_jobs += 1
        vis = job.get("visibility", "public")
        if vis == "requested_college":
            visibility_counts["College-Targeted"] += 1
        else:
            visibility_counts["Public"] += 1

        emp = (job.get("employment_type") or job.get("job_type") or "Other").strip()
        employment_counts[emp] = employment_counts.get(emp, 0) + 1

        jst = job.get("status", "active")
        job_status_counts[jst] = job_status_counts.get(jst, 0) + 1

        comp_id = job.get("company_id")
        if comp_id:
            company_jobs[comp_id] = company_jobs.get(comp_id, 0) + 1
            if jst == "active":
                company_active_jobs[comp_id] = company_active_jobs.get(comp_id, 0) + 1

    job_visibility = [{"name": k, "value": v} for k, v in visibility_counts.items()]
    job_employment_types = [{"name": k, "value": v} for k, v in sorted(employment_counts.items(), key=lambda x: -x[1])[:8]]

    # 5. Top Colleges (Equity & Engagement)
    college_students: Dict[str, int] = {}
    college_approved_students: Dict[str, int] = {}
    async for stu in users_col.find({"role": "student"}, {"college_id": 1, "is_college_approved": 1}):
        cid = stu.get("college_id")
        if cid:
            college_students[cid] = college_students.get(cid, 0) + 1
            if stu.get("is_college_approved", False):
                college_approved_students[cid] = college_approved_students.get(cid, 0) + 1

    top_colleges = []
    async for col in users_col.find({"role": "college"}, {"name": 1, "email": 1, "is_suspended": 1}):
        cid = str(col["_id"])
        stu_count = college_students.get(cid, 0)
        app_stu = college_approved_students.get(cid, 0)
        apps_cnt = college_apps.get(cid, 0)
        placed_cnt = college_placements.get(cid, 0)
        top_colleges.append({
            "id": cid,
            "name": col.get("name") or col.get("email") or "College",
            "students": stu_count,
            "approved_students": app_stu,
            "pending_students": max(0, stu_count - app_stu),
            "applications": apps_cnt,
            "placements": placed_cnt,
            "placement_rate": round((placed_cnt / apps_cnt) * 100, 1) if apps_cnt > 0 else 0.0,
            "is_suspended": col.get("is_suspended", False),
        })
    top_colleges.sort(key=lambda x: (x["students"], x["applications"]), reverse=True)

    # 6. Top Companies
    top_companies = []
    async for comp in users_col.find({"role": "company"}, {"name": 1, "email": 1, "is_approved": 1, "is_suspended": 1}):
        cid = str(comp["_id"])
        top_companies.append({
            "id": cid,
            "name": comp.get("name") or comp.get("email") or "Company",
            "total_jobs": company_jobs.get(cid, 0),
            "active_jobs": company_active_jobs.get(cid, 0),
            "applications": company_apps.get(cid, 0),
            "hires": company_hires.get(cid, 0),
            "is_approved": comp.get("is_approved", True),
            "is_suspended": comp.get("is_suspended", False),
        })
    top_companies.sort(key=lambda x: (x["total_jobs"], x["applications"]), reverse=True)

    # 7. Issues by Feature
    issues_feature_map: Dict[str, dict] = {}
    open_issues_count = 0
    critical_issues_count = 0
    total_issues_count = 0
    async for iss in issues_col.find({}, {"feature": 1, "status": 1, "severity": 1}):
        total_issues_count += 1
        feat = iss.get("feature") or "General"
        st = iss.get("status", "open")
        sev = iss.get("severity", "error")
        if feat not in issues_feature_map:
            issues_feature_map[feat] = {"feature": feat, "open": 0, "resolved": 0, "total": 0}
        issues_feature_map[feat]["total"] += 1
        if st == "resolved":
            issues_feature_map[feat]["resolved"] += 1
        else:
            issues_feature_map[feat]["open"] += 1
            open_issues_count += 1
            if sev == "critical":
                critical_issues_count += 1

    issues_by_feature = sorted(issues_feature_map.values(), key=lambda x: -x["total"])

    return {
        "overview": {
            "total_users": total_users,
            "total_students": total_students,
            "approved_students": approved_students,
            "total_colleges": total_colleges,
            "total_companies": total_companies,
            "approved_companies": approved_companies,
            "suspended_users": suspended_users,
            "total_jobs": total_jobs,
            "active_jobs": job_status_counts.get("active", 0),
            "flagged_jobs": job_status_counts.get("flagged", 0),
            "total_applications": total_applications,
            "placed_applications": placed_total,
            "placement_rate": placement_rate,
            "open_issues": open_issues_count,
            "critical_issues": critical_issues_count,
            "total_issues": total_issues_count,
        },
        "user_distribution": user_distribution,
        "daily_trends": daily_trends,
        "application_funnel": application_funnel,
        "job_visibility": job_visibility,
        "job_employment_types": job_employment_types,
        "top_colleges": top_colleges[:10],
        "top_companies": top_companies[:10],
        "issues_by_feature": issues_by_feature,
    }


@router.get("/recipients")
async def get_notification_recipients(admin=Depends(get_current_admin)):
    db = get_database()
    cursor = db["users"].find(
        {"role": {"$in": ["student", "college", "company"]}},
        {"name": 1, "email": 1, "role": 1, "college_id": 1, "is_suspended": 1, "is_approved": 1}
    ).sort("name", 1)

    students, colleges, companies = [], [], []
    async for u in cursor:
        item = {
            "id": str(u["_id"]),
            "name": u.get("name") or u.get("email"),
            "email": u.get("email"),
            "role": u.get("role"),
            "college_id": u.get("college_id"),
            "is_suspended": u.get("is_suspended", False),
        }
        if item["role"] == "student":
            students.append(item)
        elif item["role"] == "college":
            colleges.append(item)
        elif item["role"] == "company":
            companies.append(item)

    return {
        "students": students,
        "colleges": colleges,
        "companies": companies,
        "counts": {
            "students": len(students),
            "colleges": len(colleges),
            "companies": len(companies),
            "all": len(students) + len(colleges) + len(companies),
        },
    }


@router.post("/notifications/send")
async def send_custom_notification(req: CustomNotificationRequest, admin=Depends(get_current_admin)):
    db = get_database()
    notifications_col = db["notifications"]
    users_col = db["users"]

    title = req.title.strip()
    message = req.message.strip()
    if not title or not message:
        raise HTTPException(status_code=400, detail="Title and message are required")

    admin_id = admin.get("sub")
    admin_doc = await users_col.find_one({"_id": ObjectId(admin_id)}) if admin_id else None
    sender_name = (admin_doc.get("name") if admin_doc else None) or "Super Admin"

    now = datetime.utcnow()
    delivered_count = 0
    target_label = ""
    base_doc = {
        "title": title,
        "message": message,
        "type": req.category,
        "priority": req.priority,
        "sent_by_admin": True,
        "sender_id": admin_id,
        "sender_name": sender_name,
        "read_by": [],
        "dismissed_by": [],
        "is_read": False,
        "created_at": now,
    }

    if req.target_type in ("specific_user", "college", "company"):
        if not req.target_id:
            raise HTTPException(status_code=400, detail="Please select a recipient")
        try:
            target_user = await users_col.find_one({"_id": ObjectId(req.target_id)})
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid recipient ID")
        if not target_user:
            raise HTTPException(status_code=404, detail="Selected recipient not found")

        target_name = target_user.get("name") or target_user.get("email")
        target_role = target_user.get("role", "user")
        target_label = f"{target_name} ({target_role.title()})"

        docs_to_insert = [{
            **base_doc,
            "recipient_id": str(target_user["_id"]),
            "target_type": req.target_type,
            "target_label": target_label,
            "user_id": str(target_user["_id"]),
            "user_name": target_name,
            "user_role": target_role,
            "user_email": target_user.get("email"),
        }]

        # Optionally also notify all students of the selected college
        if req.target_type == "college" and req.include_college_students:
            stu_cursor = users_col.find({"role": "student", "college_id": str(target_user["_id"])})
            extra_students = 0
            async for stu in stu_cursor:
                extra_students += 1
                docs_to_insert.append({
                    **base_doc,
                    "recipient_id": str(stu["_id"]),
                    "target_type": "college_with_students",
                    "target_label": f"{target_name} + Students",
                    "user_id": str(stu["_id"]),
                    "user_name": stu.get("name") or stu.get("email"),
                    "user_role": "student",
                    "user_email": stu.get("email"),
                })
            target_label = f"{target_name} + {extra_students} Student(s)"

        await notifications_col.insert_many(docs_to_insert)
        delivered_count = len(docs_to_insert)

    elif req.target_type == "role":
        if req.target_role not in ("student", "college", "company"):
            raise HTTPException(status_code=400, detail="Invalid target role")
        role_names = {"student": "All Students", "college": "All Colleges", "company": "All Companies"}
        target_label = role_names[req.target_role]
        await notifications_col.insert_one({
            **base_doc,
            "recipient_role": req.target_role,
            "target_type": "role",
            "target_label": target_label,
            "user_role": req.target_role,
        })
        delivered_count = await users_col.count_documents({"role": req.target_role})

    elif req.target_type == "all":
        target_label = "All Platform Users"
        await notifications_col.insert_one({
            **base_doc,
            "recipient_role": "all",
            "target_type": "all",
            "target_label": target_label,
            "user_role": "all",
        })
        delivered_count = await users_col.count_documents({"role": {"$in": ["student", "college", "company"]}})

    else:
        raise HTTPException(status_code=400, detail="Invalid target_type")

    # Record a summary in admin_dispatches for clean history even when fanning out to college students
    await db["admin_notification_history"].insert_one({
        "title": title,
        "message": message,
        "category": req.category,
        "priority": req.priority,
        "target_type": req.target_type,
        "target_label": target_label,
        "delivered_count": delivered_count,
        "sender_name": sender_name,
        "created_at": now,
    })

    await log_activity(
        user_id=admin_id or "admin",
        user_name=sender_name,
        role="super_admin",
        action_type="notification",
        details=f"Sent custom notification '{title}' to {target_label}"
    )

    return {
        "message": f"Notification sent to {target_label}",
        "target_label": target_label,
        "delivered_count": delivered_count,
    }


@router.get("/notifications/sent")
async def get_sent_notifications(admin=Depends(get_current_admin)):
    db = get_database()
    cursor = db["admin_notification_history"].find({}).sort("created_at", -1).limit(50)
    history = []
    async for item in cursor:
        history.append({
            "id": str(item["_id"]),
            "title": item.get("title", ""),
            "message": item.get("message", ""),
            "category": item.get("category", "announcement"),
            "priority": item.get("priority", "normal"),
            "target_type": item.get("target_type", ""),
            "target_label": item.get("target_label", ""),
            "delivered_count": item.get("delivered_count", 1),
            "sender_name": item.get("sender_name", "Super Admin"),
            "created_at": _safe_iso(item.get("created_at")),
        })
    return history


@router.post("/issues/report")
async def report_system_issue(req: IssueReportRequest, request: Request):
    # Extract optional user info if Bearer token is present
    user_id, user_role = None, None
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
            user_role = payload.get("role")
        except Exception:
            pass

    severity = req.severity if req.severity in ("warning", "error", "critical") else "error"
    source = req.source if req.source in ("frontend", "backend") else "frontend"

    await log_system_issue(
        feature=req.feature,
        message=req.message,
        source=source,
        severity=severity,
        endpoint=req.endpoint,
        method=req.method,
        status_code=req.status_code,
        error_type=req.error_type or "FeatureFailure",
        stack_trace=req.stack_trace,
        user_id=user_id,
        user_role=user_role,
    )
    return {"message": "Issue logged"}


@router.get("/issues")
async def get_system_issues(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    source: Optional[str] = None,
    admin=Depends(get_current_admin),
):
    db = get_database()
    issues_col = db["system_issues"]

    query: dict = {}
    if status and status != "all":
        query["status"] = status
    if severity and severity != "all":
        query["severity"] = severity
    if source and source != "all":
        query["source"] = source

    cursor = issues_col.find(query).sort("created_at", -1).limit(100)
    issues = []
    async for iss in cursor:
        issues.append({
            "id": str(iss["_id"]),
            "source": iss.get("source", "backend"),
            "feature": iss.get("feature", "General"),
            "endpoint": iss.get("endpoint", ""),
            "method": iss.get("method", ""),
            "status_code": iss.get("status_code"),
            "severity": iss.get("severity", "error"),
            "error_type": iss.get("error_type", "Error"),
            "message": iss.get("message", ""),
            "stack_trace": iss.get("stack_trace"),
            "user_id": iss.get("user_id"),
            "user_email": iss.get("user_email"),
            "user_role": iss.get("user_role"),
            "status": iss.get("status", "open"),
            "resolution_note": iss.get("resolution_note", ""),
            "created_at": _safe_iso(iss.get("created_at")),
            "resolved_at": _safe_iso(iss.get("resolved_at")) if iss.get("resolved_at") else None,
        })

    total = await issues_col.count_documents({})
    open_count = await issues_col.count_documents({"status": "open"})
    investigating_count = await issues_col.count_documents({"status": "investigating"})
    resolved_count = await issues_col.count_documents({"status": "resolved"})
    critical_count = await issues_col.count_documents({"severity": "critical", "status": {"$ne": "resolved"}})

    # Group issues by feature for chart
    feature_counts: Dict[str, dict] = {}
    async for doc in issues_col.find({}, {"feature": 1, "status": 1}):
        feat = doc.get("feature") or "General"
        if feat not in feature_counts:
            feature_counts[feat] = {"feature": feat, "open": 0, "resolved": 0}
        if doc.get("status") == "resolved":
            feature_counts[feat]["resolved"] += 1
        else:
            feature_counts[feat]["open"] += 1

    return {
        "summary": {
            "total": total,
            "open": open_count,
            "investigating": investigating_count,
            "resolved": resolved_count,
            "critical": critical_count,
        },
        "by_feature": list(feature_counts.values()),
        "issues": issues,
    }


@router.patch("/issues/{issue_id}")
async def update_system_issue(issue_id: str, req: IssueUpdateRequest, admin=Depends(get_current_admin)):
    if req.status not in ("open", "investigating", "resolved"):
        raise HTTPException(status_code=400, detail="Invalid issue status")

    db = get_database()
    update_fields: dict = {"status": req.status}
    if req.resolution_note is not None:
        update_fields["resolution_note"] = req.resolution_note.strip()
    if req.status == "resolved":
        update_fields["resolved_at"] = datetime.utcnow()
    else:
        update_fields["resolved_at"] = None

    result = await db["system_issues"].update_one(
        {"_id": ObjectId(issue_id)},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Issue not found")
    return {"message": f"Issue marked as {req.status}"}


@router.delete("/issues/{issue_id}")
async def delete_system_issue(issue_id: str, admin=Depends(get_current_admin)):
    db = get_database()
    await db["system_issues"].delete_one({"_id": ObjectId(issue_id)})
    return {"message": "Issue deleted"}


@router.delete("/issues")
async def clear_resolved_issues(admin=Depends(get_current_admin)):
    db = get_database()
    res = await db["system_issues"].delete_many({"status": "resolved"})
    return {"message": f"Cleared {res.deleted_count} resolved issue(s)", "deleted_count": res.deleted_count}


@router.get("/system-health")
async def get_system_health(admin=Depends(get_current_admin)):
    db = get_database()
    start = time.perf_counter()
    db_status = "healthy"
    db_error = None
    try:
        await db.command("ping")
    except Exception as exc:
        db_status = "degraded"
        db_error = str(exc)
    latency_ms = round((time.perf_counter() - start) * 1000, 1)

    collections = {}
    for col_name in ("users", "jobs", "applications", "notifications", "activities", "system_issues"):
        try:
            collections[col_name] = await db[col_name].count_documents({})
        except Exception:
            collections[col_name] = -1

    open_critical = await db["system_issues"].count_documents({"severity": "critical", "status": {"$ne": "resolved"}})
    overall = "healthy"
    if db_status != "healthy" or open_critical > 0:
        overall = "degraded"

    return {
        "overall_status": overall,
        "database_status": db_status,
        "database_latency_ms": latency_ms,
        "database_error": db_error,
        "open_critical_issues": open_critical,
        "collections": collections,
        "checked_at": datetime.utcnow().isoformat(),
    }


@router.patch("/toggle-suspend/{user_id}")
async def toggle_suspend(user_id: str, admin=Depends(get_current_admin)):
    db = get_database()
    users_collection = db["users"]

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_status = not user.get("is_suspended", False)

    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_suspended": new_status}}
    )

    await log_activity(
        user_id=admin.get("sub", "admin"),
        user_name="Super Admin",
        role="super_admin",
        action_type="governance",
        details=f"{'Suspended' if new_status else 'Unsuspended'} {user.get('role', 'user')} account: {user.get('name') or user.get('email')}"
    )

    return {"message": f"Suspension status changed to {new_status}", "is_suspended": new_status}


@router.patch("/approve-organization/{org_id}")
async def toggle_approve_organization(org_id: str, admin=Depends(get_current_admin)):
    db = get_database()
    users_col = db["users"]

    org = await users_col.find_one({"_id": ObjectId(org_id), "role": {"$in": ["college", "company"]}})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    new_approved = not org.get("is_approved", True)
    await users_col.update_one(
        {"_id": ObjectId(org_id)},
        {"$set": {"is_approved": new_approved}}
    )

    # Notify organization of verification change
    try:
        await db["notifications"].insert_one({
            "recipient_id": str(org["_id"]),
            "title": "Account Verified by Admin" if new_approved else "Account Verification Revoked",
            "message": (
                "Your organization account has been verified by CampusConnect Admin. You now have full platform privileges."
                if new_approved
                else "Your organization verification status was paused by an administrator. Please contact support for details."
            ),
            "type": "announcement" if new_approved else "warning",
            "priority": "high",
            "sent_by_admin": True,
            "sender_name": "Super Admin",
            "read_by": [],
            "dismissed_by": [],
            "is_read": False,
            "created_at": datetime.utcnow(),
        })
    except Exception as e:
        print(f"Failed to send approval notification: {e}")

    await log_activity(
        user_id=admin.get("sub", "admin"),
        user_name="Super Admin",
        role="super_admin",
        action_type="governance",
        details=f"{'Verified' if new_approved else 'Revoked verification for'} {org.get('name') or org.get('email')}"
    )

    return {"message": "Organization verified" if new_approved else "Verification revoked", "is_approved": new_approved}


@router.get("/jobs")
async def get_all_platform_jobs(admin=Depends(get_current_admin)):
    db = get_database()
    jobs_col = db["jobs"]
    apps_col = db["applications"]

    cursor = jobs_col.find({}).sort("created_at", -1)
    jobs = []
    async for job in cursor:
        jid = str(job["_id"])
        app_count = await apps_col.count_documents({"job_id": jid})
        jobs.append({
            "id": jid,
            "title": job.get("title", "Untitled Job"),
            "company_id": job.get("company_id"),
            "company_name": job.get("company_name", "Company"),
            "location": job.get("location", ""),
            "job_type": job.get("job_type", ""),
            "employment_type": job.get("employment_type", ""),
            "stipend": job.get("stipend", ""),
            "visibility": job.get("visibility", "public"),
            "status": job.get("status", "active"),
            "moderation_reason": job.get("moderation_reason", ""),
            "applications_count": app_count,
            "created_at": _safe_iso(job.get("created_at")),
        })
    return jobs


@router.patch("/jobs/{job_id}/status")
async def moderate_job_status(job_id: str, req: JobModerationRequest, admin=Depends(get_current_admin)):
    if req.status not in ("active", "closed", "flagged"):
        raise HTTPException(status_code=400, detail="Invalid job status")

    db = get_database()
    job = await db["jobs"].find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    await db["jobs"].update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "status": req.status,
            "moderation_reason": (req.reason or "").strip(),
            "moderated_at": datetime.utcnow(),
        }}
    )

    # Notify company if job is closed or flagged
    if job.get("company_id") and req.status in ("closed", "flagged"):
        reason_suffix = f" Reason: {req.reason.strip()}" if req.reason and req.reason.strip() else ""
        try:
            await db["notifications"].insert_one({
                "recipient_id": job["company_id"],
                "title": f"Job Posting {req.status.title()} by Admin",
                "message": f"Your job posting '{job.get('title', 'Job')}' was marked as {req.status} by an administrator.{reason_suffix}",
                "type": "warning" if req.status == "flagged" else "update",
                "priority": "high",
                "sent_by_admin": True,
                "sender_name": "Super Admin",
                "read_by": [],
                "dismissed_by": [],
                "is_read": False,
                "created_at": datetime.utcnow(),
            })
        except Exception as e:
            print(f"Failed to send job moderation notification: {e}")

    await log_activity(
        user_id=admin.get("sub", "admin"),
        user_name="Super Admin",
        role="super_admin",
        action_type="moderation",
        details=f"Changed job '{job.get('title')}' status to {req.status}"
    )
    return {"message": f"Job marked as {req.status}"}


@router.delete("/jobs/{job_id}")
async def delete_platform_job(job_id: str, admin=Depends(get_current_admin)):
    db = get_database()
    job = await db["jobs"].find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await db["jobs"].delete_one({"_id": ObjectId(job_id)})
    await log_activity(
        user_id=admin.get("sub", "admin"),
        user_name="Super Admin",
        role="super_admin",
        action_type="moderation",
        details=f"Removed job posting '{job.get('title')}' ({job.get('company_name', 'Company')})"
    )
    return {"message": "Job deleted successfully"}


@router.get("/announcement")
async def get_announcement_banner():
    db = get_database()
    banner = await db["settings"].find_one({"type": "announcement_banner"})
    if banner:
        banner.pop("_id", None)
        if "updated_at" in banner and banner["updated_at"]:
            banner["updated_at"] = _safe_iso(banner["updated_at"])
        return banner
    return {
        "enabled": False,
        "title": "",
        "message": "",
        "variant": "info",
        "target_role": "all",
        "updated_at": "",
    }


@router.put("/announcement")
async def update_announcement_banner(req: AnnouncementBannerRequest, admin=Depends(get_current_admin)):
    db = get_database()
    data = req.model_dump()
    data["type"] = "announcement_banner"
    data["updated_at"] = datetime.utcnow()
    await db["settings"].update_one(
        {"type": "announcement_banner"},
        {"$set": data},
        upsert=True,
    )
    await log_activity(
        user_id=admin.get("sub", "admin"),
        user_name="Super Admin",
        role="super_admin",
        action_type="announcement",
        details=f"{'Published' if req.enabled else 'Disabled'} platform announcement banner: {req.title or 'Notice'}"
    )
    data["updated_at"] = data["updated_at"].isoformat()
    return {"message": "Platform announcement updated", "announcement": data}


@router.get("/export/{resource}")
async def export_admin_data(resource: str, admin=Depends(get_current_admin)):
    db = get_database()
    rows = []

    if resource == "users":
        async for u in db["users"].find({}).sort("created_at", -1):
            rows.append({
                "id": str(u["_id"]),
                "name": u.get("name", ""),
                "email": u.get("email", ""),
                "role": u.get("role", ""),
                "is_active": u.get("is_active", True),
                "is_approved": u.get("is_approved", True),
                "is_suspended": u.get("is_suspended", False),
                "created_at": _safe_iso(u.get("created_at")),
            })
    elif resource == "organizations":
        async for o in db["users"].find({"role": {"$in": ["college", "company"]}}).sort("created_at", -1):
            rows.append({
                "id": str(o["_id"]),
                "name": o.get("name", ""),
                "email": o.get("email", ""),
                "type": o.get("role", ""),
                "is_approved": o.get("is_approved", True),
                "is_suspended": o.get("is_suspended", False),
                "created_at": _safe_iso(o.get("created_at")),
            })
    elif resource == "jobs":
        async for j in db["jobs"].find({}).sort("created_at", -1):
            rows.append({
                "id": str(j["_id"]),
                "title": j.get("title", ""),
                "company": j.get("company_name", ""),
                "location": j.get("location", ""),
                "employment_type": j.get("employment_type", ""),
                "visibility": j.get("visibility", "public"),
                "status": j.get("status", "active"),
                "applications_count": j.get("applications_count", 0),
                "created_at": _safe_iso(j.get("created_at")),
            })
    elif resource == "issues":
        async for i in db["system_issues"].find({}).sort("created_at", -1):
            rows.append({
                "id": str(i["_id"]),
                "source": i.get("source", ""),
                "feature": i.get("feature", ""),
                "severity": i.get("severity", ""),
                "status": i.get("status", ""),
                "endpoint": i.get("endpoint", ""),
                "status_code": i.get("status_code", ""),
                "error_type": i.get("error_type", ""),
                "message": i.get("message", ""),
                "created_at": _safe_iso(i.get("created_at")),
            })
    else:
        raise HTTPException(status_code=400, detail="Unsupported export resource")

    return {"resource": resource, "count": len(rows), "rows": rows}


@router.get("/organization/{org_id}")
async def get_organization_details(org_id: str, admin=Depends(get_current_admin)):
    db = get_database()
    users_collection = db["users"]

    org = await users_collection.find_one({"_id": ObjectId(org_id)})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org["_id"] = str(org["_id"])
    org.pop("hashed_password", None)
    if "created_at" in org and org["created_at"]:
        org["created_at"] = _safe_iso(org["created_at"])

    students = []
    if org.get("role") == "college":
        student_cursor = users_collection.find({"role": "student", "college_id": org_id})
        async for student in student_cursor:
            student["_id"] = str(student["_id"])
            student.pop("hashed_password", None)
            if "created_at" in student and student["created_at"]:
                student["created_at"] = _safe_iso(student["created_at"])
            students.append(student)

    return {
        "organization": org,
        "students": students,
    }


@router.get("/activity")
async def get_user_activity(admin=Depends(get_current_admin)):
    db = get_database()
    activities_collection = db["activities"]

    recent_activities_cursor = activities_collection.find({}).sort("created_at", -1).limit(30)
    activities = []

    async for act in recent_activities_cursor:
        created_at = act.get("created_at")
        activities.append({
            "id": str(act["_id"]),
            "type": act.get("type", "activity"),
            "user": act.get("user_name", "Unknown"),
            "role": act.get("role", "user"),
            "time": created_at.isoformat() if isinstance(created_at, datetime) else str(created_at),
            "details": act.get("details", ""),
        })

    today = datetime.utcnow()
    chart_data_dict = {}

    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_name = d.strftime("%a")
        chart_data_dict[day_name] = {"name": day_name, "Student": 0, "College": 0, "Company": 0}

    seven_days_ago = today - timedelta(days=7)
    all_activities = activities_collection.find({"created_at": {"$gte": seven_days_ago}}, {"created_at": 1, "role": 1})

    async for u in all_activities:
        ca = u.get("created_at")
        role = u.get("role", "")
        if not role:
            continue
        role = str(role).capitalize()

        if role not in ["Student", "College", "Company"]:
            continue

        if isinstance(ca, str):
            try:
                ca = datetime.fromisoformat(ca.replace("Z", "+00:00"))
            except ValueError:
                pass

        if isinstance(ca, datetime):
            day_name = ca.strftime("%a")
            if day_name in chart_data_dict:
                chart_data_dict[day_name][role] += 1

    chart_data = list(chart_data_dict.values())

    return {
        "activities": activities,
        "chart_data": chart_data,
    }


@router.get("/contact-info")
async def get_contact_info():
    db = get_database()
    settings_col = db["settings"]
    contact = await settings_col.find_one({"type": "contact_info"})
    if contact:
        contact.pop("_id", None)
        return contact
    return {"email": "admin@campusconnect.com", "phone": "+1 234 567 8900", "github": "https://github.com", "linkedin": "https://linkedin.com"}


@router.put("/contact-info")
async def update_contact_info(info: ContactInfo, admin=Depends(get_current_admin)):
    db = get_database()
    settings_col = db["settings"]
    info_dict = info.model_dump()
    info_dict["type"] = "contact_info"
    await settings_col.update_one({"type": "contact_info"}, {"$set": info_dict}, upsert=True)
    return {"message": "Contact info updated successfully"}


# =====================================================================
# 1. GLOBAL USER DIRECTORY, PASSWORD RESET & ACCESS CONTROL
# =====================================================================

class AdminCreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # "student" | "college" | "company" | "super_admin"
    college_id: Optional[str] = None


class AdminResetPasswordRequest(BaseModel):
    new_password: str


@router.get("/users")
async def get_all_users(
    role: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    admin=Depends(get_current_admin),
):
    db = get_database()
    users_col = db["users"]

    # Map college IDs to names for student rows
    college_names: Dict[str, str] = {}
    async for c in users_col.find({"role": "college"}, {"name": 1, "email": 1}):
        college_names[str(c["_id"])] = c.get("name") or c.get("email") or "College"

    query: dict = {}
    if role and role != "all":
        query["role"] = role
    if status_filter == "suspended":
        query["is_suspended"] = True
    elif status_filter == "active":
        query["is_suspended"] = {"$ne": True}
    elif status_filter == "pending":
        query["$or"] = [
            {"role": "company", "is_approved": False},
            {"role": "student", "is_college_approved": False},
        ]

    cursor = users_col.find(query).sort("created_at", -1)
    users = []
    async for u in cursor:
        uid = str(u["_id"])
        u_role = u.get("role", "student")
        cid = u.get("college_id")
        is_pending = (
            (u_role == "company" and u.get("is_approved") is False)
            or (u_role == "student" and u.get("is_college_approved") is False)
        )
        users.append({
            "id": uid,
            "name": u.get("name") or u.get("email") or "Unnamed",
            "email": u.get("email", ""),
            "role": u_role,
            "college_id": cid,
            "college_name": college_names.get(cid, "") if cid else "",
            "is_active": u.get("is_active", True),
            "is_suspended": u.get("is_suspended", False),
            "is_approved": u.get("is_approved", True),
            "is_college_approved": u.get("is_college_approved", True),
            "is_pending": is_pending,
            "created_at": _safe_iso(u.get("created_at")),
        })

    counts = {
        "total": await users_col.count_documents({}),
        "student": await users_col.count_documents({"role": "student"}),
        "college": await users_col.count_documents({"role": "college"}),
        "company": await users_col.count_documents({"role": "company"}),
        "super_admin": await users_col.count_documents({"role": "super_admin"}),
        "suspended": await users_col.count_documents({"is_suspended": True}),
    }

    return {"counts": counts, "colleges": [{"id": k, "name": v} for k, v in college_names.items()], "users": users}


@router.post("/users")
async def admin_create_user(req: AdminCreateUserRequest, admin=Depends(get_current_admin)):
    if req.role not in ("student", "college", "company", "super_admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    db = get_database()
    users_col = db["users"]
    existing = await users_col.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if req.role == "student" and not req.college_id:
        raise HTTPException(status_code=400, detail="Please select a college for the student")

    user_doc = {
        "name": req.name.strip(),
        "email": req.email,
        "role": req.role,
        "hashed_password": get_password_hash(req.password),
        "is_active": True,
        "is_suspended": False,
        "is_approved": True,
        "created_at": datetime.utcnow(),
    }
    if req.role == "student":
        user_doc["college_id"] = req.college_id
        user_doc["is_college_approved"] = True

    result = await users_col.insert_one(user_doc)
    await log_activity(
        user_id=admin.get("sub", "admin"),
        user_name="Super Admin",
        role="super_admin",
        action_type="governance",
        details=f"Created new {req.role} account: {req.name.strip()} ({req.email})",
    )
    return {"message": f"{req.role.replace('_', ' ').title()} created successfully", "id": str(result.inserted_id)}


@router.post("/users/{user_id}/reset-password")
async def admin_reset_user_password(user_id: str, req: AdminResetPasswordRequest, admin=Depends(get_current_admin)):
    if len(req.new_password.strip()) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    db = get_database()
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"hashed_password": get_password_hash(req.new_password.strip())}},
    )

    try:
        await db["notifications"].insert_one({
            "recipient_id": str(user["_id"]),
            "title": "Password Reset by Administrator",
            "message": "Your account password was reset by a CampusConnect administrator. Please update it in Settings after signing in.",
            "type": "security",
            "priority": "high",
            "sent_by_admin": True,
            "sender_name": "Super Admin",
            "read_by": [],
            "dismissed_by": [],
            "is_read": False,
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass

    await log_activity(
        user_id=admin.get("sub", "admin"),
        user_name="Super Admin",
        role="super_admin",
        action_type="security",
        details=f"Reset password for {user.get('name') or user.get('email')} ({user.get('role')})",
    )
    return {"message": f"Password updated for {user.get('email')}"}


@router.patch("/users/{user_id}/approve")
async def admin_approve_user(user_id: str, admin=Depends(get_current_admin)):
    db = get_database()
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = user.get("role")
    if role == "student":
        new_val = not user.get("is_college_approved", False)
        await db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": {"is_college_approved": new_val}})
        label = "approved" if new_val else "marked pending"
    else:
        new_val = not user.get("is_approved", True)
        await db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": {"is_approved": new_val}})
        label = "verified" if new_val else "unverified"

    await log_activity(
        user_id=admin.get("sub", "admin"),
        user_name="Super Admin",
        role="super_admin",
        action_type="governance",
        details=f"Admin {label} {role}: {user.get('name') or user.get('email')}",
    )
    return {"message": f"User {label} successfully", "approved": new_val}


@router.delete("/users/{user_id}")
async def admin_delete_user(user_id: str, admin=Depends(get_current_admin)):
    if admin.get("sub") == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own active admin account")

    db = get_database()
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db["users"].delete_one({"_id": ObjectId(user_id)})
    await log_activity(
        user_id=admin.get("sub", "admin"),
        user_name="Super Admin",
        role="super_admin",
        action_type="governance",
        details=f"Deleted {user.get('role', 'user')} account: {user.get('name') or user.get('email')}",
    )
    return {"message": "User deleted successfully"}


# =====================================================================
# 2. GLOBAL PLACEMENT & APPLICATIONS OVERSIGHT TRACKER
# =====================================================================

class AdminApplicationStatusRequest(BaseModel):
    status: str


@router.get("/applications")
async def get_all_platform_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    admin=Depends(get_current_admin),
):
    db = get_database()
    apps_col = db["applications"]

    college_names: Dict[str, str] = {}
    async for c in db["users"].find({"role": "college"}, {"name": 1, "email": 1}):
        college_names[str(c["_id"])] = c.get("name") or c.get("email") or "College"

    query: dict = {}
    if status_filter and status_filter != "all":
        query["status"] = status_filter

    cursor = apps_col.find(query).sort("created_at", -1).limit(200)
    applications = []
    async for app in cursor:
        cid = app.get("college_id")
        applications.append({
            "id": str(app["_id"]),
            "job_id": app.get("job_id", ""),
            "job_title": app.get("job_title", "Untitled Job"),
            "company_id": app.get("company_id", ""),
            "company_name": app.get("company_name", "Company"),
            "student_id": app.get("student_id", ""),
            "student_name": app.get("student_name", "Student"),
            "student_email": app.get("student_email", ""),
            "college_id": cid or "",
            "college_name": college_names.get(cid, "Unassigned") if cid else "Unassigned",
            "status": app.get("status", "In Review"),
            "created_at": _safe_iso(app.get("created_at") or app.get("applied_at")),
        })

    summary = {
        "total": await apps_col.count_documents({}),
        "in_review": await apps_col.count_documents({"status": "In Review"}),
        "shortlisted": await apps_col.count_documents({"status": "Shortlisted"}),
        "offer_sent": await apps_col.count_documents({"status": "Offer Sent"}),
        "hired": await apps_col.count_documents({"status": {"$in": ["Hired", "Accepted"]}}),
        "rejected": await apps_col.count_documents({"status": "Rejected"}),
    }
    return {"summary": summary, "applications": applications}


@router.patch("/applications/{application_id}/status")
async def admin_override_application_status(
    application_id: str,
    req: AdminApplicationStatusRequest,
    admin=Depends(get_current_admin),
):
    allowed = ("In Review", "Shortlisted", "Offer Sent", "Hired", "Rejected")
    if req.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(allowed)}")

    db = get_database()
    app_doc = await db["applications"].find_one({"_id": ObjectId(application_id)})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")

    await db["applications"].update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {"status": req.status, "admin_updated_at": datetime.utcnow()}},
    )

    await log_activity(
        user_id=admin.get("sub", "admin"),
        user_name="Super Admin",
        role="super_admin",
        action_type="placement",
        details=f"Updated application for {app_doc.get('student_name')} ({app_doc.get('job_title')}) to {req.status}",
    )
    return {"message": f"Application status updated to {req.status}"}


# =====================================================================
# 3. SKILLS & ELIGIBILITY PREREQUISITES CATALOG
# =====================================================================

class AddSkillRequest(BaseModel):
    names: str  # single skill or comma-separated list


@router.get("/skills")
async def get_skills_catalog(admin=Depends(get_current_admin)):
    db = get_database()
    prereq_col = db["prerequisites"]
    jobs_col = db["jobs"]

    # Seed defaults if empty (matching company.py)
    if await prereq_col.count_documents({}) == 0:
        defaults = [
            "B.Tech / B.E.", "M.Tech / M.E.", "MCA / MSc IT", "BSc / BCA", "MBA / PGDM",
            "Final Year Student", "Pre-final Year Student", "No Active Backlogs",
            "Min 7.0 CGPA / 70%", "Min 8.0 CGPA / 80%",
            "Python", "Java", "C++", "React.js", "Node.js", "JavaScript", "TypeScript",
            "SQL / MongoDB", "Machine Learning / AI", "Data Structures & Algorithms", "Cloud / DevOps",
        ]
        for s in defaults:
            await prereq_col.update_one({"name": s}, {"$set": {"name": s}}, upsert=True)

    # Calculate real job demand per skill/prerequisite
    demand_counts: Dict[str, int] = {}
    async for job in jobs_col.find({}, {"prerequisites": 1}):
        prereqs = job.get("prerequisites")
        if not prereqs:
            continue
        items = prereqs if isinstance(prereqs, list) else [prereqs]
        for item in items:
            if isinstance(item, str) and item.strip():
                key = item.strip().lower()
                demand_counts[key] = demand_counts.get(key, 0) + 1

    skills = []
    async for doc in prereq_col.find({}).sort("name", 1):
        name = doc.get("name", "")
        if not name:
            continue
        skills.append({
            "id": str(doc["_id"]),
            "name": name,
            "demand_count": demand_counts.get(name.strip().lower(), 0),
        })

    top_demanded = sorted(skills, key=lambda s: (-s["demand_count"], s["name"]))[:10]
    return {"total": len(skills), "skills": skills, "top_demanded": top_demanded}


@router.post("/skills")
async def add_skills_to_catalog(req: AddSkillRequest, admin=Depends(get_current_admin)):
    raw_names = [n.strip() for n in req.names.split(",") if n.strip()]
    if not raw_names:
        raise HTTPException(status_code=400, detail="Please enter at least one skill or prerequisite")

    db = get_database()
    prereq_col = db["prerequisites"]
    added = 0
    for name in raw_names:
        res = await prereq_col.update_one({"name": name}, {"$set": {"name": name}}, upsert=True)
        if res.upserted_id is not None:
            added += 1

    await log_activity(
        user_id=admin.get("sub", "admin"),
        user_name="Super Admin",
        role="super_admin",
        action_type="settings",
        details=f"Added {len(raw_names)} skill/eligibility tag(s) to catalog",
    )
    return {"message": f"Added {added} new item(s) to catalog", "added": added}


@router.delete("/skills/{skill_id}")
async def delete_skill_from_catalog(skill_id: str, admin=Depends(get_current_admin)):
    db = get_database()
    await db["prerequisites"].delete_one({"_id": ObjectId(skill_id)})
    return {"message": "Skill removed from catalog"}


# =====================================================================
# 4. PLATFORM GOVERNANCE & POLICY CONTROLS
# =====================================================================

class PlatformControlsRequest(BaseModel):
    allow_student_registration: bool = True
    allow_college_registration: bool = True
    allow_company_registration: bool = True
    require_company_approval: bool = True
    require_student_college_approval: bool = True
    max_active_applications_per_student: int = 0  # 0 = unlimited
    maintenance_mode: bool = False
    maintenance_message: str = "CampusConnect is undergoing scheduled maintenance. Please check back shortly."


DEFAULT_PLATFORM_CONTROLS = PlatformControlsRequest().model_dump()


@router.get("/controls")
async def get_platform_controls():
    db = get_database()
    doc = await db["settings"].find_one({"type": "platform_controls"})
    if doc:
        doc.pop("_id", None)
        if "updated_at" in doc and doc["updated_at"]:
            doc["updated_at"] = _safe_iso(doc["updated_at"])
        return {**DEFAULT_PLATFORM_CONTROLS, **doc}
    return {**DEFAULT_PLATFORM_CONTROLS, "updated_at": ""}


@router.put("/controls")
async def update_platform_controls(req: PlatformControlsRequest, admin=Depends(get_current_admin)):
    if req.max_active_applications_per_student < 0:
        raise HTTPException(status_code=400, detail="Application limit cannot be negative")

    db = get_database()
    data = req.model_dump()
    data["type"] = "platform_controls"
    data["updated_at"] = datetime.utcnow()
    await db["settings"].update_one(
        {"type": "platform_controls"},
        {"$set": data},
        upsert=True,
    )

    await log_activity(
        user_id=admin.get("sub", "admin"),
        user_name="Super Admin",
        role="super_admin",
        action_type="governance",
        details="Updated platform governance & registration policy controls",
    )
    data["updated_at"] = data["updated_at"].isoformat()
    return {"message": "Platform governance controls saved", "controls": data}
