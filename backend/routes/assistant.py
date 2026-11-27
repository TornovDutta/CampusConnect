import asyncio
import json
import os
import re
import ssl
import urllib.error
import urllib.request
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field

from core.config import settings
from database import get_database, log_activity

router = APIRouter(prefix="/assistant", tags=["AI Campus Assistant"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"
FALLBACK_GROQ_MODEL = "openai/gpt-oss-20b"

KnowledgeCategory = Literal["activity", "facility", "club", "event", "faq"]


# ---------------------------------------------------------------------------
# Auth & Config Helpers
# ---------------------------------------------------------------------------

def _get_groq_config() -> tuple[str, str]:
    api_key = (
        settings.GROP_APIKEY
        or os.getenv("GROP_APIKEY")
        or os.getenv("GROQ_API_KEY")
        or ""
    ).strip()
    model = (
        settings.GROP_MODEL
        or os.getenv("GROP_MODEL")
        or os.getenv("GROQ_MODEL")
        or DEFAULT_GROQ_MODEL
    ).strip()
    if not model:
        model = DEFAULT_GROQ_MODEL
    return api_key, model


def _get_optional_payload(request: Request) -> Optional[dict]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        try:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except (JWTError, Exception):
            return None
    return None


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_knowledge_manager(token: str = Depends(oauth2_scheme)) -> dict:
    payload = await get_current_user(token)
    if payload.get("role") not in ("college", "super_admin"):
        raise HTTPException(
            status_code=403,
            detail="Only college placement officers or super admins can manage campus knowledge.",
        )
    return payload


def _safe_iso(val: Any) -> str:
    if isinstance(val, datetime):
        return val.isoformat()
    return str(val) if val else ""


def _serialize_knowledge(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "college_id": doc.get("college_id", "global"),
        "college_name": doc.get("college_name", "All Campuses"),
        "category": doc.get("category", "faq"),
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "location": doc.get("location", ""),
        "schedule": doc.get("schedule", ""),
        "contact_info": doc.get("contact_info", ""),
        "tags": doc.get("tags", []),
        "created_by_role": doc.get("created_by_role", ""),
        "updated_at": _safe_iso(doc.get("updated_at") or doc.get("created_at")),
    }


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    college_id: Optional[str] = None
    history: List[ChatHistoryItem] = Field(default_factory=list)


class KnowledgeItemCreate(BaseModel):
    category: KnowledgeCategory = "faq"
    title: str = Field(..., min_length=2, max_length=160)
    description: str = Field(..., min_length=4, max_length=3000)
    location: Optional[str] = ""
    schedule: Optional[str] = ""
    contact_info: Optional[str] = ""
    tags: List[str] = Field(default_factory=list)
    scope: Optional[Literal["college", "global"]] = None


class KnowledgeItemUpdate(BaseModel):
    category: Optional[KnowledgeCategory] = None
    title: Optional[str] = Field(None, min_length=2, max_length=160)
    description: Optional[str] = Field(None, min_length=4, max_length=3000)
    location: Optional[str] = None
    schedule: Optional[str] = None
    contact_info: Optional[str] = None
    tags: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Live MongoDB Context Builder (Real Data Only)
# ---------------------------------------------------------------------------

def _extract_keywords(text: str) -> List[str]:
    words = re.findall(r"[A-Za-z0-9]{3,}", text.lower())
    stop = {
        "the", "and", "for", "with", "about", "what", "when", "where", "how",
        "who", "which", "can", "you", "tell", "find", "info", "information",
        "help", "are", "there", "any", "campus", "college", "please", "does",
        "have", "this", "that", "from", "into", "your", "show", "give",
    }
    seen = []
    for w in words:
        if w not in stop and w not in seen:
            seen.append(w)
        if len(seen) >= 6:
            break
    return seen


async def _gather_live_context(
    db: Any,
    user_payload: Optional[dict],
    user_message: str,
    requested_college_id: Optional[str],
) -> tuple[str, List[dict], List[dict]]:
    """
    Collects grounded, tenant-safe live data from MongoDB for the Groq prompt:
      1. Relevant campus_knowledge entries (activities, facilities, clubs, events, FAQs).
      2. Real user / college / active drives / upcoming interviews (strictly scoped).
      3. Role-appropriate quick navigation actions.
    """
    users_col = db["users"]
    knowledge_col = db["campus_knowledge"]
    jobs_col = db["jobs"]
    apps_col = db["applications"]

    role = user_payload.get("role") if user_payload else "guest"
    user_id = user_payload.get("sub") if user_payload else None

    user_doc = None
    scoped_college_id = requested_college_id
    scoped_college_name = None

    if user_id:
        try:
            user_doc = await users_col.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user_doc = None

    if role == "college" and user_id:
        scoped_college_id = user_id
        scoped_college_name = (user_doc or {}).get("name") or "Your College"
    elif role == "student" and user_doc:
        scoped_college_id = user_doc.get("college_id") or scoped_college_id
        if scoped_college_id:
            try:
                c_doc = await users_col.find_one({"_id": ObjectId(scoped_college_id)})
                if c_doc:
                    scoped_college_name = c_doc.get("name")
            except Exception:
                pass
    elif scoped_college_id:
        try:
            c_doc = await users_col.find_one({"_id": ObjectId(scoped_college_id), "role": "college"})
            if c_doc:
                scoped_college_name = c_doc.get("name")
        except Exception:
            pass

    # 1. Fetch relevant Campus Knowledge items (activities, facilities, clubs, events, FAQs)
    scope_filters: List[dict] = [{"college_id": "global"}]
    if scoped_college_id:
        scope_filters.append({"college_id": scoped_college_id})
    elif role == "super_admin":
        scope_filters = [{}]

    keywords = _extract_keywords(user_message)
    base_scope = {"$or": scope_filters} if scope_filters != [{}] else {}

    matched_items: List[dict] = []
    seen_ids = set()

    if keywords:
        regex_pattern = "|".join(re.escape(kw) for kw in keywords)
        kw_query: dict = {
            "$and": [
                base_scope if base_scope else {},
                {
                    "$or": [
                        {"title": {"$regex": regex_pattern, "$options": "i"}},
                        {"description": {"$regex": regex_pattern, "$options": "i"}},
                        {"category": {"$regex": regex_pattern, "$options": "i"}},
                        {"location": {"$regex": regex_pattern, "$options": "i"}},
                        {"tags": {"$regex": regex_pattern, "$options": "i"}},
                    ]
                },
            ]
        }
        async for doc in knowledge_col.find(kw_query).sort("updated_at", -1).limit(10):
            did = str(doc["_id"])
            if did not in seen_ids:
                seen_ids.add(did)
                matched_items.append(doc)

    # Supplement with latest campus knowledge up to 15 items so general questions ("what clubs exist?") work
    if len(matched_items) < 15:
        async for doc in knowledge_col.find(base_scope).sort("updated_at", -1).limit(15):
            did = str(doc["_id"])
            if did not in seen_ids:
                seen_ids.add(did)
                matched_items.append(doc)
            if len(matched_items) >= 15:
                break

    knowledge_lines: List[str] = []
    sources: List[dict] = []
    for doc in matched_items:
        cat = doc.get("category", "faq").upper()
        title = doc.get("title", "")
        desc = doc.get("description", "")
        loc = doc.get("location", "")
        sched = doc.get("schedule", "")
        contact = doc.get("contact_info", "")
        cname = doc.get("college_name", "Campus")
        parts = [f"[{cat}] {title} ({cname}): {desc}"]
        if loc:
            parts.append(f"Location: {loc}")
        if sched:
            parts.append(f"Schedule: {sched}")
        if contact:
            parts.append(f"Contact: {contact}")
        knowledge_lines.append(" | ".join(parts))
        sources.append({
            "id": str(doc["_id"]),
            "category": doc.get("category", "faq"),
            "title": title,
            "college_name": cname,
        })

    # 2. Fetch live platform records scoped strictly to the user
    portal_lines: List[str] = []
    suggested_actions: List[dict] = []

    if role == "student" and user_doc:
        portal_lines.append(
            f"User: Student named {user_doc.get('name', 'Student')}, "
            f"College: {scoped_college_name or 'Not linked'}, "
            f"Branch: {user_doc.get('branch') or 'N/A'}, "
            f"Batch: {user_doc.get('batch') or 'N/A'}, "
            f"CGPA: {user_doc.get('cgpa') if user_doc.get('cgpa') is not None else 'N/A'}, "
            f"Approval Status: {'Approved' if user_doc.get('is_college_approved') else 'Pending college approval'}."
        )
        # Upcoming scheduled interviews for this student
        upcoming_apps = []
        async for a in apps_col.find({
            "student_id": user_id,
            "interview_date": {"$exists": True, "$ne": None, "$ne": ""},
        }).sort("interview_date", 1).limit(5):
            upcoming_apps.append(
                f"{a.get('job_title', 'Role')} at {a.get('company_name', 'Company')} "
                f"on {a.get('interview_date')} {a.get('interview_time', '')} ({a.get('interview_mode', 'Online')})"
            )
        if upcoming_apps:
            portal_lines.append("Student Upcoming Interviews: " + "; ".join(upcoming_apps))

        # Active applications count
        app_count = await apps_col.count_documents({"student_id": user_id})
        portal_lines.append(f"Student Total Active/Past Applications: {app_count}.")

        # Active jobs / campus drives open to this student
        job_query: dict = {"status": "active"}
        if scoped_college_id:
            job_query["$or"] = [
                {"visibility": "public"},
                {"target_colleges": scoped_college_id},
                {"college_id": scoped_college_id},
            ]
        else:
            job_query["visibility"] = "public"

        active_drives = []
        async for j in jobs_col.find(job_query).sort("created_at", -1).limit(6):
            active_drives.append(
                f"{j.get('title', 'Role')} at {j.get('company_name', 'Company')} "
                f"({j.get('location', 'Remote/Campus')}, {j.get('employment_type', 'Full-time')})"
            )
        if active_drives:
            portal_lines.append("Live Open Drives / Jobs: " + "; ".join(active_drives))

        suggested_actions = [
            {"label": "Browse Drives", "path": "/dashboard/student"},
            {"label": "My Calendar", "path": "/dashboard/student/calendar"},
            {"label": "Message Placement Cell", "path": "/dashboard/student/messages"},
        ]

    elif role == "college" and user_id:
        stu_count = await users_col.count_documents({"role": "student", "college_id": user_id, "is_suspended": {"$ne": True}})
        pending_count = await users_col.count_documents({"role": "student", "college_id": user_id, "is_college_approved": {"$ne": True}})
        portal_lines.append(
            f"User: College Placement Officer for {scoped_college_name}. "
            f"Enrolled Students: {stu_count}, Pending Approvals: {pending_count}."
        )
        suggested_actions = [
            {"label": "Manage Campus Knowledge", "path": "/dashboard/college/assistant-knowledge"},
            {"label": "Students Directory", "path": "/dashboard/college/students"},
        ]

    elif role == "company" and user_id:
        comp_name = (user_doc or {}).get("name") or "Company Recruiter"
        active_jobs = await jobs_col.count_documents({"company_id": user_id, "status": "active"})
        apps_total = await apps_col.count_documents({"company_id": user_id})
        portal_lines.append(
            f"User: Company Recruiter ({comp_name}). Active Postings: {active_jobs}, Total Applicants: {apps_total}."
        )
        suggested_actions = [
            {"label": "Company Dashboard", "path": "/dashboard/company"},
            {"label": "Campus Directory", "path": "/colleges"},
        ]

    elif role == "super_admin":
        total_colleges = await users_col.count_documents({"role": "college", "is_suspended": {"$ne": True}})
        total_students = await users_col.count_documents({"role": "student", "is_suspended": {"$ne": True}})
        total_jobs = await jobs_col.count_documents({"status": "active"})
        portal_lines.append(
            f"User: Super Admin. Platform Totals -> Colleges: {total_colleges}, Students: {total_students}, Active Jobs: {total_jobs}."
        )
        suggested_actions = [
            {"label": "Manage Campus Knowledge", "path": "/dashboard/admin/assistant-knowledge"},
            {"label": "Admin Analytics", "path": "/dashboard/admin/analytics"},
        ]

    else:
        # Guest / public visitor
        partner_names = []
        async for c in users_col.find({"role": "college", "is_suspended": {"$ne": True}}, {"name": 1, "city": 1}).limit(10):
            cname = c.get("name")
            ccity = c.get("city")
            if cname:
                partner_names.append(f"{cname} ({ccity})" if ccity else cname)
        if partner_names:
            portal_lines.append("Registered Partner Colleges on CampusConnect: " + ", ".join(partner_names))
        active_public_jobs = await jobs_col.count_documents({"status": "active", "visibility": "public"})
        portal_lines.append(f"Public Open Job/Drive Listings Currently Active: {active_public_jobs}.")
        suggested_actions = [
            {"label": "Explore Colleges", "path": "/colleges"},
            {"label": "Sign In", "path": "/login"},
        ]

    knowledge_section = (
        "\n".join(f"- {line}" for line in knowledge_lines)
        if knowledge_lines
        else "No custom campus activities, facilities, clubs, events, or FAQ entries have been published in the database for this campus yet."
    )
    portal_section = "\n".join(f"- {line}" for line in portal_lines)

    context_blob = (
        f"LIVE PORTAL STATE:\n{portal_section}\n\n"
        f"PUBLISHED CAMPUS KNOWLEDGE BASE (Activities, Facilities, Clubs, Events, FAQs):\n{knowledge_section}"
    )
    return context_blob, sources, suggested_actions


# ---------------------------------------------------------------------------
# Groq Chat Completion Call (Standard Library HTTPS, Zero Extra Deps)
# ---------------------------------------------------------------------------

def _post_groq_sync(api_key: str, model: str, messages: List[dict]) -> dict:
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.4,
        "max_completion_tokens": 1200,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        GROQ_CHAT_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "CampusConnect-Assistant/1.0",
        },
        method="POST",
    )

    try:
        import certifi
        ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    except Exception:
        ssl_ctx = ssl.create_default_context()

    with urllib.request.urlopen(req, context=ssl_ctx, timeout=28) as resp:
        raw = resp.read().decode("utf-8")
        return json.loads(raw)


