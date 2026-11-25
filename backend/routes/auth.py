from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from core.security import verify_password, create_access_token, get_password_hash
from database import get_database, log_activity
from models.user import UserCreate, RoleEnum
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from jose import jwt, JWTError
from core.config import settings
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_database()
    users_collection = db["users"]
    
    # 1. Find the user (case-insensitive and trimmed email)
    import re
    username_clean = (form_data.username or "").strip()
    user = await users_collection.find_one({
        "email": {"$regex": f"^{re.escape(username_clean)}$", "$options": "i"}
    })
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Verify password
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Check if active and suspended
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if user.get("is_suspended", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account Suspended by Admin"
        )

    # 4. Create Token
    access_token = create_access_token(
        data={"sub": str(user["_id"]), "role": user["role"]}
    )
    
    # Remove hashed password from user dict to safely return it
    user["_id"] = str(user["_id"])
    del user["hashed_password"]
    
    user_name_val = user.get("name") or user.get("email")
    user_role_val = user.get("role", "student")
    
    # Log login activity
    await log_activity(
        user_id=str(user["_id"]),
        user_name=user_name_val,
        role=user_role_val,
        action_type="login",
        details="User logged in"
    )
    
    # Create notification for Super Admin of new user login
    try:
        notifications_col = db["notifications"]
        role_label = user_role_val.replace("_", " ").title()
        await notifications_col.insert_one({
            "recipient_role": "super_admin",
            "title": "New User Login",
            "message": f"{user_name_val} ({role_label}) has logged into CampusConnect.",
            "type": "login",
            "user_id": str(user["_id"]),
            "user_name": user_name_val,
            "user_role": user_role_val,
            "user_email": user.get("email"),
            "read_by": [],
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"Failed to create login notification: {e}")
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

@router.get("/colleges")
async def get_colleges():
    db = get_database()
    colleges_cursor = db["users"].find({"role": "college", "is_suspended": {"$ne": True}})
    colleges = []
    async for college in colleges_cursor:
        colleges.append({
            "id": str(college["_id"]),
            "name": college.get("name", college.get("email"))
        })
    return colleges

@router.post("/register")
async def register(user_in: UserCreate):
    db = get_database()
    users_collection = db["users"]

    # Enforce Admin Platform Governance Controls
    controls = await db["settings"].find_one({"type": "platform_controls"}) or {}
    if controls.get("maintenance_mode", False):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=controls.get("maintenance_message") or "Platform is currently in maintenance mode. Registrations are paused.",
        )

    role_val = user_in.role.value if hasattr(user_in.role, "value") else str(user_in.role)
    if role_val == "student" and not controls.get("allow_student_registration", True):
        raise HTTPException(status_code=403, detail="Student registration is currently paused by the administrator.")
    if role_val == "college" and not controls.get("allow_college_registration", True):
        raise HTTPException(status_code=403, detail="College registration is currently paused by the administrator.")
    if role_val == "company" and not controls.get("allow_company_registration", True):
        raise HTTPException(status_code=403, detail="Company registration is currently paused by the administrator.")
    
    # Check if user exists (case-insensitive)
    import re
    email_clean = (user_in.email or "").strip().lower()
    existing_user = await users_collection.find_one({
        "email": {"$regex": f"^{re.escape(email_clean)}$", "$options": "i"}
    })
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user dictionary
    user_dict = user_in.model_dump(exclude={"password"})
    user_dict["email"] = email_clean
    user_dict["hashed_password"] = get_password_hash(user_in.password)
    user_dict["is_active"] = True
    user_dict["is_suspended"] = False
    user_dict["created_at"] = datetime.utcnow()
    
    # Needs approval if it's a company (respecting platform controls)
    if role_val == "company":
        user_dict["is_approved"] = not controls.get("require_company_approval", True)
    else:
        user_dict["is_approved"] = True
        
    # If student, require college approval (respecting platform controls)
    if role_val == "student":
        if not user_in.college_id:
            raise HTTPException(status_code=400, detail="Students must select a college")
        user_dict["is_college_approved"] = not controls.get("require_student_college_approval", True)
        
    result = await users_collection.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    del user_dict["hashed_password"]
    
    role_str = user_in.role.value if hasattr(user_in.role, 'value') else user_in.role
    
    # Log registration activity
    await log_activity(
        user_id=str(result.inserted_id),
        user_name=user_dict.get("name") or user_dict.get("email"),
        role=role_str,
        action_type="signup",
        details=f"Registered a new {role_str} account"
    )
    
    # Create notification for Super Admin of new user registration
    try:
        notifications_col = db["notifications"]
        role_label = role_str.replace("_", " ").title()
        await notifications_col.insert_one({
            "recipient_role": "super_admin",
            "title": "New User Registration",
            "message": f"New {role_label} registered: {user_dict.get('name')} ({user_dict.get('email')}).",
            "type": "signup",
            "user_id": str(result.inserted_id),
            "user_name": user_dict.get("name"),
            "user_role": role_str,
            "user_email": user_dict.get("email"),
            "read_by": [],
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"Failed to create registration notification: {e}")
    
    return {"message": "User registered successfully", "user": user_dict}

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(req: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    users_collection = db["users"]
    
    user_id = current_user.get("sub")
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not verify_password(req.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    new_hashed_password = get_password_hash(req.new_password)
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"hashed_password": new_hashed_password}}
    )
    
    await log_activity(
        user_id=user_id,
        user_name=user.get("name") or user.get("email"),
        role=user.get("role", "student"),
        action_type="security",
        details="Changed password"
    )
    
    return {"message": "Password updated successfully"}

class PreferencesRequest(BaseModel):
    language: Optional[str] = "en"
    timezone: Optional[str] = "Asia/Kolkata"
    theme: Optional[str] = "light"
    accent_color: Optional[str] = "teal"
    compact_mode: Optional[bool] = False
    email_notifications: Optional[bool] = True
    login_alerts: Optional[bool] = True
    desktop_notifications: Optional[bool] = False

@router.get("/preferences")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user.get("sub")
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    default_prefs = {
        "language": "en",
        "timezone": "Asia/Kolkata",
        "theme": "light",
        "accent_color": "teal",
        "compact_mode": False,
        "email_notifications": True,
        "login_alerts": True,
        "desktop_notifications": False
    }
    user_prefs = user.get("preferences", {})
    return {**default_prefs, **user_prefs}

@router.put("/preferences")
async def update_preferences(req: PreferencesRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user.get("sub")
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    prefs_dict = req.model_dump()
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"preferences": prefs_dict}}
    )
    
    await log_activity(
        user_id=user_id,
        user_name=user.get("name") or user.get("email"),
        role=user.get("role", "student"),
        action_type="settings",
        details="Updated preferences (language, timezone, appearance)"
    )
    
    return {"message": "Preferences updated successfully", "preferences": prefs_dict}
