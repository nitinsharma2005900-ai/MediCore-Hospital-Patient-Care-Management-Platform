from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from routers.analytics import authorized_snapshot
from typing import Dict, Any, List
import pandas as pd
import io
import json
from processing.validator import validate_lab_dataset, validate_appointment_dataset
from processing.benchmark import run_performance_benchmark

router = APIRouter(prefix="/processing", tags=["Clinical Dataset Processing"], dependencies=[Depends(authorized_snapshot)])

@router.post("/validate-lab-dataset")
async def validate_lab_csv(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Validates uploaded synthetic laboratory CSV dataset.
    Checks LOINC test codes, physical range boundaries, missing fields, and metadata validity.
    """
    if not file.filename or not file.filename.endswith(('.csv', '.json')):
        raise HTTPException(status_code=400, detail="Only CSV and JSON datasets are accepted.")

    contents = await file.read(2 * 1024 * 1024 + 1)
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(413, "Dataset exceeds 2 MiB")
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            data = json.loads(contents.decode('utf-8'))
            df = pd.DataFrame(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Malformed dataset")

    try:
        clean_df, errors, stats = validate_lab_dataset(df)
    except ValueError:
        raise HTTPException(400, "Required dataset columns are missing")

    return {
        "status": "success",
        "filename": file.filename,
        "validation_statistics": stats,
        "errors": errors[:50], # Return first 50 error details
        "sample_valid_records": clean_df.head(5).to_dict(orient='records')
    }

@router.post("/run-benchmark")
async def execute_benchmark(records: int = Query(5000, ge=1, le=50000)) -> Dict[str, Any]:
    """
    Runs an on-demand performance and correctness benchmark across thousands of records.
    Returns throughput, latency in milliseconds, and quality score.
    """
    if records > 50000:
        raise HTTPException(status_code=400, detail="Maximum benchmark limit is 50,000 records.")
    result = run_performance_benchmark(records)
    return result
