from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from core.security import verify_password, create_access_token, get_password_hash
from database import get_database, log_activity
from models.user import UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_database()
    users_collection = db["users"]
    
    # 1. Find the user
    user = await users_collection.find_one({"email": form_data.username})
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
    
    # Log login activity
    await log_activity(
        user_id=str(user["_id"]),
        user_name=user.get("name") or user.get("email"),
        role=user.get("role", "student"),
        action_type="login",
        details="User logged in"
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

from models.user import UserCreate, UserInDB
from datetime import datetime

@router.get("/colleges")
async def get_colleges():
    db = get_database()
    colleges_cursor = db["users"].find({"role": "college", "is_suspended": False})
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
    
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user dictionary
    user_dict = user_in.model_dump(exclude={"password"})
    user_dict["hashed_password"] = get_password_hash(user_in.password)
    user_dict["is_active"] = True
    user_dict["is_suspended"] = False
    user_dict["created_at"] = datetime.utcnow()
    
    # Needs approval if it's a company
    if user_in.role == "company":
        user_dict["is_approved"] = False
    else:
        user_dict["is_approved"] = True
        
    # If student, require college approval
    if user_in.role == "student":
        if not user_in.college_id:
            raise HTTPException(status_code=400, detail="Students must select a college")
        user_dict["is_college_approved"] = False
        
    result = await users_collection.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    del user_dict["hashed_password"]
    
    # Log registration activity
    await log_activity(
        user_id=str(result.inserted_id),
        user_name=user_dict.get("name") or user_dict.get("email"),
        role=user_dict.get("role", "student"),
        action_type="signup",
        details=f"Registered a new {user_dict.get('role', 'student')} account"
    )
    
    return {"message": "User registered successfully", "user": user_dict}

from pydantic import BaseModel
from jose import jwt, JWTError
from core.config import settings
from bson import ObjectId

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

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