async def _call_groq_with_fallback(api_key: str, preferred_model: str, messages: List[dict]) -> tuple[str, str]:
    models_to_try = [preferred_model]
    if preferred_model != FALLBACK_GROQ_MODEL:
        models_to_try.append(FALLBACK_GROQ_MODEL)

    last_err = None
    for mdl in models_to_try:
        try:
            res = await asyncio.to_thread(_post_groq_sync, api_key, mdl, messages)
            choices = res.get("choices") or []
            if choices:
                msg = choices[0].get("message") or {}
                content = (msg.get("content") or "").strip()
                if content:
                    return content, res.get("model") or mdl
        except urllib.error.HTTPError as http_err:
            err_body = ""
            try:
                err_body = http_err.read().decode("utf-8", errors="ignore")
            except Exception:
                pass
            last_err = f"Groq API HTTP {http_err.code}: {err_body[:300]}"
            # Don't retry auth error on fallback model
            if http_err.code in (401, 403):
                raise HTTPException(
                    status_code=502,
                    detail="AI service authentication failed. Please verify GROP_APIKEY in backend environment configuration.",
                )
        except Exception as exc:
            last_err = str(exc)

    raise HTTPException(
        status_code=502,
        detail=f"AI Campus Assistant is temporarily unavailable ({last_err or 'connection error'}). Please try again in a moment.",
    )


