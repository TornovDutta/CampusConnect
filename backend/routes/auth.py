from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from database import get_database
from core.security import verify_password, create_access_token, get_password_hash
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
        data={"sub": user["email"], "role": user["role"]}
    )
    
    # Remove hashed password from user dict to safely return it
    user["_id"] = str(user["_id"])
    del user["hashed_password"]
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

from models.user import UserCreate, UserInDB
from datetime import datetime

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
        
    result = await users_collection.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    del user_dict["hashed_password"]
    
    return {"message": "User registered successfully", "user": user_dict}
