from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import connect_to_mongo, close_mongo_connection, get_database
from core.config import settings
from core.security import get_password_hash
from models.user import RoleEnum
from datetime import datetime
from routes import auth, admin, student, college, company

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

# Configure CORS
origins = [
    "http://localhost:5173", # Vite frontend default port
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