# ---------------------------------------------------------------------------
# Endpoints: Status, Chat, History, Knowledge CRUD
# ---------------------------------------------------------------------------

@router.get("/status")
async def get_assistant_status():
    api_key, model = _get_groq_config()
    return {
        "configured": bool(api_key),
        "model": model,
        "provider": "Groq",
    }


@router.post("/chat")
async def chat_with_assistant(req: AssistantChatRequest, request: Request):
    api_key, model = _get_groq_config()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GROP_APIKEY is not configured in the backend environment. Please set GROP_APIKEY to activate the AI Campus Assistant.",
        )

    db = get_database()
    user_payload = _get_optional_payload(request)
    user_message = req.message.strip()

    context_blob, sources, suggested_actions = await _gather_live_context(
        db=db,
        user_payload=user_payload,
        user_message=user_message,
        requested_college_id=req.college_id,
    )

    system_prompt = (
        "You are the CampusConnect AI Campus Assistant — friendly, helpful, accurate, and concise.\n"
        "Your purpose:\n"
        "1. Answer questions about campus activities, events, clubs, and college facilities.\n"
        "2. Help students and visitors find real information on CampusConnect (drives, interviews, partner colleges, dashboards).\n"
        "3. Answer FAQs about college facilities, clubs, events, and platform workflows.\n"
        "4. Provide warm, clear conversational assistance.\n\n"
        "Strict Rules:\n"
        "- Ground factual claims (dates, room locations, club timings, CGPA cutoffs, drives, college details) ONLY in the live database context below.\n"
        "- Never invent fake club names, fake event dates, fake facility timings, or fake placement statistics.\n"
        "- If specific campus club, facility, or event details are not published in the Campus Knowledge Base yet, say so clearly and suggest contacting their College Placement Cell or checking back once the college publishes those entries.\n"
        "- Keep responses structured with short paragraphs or bullet points so they read cleanly on mobile screens.\n\n"
        f"{context_blob}"
    )

    messages: List[dict] = [{"role": "system", "content": system_prompt}]

    # Include up to last 8 turns from client history (or DB if empty)
    history_slice = req.history[-8:]
    if not history_slice and user_payload and user_payload.get("sub"):
        conv = await db["assistant_conversations"].find_one({"user_id": user_payload["sub"]})
        if conv and conv.get("messages"):
            for m in conv["messages"][-8:]:
                if m.get("role") in ("user", "assistant") and m.get("content"):
                    messages.append({"role": m["role"], "content": m["content"]})
    else:
        for h in history_slice:
            messages.append({"role": h.role, "content": h.content})

    messages.append({"role": "user", "content": user_message})

    reply_text, used_model = await _call_groq_with_fallback(api_key, model, messages)

    # Persist conversation for authenticated users
    if user_payload and user_payload.get("sub"):
        uid = user_payload["sub"]
        now = datetime.utcnow()
        new_turns = [
            {"role": "user", "content": user_message, "created_at": now},
            {"role": "assistant", "content": reply_text, "model": used_model, "created_at": now},
        ]
        await db["assistant_conversations"].update_one(
            {"user_id": uid},
            {
                "$push": {"messages": {"$each": new_turns, "$slice": -40}},
                "$set": {"updated_at": now, "role": user_payload.get("role")},
            },
            upsert=True,
        )

    return {
        "reply": reply_text,
        "model": used_model,
        "sources": sources[:5],
        "suggested_actions": suggested_actions,
    }


