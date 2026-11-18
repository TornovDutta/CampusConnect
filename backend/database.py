import asyncio
import datetime
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

# Using standard configs
MONGO_DETAILS = settings.MONGO_URI
DATABASE_NAME = settings.DATABASE_NAME

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None
    loop = None

db_instance = MongoDB()

async def connect_to_mongo():
    print("Connecting to MongoDB...")
    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None
    db_instance.client = AsyncIOMotorClient(MONGO_DETAILS)
    db_instance.db = db_instance.client[DATABASE_NAME]
    db_instance.loop = current_loop
    print("Connected to MongoDB!")

async def close_mongo_connection():
    print("Closing MongoDB connection...")
    if db_instance.client:
        db_instance.client.close()
        db_instance.client = None
        db_instance.db = None
        db_instance.loop = None
        print("MongoDB connection closed.")

def get_database():
    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None

    if db_instance.db is None or (current_loop is not None and db_instance.loop is not None and db_instance.loop != current_loop):
        db_instance.client = AsyncIOMotorClient(MONGO_DETAILS)
        db_instance.db = db_instance.client[DATABASE_NAME]
        db_instance.loop = current_loop
    return db_instance.db

async def log_activity(user_id: str, user_name: str, role: str, action_type: str, details: str):
    db = get_database()
    if db is not None:
        try:
            await db["activities"].insert_one({
                "user_id": user_id,
                "user_name": user_name,
                "role": role,
                "type": action_type,
                "details": details,
                "created_at": datetime.datetime.utcnow()
            })
        except Exception as e:
            print(f"Failed to log activity: {e}")

async def log_system_issue(
    feature: str,
    message: str,
    source: str = "backend",
    severity: str = "error",
    endpoint: Optional[str] = None,
    method: Optional[str] = None,
    status_code: Optional[int] = None,
    error_type: Optional[str] = None,
    stack_trace: Optional[str] = None,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    user_role: Optional[str] = None,
):
    db = get_database()
    if db is not None:
        try:
            await db["system_issues"].insert_one({
                "source": source,
                "feature": feature or "General",
                "endpoint": endpoint or "",
                "method": method or "",
                "status_code": status_code,
                "severity": severity,
                "error_type": error_type or "RuntimeError",
                "message": str(message)[:1000],
                "stack_trace": str(stack_trace)[:4000] if stack_trace else None,
                "user_id": user_id,
                "user_email": user_email,
                "user_role": user_role,
                "status": "open",
                "resolution_note": "",
                "created_at": datetime.datetime.utcnow(),
                "resolved_at": None,
            })
        except Exception as e:
            print(f"Failed to log system issue: {e}")
