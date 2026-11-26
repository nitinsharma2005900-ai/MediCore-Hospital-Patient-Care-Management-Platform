import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_appointment_utilization_endpoint():
    response = client.get("/analytics/appointment-utilization")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "utilization_rate_percent" in data["data"]
    assert "total_appointments" in data["data"]

def test_waiting_times_endpoint():
    response = client.get("/analytics/waiting-times")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "average_wait_minutes" in data["data"]
    assert "median_wait_minutes" in data["data"]

def test_lab_turnaround_endpoint():
    response = client.get("/analytics/lab-turnaround")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "average_tat_hours" in data["data"]

def test_population_metrics_endpoint():
    response = client.get("/analytics/population-metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "total_synthetic_patients" in data["data"]
    assert "age_distribution" in data["data"]

def test_department_statistics_endpoint():
    response = client.get("/analytics/department-statistics")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["data"], list)
    assert len(data["data"]) > 0