@router.get("/history")
async def get_chat_history(user=Depends(get_current_user)):
    db = get_database()
    conv = await db["assistant_conversations"].find_one({"user_id": user["sub"]})
    if not conv:
        return {"messages": []}
    return {
        "messages": [
            {
                "role": m.get("role", "assistant"),
                "content": m.get("content", ""),
                "created_at": _safe_iso(m.get("created_at")),
            }
            for m in conv.get("messages", [])
        ]
    }


@router.delete("/history")
async def clear_chat_history(user=Depends(get_current_user)):
    db = get_database()
    await db["assistant_conversations"].delete_one({"user_id": user["sub"]})
    return {"message": "Conversation history cleared."}


# ---------------------------------------------------------------------------
# Campus Knowledge Base CRUD (Activities, Facilities, Clubs, Events, FAQs)
# ---------------------------------------------------------------------------

@router.get("/knowledge")
async def list_campus_knowledge(
    request: Request,
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    college_id: Optional[str] = Query(None),
):
    db = get_database()
    payload = _get_optional_payload(request)
    role = payload.get("role") if payload else "guest"
    uid = payload.get("sub") if payload else None

    query: Dict[str, Any] = {}

    if role == "super_admin":
        if college_id:
            query["college_id"] = college_id
    elif role == "college" and uid:
        query["$or"] = [{"college_id": uid}, {"college_id": "global"}]
    elif role == "student" and uid:
        u_doc = await db["users"].find_one({"_id": ObjectId(uid)}, {"college_id": 1})
        cid = (u_doc or {}).get("college_id")
        if cid:
            query["$or"] = [{"college_id": cid}, {"college_id": "global"}]
        else:
            query["college_id"] = "global"
    else:
        if college_id:
            query["$or"] = [{"college_id": college_id}, {"college_id": "global"}]
        else:
            query["college_id"] = "global"

    if category and category != "all":
        query["category"] = category

    if search and search.strip():
        rx = {"$regex": re.escape(search.strip()), "$options": "i"}
        search_cond = {"$or": [{"title": rx}, {"description": rx}, {"location": rx}, {"tags": rx}]}
        if "$or" in query:
            query = {"$and": [{"$or": query.pop("$or")}, search_cond, query]}
        else:
            query.update(search_cond)

    cursor = db["campus_knowledge"].find(query).sort("updated_at", -1).limit(200)
    items = [_serialize_knowledge(doc) async for doc in cursor]
    return {"items": items, "total": len(items)}


