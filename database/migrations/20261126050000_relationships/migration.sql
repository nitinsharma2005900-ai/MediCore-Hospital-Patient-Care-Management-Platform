ALTER TABLE "DoctorProfile" ADD CONSTRAINT doctor_department UNIQUE (id,"departmentId");
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_provider_department FOREIGN KEY ("doctorId","departmentId") REFERENCES "DoctorProfile"(id,"departmentId");
ALTER TABLE "Diagnosis" ADD CONSTRAINT diagnosis_doctor FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"(id);
ALTER TABLE "VitalSigns" ADD CONSTRAINT vital_recorder FOREIGN KEY ("recordedByUserId") REFERENCES "User"(id);
ALTER TABLE "LabResult" ADD CONSTRAINT result_technician FOREIGN KEY ("technicianUserId") REFERENCES "User"(id);
ALTER TABLE "LabResult" ADD CONSTRAINT result_validator FOREIGN KEY ("validatedByUserId") REFERENCES "User"(id);
