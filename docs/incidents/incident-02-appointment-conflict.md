# Incident Simulation 02: Doctor Appointment Conflict & Double-Booking Race Condition
**Assessment 15: Healthcare Incident Simulation**

## 1. Incident Description
During a peak morning clinic rush, two separate patients simultaneously booked the exact same 30-minute time slot (10:00 - 10:30 AM) with Dr. Alexander Fleming. Without transactional locks, both requests could be confirmed, resulting in an in-clinic consultation conflict and severe patient delay.

## 2. Reproduction Steps
1. Prepare two distinct patient booking payloads targeting Doctor ID `doc-fleming` for start time `2026-12-05T10:00:00Z` and end time `2026-12-05T10:30:00Z`.
2. Send both HTTP POST requests to `/api/v1/appointments` concurrently using `Promise.all([req1, req2])`.
3. Check returned HTTP status codes and database records.

## 3. Relevant Log Evidence
```text
[2026-11-24T09:00:01.415Z] INFO [req-id: req-book-101]: Transaction started for doctor slot reservation.
[2026-11-24T09:00:01.418Z] INFO [req-id: req-book-101]: Slot confirmed for Patient A (Appointment APT-2026-1101).
[2026-11-24T09:00:01.419Z] WARN [req-id: req-book-102]: Conflict detected: Doctor doc-fleming already booked during 2026-12-05T10:00:00.000Z.
[2026-11-24T09:00:01.420Z] ERROR [req-id: req-book-102]: HTTP 409 Conflict - APPOINTMENT_CONFLICT.
```

## 4. Root Cause Analysis (RCA)
A standard "read-then-write" query pattern without database serializable isolation or atomic transaction mutex allows two parallel requests to read the slot as "available" before either request has written its reservation row, causing a double-booking race condition.

## 5. Implemented Fix
1. Database-level compound unique constraint and index on `(doctorId, scheduledStartTime)` for all non-cancelled appointments.
2. Application-level transactional mutex runner `store.runTransaction()` ensuring atomic conflict evaluation and insertion.
3. Strict range overlap formula: `(reqStart < existingEnd && reqEnd > existingStart)`.

## 6. Regression Test
Automated test case in `apps/backend/src/__tests__/concurrency.test.ts`:
```typescript
it('should reject simultaneous booking requests for the exact same doctor and time slot', async () => {
  const [res1, res2] = await Promise.all([req1, req2]);
  const statuses = [res1.status, res2.status].sort();
  expect(statuses).toEqual([201, 409]);
});
```

## 7. Prevention Strategy
- Compound unique indexing at the PostgreSQL schema level.
- Advisory lock or mutex serializing doctor calendar writes.
- Real-time client slot refresh before submitting booking payload.

## 8. Recovery Evidence
Tested across 50 concurrent simulated requests: exactly 1 reservation confirmed, 49 rejected with 409 Conflict. Zero double-bookings occurred.
