from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import PlainTextResponse
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
import io
import csv
import zipfile
import xml.etree.ElementTree as ET
import re

from database import get_database, log_activity
from core.config import settings
from core.security import get_password_hash

router = APIRouter(prefix="/college", tags=["College"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_college(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "college":
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _safe_iso(val) -> str:
    if isinstance(val, datetime):
        return val.isoformat()
    return str(val) if val else ""


def _parse_float(val) -> Optional[float]:
    if val is None or str(val).strip() == "":
        return None
    try:
        return round(float(str(val).strip()), 2)
    except ValueError:
        return None


def _parse_int(val, default: int = 0) -> int:
    if val is None or str(val).strip() == "":
        return default
    try:
        return int(float(str(val).strip()))
    except ValueError:
        return default


def _col_letters_to_index(col_letters: str) -> int:
    idx = 0
    for ch in col_letters:
        if "A" <= ch <= "Z":
            idx = idx * 26 + (ord(ch) - ord("A") + 1)
    return idx - 1


def _parse_xlsx_bytes(content: bytes) -> List[List[str]]:
    """Pure-stdlib .xlsx parser (no external openpyxl dependency required)."""
    rows_out: List[List[str]] = []
    with zipfile.ZipFile(io.BytesIO(content)) as zf:
        # 1. Load shared strings if present
        shared_strings: List[str] = []
        if "xl/sharedStrings.xml" in zf.namelist():
            root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
            ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            for si in root.findall("s:si", ns):
                texts = [t.text or "" for t in si.findall(".//s:t", ns)]
                shared_strings.append("".join(texts))

        # 2. Pick first worksheet
        sheet_names = sorted(
            [n for n in zf.namelist() if n.startswith("xl/worksheets/sheet") and n.endswith(".xml")]
        )
        if not sheet_names:
            raise ValueError("No worksheet found in Excel file")

        sheet_root = ET.fromstring(zf.read(sheet_names[0]))
        ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

        for row_el in sheet_root.findall(".//s:sheetData/s:row", ns):
            row_dict: Dict[int, str] = {}
            max_col = -1
            for c_el in row_el.findall("s:c", ns):
                ref = c_el.attrib.get("r", "")
                match = re.match(r"([A-Z]+)", ref)
                col_idx = _col_letters_to_index(match.group(1)) if match else (max_col + 1)
                if col_idx > max_col:
                    max_col = col_idx

                c_type = c_el.attrib.get("t", "")
                val = ""
                if c_type == "inlineStr":
                    is_el = c_el.find("s:is", ns)
                    if is_el is not None:
                        val = "".join(t.text or "" for t in is_el.findall(".//s:t", ns))
                else:
                    v_el = c_el.find("s:v", ns)
                    if v_el is not None and v_el.text is not None:
                        if c_type == "s":
                            try:
                                val = shared_strings[int(v_el.text)]
                            except Exception:
                                val = v_el.text
                        else:
                            val = v_el.text
                row_dict[col_idx] = val.strip()

            if max_col >= 0:
                row_list = [row_dict.get(i, "") for i in range(max_col + 1)]
                if any(cell != "" for cell in row_list):
                    rows_out.append(row_list)
    return rows_out


def _parse_spreadsheet_rows(filename: str, content: bytes) -> List[Dict[str, str]]:
    lower_name = (filename or "").lower()
    raw_rows: List[List[str]] = []

    if lower_name.endswith(".xlsx"):
        raw_rows = _parse_xlsx_bytes(content)
    elif lower_name.endswith(".csv") or lower_name.endswith(".txt"):
        text = content.decode("utf-8-sig", errors="replace")
        reader = csv.reader(io.StringIO(text))
        raw_rows = [[c.strip() for c in r] for r in reader if any(c.strip() for c in r)]
    else:
        # Try xlsx first, then fallback to CSV
        try:
            raw_rows = _parse_xlsx_bytes(content)
        except Exception:
            text = content.decode("utf-8-sig", errors="replace")
            reader = csv.reader(io.StringIO(text))
            raw_rows = [[c.strip() for c in r] for r in reader if any(c.strip() for c in r)]

    if len(raw_rows) < 2:
        return []

    headers = [re.sub(r"[^a-z0-9]+", "_", h.strip().lower()).strip("_") for h in raw_rows[0]]
    records: List[Dict[str, str]] = []
    for row in raw_rows[1:]:
        rec: Dict[str, str] = {}
        for i, h in enumerate(headers):
            if h:
                rec[h] = row[i].strip() if i < len(row) else ""
        if any(rec.values()):
            records.append(rec)
    return records


def _student_matches_rule(student: dict, rule: Optional[dict]) -> tuple:
    """Check whether a student satisfies a college's eligibility rule for a job."""
    if not rule:
        return True, ""
    if rule.get("is_open", True) is False:
        return False, "Applications for this drive are currently closed by your college placement cell."

    specific_ids = rule.get("specific_student_ids") or []
    if len(specific_ids) > 0:
        if str(student.get("_id")) not in specific_ids:
            return False, "This drive is currently opened for a hand-picked list of students by your college."

    min_cgpa = rule.get("min_cgpa")
    if min_cgpa is not None and float(min_cgpa) > 0:
        stu_cgpa = _parse_float(student.get("cgpa"))
        if stu_cgpa is None:
            return False, f"Minimum CGPA of {min_cgpa} required by your college (your CGPA is not updated yet)."
        if stu_cgpa < float(min_cgpa):
            return False, f"Minimum CGPA of {min_cgpa} required by your college (your CGPA: {stu_cgpa})."

    allowed_batches = [str(b).strip().lower() for b in (rule.get("allowed_batches") or []) if str(b).strip()]
    if allowed_batches:
        stu_batch = str(student.get("batch") or "").strip().lower()
        if not stu_batch or stu_batch not in allowed_batches:
            return False, f"Restricted to batch(es): {', '.join(rule.get('allowed_batches') or [])}."

    allowed_branches = [str(b).strip().lower() for b in (rule.get("allowed_branches") or []) if str(b).strip()]
    if allowed_branches:
        stu_branch = str(student.get("branch") or "").strip().lower()
        if not stu_branch or stu_branch not in allowed_branches:
            return False, f"Restricted to branch(es): {', '.join(rule.get('allowed_branches') or [])}."

    max_backlogs = rule.get("max_backlogs")
    if max_backlogs is not None:
        stu_backlogs = _parse_int(student.get("backlogs"), 0)
        if stu_backlogs > int(max_backlogs):
            return False, f"Maximum {max_backlogs} active backlog(s) allowed (you have {stu_backlogs})."

    return True, ""


# =====================================================================
# MODELS
# =====================================================================

class StudentAddRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    cgpa: Optional[float] = None
    batch: Optional[str] = None
    branch: Optional[str] = None
    roll_number: Optional[str] = None
    backlogs: int = 0


class StudentUpdateRequest(BaseModel):
    name: Optional[str] = None
    cgpa: Optional[float] = None
    batch: Optional[str] = None
    branch: Optional[str] = None
    roll_number: Optional[str] = None
    backlogs: Optional[int] = None


class CollegeNotificationRequest(BaseModel):
    target_mode: str  # "all_students" | "specific_student" | "batch" | "branch" | "cgpa_min" | "unapplied"
    student_id: Optional[str] = None
    batch: Optional[str] = None
    branch: Optional[str] = None
    min_cgpa: Optional[float] = None
    title: str
    message: str
    category: str = "announcement"  # "announcement" | "update" | "warning" | "alert"
    priority: str = "normal"  # "normal" | "high" | "urgent"


class JobEligibilityRuleRequest(BaseModel):
    is_open: bool = True
    min_cgpa: Optional[float] = None
    allowed_batches: List[str] = []
    allowed_branches: List[str] = []
    max_backlogs: Optional[int] = None
    specific_student_ids: List[str] = []
    note: Optional[str] = ""
    notify_eligible: bool = False


class InvitationResponseRequest(BaseModel):
    decision: str  # "accepted" | "declined"


class CollegeReportRequest(BaseModel):
    title: str
    category: str = "placement_summary"  # "placement_summary" | "issue_escalation" | "company_feedback" | "drive_request" | "general"
    priority: str = "normal"  # "normal" | "high" | "urgent"
    description: str
    attach_stats_snapshot: bool = True


class CollegeMessageRequest(BaseModel):
    message: str


# =====================================================================
# DASHBOARD & INVITATIONS
# =====================================================================

@router.get("/dashboard-stats")
async def get_college_dashboard(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    registered_students = await db["users"].count_documents({
        "role": "student", "college_id": college_id, "is_college_approved": True
    })
    pending_students_count = await db["users"].count_documents({
        "role": "student", "college_id": college_id, "is_college_approved": False
    })

    # Fetch campus drive invitations (jobs targeting this college)
    invites_cursor = db["jobs"].find({
        "status": "active", "visibility": "requested_college", "target_colleges": college_id
    }).sort("created_at", -1)
    recent_invitations = []
    async for invite in invites_cursor:
        responses = invite.get("college_responses", {})
        invite["_id"] = str(invite["_id"])
        invite["id"] = str(invite["_id"])
        if "created_at" in invite and invite["created_at"]:
            invite["created_at"] = _safe_iso(invite["created_at"])
        invite["package_details"] = invite.get("stipend") or invite.get("employment_type", "Competitive Package")
        invite["college_decision"] = responses.get(college_id, "pending")
        recent_invitations.append(invite)

    drive_invitations = len(recent_invitations)
    students_placed = await db["applications"].count_documents({
        "college_id": college_id, "status": {"$in": ["Shortlisted", "Offer Sent", "Hired", "Accepted"]}
    })
    total_applications = await db["applications"].count_documents({"college_id": college_id})
    unread_admin_messages = await db["admin_college_messages"].count_documents({
        "college_id": college_id, "sender_role": "super_admin", "read_by_college": {"$ne": True}
    })

    return {
        "stats": {
            "registered_students": registered_students,
            "pending_students": pending_students_count,
            "drive_invitations": drive_invitations,
            "students_placed": students_placed,
            "total_applications": total_applications,
            "unread_admin_messages": unread_admin_messages,
        },
        "recent_invitations": recent_invitations,
    }


@router.patch("/invitations/{job_id}/respond")
async def respond_to_invitation(job_id: str, req: InvitationResponseRequest, college=Depends(get_current_college)):
    if req.decision not in ("accepted", "declined"):
        raise HTTPException(status_code=400, detail="Decision must be 'accepted' or 'declined'")

    db = get_database()
    college_id = college["sub"]
    job = await db["jobs"].find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job drive not found")

    await db["jobs"].update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {f"college_responses.{college_id}": req.decision}},
    )

    # Also sync college_job_rules open/closed state automatically
    await db["college_job_rules"].update_one(
        {"college_id": college_id, "job_id": job_id},
        {"$set": {"is_open": req.decision == "accepted", "updated_at": datetime.utcnow()}},
        upsert=True,
    )

    # Notify company of college response
    if job.get("company_id"):
        college_doc = await db["users"].find_one({"_id": ObjectId(college_id)}, {"name": 1, "email": 1})
        col_name = (college_doc.get("name") if college_doc else None) or "A college"
        try:
            await db["notifications"].insert_one({
                "recipient_id": job["company_id"],
                "title": f"Campus Drive Invitation {req.decision.title()}",
                "message": f"{col_name} has {req.decision} your drive invitation for '{job.get('title', 'Job')}'.",
                "type": "announcement" if req.decision == "accepted" else "warning",
                "priority": "normal",
                "read_by": [],
                "dismissed_by": [],
                "is_read": False,
                "created_at": datetime.utcnow(),
            })
        except Exception:
            pass

    return {"message": f"Invitation {req.decision}", "decision": req.decision}


# =====================================================================
# STUDENT MANAGEMENT & BULK EXCEL/CSV IMPORT
# =====================================================================

@router.get("/pending-students")
async def get_pending_students(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    cursor = db["users"].find({
        "role": "student",
        "college_id": college_id,
        "is_college_approved": False
    }).sort("created_at", -1)

    students = []
    async for student in cursor:
        student["_id"] = str(student["_id"])
        student.pop("hashed_password", None)
        if "created_at" in student and student["created_at"]:
            student["created_at"] = _safe_iso(student["created_at"])
        students.append(student)

    return students


@router.patch("/approve-student/{student_id}")
async def approve_student(student_id: str, college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    result = await db["users"].update_one(
        {"_id": ObjectId(student_id), "college_id": college_id, "role": "student"},
        {"$set": {"is_college_approved": True}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Student not found or already approved")

    return {"message": "Student approved successfully"}


@router.post("/approve-all-pending")
async def approve_all_pending_students(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]
    result = await db["users"].update_many(
        {"role": "student", "college_id": college_id, "is_college_approved": False},
        {"$set": {"is_college_approved": True}},
    )
    return {"message": f"Approved {result.modified_count} pending student(s)", "approved_count": result.modified_count}


@router.post("/add-student")
async def add_student(student_in: StudentAddRequest, college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    existing_user = await db["users"].find_one({"email": student_in.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = {
        "name": student_in.name.strip(),
        "email": student_in.email,
        "role": "student",
        "is_active": True,
        "college_id": college_id,
        "is_college_approved": True,
        "created_at": datetime.utcnow(),
        "hashed_password": get_password_hash(student_in.password),
        "is_suspended": False,
        "is_approved": True,
        "cgpa": student_in.cgpa,
        "batch": (student_in.batch or "").strip(),
        "branch": (student_in.branch or "").strip(),
        "roll_number": (student_in.roll_number or "").strip(),
        "backlogs": max(0, student_in.backlogs or 0),
    }

    result = await db["users"].insert_one(user_dict)
    return {"message": "Student added successfully", "id": str(result.inserted_id)}


@router.get("/students-template")
async def download_students_template():
    sample = (
        "name,email,password,cgpa,batch,branch,roll_number,backlogs\n"
        "Aarav Sharma,aarav.sharma@college.edu,Student@123,9.2,2026,CSE,CS2026001,0\n"
        "Priya Patel,priya.patel@college.edu,Student@123,8.6,2026,ECE,EC2026014,0\n"
        "Rohan Verma,rohan.verma@college.edu,Student@123,7.8,2027,IT,IT2027008,1\n"
    )
    return PlainTextResponse(
        content=sample,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=campusconnect-students-template.csv"},
    )


@router.post("/import-students")
async def import_students_from_excel(file: UploadFile = File(...), college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        records = _parse_spreadsheet_rows(file.filename or "", content)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse spreadsheet. Please upload a valid .xlsx or .csv file ({exc}).",
        )

    if not records:
        raise HTTPException(
            status_code=400,
            detail="No student rows found. Ensure row 1 has headers (name, email, password, cgpa, batch, branch).",
        )

    imported: List[dict] = []
    errors: List[dict] = []
    email_re = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

    for idx, rec in enumerate(records, start=2):
        name = rec.get("name") or rec.get("full_name") or rec.get("student_name") or ""
        email = (rec.get("email") or rec.get("email_address") or rec.get("student_email") or "").strip().lower()
        password = rec.get("password") or rec.get("temp_password") or "Student@123"
        cgpa = _parse_float(rec.get("cgpa") or rec.get("gpa") or rec.get("score"))
        batch = (rec.get("batch") or rec.get("graduation_year") or rec.get("year") or "").strip()
        branch = (rec.get("branch") or rec.get("department") or rec.get("dept") or "").strip()
        roll_no = (rec.get("roll_number") or rec.get("roll_no") or rec.get("roll") or rec.get("student_id") or "").strip()
        backlogs = max(0, _parse_int(rec.get("backlogs") or rec.get("active_backlogs"), 0))

        if not name or not email:
            errors.append({"row": idx, "email": email or "-", "reason": "Missing required name or email"})
            continue
        if not email_re.match(email):
            errors.append({"row": idx, "email": email, "reason": "Invalid email format"})
            continue

        existing = await db["users"].find_one({"email": email})
        if existing:
            errors.append({"row": idx, "email": email, "reason": "Email already registered"})
            continue

        user_doc = {
            "name": name.strip(),
            "email": email,
            "role": "student",
            "is_active": True,
            "college_id": college_id,
            "is_college_approved": True,
            "created_at": datetime.utcnow(),
            "hashed_password": get_password_hash(password),
            "is_suspended": False,
            "is_approved": True,
            "cgpa": cgpa,
            "batch": batch,
            "branch": branch,
            "roll_number": roll_no,
            "backlogs": backlogs,
        }
        res = await db["users"].insert_one(user_doc)
        imported.append({
            "id": str(res.inserted_id),
            "name": name.strip(),
            "email": email,
            "cgpa": cgpa,
            "batch": batch,
            "branch": branch,
        })

    college_doc = await db["users"].find_one({"_id": ObjectId(college_id)}, {"name": 1, "email": 1})
    col_name = (college_doc.get("name") if college_doc else None) or "College"
    await log_activity(
        user_id=college_id,
        user_name=col_name,
        role="college",
        action_type="bulk_import",
        details=f"Imported {len(imported)} students via {file.filename} ({len(errors)} skipped)",
    )

    return {
        "message": f"Imported {len(imported)} student(s), skipped {len(errors)} row(s).",
        "imported_count": len(imported),
        "skipped_count": len(errors),
        "imported": imported,
        "errors": errors[:50],
    }


@router.get("/students")
async def get_college_students(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    # Gather per-student performance metrics from applications
    perf_map: Dict[str, dict] = {}
    async for app in db["applications"].find({"college_id": college_id}, {"student_id": 1, "status": 1}):
        sid = app.get("student_id")
        if not sid:
            continue
        if sid not in perf_map:
            perf_map[sid] = {"total_applications": 0, "shortlisted": 0, "offers": 0, "hired": 0, "rejected": 0}
        perf_map[sid]["total_applications"] += 1
        st = app.get("status", "In Review")
        if st == "Shortlisted":
            perf_map[sid]["shortlisted"] += 1
        elif st == "Offer Sent":
            perf_map[sid]["offers"] += 1
        elif st in ("Hired", "Accepted"):
            perf_map[sid]["hired"] += 1
        elif st == "Rejected":
            perf_map[sid]["rejected"] += 1

    cursor = db["users"].find({
        "role": "student",
        "college_id": college_id,
        "is_college_approved": True
    }).sort("created_at", -1)

    students = []
    async for student in cursor:
        sid = str(student["_id"])
        student["_id"] = sid
        student.pop("hashed_password", None)
        if "created_at" in student and student["created_at"]:
            student["created_at"] = _safe_iso(student["created_at"])

        perf = perf_map.get(sid, {"total_applications": 0, "shortlisted": 0, "offers": 0, "hired": 0, "rejected": 0})
        student["performance"] = perf
        if perf["hired"] > 0 or perf["offers"] > 0:
            student["placement_status"] = "Placed"
        elif perf["shortlisted"] > 0:
            student["placement_status"] = "Shortlisted"
        elif perf["total_applications"] > 0:
            student["placement_status"] = "Applying"
        else:
            student["placement_status"] = "Not Applied"

        students.append(student)

    return students


@router.get("/students/{student_id}")
async def get_student_details(student_id: str, college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    student = await db["users"].find_one({
        "_id": ObjectId(student_id),
        "college_id": college_id,
        "role": "student"
    })

    if not student:
        raise HTTPException(status_code=404, detail="Student not found or does not belong to this college")

    student["_id"] = str(student["_id"])
    student.pop("hashed_password", None)
    if "created_at" in student and student["created_at"]:
        student["created_at"] = _safe_iso(student["created_at"])

    # Also return this student's application history
    apps = []
    async for app in db["applications"].find({"student_id": student_id}).sort("created_at", -1):
        apps.append({
            "id": str(app["_id"]),
            "job_id": app.get("job_id"),
            "job_title": app.get("job_title", "Job"),
            "company_name": app.get("company_name", "Company"),
            "status": app.get("status", "In Review"),
            "created_at": _safe_iso(app.get("created_at") or app.get("applied_at")),
        })
    student["applications"] = apps

    return student


@router.put("/students/{student_id}")
async def update_student_academic_profile(
    student_id: str,
    req: StudentUpdateRequest,
    college=Depends(get_current_college),
):
    db = get_database()
    college_id = college["sub"]

    update_fields: dict = {}
    if req.name is not None and req.name.strip():
        update_fields["name"] = req.name.strip()
    if req.cgpa is not None:
        update_fields["cgpa"] = round(float(req.cgpa), 2)
    if req.batch is not None:
        update_fields["batch"] = req.batch.strip()
    if req.branch is not None:
        update_fields["branch"] = req.branch.strip()
    if req.roll_number is not None:
        update_fields["roll_number"] = req.roll_number.strip()
    if req.backlogs is not None:
        update_fields["backlogs"] = max(0, int(req.backlogs))

    if not update_fields:
        return {"message": "No changes provided"}

    res = await db["users"].update_one(
        {"_id": ObjectId(student_id), "college_id": college_id, "role": "student"},
        {"$set": update_fields},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found or does not belong to this college")

    return {"message": "Student academic profile updated", "updated": update_fields}


@router.patch("/students/{student_id}/toggle-suspend")
async def toggle_student_suspension(student_id: str, college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    student = await db["users"].find_one({
        "_id": ObjectId(student_id),
        "college_id": college_id,
        "role": "student"
    })

    if not student:
        raise HTTPException(status_code=404, detail="Student not found or does not belong to this college")

    new_status = not student.get("is_suspended", False)

    await db["users"].update_one(
        {"_id": ObjectId(student_id)},
        {"$set": {"is_suspended": new_status}}
    )

    return {"message": "Student suspended" if new_status else "Student unsuspended", "is_suspended": new_status}


@router.get("/selected-jobs")
async def get_selected_jobs(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    cursor = db["applications"].find({
        "college_id": college_id,
        "status": {"$in": ["Shortlisted", "Offer Sent", "Hired", "Accepted"]}
    }).sort("created_at", -1)

    selected_jobs = []
    async for app in cursor:
        app["_id"] = str(app["_id"])
        app["created_at"] = _safe_iso(app.get("created_at") or app.get("applied_at"))
        app["applied_at"] = app["created_at"]
        selected_jobs.append(app)

    return selected_jobs


# =====================================================================
# CUSTOM STUDENT NOTIFICATIONS (ALL / SPECIFIC / BATCH / BRANCH / CGPA / UNAPPLIED)
# =====================================================================

@router.post("/notifications/send")
async def send_college_student_notification(req: CollegeNotificationRequest, college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    title = req.title.strip()
    message = req.message.strip()
    if not title or not message:
        raise HTTPException(status_code=400, detail="Title and message are required")

    college_doc = await db["users"].find_one({"_id": ObjectId(college_id)}, {"name": 1, "email": 1})
    college_name = (college_doc.get("name") if college_doc else None) or "College Placement Cell"

    base_query: dict = {"role": "student", "college_id": college_id, "is_college_approved": True}
    target_label = "All College Students"

    if req.target_mode == "specific_student":
        if not req.student_id:
            raise HTTPException(status_code=400, detail="Please select a student")
        base_query["_id"] = ObjectId(req.student_id)
    elif req.target_mode == "batch":
        if not req.batch or not req.batch.strip():
            raise HTTPException(status_code=400, detail="Please specify a batch")
        base_query["batch"] = {"$regex": f"^{re.escape(req.batch.strip())}$", "$options": "i"}
        target_label = f"Batch {req.batch.strip()} Students"
    elif req.target_mode == "branch":
        if not req.branch or not req.branch.strip():
            raise HTTPException(status_code=400, detail="Please specify a branch")
        base_query["branch"] = {"$regex": f"^{re.escape(req.branch.strip())}$", "$options": "i"}
        target_label = f"{req.branch.strip().upper()} Branch Students"
    elif req.target_mode == "cgpa_min":
        if req.min_cgpa is None:
            raise HTTPException(status_code=400, detail="Please enter a minimum CGPA")
        base_query["cgpa"] = {"$gte": float(req.min_cgpa)}
        target_label = f"Students with CGPA >= {req.min_cgpa}"
    elif req.target_mode == "unapplied":
        applied_ids = set()
        async for app in db["applications"].find({"college_id": college_id}, {"student_id": 1}):
            if app.get("student_id"):
                applied_ids.add(app["student_id"])
        target_label = "Students with 0 Applications (Nudge)"
    elif req.target_mode != "all_students":
        raise HTTPException(status_code=400, detail="Invalid target_mode")

    matched_students = []
    async for stu in db["users"].find(base_query, {"name": 1, "email": 1}):
        if req.target_mode == "unapplied" and str(stu["_id"]) in applied_ids:
            continue
        matched_students.append(stu)

    if not matched_students:
        raise HTTPException(status_code=404, detail="No students matched the selected criteria.")

    if req.target_mode == "specific_student":
        s = matched_students[0]
        target_label = f"{s.get('name') or s.get('email')} (Student)"

    now = datetime.utcnow()
    notif_docs = [
        {
            "recipient_id": str(stu["_id"]),
            "title": title,
            "message": message,
            "type": req.category,
            "priority": req.priority,
            "sent_by_college": True,
            "sender_id": college_id,
            "sender_name": college_name,
            "user_id": str(stu["_id"]),
            "user_name": stu.get("name") or stu.get("email"),
            "user_role": "student",
            "read_by": [],
            "dismissed_by": [],
            "is_read": False,
            "created_at": now,
        }
        for stu in matched_students
    ]
    await db["notifications"].insert_many(notif_docs)

    await db["college_notification_history"].insert_one({
        "college_id": college_id,
        "title": title,
        "message": message,
        "category": req.category,
        "priority": req.priority,
        "target_mode": req.target_mode,
        "target_label": target_label,
        "delivered_count": len(notif_docs),
        "created_at": now,
    })

    return {
        "message": f"Notification delivered to {len(notif_docs)} student(s) ({target_label}).",
        "delivered_count": len(notif_docs),
        "target_label": target_label,
    }


@router.get("/notifications/sent")
async def get_college_sent_notifications(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]
    cursor = db["college_notification_history"].find({"college_id": college_id}).sort("created_at", -1).limit(50)
    items = []
    async for doc in cursor:
        items.append({
            "id": str(doc["_id"]),
            "title": doc.get("title", ""),
            "message": doc.get("message", ""),
            "category": doc.get("category", "announcement"),
            "priority": doc.get("priority", "normal"),
            "target_label": doc.get("target_label", ""),
            "delivered_count": doc.get("delivered_count", 0),
            "created_at": _safe_iso(doc.get("created_at")),
        })
    return items


# =====================================================================
# JOB ELIGIBILITY CONTROL & PER-JOB TRACKING
# =====================================================================

@router.get("/jobs")
async def get_college_jobs_with_rules(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    # Fetch all approved students of this college for live eligibility count calculation
    college_students = []
    async for s in db["users"].find({"role": "student", "college_id": college_id, "is_college_approved": True, "is_suspended": {"$ne": True}}):
        college_students.append(s)

    # Fetch saved college eligibility rules
    rules_map: Dict[str, dict] = {}
    async for r in db["college_job_rules"].find({"college_id": college_id}):
        r["_id"] = str(r["_id"])
        rules_map[r["job_id"]] = r

    # Fetch college applications grouped by job_id
    job_apps_map: Dict[str, dict] = {}
    async for app in db["applications"].find({"college_id": college_id}, {"job_id": 1, "status": 1}):
        jid = app.get("job_id")
        if not jid:
            continue
        if jid not in job_apps_map:
            job_apps_map[jid] = {"applied": 0, "shortlisted": 0, "offers": 0, "hired": 0, "rejected": 0}
        job_apps_map[jid]["applied"] += 1
        st = app.get("status", "In Review")
        if st == "Shortlisted":
            job_apps_map[jid]["shortlisted"] += 1
        elif st == "Offer Sent":
            job_apps_map[jid]["offers"] += 1
        elif st in ("Hired", "Accepted"):
            job_apps_map[jid]["hired"] += 1
        elif st == "Rejected":
            job_apps_map[jid]["rejected"] += 1

    # Jobs visible to this college: public OR targeted to this college
    query = {
        "status": "active",
        "$or": [
            {"visibility": "public"},
            {"visibility": {"$exists": False}},
            {"visibility": "requested_college", "target_colleges": college_id},
        ],
    }

    jobs = []
    async for job in db["jobs"].find(query).sort("created_at", -1):
        jid = str(job["_id"])
        rule = rules_map.get(jid)
        eligible_count = sum(1 for s in college_students if _student_matches_rule(s, rule)[0])
        stats = job_apps_map.get(jid, {"applied": 0, "shortlisted": 0, "offers": 0, "hired": 0, "rejected": 0})
        jobs.append({
            "id": jid,
            "title": job.get("title", "Untitled Job"),
            "company_name": job.get("company_name", "Company"),
            "location": job.get("location", ""),
            "employment_type": job.get("employment_type", ""),
            "stipend": job.get("stipend", ""),
            "visibility": job.get("visibility", "public"),
            "created_at": _safe_iso(job.get("created_at")),
            "total_college_students": len(college_students),
            "eligible_students_count": eligible_count,
            "college_stats": stats,
            "rule": {
                "is_open": rule.get("is_open", True) if rule else True,
                "min_cgpa": rule.get("min_cgpa") if rule else None,
                "allowed_batches": rule.get("allowed_batches", []) if rule else [],
                "allowed_branches": rule.get("allowed_branches", []) if rule else [],
                "max_backlogs": rule.get("max_backlogs") if rule else None,
                "specific_student_ids": rule.get("specific_student_ids", []) if rule else [],
                "note": rule.get("note", "") if rule else "",
            },
        })

    # Distinct batches and branches for quick filter chips
    batches = sorted({str(s.get("batch")).strip() for s in college_students if s.get("batch")})
    branches = sorted({str(s.get("branch")).strip() for s in college_students if s.get("branch")})

    return {"jobs": jobs, "batches": batches, "branches": branches}


@router.put("/jobs/{job_id}/eligibility")
async def set_job_eligibility_rule(
    job_id: str,
    req: JobEligibilityRuleRequest,
    college=Depends(get_current_college),
):
    db = get_database()
    college_id = college["sub"]

    job = await db["jobs"].find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    rule_doc = {
        "college_id": college_id,
        "job_id": job_id,
        "is_open": req.is_open,
        "min_cgpa": req.min_cgpa,
        "allowed_batches": [b.strip() for b in req.allowed_batches if b.strip()],
        "allowed_branches": [b.strip() for b in req.allowed_branches if b.strip()],
        "max_backlogs": req.max_backlogs,
        "specific_student_ids": [sid for sid in req.specific_student_ids if sid],
        "note": (req.note or "").strip(),
        "updated_at": datetime.utcnow(),
    }

    await db["college_job_rules"].update_one(
        {"college_id": college_id, "job_id": job_id},
        {"$set": rule_doc},
        upsert=True,
    )

    # Calculate eligible students & optionally notify them
    eligible_students = []
    async for s in db["users"].find({"role": "student", "college_id": college_id, "is_college_approved": True, "is_suspended": {"$ne": True}}):
        if _student_matches_rule(s, rule_doc)[0]:
            eligible_students.append(s)

    notified = 0
    if req.notify_eligible and req.is_open and eligible_students:
        criteria_parts = []
        if req.min_cgpa:
            criteria_parts.append(f"CGPA >= {req.min_cgpa}")
        if rule_doc["allowed_batches"]:
            criteria_parts.append(f"Batch {', '.join(rule_doc['allowed_batches'])}")
        if rule_doc["allowed_branches"]:
            criteria_parts.append(f"Branch {', '.join(rule_doc['allowed_branches'])}")
        criteria_text = f" ({' · '.join(criteria_parts)})" if criteria_parts else ""

        now = datetime.utcnow()
        notif_docs = [
            {
                "recipient_id": str(stu["_id"]),
                "title": f"Job Drive Open: {job.get('title', 'Opportunity')}",
                "message": f"Your college has opened applications for {job.get('title')} at {job.get('company_name', 'Company')}{criteria_text}. Apply now from your dashboard!",
                "type": "announcement",
                "priority": "high",
                "sent_by_college": True,
                "sender_id": college_id,
                "read_by": [],
                "dismissed_by": [],
                "is_read": False,
                "created_at": now,
            }
            for stu in eligible_students
        ]
        await db["notifications"].insert_many(notif_docs)
        notified = len(notif_docs)

    return {
        "message": "Job eligibility rules updated",
        "eligible_students_count": len(eligible_students),
        "notified_count": notified,
    }


@router.get("/jobs/{job_id}/applicants")
async def get_college_job_applicants(job_id: str, college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    stu_map: Dict[str, dict] = {}
    async for s in db["users"].find({"role": "student", "college_id": college_id}, {"cgpa": 1, "batch": 1, "branch": 1, "roll_number": 1}):
        stu_map[str(s["_id"])] = s

    applicants = []
    async for app in db["applications"].find({"job_id": job_id, "college_id": college_id}).sort("created_at", -1):
        sid = app.get("student_id", "")
        s_info = stu_map.get(sid, {})
        applicants.append({
            "id": str(app["_id"]),
            "student_id": sid,
            "student_name": app.get("student_name", "Student"),
            "student_email": app.get("student_email", ""),
            "cgpa": s_info.get("cgpa"),
            "batch": s_info.get("batch", ""),
            "branch": s_info.get("branch", ""),
            "roll_number": s_info.get("roll_number", ""),
            "status": app.get("status", "In Review"),
            "created_at": _safe_iso(app.get("created_at") or app.get("applied_at")),
        })
    return applicants


# =====================================================================
# COLLEGE PROGRESS & LAG ANALYTICS (MULTIPLE DIAGRAMS)
# =====================================================================

@router.get("/analytics")
async def get_college_analytics(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    students = []
    async for s in db["users"].find({"role": "student", "college_id": college_id}):
        students.append(s)

    apps = []
    async for a in db["applications"].find({"college_id": college_id}):
        apps.append(a)

    # Per-student application map
    stu_apps: Dict[str, List[dict]] = {}
    funnel = {"In Review": 0, "Shortlisted": 0, "Offer Sent": 0, "Hired": 0, "Rejected": 0}
    for a in apps:
        sid = a.get("student_id")
        if sid:
            stu_apps.setdefault(sid, []).append(a)
        st = a.get("status", "In Review")
        if st == "Accepted":
            st = "Hired"
        if st in funnel:
            funnel[st] += 1
        else:
            funnel["In Review"] += 1

    total_students = len(students)
    approved_students = 0
    pending_students = 0
    suspended_students = 0
    placed_students_count = 0
    actively_applying_count = 0
    unapplied_approved_count = 0
    missing_cgpa_count = 0
    cgpa_values: List[float] = []

    branch_map: Dict[str, dict] = {}
    batch_map: Dict[str, dict] = {}
    cgpa_bands: Dict[str, dict] = {
        "< 6.5": {"band": "< 6.5", "total": 0, "applied": 0, "placed": 0},
        "6.5 - 7.4": {"band": "6.5 - 7.4", "total": 0, "applied": 0, "placed": 0},
        "7.5 - 8.4": {"band": "7.5 - 8.4", "total": 0, "applied": 0, "placed": 0},
        "8.5 - 8.9": {"band": "8.5 - 8.9", "total": 0, "applied": 0, "placed": 0},
        "9.0+": {"band": "9.0+", "total": 0, "applied": 0, "placed": 0},
        "Not Set": {"band": "Not Set", "total": 0, "applied": 0, "placed": 0},
    }

    for s in students:
        sid = str(s["_id"])
        is_susp = s.get("is_suspended", False)
        is_appr = s.get("is_college_approved", False)
        s_apps = stu_apps.get(sid, [])
        has_applied = len(s_apps) > 0
        is_placed = any(a.get("status") in ("Shortlisted", "Offer Sent", "Hired", "Accepted") for a in s_apps)

        if is_susp:
            suspended_students += 1
        elif not is_appr:
            pending_students += 1
        else:
            approved_students += 1
            if is_placed:
                placed_students_count += 1
            elif has_applied:
                actively_applying_count += 1
            else:
                unapplied_approved_count += 1

        cgpa_val = _parse_float(s.get("cgpa"))
        if cgpa_val is None:
            missing_cgpa_count += 1
            band_key = "Not Set"
        else:
            cgpa_values.append(cgpa_val)
            if cgpa_val < 6.5:
                band_key = "< 6.5"
            elif cgpa_val < 7.5:
                band_key = "6.5 - 7.4"
            elif cgpa_val < 8.5:
                band_key = "7.5 - 8.4"
            elif cgpa_val < 9.0:
                band_key = "8.5 - 8.9"
            else:
                band_key = "9.0+"

        cgpa_bands[band_key]["total"] += 1
        if has_applied:
            cgpa_bands[band_key]["applied"] += 1
        if is_placed:
            cgpa_bands[band_key]["placed"] += 1

        branch = (s.get("branch") or "Unassigned").strip() or "Unassigned"
        if branch not in branch_map:
            branch_map[branch] = {"branch": branch, "total": 0, "applied": 0, "placed": 0, "unapplied": 0}
        branch_map[branch]["total"] += 1
        if has_applied:
            branch_map[branch]["applied"] += 1
        else:
            branch_map[branch]["unapplied"] += 1
        if is_placed:
            branch_map[branch]["placed"] += 1

        batch = (s.get("batch") or "Unassigned").strip() or "Unassigned"
        if batch not in batch_map:
            batch_map[batch] = {"batch": batch, "total": 0, "applied": 0, "placed": 0}
        batch_map[batch]["total"] += 1
        if has_applied:
            batch_map[batch]["applied"] += 1
        if is_placed:
            batch_map[batch]["placed"] += 1

    by_branch = []
    for b in branch_map.values():
        b["placement_rate"] = round((b["placed"] / b["total"]) * 100, 1) if b["total"] > 0 else 0.0
        by_branch.append(b)
    by_branch.sort(key=lambda x: -x["total"])

    by_batch = []
    for b in batch_map.values():
        b["placement_rate"] = round((b["placed"] / b["total"]) * 100, 1) if b["total"] > 0 else 0.0
        by_batch.append(b)
    by_batch.sort(key=lambda x: x["batch"])

    placement_rate = round((placed_students_count / approved_students) * 100, 1) if approved_students > 0 else 0.0
    participation_rate = round(((placed_students_count + actively_applying_count) / approved_students) * 100, 1) if approved_students > 0 else 0.0
    avg_cgpa = round(sum(cgpa_values) / len(cgpa_values), 2) if cgpa_values else 0.0

    # Auto-generate Lag Diagnostics (highlighting where the college is lagging!)
    lag_alerts: List[dict] = []
    if pending_students > 0:
        lag_alerts.append({
            "severity": "high",
            "title": f"{pending_students} Student Approval(s) Pending",
            "detail": "Students cannot see or apply to jobs until your placement cell approves their accounts.",
            "action_label": "Go to Approvals",
            "action_path": "/dashboard/college",
        })
    if unapplied_approved_count > 0:
        lag_alerts.append({
            "severity": "high" if unapplied_approved_count >= 5 else "medium",
            "title": f"{unapplied_approved_count} Approved Student(s) Have 0 Applications",
            "detail": "These students are eligible to apply but haven't submitted any applications yet. Send them a targeted nudge!",
            "action_label": "Nudge Inactive Students",
            "action_path": "/dashboard/college/notifications?mode=unapplied",
        })
    if missing_cgpa_count > 0:
        lag_alerts.append({
            "severity": "medium",
            "title": f"{missing_cgpa_count} Student(s) Missing CGPA Data",
            "detail": "Students without CGPA recorded cannot qualify for CGPA-filtered drives (e.g., 8.5+ or 9.0+ CGPA).",
            "action_label": "Update Student Directory",
            "action_path": "/dashboard/college/students",
        })
    total_apps = len(apps)
    if total_apps >= 5 and (funnel["Rejected"] / total_apps) >= 0.45:
        lag_alerts.append({
            "severity": "high",
            "title": f"High Rejection Rate ({round((funnel['Rejected'] / total_apps) * 100)}%)",
            "detail": "Nearly half of submitted applications are being rejected. Consider mock interviews, skill workshops, or stricter CGPA/branch pre-screening.",
            "action_label": "Review Job Eligibility Rules",
            "action_path": "/dashboard/college/jobs",
        })
    for br in by_branch:
        if br["branch"] != "Unassigned" and br["total"] >= 3 and br["applied"] == 0:
            lag_alerts.append({
                "severity": "medium",
                "title": f"{br['branch']} Branch Has 0% Job Participation",
                "detail": f"None of the {br['total']} students in {br['branch']} have applied to any drive yet.",
                "action_label": f"Notify {br['branch']} Branch",
                "action_path": "/dashboard/college/notifications",
            })

    return {
        "overview": {
            "total_students": total_students,
            "approved_students": approved_students,
            "pending_students": pending_students,
            "suspended_students": suspended_students,
            "placed_students": placed_students_count,
            "actively_applying": actively_applying_count,
            "unapplied_students": unapplied_approved_count,
            "total_applications": total_apps,
            "placement_rate": placement_rate,
            "participation_rate": participation_rate,
            "avg_cgpa": avg_cgpa,
            "missing_cgpa_count": missing_cgpa_count,
        },
        "funnel": [{"stage": k, "count": v} for k, v in funnel.items()],
        "engagement_breakdown": [
            {"name": "Placed / Shortlisted", "value": placed_students_count},
            {"name": "Actively Applying", "value": actively_applying_count},
            {"name": "Unapplied (Lag)", "value": unapplied_approved_count},
            {"name": "Pending Approval (Lag)", "value": pending_students},
            {"name": "Suspended", "value": suspended_students},
        ],
        "by_branch": by_branch,
        "by_batch": by_batch,
        "by_cgpa_band": list(cgpa_bands.values()),
        "lag_alerts": lag_alerts,
    }


# =====================================================================
# REPORTS TO SUPER ADMIN
# =====================================================================

@router.post("/reports")
async def submit_report_to_admin(req: CollegeReportRequest, college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    if not req.title.strip() or not req.description.strip():
        raise HTTPException(status_code=400, detail="Report title and description are required")

    college_doc = await db["users"].find_one({"_id": ObjectId(college_id)}, {"name": 1, "email": 1})
    college_name = (college_doc.get("name") if college_doc else None) or "College"
    college_email = (college_doc.get("email") if college_doc else None) or ""

    stats_snapshot = None
    if req.attach_stats_snapshot:
        total_stu = await db["users"].count_documents({"role": "student", "college_id": college_id})
        approved_stu = await db["users"].count_documents({"role": "student", "college_id": college_id, "is_college_approved": True})
        total_apps = await db["applications"].count_documents({"college_id": college_id})
        placed = await db["applications"].count_documents({
            "college_id": college_id, "status": {"$in": ["Shortlisted", "Offer Sent", "Hired", "Accepted"]}
        })
        stats_snapshot = {
            "total_students": total_stu,
            "approved_students": approved_stu,
            "total_applications": total_apps,
            "placed_or_shortlisted": placed,
        }

    now = datetime.utcnow()
    report_doc = {
        "college_id": college_id,
        "college_name": college_name,
        "college_email": college_email,
        "title": req.title.strip(),
        "category": req.category,
        "priority": req.priority,
        "description": req.description.strip(),
        "stats_snapshot": stats_snapshot,
        "status": "submitted",
        "admin_response": "",
        "created_at": now,
        "updated_at": now,
    }
    res = await db["college_reports"].insert_one(report_doc)

    # Notify Super Admin
    try:
        await db["notifications"].insert_one({
            "recipient_role": "super_admin",
            "title": f"New College Report: {req.title.strip()}",
            "message": f"{college_name} submitted a {req.category.replace('_', ' ')} report ({req.priority} priority).",
            "type": "alert" if req.priority == "urgent" else "update",
            "priority": req.priority,
            "user_id": college_id,
            "user_name": college_name,
            "user_role": "college",
            "read_by": [],
            "dismissed_by": [],
            "is_read": False,
            "created_at": now,
        })
    except Exception:
        pass

    return {"message": "Report submitted to Super Admin", "id": str(res.inserted_id)}


@router.get("/reports")
async def get_college_submitted_reports(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]
    cursor = db["college_reports"].find({"college_id": college_id}).sort("created_at", -1).limit(50)
    reports = []
    async for r in cursor:
        reports.append({
            "id": str(r["_id"]),
            "title": r.get("title", ""),
            "category": r.get("category", "general"),
            "priority": r.get("priority", "normal"),
            "description": r.get("description", ""),
            "stats_snapshot": r.get("stats_snapshot"),
            "status": r.get("status", "submitted"),
            "admin_response": r.get("admin_response", ""),
            "created_at": _safe_iso(r.get("created_at")),
            "updated_at": _safe_iso(r.get("updated_at")),
        })
    return reports


# =====================================================================
# DIRECT MESSAGING: COLLEGE <-> SUPER ADMIN
# =====================================================================

@router.get("/messages")
async def get_college_admin_messages(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]

    # Mark admin messages as read by college
    await db["admin_college_messages"].update_many(
        {"college_id": college_id, "sender_role": "super_admin", "read_by_college": {"$ne": True}},
        {"$set": {"read_by_college": True}},
    )

    cursor = db["admin_college_messages"].find({"college_id": college_id}).sort("created_at", 1).limit(100)
    messages = []
    async for m in cursor:
        messages.append({
            "id": str(m["_id"]),
            "sender_role": m.get("sender_role", "college"),
            "sender_name": m.get("sender_name", ""),
            "message": m.get("message", ""),
            "created_at": _safe_iso(m.get("created_at")),
        })
    return messages


@router.post("/messages")
async def send_message_to_admin(req: CollegeMessageRequest, college=Depends(get_current_college)):
    text = req.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    db = get_database()
    college_id = college["sub"]
    college_doc = await db["users"].find_one({"_id": ObjectId(college_id)}, {"name": 1, "email": 1})
    college_name = (college_doc.get("name") if college_doc else None) or "College"

    now = datetime.utcnow()
    msg_doc = {
        "college_id": college_id,
        "college_name": college_name,
        "sender_role": "college",
        "sender_id": college_id,
        "sender_name": college_name,
        "message": text,
        "read_by_admin": False,
        "read_by_college": True,
        "created_at": now,
    }
    res = await db["admin_college_messages"].insert_one(msg_doc)

    # Notify Super Admin
    try:
        await db["notifications"].insert_one({
            "recipient_role": "super_admin",
            "title": f"Message from {college_name}",
            "message": text[:160],
            "type": "announcement",
            "priority": "normal",
            "user_id": college_id,
            "user_name": college_name,
            "user_role": "college",
            "read_by": [],
            "dismissed_by": [],
            "is_read": False,
            "created_at": now,
        })
    except Exception:
        pass

    return {
        "id": str(res.inserted_id),
        "sender_role": "college",
        "sender_name": college_name,
        "message": text,
        "created_at": now.isoformat(),
    }
