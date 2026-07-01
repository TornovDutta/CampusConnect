from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum
from datetime import datetime

class RoleEnum(str, Enum):
    super_admin = "super_admin"
    college = "college"
    student = "student"
    company = "company"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: RoleEnum
    is_active: bool = True
    college_id: Optional[str] = None
    is_college_approved: Optional[bool] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: str

class UserResponse(UserBase):
    id: str = Field(alias="_id")
