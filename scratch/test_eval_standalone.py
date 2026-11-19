# Test question bank and evaluation heuristic logic standalone
QUESTION_BANK = {
    "frontend": [
        {"id": "fe_1", "topic": "Frontend Engineering", "question": "Explain React's Virtual DOM."}
    ],
    "backend": [
        {"id": "be_1", "topic": "Backend Engineering", "question": "Compare SQL vs MongoDB."}
    ],
    "hr": [
        {"id": "hr_1", "topic": "HR & Behavioral", "question": "Tell me about a challenging roadblock."}
    ]
}

def evaluate_mock_interview(answer: str):
    ans = answer.strip()
    if len(ans) < 15:
        return {"score": 30, "readiness": "Needs Expansion"}
    word_count = len(ans.split())
    score = 65
    if word_count > 40:
        score += 15
    if word_count > 80:
        score += 10
    if any(k in ans.lower() for k in ["for example", "specifically", "because", "trade-off", "performance", "result"]):
        score += 10
    score = min(score, 98)
    return {
        "score": score,
        "readiness": "Interview Ready" if score >= 80 else "Good Foundation",
        "word_count": word_count
    }

ans = "The Virtual DOM is an in-memory representation of the Real DOM. When state changes, React reconciles changes via diffing, specifically reducing expensive repaints and boosting performance."
res = evaluate_mock_interview(ans)
print("Evaluation Result:", res)
assert res["score"] >= 80
print("TEST PASSED!")
