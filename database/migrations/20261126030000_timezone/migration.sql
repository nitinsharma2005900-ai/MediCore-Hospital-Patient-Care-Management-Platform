-- Store instants with an explicit offset. Application/driver time zones cannot shift them.
ALTER TABLE "Appointment" DROP CONSTRAINT appointment_no_overlap;
ALTER TABLE "Appointment" DROP CONSTRAINT appointment_positive_duration;
DO $$ DECLARE item record;
BEGIN
  FOR item IN SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema='public' AND data_type='timestamp without time zone'
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE timestamptz USING %I AT TIME ZONE ''UTC''',
      item.table_name, item.column_name, item.column_name);
  END LOOP;
END $$;
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_positive_duration CHECK ("scheduledEndTime" > "scheduledStartTime");
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_no_overlap EXCLUDE USING gist
  ("doctorId" WITH =, tstzrange("scheduledStartTime", "scheduledEndTime", '[)') WITH &&)
  WHERE (status NOT IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED'));
