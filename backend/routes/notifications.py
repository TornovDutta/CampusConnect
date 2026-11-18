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

    or_conditions = [
        {"recipient_id": user_id},
        {"recipient_role": role},
        {"recipient_role": "all"},
    ]
    # For super_admin, also fetch notifications targeting 'admin'
    if role == "super_admin":
        or_conditions.append({"recipient_role": "admin"})

    query = {
        "$and": [
            {"$or": or_conditions},
            {"dismissed_by": {"$ne": user_id}},
        ]
    }

    cursor = notifications_col.find(query).sort("created_at", -1).limit(50)
    notifications = []
    unread_count = 0

    async for item in cursor:
        created_at = item.get("created_at")
        read_by = item.get("read_by", [])
        is_direct = bool(item.get("recipient_id"))
        is_read = (item.get("is_read", False) or (user_id in read_by)) if is_direct else (user_id in read_by)
        if not is_read:
            unread_count += 1

        notifications.append({
            "id": str(item["_id"]),
            "title": item.get("title", "Notification"),
            "message": item.get("message", ""),
            "type": item.get("type", "system"),
            "priority": item.get("priority", "normal"),
            "sent_by_admin": bool(item.get("sent_by_admin", False)),
            "sender_name": item.get("sender_name"),
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

    notif = await notifications_col.find_one({"_id": ObjectId(notification_id)})
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    update_ops: dict = {"$addToSet": {"read_by": user_id}}
    if notif.get("recipient_id") == user_id:
        update_ops["$set"] = {"is_read": True}

    await notifications_col.update_one({"_id": ObjectId(notification_id)}, update_ops)
    return {"message": "Notification marked as read"}

@router.post("/mark-all-read")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user.get("sub")
    role = current_user.get("role")
    notifications_col = db["notifications"]

    or_conditions = [
        {"recipient_id": user_id},
        {"recipient_role": role},
        {"recipient_role": "all"},
    ]
    if role == "super_admin":
        or_conditions.append({"recipient_role": "admin"})

    await notifications_col.update_many(
        {"$or": or_conditions},
        {"$addToSet": {"read_by": user_id}}
    )
    await notifications_col.update_many(
        {"recipient_id": user_id},
        {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user.get("sub")
    notifications_col = db["notifications"]
    notif = await notifications_col.find_one({"_id": ObjectId(notification_id)})
    if not notif:
        return {"message": "Notification deleted"}

    if notif.get("recipient_id") == user_id:
        await notifications_col.delete_one({"_id": ObjectId(notification_id)})
    else:
        await notifications_col.update_one(
            {"_id": ObjectId(notification_id)},
            {"$addToSet": {"dismissed_by": user_id}}
        )
    return {"message": "Notification deleted"}

@router.delete("")
async def clear_all_notifications(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user.get("sub")
    role = current_user.get("role")
    notifications_col = db["notifications"]

    # Delete direct notifications for this user
    await notifications_col.delete_many({"recipient_id": user_id})

    # Dismiss role-based/broadcast notifications only for this user
    role_conditions = [
        {"recipient_role": role},
        {"recipient_role": "all"},
    ]
    if role == "super_admin":
        role_conditions.append({"recipient_role": "admin"})

    await notifications_col.update_many(
        {"$or": role_conditions},
        {"$addToSet": {"dismissed_by": user_id}}
    )
    return {"message": "Notifications cleared"}
