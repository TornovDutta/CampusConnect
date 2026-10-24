from fastapi import APIRouter, Depends, HTTPException
from database import get_database
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from core.config import settings
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/notifications", tags=["Notifications"])
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

@router.get("")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user.get("sub")
    role = current_user.get("role")
    notifications_col = db["notifications"]

    query = {
        "$or": [
            {"recipient_id": user_id},
            {"recipient_role": role}
        ]
    }
    # For super_admin, also fetch notifications targeting 'admin'
    if role == "super_admin":
        query["$or"].append({"recipient_role": "admin"})

    cursor = notifications_col.find(query).sort("created_at", -1).limit(50)
    notifications = []
    unread_count = 0

    async for item in cursor:
        created_at = item.get("created_at")
        read_by = item.get("read_by", [])
        is_read = item.get("is_read", False) or (user_id in read_by)
        if not is_read:
            unread_count += 1

        notifications.append({
            "id": str(item["_id"]),
            "title": item.get("title", "Notification"),
            "message": item.get("message", ""),
            "type": item.get("type", "system"),
            "user_id": item.get("user_id"),
            "user_name": item.get("user_name"),
            "user_role": item.get("user_role"),
            "user_email": item.get("user_email"),
            "is_read": is_read,
            "created_at": created_at.isoformat() if isinstance(created_at, datetime) else str(created_at)
        })

    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@router.post("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user.get("sub")
    notifications_col = db["notifications"]
    
    await notifications_col.update_one(
        {"_id": ObjectId(notification_id)},
        {
            "$addToSet": {"read_by": user_id},
            "$set": {"is_read": True}
        }
    )
    return {"message": "Notification marked as read"}

@router.post("/mark-all-read")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user.get("sub")
    role = current_user.get("role")
    notifications_col = db["notifications"]

    query = {
        "$or": [
            {"recipient_id": user_id},
            {"recipient_role": role}
        ]
    }
    if role == "super_admin":
        query["$or"].append({"recipient_role": "admin"})

    await notifications_col.update_many(
        query,
        {
            "$addToSet": {"read_by": user_id},
            "$set": {"is_read": True}
        }
    )
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    notifications_col = db["notifications"]
    await notifications_col.delete_one({"_id": ObjectId(notification_id)})
    return {"message": "Notification deleted"}

@router.delete("")
async def clear_all_notifications(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user.get("sub")
    role = current_user.get("role")
    notifications_col = db["notifications"]

    query = {
        "$or": [
            {"recipient_id": user_id},
            {"recipient_role": role}
        ]
    }
    if role == "super_admin":
        query["$or"].append({"recipient_role": "admin"})

    await notifications_col.delete_many(query)
    return {"message": "Notifications cleared"}
