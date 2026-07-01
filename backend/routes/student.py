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
    
    return {
        "is_college_approved": user.get("is_college_approved", False),
        "college_id": user.get("college_id"),
        "stats": {
            "total_applications": 0,
            "in_review": 0,
            "shortlisted": 0,
            "rejected": 0
        },
        "recommended_jobs": [],
        "recent_applications": []
    }
