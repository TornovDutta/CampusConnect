from fastapi import APIRouter, Depends, HTTPException
from database import get_database
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from core.config import settings

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

@router.get("/dashboard-stats")
async def get_college_dashboard(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]  # subject/user_id in JWT
    
    # We'll calculate real stats later
    return {
        "stats": {
            "registered_students": await db["users"].count_documents({"role": "student", "college_id": college_id, "is_college_approved": True}),
            "drive_invitations": 0,
            "students_placed": 0
        },
        "recent_invitations": []
    }

from bson import ObjectId

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
        if "hashed_password" in student:
            del student["hashed_password"]
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

from pydantic import BaseModel, EmailStr

class StudentAddRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

@router.post("/add-student")
async def add_student(student_in: StudentAddRequest, college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]
    
    existing_user = await db["users"].find_one({"email": student_in.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    from core.security import get_password_hash
    from datetime import datetime
    
    user_dict = {
        "name": student_in.name,
        "email": student_in.email,
        "role": "student",
        "is_active": True,
        "college_id": college_id,
        "is_college_approved": True,
        "created_at": datetime.utcnow(),
        "hashed_password": get_password_hash(student_in.password),
        "is_suspended": False,
        "is_approved": True,
    }
    
    result = await db["users"].insert_one(user_dict)
    return {"message": "Student added successfully", "id": str(result.inserted_id)}
