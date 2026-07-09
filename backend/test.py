import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
async def test():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['campusconnect']
    activities_collection = db['activities']
    recent = await activities_collection.find({}).to_list(10)
    print(recent)
if __name__ == '__main__':
    asyncio.run(test())
