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
    job_dict["company_id"] = company_id
    job_dict["company_name"] = company_name
    job_dict["status"] = "active"
    job_dict["applications_count"] = 0
    job_dict["created_at"] = datetime.utcnow()
    
    result = await jobs_collection.insert_one(job_dict)
    
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

@router.get("/all-jobs")
async def get_all_jobs(company=Depends(get_current_company)):
    db = get_database()
    jobs_collection = db["jobs"]
    applications_collection = db["applications"]
    company_id = company.get("sub")
    
    cursor = jobs_collection.find({"company_id": company_id}).sort("created_at", -1)
    jobs = []
    async for job in cursor:
        job["_id"] = str(job["_id"])
        count = await applications_collection.count_documents({"job_id": str(job["_id"])})
        job["applications_count"] = count
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

@router.patch("/applications/{application_id}/status")
async def update_application_status(application_id: str, status_in: UpdateStatusRequest, company=Depends(get_current_company)):
    db = get_database()
    company_id = company.get("sub")
    
    result = await db["applications"].update_one(
        {"_id": ObjectId(application_id), "company_id": company_id},
        {"$set": {"status": status_in.status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")
    return {"message": "Status updated successfully"}

