import asyncio
from datetime import datetime
from bson import ObjectId

async def test_logic():
    from database import get_database
    db = get_database()
    
    # 1. Check if mock questions load
    from routes.student import QUESTION_BANK, evaluate_mock_interview, MockEvaluateRequest
    print("Mock question topics:", list(QUESTION_BANK.keys()))
    assert len(QUESTION_BANK["frontend"]) > 0
    assert len(QUESTION_BANK["backend"]) > 0
    assert len(QUESTION_BANK["hr"]) > 0
    print("Question bank verified.")

    # 2. Check mock evaluation logic
    dummy_student = {"sub": "000000000000000000000001", "role": "student"}
    req = MockEvaluateRequest(
        question_id="fe_1",
        topic="frontend",
        question="Explain Virtual DOM",
        answer="The virtual DOM is an in-memory lightweight representation of the real DOM. When state changes, React reconciles differences using diffing algorithms to minimize expensive repaints and reflows.",
        time_spent_seconds=65
    )
    result = await evaluate_mock_interview(req, dummy_student)
    print("Mock evaluate response:", result)
    assert result["score"] >= 70
    assert "strengths" in result

    print("ALL LOGIC CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test_logic())
