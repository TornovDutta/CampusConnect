from motor.motor_asyncio import AsyncIOMotorClient
import os

# Using a standard localhost mongo URI for development
MONGO_DETAILS = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = "campusconnect"

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_instance = MongoDB()

async def connect_to_mongo():
    print("Connecting to MongoDB...")
    db_instance.client = AsyncIOMotorClient(MONGO_DETAILS)
    db_instance.db = db_instance.client[DATABASE_NAME]
    print("Connected to MongoDB!")

async def close_mongo_connection():
    print("Closing MongoDB connection...")
    if db_instance.client:
        db_instance.client.close()
        print("MongoDB connection closed.")

def get_database():
    return db_instance.db
