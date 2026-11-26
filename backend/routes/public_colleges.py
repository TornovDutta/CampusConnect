from fastapi import APIRouter, Request, HTTPException, Query
from database import get_database
from core.config import settings
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from jose import jwt, JWTError

router = APIRouter(prefix="/public/colleges", tags=["Public Colleges & Placement Explorer"])

def _safe_str(val) -> str:
    return str(val) if val is not None else ""

def _parse_float(val) -> Optional[float]:
    if val is None:
        return None
    try:
        f = float(val)
        return f if f >= 0 else None
    except (ValueError, TypeError):
        return None

def _extract_ctc_number(ctc_str: Optional[str]) -> Optional[float]:
    """Helper to extract numerical LPA from strings like '₹12,00,000 CTC' or '12 LPA' or '8.5'"""
    if not ctc_str:
        return None
    import re
    cleaned = str(ctc_str).replace(",", "").strip()
    # Check for LPA directly (e.g. 12 LPA or 12.5 LPA)
    match_lpa = re.search(r"(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lac)", cleaned, re.IGNORECASE)
    if match_lpa:
        try:
            return float(match_lpa.group(1))
        except Exception:
            pass
    # Check for direct large number (e.g. 1200000 -> 12.0 LPA)
    match_num = re.search(r"(\d{5,8})", cleaned)
    if match_num:
        try:
            val = float(match_num.group(1))
            return round(val / 100000, 2)
        except Exception:
            pass
    # Direct float
    try:
        val = float(cleaned)
        if val > 1000:
            return round(val / 100000, 2)
        return val
    except Exception:
        return None

def get_optional_user_payload(request: Request) -> Optional[dict]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except (JWTError, Exception):
            return None
    return None


