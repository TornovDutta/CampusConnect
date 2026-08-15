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
    
    registered_students = await db["users"].count_documents({"role": "student", "college_id": college_id, "is_college_approved": True})
    
    # Fetch campus drive invitations (jobs targeting this college)
    invites_cursor = db["jobs"].find({"status": "active", "visibility": "requested_college", "target_colleges": college_id}).sort("created_at", -1)
    recent_invitations = []
    async for invite in invites_cursor:
        invite["_id"] = str(invite["_id"])
        invite["id"] = str(invite["_id"])
        if "created_at" in invite and invite["created_at"]:
            invite["created_at"] = invite["created_at"].isoformat() if hasattr(invite["created_at"], "isoformat") else str(invite["created_at"])
        invite["package_details"] = invite.get("stipend") or invite.get("employment_type", "Competitive Package")
        recent_invitations.append(invite)
        
    drive_invitations = len(recent_invitations)
    students_placed = await db["applications"].count_documents({"college_id": college_id, "status": {"$in": ["Shortlisted", "Offer Sent", "Hired"]}})

    return {
        "stats": {
            "registered_students": registered_students,
            "drive_invitations": drive_invitations,
            "students_placed": students_placed
        },
        "recent_invitations": recent_invitations
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

@router.get("/students")
async def get_college_students(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]
    
    cursor = db["users"].find({
        "role": "student", 
        "college_id": college_id, 
        "is_college_approved": True
    }).sort("created_at", -1)
    
    students = []
    async for student in cursor:
        student["_id"] = str(student["_id"])
        if "hashed_password" in student:
            del student["hashed_password"]
        students.append(student)
        
    return students

@router.get("/selected-jobs")
async def get_selected_jobs(college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]
    
    cursor = db["applications"].find({
        "college_id": college_id, 
        "status": {"$in": ["Shortlisted", "Offer Sent", "Hired"]}
    }).sort("applied_at", -1)
    
    selected_jobs = []
    async for app in cursor:
        app["_id"] = str(app["_id"])
        if "applied_at" in app and app["applied_at"]:
            app["applied_at"] = app["applied_at"].isoformat() if hasattr(app["applied_at"], "isoformat") else str(app["applied_at"])
        selected_jobs.append(app)
        
    return selected_jobs

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
    if "hashed_password" in student:
        del student["hashed_password"]
        
    return student

@router.patch("/students/{student_id}/toggle-suspend")
async def toggle_student_suspension(student_id: str, college=Depends(get_current_college)):
    db = get_database()
    college_id = college["sub"]
    
    # Check if student exists and belongs to this college
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