@router.post("/knowledge")
async def create_campus_knowledge(req: KnowledgeItemCreate, user=Depends(get_knowledge_manager)):
    db = get_database()
    role = user.get("role")
    uid = user.get("sub")

    if role == "super_admin" and req.scope == "global":
        target_cid = "global"
        target_cname = "All Campuses (Global)"
    elif role == "super_admin":
        target_cid = "global"
        target_cname = "All Campuses (Global)"
    else:
        target_cid = uid
        c_doc = await db["users"].find_one({"_id": ObjectId(uid)}, {"name": 1})
        target_cname = (c_doc or {}).get("name") or "College Campus"

    now = datetime.utcnow()
    clean_tags = [t.strip() for t in req.tags if t and t.strip()][:10]

    doc = {
        "college_id": target_cid,
        "college_name": target_cname,
        "category": req.category,
        "title": req.title.strip(),
        "description": req.description.strip(),
        "location": (req.location or "").strip(),
        "schedule": (req.schedule or "").strip(),
        "contact_info": (req.contact_info or "").strip(),
        "tags": clean_tags,
        "created_by": uid,
        "created_by_role": role,
        "created_at": now,
        "updated_at": now,
    }
    res = await db["campus_knowledge"].insert_one(doc)
    doc["_id"] = res.inserted_id

    await log_activity(
        uid,
        target_cname,
        role,
        "campus_knowledge_created",
        f"Published {req.category}: {req.title.strip()}",
    )
    return _serialize_knowledge(doc)


