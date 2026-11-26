from fastapi.testclient import TestClient
from main import app
from processing.reporter import calculate_waiting_times, calculate_lab_turnaround_times, generate_population_report
import pytest
import httpx
import pandas as pd
from processing.validator import validate_lab_dataset

@pytest.mark.parametrize('path', ['appointment-utilization','waiting-times','lab-turnaround','population-metrics','department-statistics'])
def test_analytics_requires_authentication(path):
    response=TestClient(app).get('/analytics/'+path)
    assert response.status_code==401

def test_no_invented_waiting_metrics():
    data=calculate_waiting_times([{'startTime':'bad'}])
    assert data['sample_size']==0
    assert data['average_wait_minutes'] is None

def test_no_invented_lab_metrics():
    data=calculate_lab_turnaround_times([])
    assert data['completed_orders_analyzed']==0
    assert data['average_tat_hours'] is None

def test_population_handles_timezone_aware_database_values():
    result=generate_population_report([{'dateOfBirth':'1990-01-01T00:00:00.000Z','gender':'FEMALE'}])
    assert result['total_synthetic_patients']==1
    assert result['mean_patient_age']>30

def test_backend_outage_returns_503(monkeypatch):
    async def unavailable(self,*args,**kwargs):
        raise httpx.ConnectError('controlled synthetic outage')
    monkeypatch.setattr(httpx.AsyncClient,'get',unavailable)
    response=TestClient(app).get('/analytics/waiting-times',headers={'Authorization':'Bearer synthetic'})
    assert response.status_code==503
    assert 'fallback' not in response.text

@pytest.mark.parametrize('changes',[{'patient_id':None},{'unit':'wrong'},{'measured_value':'Infinity'},{'reference_low':100,'reference_high':10}])
def test_dataset_rejects_missing_identity_units_and_malformed_reference(changes):
    row={'patient_id':'synthetic','test_code':'1558-6','measured_value':95,'unit':'mg/dL',**changes}
    clean,errors,stats=validate_lab_dataset(pd.DataFrame([row]))
    assert len(clean)==0
    assert stats['error_count']>=1
