CREATE TABLE "CareAssignment" (
  id text PRIMARY KEY, "patientId" text NOT NULL REFERENCES "PatientProfile"(id),
  "nurseUserId" text NOT NULL REFERENCES "User"(id), active boolean NOT NULL DEFAULT true,
  UNIQUE ("patientId", "nurseUserId")
);
ALTER TABLE "LabOrder" ADD COLUMN "assignedTechnicianUserId" text REFERENCES "User"(id);
CREATE INDEX lab_assignee_idx ON "LabOrder" ("assignedTechnicianUserId");
