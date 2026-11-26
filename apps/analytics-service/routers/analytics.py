from fastapi import APIRouter, Depends, Header, HTTPException
from typing import Any
import httpx
import os
from processing.reporter import (calculate_appointment_utilization, calculate_waiting_times,
    calculate_lab_turnaround_times, generate_population_report)

router = APIRouter(prefix="/analytics", tags=["Operational Analytics"])
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://127.0.0.1:4010")

async def authorized_snapshot(authorization: str = Header(default="")) -> dict[str, Any]:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentication required")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{BACKEND_BASE_URL}/api/v1/operations/analytics-source",
                headers={"Authorization": authorization})
        if response.status_code in (401, 403):
            raise HTTPException(response.status_code, "Operational analytics permission required")
        response.raise_for_status()
        return response.json()["data"]
    except HTTPException:
        raise
    except (httpx.HTTPError, ValueError, KeyError):
        raise HTTPException(503, "Authoritative data source unavailable")

@router.get("/appointment-utilization")
async def utilization(source=Depends(authorized_snapshot)):
    return {"status": "success", "metric": "appointment_utilization", "data": calculate_appointment_utilization(source["appointments"])}

@router.get("/waiting-times")
async def waiting(source=Depends(authorized_snapshot)):
    return {"status": "success", "metric": "patient_waiting_times", "data": calculate_waiting_times(source["encounters"])}

@router.get("/lab-turnaround")
async def turnaround(source=Depends(authorized_snapshot)):
    return {"status": "success", "metric": "laboratory_turnaround_time", "data": calculate_lab_turnaround_times(source["labOrders"])}

@router.get("/population-metrics")
async def population(source=Depends(authorized_snapshot)):
    return {"status": "success", "metric": "synthetic_population_reporting", "data": generate_population_report(source["patients"])}

@router.get("/department-statistics")
async def departments(source=Depends(authorized_snapshot)):
    stats=[]
    for department in source["departments"]:
        appointments=[a for a in source["appointments"] if a.get("department_name")==department["name"]]
        completed=sum(a["status"]=="COMPLETED" for a in appointments)
        stats.append({"department":department["name"], "activeDoctors":department["activeDoctors"],
            "scheduledAppointments":len(appointments), "completedEncounters":completed,
            "occupancyRate":round(completed/len(appointments)*100,1) if appointments else 0})
    return {"status":"success", "metric":"operational_department_statistics", "data":stats}
