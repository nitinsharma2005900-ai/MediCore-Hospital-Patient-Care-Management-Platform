# Incident Simulation 05: Incorrect Laboratory Result Association & Patient Mismatch Safeguard
**Assessment 15: Healthcare Incident Simulation**

## 1. Incident Description
A busy laboratory technician mistakenly entered a serum creatinine result intended for Patient A (`pat-001`) into a requisition order belonging to Patient B (`pat-002`). In a clinical environment, misassociating diagnostic lab results can result in catastrophic clinical errors, improper drug dosing, or incorrect surgical interventions.

## 2. Reproduction Steps
1. Create a Lab Order for Patient A (`pat-001`).
2. Obtain the Lab Order ID (`lab-order-001`).
3. Attempt to submit a lab result payload to `/api/v1/lab/results` containing `labOrderId: lab-order-001`, but passing `patientId: pat-002`.

## 3. Relevant Log Evidence
```text
[2026-11-24T18:10:04.912Z] ERROR [req-id: req-lab-4401]: Patient mismatch validation triggered!
Requisition Order: lab-order-001 (Owner Patient: pat-001)
Submitted Result Patient: pat-002
Technician User ID: usr-labtech-001
Action: REJECTED (HTTP 400 Bad Request - PATIENT_MISMATCH)
[2026-11-24T18:10:04.919Z] INFO: Incident flagged in AuditLog table (Audit ID: aud-lab-1029).
```

## 4. Root Cause Analysis (RCA)
Allowing the client to specify both `labOrderId` and `patientId` without enforcing a strict relational equality check against the authoritative database record allowed accidental human entry errors to attach critical results to the wrong medical record.

## 5. Implemented Fix
Added a mandatory database cross-check in `enterLabResult` controller:
```typescript
const order = store.labOrders.find(o => o.id === validated.labOrderId);
if (!order) {
  throw new AppError('Associated Lab order not found', 404, 'NOT_FOUND');
}

// Strict patient association verification
if (order.patientId !== validated.patientId) {
  throw new AppError(
    'Patient mismatch: Lab result patient does not match order patient record.',
    400,
    'PATIENT_MISMATCH'
  );
}
```

## 6. Regression Test
Automated test case verifying that any payload where `order.patientId !== result.patientId` is rejected with `400 Bad Request (PATIENT_MISMATCH)`.

## 7. Prevention Strategy
- Two-stage verification: preliminary results require attending physician or senior pathologist validation to transition to `FINAL`.
- Barcode scanning / MRN validation on diagnostic specimens.
- Strict database foreign key validation.

## 8. Recovery Evidence
Test suite confirmed 100% rejection rate for mismatched patient IDs. Zero corrupt diagnostic entries recorded.
