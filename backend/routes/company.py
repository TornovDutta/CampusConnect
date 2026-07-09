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

from typing import Optional

class JobCreate(BaseModel):
    title: str
    location: str
    description: str
    job_type: str
    employment_type: str
    stipend: Optional[str] = None
    working_hours: Optional[str] = None
    prerequisites: Optional[str] = None

@router.get("/dashboard-stats")
async def get_company_dashboard(company=Depends(get_current_company)):
    db = get_database()
    jobs_collection = db["jobs"]
    company_id = company.get("sub")
    
    active_jobs = await jobs_collection.count_documents({"company_id": company_id, "status": "active"})
    
    recent_jobs_cursor = jobs_collection.find({"company_id": company_id}).sort("created_at", -1).limit(10)
    recent_jobs = []
    async for job in recent_jobs_cursor:
        job["_id"] = str(job["_id"])
        recent_jobs.append(job)
        
    return {
        "stats": {
            "active_jobs": active_jobs,
            "total_applications": sum(job.get("applications_count", 0) for job in recent_jobs),
            "offers_sent": 0
        },
        "recent_jobs": recent_jobs
    }

@router.post("/jobs")
async def create_job(job_in: JobCreate, company=Depends(get_current_company)):
    db = get_database()
    jobs_collection = db["jobs"]
    
    job_dict = job_in.model_dump()
    job_dict["company_id"] = company.get("sub")
    job_dict["status"] = "active"
    job_dict["applications_count"] = 0
    job_dict["created_at"] = datetime.utcnow()
    
    result = await jobs_collection.insert_one(job_dict)
    
    from database import log_activity
    await log_activity(
        user_id=company.get("sub"),
        user_name=company.get("sub"), # Ideally we fetch the company name, but this is a placeholder
        role="company",
        action_type="job_post",
        details=f"Posted a new job: {job_in.title}"
    )
    
    return {"message": "Job posted successfully", "job_id": str(result.inserted_id)}
