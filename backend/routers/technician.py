from fastapi import APIRouter
import servicenow as sn

router = APIRouter()

@router.get("/tasks/{assigned_to}")
def get_my_tasks(assigned_to: str):
    query = f"assigned_to={assigned_to}^state!=6^state!=7"
    return sn.get_incidents(query=query)

@router.get("/stats/{assigned_to}")
def get_my_stats(assigned_to: str):
    all_tasks = sn.get_incidents(
        query=f"assigned_to={assigned_to}",
        limit=100
    )
    incidents = all_tasks.get("result", [])
    total = len(incidents)
    resolved = len([i for i in incidents if i.get("state") == "6"])
    pending = len([i for i in incidents if i.get("state") in ["1", "2"]])
    return {
        "total": total,
        "resolved": resolved,
        "pending": pending,
        "resolution_rate": round((resolved / total * 100) if total > 0 else 0, 1)
    }