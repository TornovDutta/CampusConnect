from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict
from datetime import datetime
from database import get_database
from typing import List, Dict
from database import get_database
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from core.config import settings

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

@router.get("/dashboard-stats")
async def get_admin_dashboard(admin=Depends(get_current_admin)):
    db = get_database()
    users_collection = db["users"]
    
    total_users = await users_collection.count_documents({})
    total_colleges = await users_collection.count_documents({"role": "college"})
    total_companies = await users_collection.count_documents({"role": "company"})
    # Get all colleges and companies for management
    orgs_cursor = users_collection.find({
        "role": {"$in": ["college", "company"]}
    }).sort("created_at", -1)
    
    organizations = []
    async for org in orgs_cursor:
        org["_id"] = str(org["_id"])
        if "hashed_password" in org:
            del org["hashed_password"]
        organizations.append(org)
        
    return {
        "stats": {
            "total_users": total_users,
            "total_colleges": total_colleges,
            "total_companies": total_companies
        },
        "organizations": organizations
    }

from bson import ObjectId

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
    
    # Optional: if it's a college, you can also suspend all its students (requires students to have college_id)
    
    return {"message": f"Suspension status changed to {new_status}"}

@router.get("/organization/{org_id}")
async def get_organization_details(org_id: str, admin=Depends(get_current_admin)):
    db = get_database()
    users_collection = db["users"]
    
    org = await users_collection.find_one({"_id": ObjectId(org_id)})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    org["_id"] = str(org["_id"])
    if "hashed_password" in org:
        del org["hashed_password"]
        
    students = []
    # If it's a college, fetch their students
    if org.get("role") == "college":
        # We assume students have a 'college_id' field.
        student_cursor = users_collection.find({"role": "student", "college_id": org_id})
        async for student in student_cursor:
            student["_id"] = str(student["_id"])
            if "hashed_password" in student:
                del student["hashed_password"]
            students.append(student)
            
    return {
        "organization": org,
        "students": students
    }

@router.get("/activity")
async def get_user_activity(admin=Depends(get_current_admin)):
    db = get_database()
    activities_collection = db["activities"]
    
    # 1. Fetch recent activities for the Activity Log
    recent_activities_cursor = activities_collection.find({}).sort("created_at", -1).limit(20)
    activities = []
    
    async for act in recent_activities_cursor:
        created_at = act.get("created_at")
        activities.append({
            "id": str(act["_id"]),
            "type": act.get("type", "activity"),
            "user": act.get("user_name", "Unknown"),
            "role": act.get("role", "user"),
            "time": created_at.isoformat() if isinstance(created_at, datetime) else str(created_at),
            "details": act.get("details", "")
        })
        
    chart_data_dict = {
        "Mon": {"name": "Mon", "Student": 0, "College": 0, "Company": 0},
        "Tue": {"name": "Tue", "Student": 0, "College": 0, "Company": 0},
        "Wed": {"name": "Wed", "Student": 0, "College": 0, "Company": 0},
        "Thu": {"name": "Thu", "Student": 0, "College": 0, "Company": 0},
        "Fri": {"name": "Fri", "Student": 0, "College": 0, "Company": 0},
        "Sat": {"name": "Sat", "Student": 0, "College": 0, "Company": 0},
        "Sun": {"name": "Sun", "Student": 0, "College": 0, "Company": 0},
    }
    
    all_activities = activities_collection.find({}, {"created_at": 1, "role": 1})
    async for u in all_activities:
        ca = u.get("created_at")
        role = u.get("role", "").capitalize()
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
        "chart_data": chart_data
    }