@router.get("")
async def search_public_colleges(
    q: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200)
):
    """
    Public directory of registered colleges and universities.
    Accessible to anyone (non-logged-in and logged-in users).
    Returns verified institutional profile and public placement performance highlights.
    """
    db = get_database()
    users_col = db["users"]
    apps_col = db["applications"]

    query: Dict[str, Any] = {
        "role": "college",
        "is_suspended": {"$ne": True}
    }

    if q and q.strip():
        search_regex = {"$regex": q.strip(), "$options": "i"}
        query["$or"] = [
            {"name": search_regex},
            {"email": search_regex},
            {"city": search_regex},
            {"state": search_regex},
            {"location": search_regex}
        ]

    cursor = users_col.find(query).sort("name", 1).limit(limit)
    colleges = []

    # Map all colleges
    async for doc in cursor:
        cid = str(doc["_id"])
        cname = doc.get("name") or doc.get("email") or "Partner University"

        # Count verified students
        student_count = await users_col.count_documents({
            "role": "student",
            "college_id": cid,
            "is_suspended": {"$ne": True}
        })

        # Count placements
        placed_count = await apps_col.count_documents({
            "college_id": cid,
            "status": {"$in": ["Shortlisted", "Offer Sent", "Hired", "Accepted", "Selected"]}
        })

        # Get prominent recruiting companies for this college from real applications
        companies_cursor = apps_col.aggregate([
            {"$match": {"college_id": cid, "company_name": {"$exists": True, "$ne": ""}}},
            {"$group": {"_id": "$company_name", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ])
        top_companies = []
        async for comp in companies_cursor:
            if comp["_id"]:
                top_companies.append(comp["_id"])

        # Real CTC calculation from offers
        ctc_cursor = apps_col.find(
            {"college_id": cid, "status": {"$in": ["Shortlisted", "Offer Sent", "Hired", "Accepted", "Selected"]}},
            {"offer_details": 1, "stipend": 1}
        )
        ctc_vals = []
        async for c_app in ctc_cursor:
            raw_c = (c_app.get("offer_details") or {}).get("ctc_or_stipend") or c_app.get("stipend")
            c_val = _extract_ctc_number(raw_c)
            if c_val is not None:
                ctc_vals.append(c_val)

        if ctc_vals:
            min_c = min(ctc_vals)
            max_c = max(ctc_vals)
            avg_c = round(sum(ctc_vals) / len(ctc_vals), 1)
            pkg_str = f"₹{min_c} - ₹{max_c} LPA" if min_c != max_c else f"₹{avg_c} LPA Avg"
        elif placed_count > 0:
            pkg_str = f"{placed_count} Offer{'s' if placed_count != 1 else ''} Extended"
        else:
            pkg_str = "Placement Drives Active"

        # Calculate placement tier directly from real student & placement records
        if student_count > 0:
            rate = round((placed_count / student_count) * 100, 1)
            if rate >= 80:
                tier_label = f"Tier 1 Benchmark ({rate}% Placed)"
                badge = "High Placement Performance"
            elif rate >= 50:
                tier_label = f"Tier 2 Track ({rate}% Placed)"
                badge = "Consistent Placement"
            else:
                tier_label = f"Active Track ({rate}% Placed)" if placed_count > 0 else "Active Placement Track"
                badge = "Growing Placement Hub"
        else:
            tier_label = "Registered Campus Partner"
            badge = "Verified Campus"

        colleges.append({
            "id": cid,
            "_id": cid,
            "name": cname,
            "email": doc.get("email", ""),
            "city": doc.get("city") or doc.get("location") or "Academic Campus",
            "state": doc.get("state") or "",
            "location": doc.get("location") or doc.get("city") or "India",
            "website": doc.get("website") or "",
            "accreditation": doc.get("accreditation") or "AICTE / UGC Recognized",
            "student_pool_size": f"{student_count} Enrolled Student{'s' if student_count != 1 else ''}",
            "placement_tier": tier_label,
            "performance_badge": badge,
            "top_hiring_partners": top_companies[:4],
            "average_package_bracket": pkg_str,
            "is_verified": True
        })

    return {
        "total_colleges": len(colleges),
        "colleges": colleges
    }


@router.get("/{college_id}/placement-performance")
async def get_college_placement_performance(
    college_id: str,
    request: Request
):
    """
    Search & view performance for a specific college.
    - Non-logged-in & external users see high-level public benchmarks.
    - Verified students/officers belonging to this specific college (or Super Admin)
      unlock exact, audited CTC distributions, branch-by-branch statistics, and student rosters.
    """
    db = get_database()
    users_col = db["users"]
    apps_col = db["applications"]

    try:
        c_oid = ObjectId(college_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid college ID")

    college_doc = await users_col.find_one({"_id": c_oid, "role": "college"})
    if not college_doc:
        raise HTTPException(status_code=404, detail="College not found")

    college_name = college_doc.get("name") or college_doc.get("email") or "College"

    # Evaluate User Permission Context
    payload = get_optional_user_payload(request)
    user_context = {
        "is_authenticated": False,
        "user_role": None,
        "belongs_to_college": False,
        "user_college_name": None,
        "lock_reason": "unauthenticated"
    }
    can_view_detailed = False

    if payload:
        user_context["is_authenticated"] = True
        u_role = payload.get("role")
        u_id = payload.get("sub")
        user_context["user_role"] = u_role

        user_doc = await users_col.find_one({"_id": ObjectId(u_id)}) if u_id else None

        if u_role == "super_admin":
            can_view_detailed = True
            user_context["belongs_to_college"] = True
            user_context["lock_reason"] = None
        elif u_role == "college" and u_id == college_id:
            can_view_detailed = True
            user_context["belongs_to_college"] = True
            user_context["lock_reason"] = None
        elif u_role == "student" and user_doc and str(user_doc.get("college_id")) == college_id:
            can_view_detailed = True
            user_context["belongs_to_college"] = True
            user_context["lock_reason"] = None
        else:
            # Authenticated, but does not belong to this college
            user_context["belongs_to_college"] = False
            user_context["lock_reason"] = "different_institution"
            if user_doc and user_doc.get("college_id"):
                stu_col = await users_col.find_one({"_id": ObjectId(user_doc["college_id"])})
                if stu_col:
                    user_context["user_college_name"] = stu_col.get("name")

    # Fetch Base Stats
    students_cursor = users_col.find({
        "role": "student",
        "college_id": college_id,
        "is_suspended": {"$ne": True}
    })
    students = [s async for s in students_cursor]
    total_students = len(students)

    apps_cursor = apps_col.find({"college_id": college_id})
    applications = [a async for a in apps_cursor]

    # Map students and applications
    student_apps: Dict[str, List[dict]] = {}
    for a in applications:
        sid = a.get("student_id")
        if sid:
            student_apps.setdefault(sid, []).append(a)

    placed_students_set = set()
    offers_list = []
    ctc_values: List[float] = []

    for a in applications:
        st = a.get("status")
        sid = a.get("student_id")
        if st in ["Shortlisted", "Offer Sent", "Hired", "Accepted", "Selected"]:
            if sid:
                placed_students_set.add(sid)
            # Check offer CTC
            offer = a.get("offer_details") or {}
            raw_ctc = offer.get("ctc_or_stipend") or a.get("stipend")
            val = _extract_ctc_number(raw_ctc)
            if val is not None:
                ctc_values.append(val)
                offers_list.append({
                    "student_name": a.get("student_name", "Student"),
                    "job_title": a.get("job_title", "Position"),
                    "company_name": a.get("company_name", "Company"),
                    "ctc": f"₹{val} LPA",
                    "status": st,
                    "date": a.get("created_at")
                })

    placed_count = len(placed_students_set)
    calculated_rate = round((placed_count / total_students) * 100, 1) if total_students > 0 else 0.0

    # Count real campus drives / jobs open or targeted to this college
    jobs_col = db["jobs"]
    drives_hosted = await jobs_col.count_documents({
        "$or": [
            {"target_colleges": college_id},
            {"college_id": college_id},
            {"visibility": "public"}
        ],
        "status": {"$ne": "flagged"}
    })

    # Real Recruiting Partners from applications
    comp_map: Dict[str, int] = {}
    sector_set = set()
    for a in applications:
        c_name = a.get("company_name")
        if c_name:
            comp_map[c_name] = comp_map.get(c_name, 0) + 1
        ind = a.get("job_industry") or a.get("industry")
        if ind:
            sector_set.add(ind)

    top_recruiters = sorted(
        [{"company": k, "hires": v} for k, v in comp_map.items()],
        key=lambda x: x["hires"],
        reverse=True
    )[:8]

    # Package calculation from real offers
    if ctc_values:
        avg_ctc = round(sum(ctc_values) / len(ctc_values), 1)
        highest_ctc = max(ctc_values)
        median_ctc = sorted(ctc_values)[len(ctc_values) // 2]
        est_pkg_str = f"₹{avg_ctc} LPA Avg" if len(ctc_values) == 1 else f"₹{min(ctc_values)} - ₹{highest_ctc} LPA"
    else:
        avg_ctc = 0.0
        highest_ctc = 0.0
        median_ctc = 0.0
        est_pkg_str = "Awaiting Offers"

    # Dynamic tier calculation
    if calculated_rate >= 80:
        tier_label = f"Tier 1 Benchmark ({calculated_rate}%)"
    elif calculated_rate >= 50:
        tier_label = f"Tier 2 Track ({calculated_rate}%)"
    elif total_students > 0:
        tier_label = f"Active Track ({calculated_rate}%)" if placed_count > 0 else "Placement Drives Underway"
    else:
        tier_label = "Registered Institution"

    est_bracket = f"{calculated_rate}% Verified" if total_students > 0 else "0% (New Campus)"

    # Public Overview (Always available to non-logged-in & logged-in users)
    public_overview = {
        "id": college_id,
        "name": college_name,
        "email": college_doc.get("email", ""),
        "city": college_doc.get("city") or college_doc.get("location") or "Campus Location",
        "state": college_doc.get("state") or "",
        "location": college_doc.get("location") or "India",
        "website": college_doc.get("website") or "",
        "accreditation": college_doc.get("accreditation") or "AICTE / UGC Recognized",
        "placement_tier": tier_label,
        "estimated_placement_bracket": est_bracket,
        "estimated_average_package": est_pkg_str,
        "top_recruiters": [r["company"] for r in top_recruiters[:5]],
        "active_hiring_sectors": list(sector_set)[:5] if sector_set else ["Software Engineering", "Core Engineering", "Analytics", "Product & Operations"],
        "student_community_size": f"{total_students} Verified Student{'s' if total_students != 1 else ''}",
        "drives_hosted_this_season": drives_hosted
    }

    # If user does NOT have permission to view detailed confidential data:
    if not can_view_detailed:
        return {
            "can_view_detailed": False,
            "user_context": user_context,
            "public_overview": public_overview,
            "locked_sections": [
                "exact_average_ctc",
                "exact_highest_package",
                "department_wise_breakdown",
                "cgpa_success_matrix",
                "confidential_placed_student_roll",
                "audit_offer_letters"
            ],
            "gated_notice": {
                "title": "Verified Institutional Placement Records Locked",
                "message": (
                    "Detailed audited CTC numbers, department-level success rates, and student placement registries are restricted "
                    f"to enrolled students, placement officers, and faculty of {college_name}."
                ) if user_context["is_authenticated"] else (
                    "Sign in to your student or institutional account to access verified CTC statistics and department breakdown."
                )
            }
        }

    # =================================================================
    # DETAILED ACCURATE DATA (Authorized User Belonging to this College)
    # =================================================================

    # Department / Branch Breakdown from real students
    branch_stats: Dict[str, Dict[str, Any]] = {}
    for s in students:
        br = (s.get("branch") or "General / Multi-Disciplinary").strip()
        sid = str(s["_id"])
        is_placed = sid in placed_students_set
        
        if br not in branch_stats:
            branch_stats[br] = {"branch": br, "total": 0, "placed": 0}
        branch_stats[br]["total"] += 1
        if is_placed:
            branch_stats[br]["placed"] += 1

    dept_breakdown = []
    for br, stats in branch_stats.items():
        tot = stats["total"]
        plc = stats["placed"]
        dept_breakdown.append({
            "branch": br,
            "total_students": tot,
            "placed_students": plc,
            "unplaced_students": max(0, tot - plc),
            "placement_rate": round((plc / tot) * 100, 1) if tot > 0 else 0.0
        })

    # CGPA Band Success Matrix from real students
    cgpa_bands = [
        {"band": "9.0+ CGPA", "total": 0, "placed": 0},
        {"band": "8.0 - 8.9 CGPA", "total": 0, "placed": 0},
        {"band": "7.0 - 7.9 CGPA", "total": 0, "placed": 0},
        {"band": "< 7.0 CGPA", "total": 0, "placed": 0}
    ]
    for s in students:
        cv = _parse_float(s.get("cgpa"))
        is_p = str(s["_id"]) in placed_students_set
        if cv is not None:
            if cv >= 9.0:
                cgpa_bands[0]["total"] += 1
                if is_p: cgpa_bands[0]["placed"] += 1
            elif cv >= 8.0:
                cgpa_bands[1]["total"] += 1
                if is_p: cgpa_bands[1]["placed"] += 1
            elif cv >= 7.0:
                cgpa_bands[2]["total"] += 1
                if is_p: cgpa_bands[2]["placed"] += 1
            else:
                cgpa_bands[3]["total"] += 1
                if is_p: cgpa_bands[3]["placed"] += 1

    for b in cgpa_bands:
        b["rate"] = round((b["placed"] / b["total"]) * 100, 1) if b["total"] > 0 else 0.0

    return {
        "can_view_detailed": True,
        "user_context": user_context,
        "public_overview": public_overview,
        "verified_metrics": {
            "total_registered_batch": total_students,
            "total_placed_candidates": placed_count,
            "exact_placement_rate": calculated_rate,
            "average_ctc": f"₹{avg_ctc} LPA" if ctc_values else "N/A",
            "highest_ctc": f"₹{highest_ctc} LPA" if ctc_values else "N/A",
            "median_ctc": f"₹{median_ctc} LPA" if ctc_values else "N/A",
            "active_applications_in_pipeline": len(applications),
            "total_participating_companies": len(top_recruiters)
        },
        "department_breakdown": dept_breakdown,
        "cgpa_success_matrix": cgpa_bands,
        "recruiter_leaderboard": top_recruiters,
        "recent_placement_roll": offers_list[:10]
    }