@router.put("/knowledge/{item_id}")
async def update_campus_knowledge(
    item_id: str,
    req: KnowledgeItemUpdate,
    user=Depends(get_knowledge_manager),
):
    db = get_database()
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid knowledge item ID")

    existing = await db["campus_knowledge"].find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Campus knowledge item not found")

    if user.get("role") != "super_admin" and existing.get("college_id") != user.get("sub"):
        raise HTTPException(status_code=403, detail="You can only edit entries belonging to your own campus")

    updates: Dict[str, Any] = {"updated_at": datetime.utcnow()}
    if req.category is not None:
        updates["category"] = req.category
    if req.title is not None:
        updates["title"] = req.title.strip()
    if req.description is not None:
        updates["description"] = req.description.strip()
    if req.location is not None:
        updates["location"] = req.location.strip()
    if req.schedule is not None:
        updates["schedule"] = req.schedule.strip()
    if req.contact_info is not None:
        updates["contact_info"] = req.contact_info.strip()
    if req.tags is not None:
        updates["tags"] = [t.strip() for t in req.tags if t and t.strip()][:10]

    await db["campus_knowledge"].update_one({"_id": oid}, {"$set": updates})
    updated = await db["campus_knowledge"].find_one({"_id": oid})
    return _serialize_knowledge(updated)


@router.delete("/knowledge/{item_id}")
async def delete_campus_knowledge(item_id: str, user=Depends(get_knowledge_manager)):
    db = get_database()
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid knowledge item ID")

    existing = await db["campus_knowledge"].find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Campus knowledge item not found")

    if user.get("role") != "super_admin" and existing.get("college_id") != user.get("sub"):
        raise HTTPException(status_code=403, detail="You can only delete entries belonging to your own campus")

    await db["campus_knowledge"].delete_one({"_id": oid})
    return {"message": "Campus knowledge entry deleted."}
