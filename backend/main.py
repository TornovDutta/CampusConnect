from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import connect_to_mongo, close_mongo_connection, get_database
from core.config import settings
from core.security import get_password_hash
from models.user import RoleEnum
from datetime import datetime
from routes import auth, admin, student, college, company, notifications

app = FastAPI(
    title="CampusConnect API",
    description="API for the CampusConnect Recruitment Platform",
    version="1.0.0"
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(student.router)
app.include_router(college.router)
app.include_router(company.router)
app.include_router(notifications.router)

# Configure CORS origins dynamically from environment variables
default_origins = [
    "http://localhost:5173", # Vite default port
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

env_origins = []
if settings.FRONTEND_URL:
    for url in settings.FRONTEND_URL.split(","):
        cleaned = url.strip().rstrip("/")
        if cleaned:
            env_origins.append(cleaned)

if settings.CORS_ORIGINS:
    for url in settings.CORS_ORIGINS.split(","):
        cleaned = url.strip().rstrip("/")
        if cleaned:
            env_origins.append(cleaned)

# Combine and deduplicate
allowed_origins = list(dict.fromkeys(default_origins + env_origins))

# Allow wildcard if explicitly specified
allow_all = "*" in env_origins or settings.FRONTEND_URL.strip() == "*"

if allow_all:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=r"^https:\/\/.*\.vercel\.app$", # Auto-allows Vercel preview & production deployments
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

async def init_super_admin():
    db = get_database()
    users_collection = db["users"]
    
    admin_exists = await users_collection.find_one({"email": settings.ADMIN_EMAIL})
    
    if not admin_exists:
        print(f"Creating Super Admin from .env: {settings.ADMIN_EMAIL}")
        admin_user = {
            "email": settings.ADMIN_EMAIL,
            "hashed_password": get_password_hash(settings.ADMIN_PASSWORD),
            "role": RoleEnum.super_admin,
            "name": settings.ADMIN_NAME,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        await users_collection.insert_one(admin_user)
        print("Super Admin created successfully.")
    else:
        print("Super Admin already exists in the database.")

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()
    await init_super_admin()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

@app.get("/")
async def root():
    return {"message": "Welcome to CampusConnect API", "status": "healthy"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "db": "connected"}
