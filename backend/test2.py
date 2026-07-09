import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def test():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    activities_collection = client['campusconnect']['activities']
    
    chart_data_dict = {
        'Mon': {'name': 'Mon', 'Student': 0, 'College': 0, 'Company': 0},
        'Tue': {'name': 'Tue', 'Student': 0, 'College': 0, 'Company': 0},
        'Wed': {'name': 'Wed', 'Student': 0, 'College': 0, 'Company': 0},
        'Thu': {'name': 'Thu', 'Student': 0, 'College': 0, 'Company': 0},
        'Fri': {'name': 'Fri', 'Student': 0, 'College': 0, 'Company': 0},
        'Sat': {'name': 'Sat', 'Student': 0, 'College': 0, 'Company': 0},
        'Sun': {'name': 'Sun', 'Student': 0, 'College': 0, 'Company': 0},
    }
    
    all_activities = activities_collection.find({}, {'created_at': 1, 'role': 1})
    async for u in all_activities:
        ca = u.get('created_at')
        role = u.get('role', '').capitalize()
        if role not in ['Student', 'College', 'Company']:
            continue
        if isinstance(ca, datetime):
            day_name = ca.strftime('%a')
            if day_name in chart_data_dict:
                chart_data_dict[day_name][role] += 1
                
    print(list(chart_data_dict.values()))

if __name__ == '__main__':
    asyncio.run(test())
