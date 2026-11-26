import pytest
import pandas as pd
from processing.validator import validate_lab_dataset, validate_appointment_dataset

def test_validate_lab_dataset_handles_clean_data():
    data = [
        {'id': '1', 'test_code': '1558-6', 'measured_value': 95.0, 'unit': 'mg/dL', 'patient_id': 'P1'},
        {'id': '2', 'test_code': '2160-0', 'measured_value': 1.05, 'unit': 'mg/dL', 'patient_id': 'P1'}
    ]
    df = pd.DataFrame(data)
    clean_df, errors, stats = validate_lab_dataset(df)

    assert len(clean_df) == 2
    assert stats['error_count'] == 0
    assert stats['quality_score_percent'] == 100.0

def test_validate_lab_dataset_detects_missing_and_malformed_values():
    data = [
        {'id': '1', 'test_code': '1558-6', 'measured_value': None, 'unit': 'mg/dL', 'patient_id': 'P1'}, # missing
        {'id': '2', 'test_code': '2160-0', 'measured_value': 'NOT_NUMERIC', 'unit': 'mg/dL', 'patient_id': 'P2'}, # malformed
        {'id': '3', 'test_code': '2823-3', 'measured_value': 4.5, 'unit': 'mmol/L', 'patient_id': 'P3'} # valid
    ]
    df = pd.DataFrame(data)
    clean_df, errors, stats = validate_lab_dataset(df)

    assert len(clean_df) == 1
    assert stats['error_count'] == 2
    assert len(errors) == 2

def test_validate_appointment_dataset_checks_status_and_timestamps():
    data = [
        {
            'appointment_id': 'A1',
            'doctor_id': 'D1',
            'patient_id': 'P1',
            'start_time': '2026-11-26T09:00:00Z',
            'end_time': '2026-11-26T09:30:00Z',
            'status': 'CONFIRMED'
        },
        {
            'appointment_id': 'A2',
            'doctor_id': 'D1',
            'patient_id': 'P2',
            'start_time': '2026-11-26T10:00:00Z',
            'end_time': '2026-11-26T09:30:00Z', # Invalid end time
            'status': 'CONFIRMED'
        },
        {
            'appointment_id': 'A3',
            'doctor_id': 'D1',
            'patient_id': 'P3',
            'start_time': '2026-11-26T11:00:00Z',
            'end_time': '2026-11-26T11:30:00Z',
            'status': 'INVALID_STATUS_STRING' # Invalid status
        }
    ]
    df = pd.DataFrame(data)
    clean_df, errors, stats = validate_appointment_dataset(df)

    assert len(clean_df) == 1
    assert stats['error_count'] == 2
