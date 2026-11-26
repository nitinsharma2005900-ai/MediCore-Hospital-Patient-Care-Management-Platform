CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_positive_duration CHECK ("scheduledEndTime" > "scheduledStartTime");
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_no_overlap EXCLUDE USING gist
  ("doctorId" WITH =, tsrange("scheduledStartTime", "scheduledEndTime", '[)') WITH &&)
  WHERE (status NOT IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED'));
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_association UNIQUE (id, "patientId", "doctorId");
ALTER TABLE "Encounter" ADD CONSTRAINT encounter_appointment_association FOREIGN KEY ("appointmentId", "patientId", "doctorId")
  REFERENCES "Appointment"(id, "patientId", "doctorId");
ALTER TABLE "Encounter" ADD CONSTRAINT encounter_patient UNIQUE (id, "patientId");
ALTER TABLE "LabOrder" ADD CONSTRAINT lab_encounter_patient FOREIGN KEY ("encounterId", "patientId") REFERENCES "Encounter"(id, "patientId");
ALTER TABLE "LabOrder" ADD CONSTRAINT lab_order_patient UNIQUE (id, "patientId");
ALTER TABLE "LabResult" ADD CONSTRAINT lab_result_patient FOREIGN KEY ("labOrderId", "patientId") REFERENCES "LabOrder"(id, "patientId");
ALTER TABLE "Prescription" ADD CONSTRAINT prescription_encounter_patient FOREIGN KEY ("encounterId", "patientId") REFERENCES "Encounter"(id, "patientId");
ALTER TABLE "VitalSigns" ADD CONSTRAINT vital_encounter_patient FOREIGN KEY ("encounterId", "patientId") REFERENCES "Encounter"(id, "patientId");
ALTER TABLE "Diagnosis" ADD CONSTRAINT diagnosis_encounter_patient FOREIGN KEY ("encounterId", "patientId") REFERENCES "Encounter"(id, "patientId");
ALTER TABLE "Invoice" ADD CONSTRAINT invoice_encounter_patient FOREIGN KEY ("encounterId", "patientId") REFERENCES "Encounter"(id, "patientId");
ALTER TABLE "Invoice" ADD CONSTRAINT invoice_patient UNIQUE (id, "patientId");
ALTER TABLE "Payment" ADD CONSTRAINT payment_invoice_patient FOREIGN KEY ("invoiceId", "patientId") REFERENCES "Invoice"(id, "patientId");
ALTER TABLE "Payment" ADD CONSTRAINT payment_positive CHECK (amount > 0);
ALTER TABLE "InvoiceItem" ADD CONSTRAINT invoice_item_positive CHECK (quantity > 0 AND "unitPrice" >= 0);
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT prescription_quantity_positive CHECK (quantity > 0 AND "durationDays" > 0 AND "refillsAllowed" >= 0);
ALTER TABLE "WaitingList" ADD FOREIGN KEY ("patientId") REFERENCES "PatientProfile"(id);
ALTER TABLE "WaitingList" ADD FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"(id);
ALTER TABLE "WaitingList" ADD FOREIGN KEY ("departmentId") REFERENCES "Department"(id);
ALTER TABLE "RefreshToken" ADD COLUMN "accessTokenId" text UNIQUE;
ALTER TABLE "AuditLog" ALTER COLUMN "performedByUserId" DROP NOT NULL;
CREATE UNIQUE INDEX user_email_case_insensitive ON "User" (lower(email));
CREATE UNIQUE INDEX payment_reference_unique ON "Payment" ("transactionReference") WHERE "transactionReference" IS NOT NULL;
CREATE INDEX refresh_active_idx ON "RefreshToken" ("userId", revoked, "expiresAt");
CREATE TABLE "NotificationDelivery" (
  id text PRIMARY KEY, "notificationId" text NOT NULL UNIQUE REFERENCES "Notification"(id),
  attempts integer NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'PENDING',
  "lastError" text, "deliveredAt" timestamptz, "updatedAt" timestamptz NOT NULL DEFAULT now()
);
