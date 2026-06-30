from fastapi import APIRouter, Depends, HTTPException, status
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
