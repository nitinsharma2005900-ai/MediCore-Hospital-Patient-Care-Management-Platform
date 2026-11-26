import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'apps', 'analytics-service')))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("[FastAPI Runtime Verification] Testing endpoints...")

# 1. Health check
res = client.get("/health")
assert res.status_code == 200, f"Health check failed: {res.status_code}"
print(f"[Test 1] GET /health -> Status: {res.status_code}, Body: {res.json()}")

# 2. Swagger docs
res = client.get("/docs")
assert res.status_code == 200, f"Docs failed: {res.status_code}"
print(f"[Test 2] GET /docs -> Status: {res.status_code} (Swagger UI reachable)")

# 3. Appointment utilization
res = client.get("/analytics/appointment-utilization")
assert res.status_code == 200, f"Appointment utilization failed: {res.status_code}"
data = res.json()["data"]
print(f"[Test 3] GET /analytics/appointment-utilization -> Status: {res.status_code}")
print(f"         Total: {data['total_appointments']}, Completed: {data['completed']}, Rate: {data['utilization_rate_percent']}%")

# 4. Waiting times
res = client.get("/analytics/waiting-times")
assert res.status_code == 200, f"Waiting times failed: {res.status_code}"
wait_data = res.json()["data"]
print(f"[Test 4] GET /analytics/waiting-times -> Status: {res.status_code}")
print(f"         Average Wait Time: {wait_data['average_wait_minutes']} minutes, 90th percentile: {wait_data['p90_wait_minutes']} minutes")

# 5. Lab Turnaround
res = client.get("/analytics/lab-turnaround")
assert res.status_code == 200, f"Lab turnaround failed: {res.status_code}"
tat_data = res.json()["data"]
print(f"[Test 5] GET /analytics/lab-turnaround -> Status: {res.status_code}")
print(f"         Average Lab TAT: {tat_data['average_tat_hours']} hours, Completed Orders: {tat_data['completed_orders_analyzed']}")

# 6. Population Metrics
res = client.get("/analytics/population-metrics")
assert res.status_code == 200, f"Population metrics failed: {res.status_code}"
pop_data = res.json()["data"]
print(f"[Test 6] GET /analytics/population-metrics -> Status: {res.status_code}")
print(f"         Total Patients: {pop_data['total_synthetic_patients']}, Gender Ratio: {pop_data['gender_distribution']}")

# 7. Department Statistics
res = client.get("/analytics/department-statistics")
assert res.status_code == 200, f"Department statistics failed: {res.status_code}"
dept_data = res.json()["data"]
print(f"[Test 7] GET /analytics/department-statistics -> Status: {res.status_code}")
print(f"         Departments analyzed: {len(dept_data)}")

print("\n[SUCCESS] All FastAPI Analytics live runtime checks passed with 100% success!\n")
