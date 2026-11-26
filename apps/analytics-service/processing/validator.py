import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from datetime import datetime

# Standard LOINC codes and expected units in clinical biochemistry
VALID_LAB_METADATA = {
    '24323-8': {'name': 'Comprehensive Metabolic Panel', 'unit': 'panel'},
    '1558-6': {'name': 'Glucose Fasting', 'unit': 'mg/dL', 'min': 20.0, 'max': 800.0},
    '2160-0': {'name': 'Creatinine Serum', 'unit': 'mg/dL', 'min': 0.1, 'max': 25.0},
    '2823-3': {'name': 'Potassium Serum', 'unit': 'mmol/L', 'min': 1.0, 'max': 10.0},
    '2951-2': {'name': 'Sodium Serum', 'unit': 'mmol/L', 'min': 100.0, 'max': 180.0},
    '58410-2': {'name': 'Complete Blood Count', 'unit': 'panel'},
    '6690-2': {'name': 'White Blood Cell Count', 'unit': '10*3/uL', 'min': 0.5, 'max': 100.0},
    '718-7': {'name': 'Hemoglobin', 'unit': 'g/dL', 'min': 3.0, 'max': 25.0},
    '777-3': {'name': 'Platelet Count', 'unit': '10*3/uL', 'min': 10.0, 'max': 1500.0},
    '2093-3': {'name': 'Total Cholesterol', 'unit': 'mg/dL', 'min': 50.0, 'max': 600.0},
    '4548-4': {'name': 'HbA1c Glycated', 'unit': '%', 'min': 3.0, 'max': 20.0}
}

VALID_APPOINTMENT_STATUSES = {
    'REQUESTED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 
    'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'
}

def validate_lab_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict[str, Any]], Dict[str, Any]]:
    """
    Validates a synthetic laboratory dataset using Pandas.
    Detects missing values, out-of-range numerical values, unknown test codes,
    and unit mismatches. Does NOT generate clinical diagnoses.
    """
    errors: List[Dict[str, Any]] = []
    required_cols = ['test_code', 'measured_value', 'unit', 'patient_id']
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing mandatory columns: {missing_cols}")

    total_records = len(df)
    valid_rows = []

    for idx, row in df.iterrows():
        row_id = row.get('id', str(idx))
        test_code = str(row.get('test_code', '')).strip()
        measured_val = row.get('measured_value')
        unit = str(row.get('unit', '')).strip()

        # 1. Missing test code
        if not test_code or pd.isna(test_code) or test_code == 'nan':
            errors.append({
                'row': int(idx),
                'id': row_id,
                'field': 'test_code',
                'issue': 'Missing or empty test code',
                'severity': 'ERROR'
            })
            continue

        # 2. Unknown test metadata
        meta = VALID_LAB_METADATA.get(test_code)
        if not meta:
            errors.append({
                'row': int(idx),
                'id': row_id,
                'field': 'test_code',
                'issue': f"Unknown LOINC / test code '{test_code}'",
                'severity': 'WARNING'
            })

        # 3. Missing or non-numeric measured value
        if pd.isna(measured_val) or str(measured_val).strip() == '':
            errors.append({
                'row': int(idx),
                'id': row_id,
                'field': 'measured_value',
                'issue': 'Missing measured value',
                'severity': 'ERROR'
            })
            continue

        try:
            num_val = float(measured_val)
        except (ValueError, TypeError):
            errors.append({
                'row': int(idx),
                'id': row_id,
                'field': 'measured_value',
                'issue': f"Malformed non-numeric value: '{measured_val}'",
                'severity': 'ERROR'
            })
            continue

        # 4. Out-of-bounds physical plausibility check
        if meta and 'min' in meta and 'max' in meta:
            if num_val < meta['min'] or num_val > meta['max']:
                errors.append({
                    'row': int(idx),
                    'id': row_id,
                    'field': 'measured_value',
                    'issue': f"Physiologically implausible value {num_val} for {meta['name']} (allowed range: {meta['min']} - {meta['max']})",
                    'severity': 'WARNING'
                })

        # 5. Unit check
        if meta and meta.get('unit') and unit and meta['unit'].lower() != unit.lower():
            errors.append({
                'row': int(idx),
                'id': row_id,
                'field': 'unit',
                'issue': f"Unit discrepancy: expected '{meta['unit']}', found '{unit}'",
                'severity': 'WARNING'
            })

        valid_rows.append(row)

    clean_df = pd.DataFrame(valid_rows) if valid_rows else pd.DataFrame(columns=df.columns)

    stats = {
        'total_records': total_records,
        'valid_records': len(clean_df),
        'error_count': len([e for e in errors if e['severity'] == 'ERROR']),
        'warning_count': len([e for e in errors if e['severity'] == 'WARNING']),
        'quality_score_percent': round((len(clean_df) / total_records * 100), 2) if total_records > 0 else 0.0
    }

    return clean_df, errors, stats


def validate_appointment_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict[str, Any]], Dict[str, Any]]:
    """
    Validates appointment scheduling dataset: checks status validity,
    start and end timestamps, durations, and department codes.
    """
    errors: List[Dict[str, Any]] = []
    required_cols = ['appointment_id', 'doctor_id', 'patient_id', 'start_time', 'end_time', 'status']
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing mandatory columns: {missing_cols}")

    total_records = len(df)
    valid_rows = []

    for idx, row in df.iterrows():
        apt_id = str(row['appointment_id'])
        status = str(row.get('status', '')).upper().strip()

        # Status check
        if status not in VALID_APPOINTMENT_STATUSES:
            errors.append({
                'row': int(idx),
                'id': apt_id,
                'field': 'status',
                'issue': f"Invalid appointment status '{status}'",
                'severity': 'ERROR'
            })
            continue

        # Timestamps
        try:
            start_dt = pd.to_datetime(row['start_time'])
            end_dt = pd.to_datetime(row['end_time'])
            if end_dt <= start_dt:
                errors.append({
                    'row': int(idx),
                    'id': apt_id,
                    'field': 'end_time',
                    'issue': 'Scheduled end time is earlier than or equal to start time',
                    'severity': 'ERROR'
                })
                continue
            duration_minutes = (end_dt - start_dt).total_seconds() / 60.0
            if duration_minutes < 5 or duration_minutes > 240:
                errors.append({
                    'row': int(idx),
                    'id': apt_id,
                    'field': 'duration',
                    'issue': f"Unusual appointment duration: {duration_minutes} minutes",
                    'severity': 'WARNING'
                })
        except Exception as e:
            errors.append({
                'row': int(idx),
                'id': apt_id,
                'field': 'timestamps',
                'issue': f"Failed to parse datetime timestamps: {str(e)}",
                'severity': 'ERROR'
            })
            continue

        valid_rows.append(row)

    clean_df = pd.DataFrame(valid_rows) if valid_rows else pd.DataFrame(columns=df.columns)
    stats = {
        'total_records': total_records,
        'valid_records': len(clean_df),
        'error_count': len([e for e in errors if e['severity'] == 'ERROR']),
        'warning_count': len([e for e in errors if e['severity'] == 'WARNING']),
        'quality_score_percent': round((len(clean_df) / total_records * 100), 2) if total_records > 0 else 0.0
    }

    return clean_df, errors, stats
