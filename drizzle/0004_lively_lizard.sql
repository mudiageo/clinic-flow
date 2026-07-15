CREATE TYPE "public"."lab_status" AS ENUM('pending', 'processing', 'completed');--> statement-breakpoint
CREATE TYPE "public"."lab_urgency" AS ENUM('routine', 'urgent', 'stat');--> statement-breakpoint
COMMIT;
-- ALTER TYPE "public"."triage_level" ADD VALUE 'unassigned' BEFORE 'green';--> statement-breakpoint
BEGIN;
CREATE TABLE "lab_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"phc_id" uuid NOT NULL,
	"requested_by_staff_id" uuid NOT NULL,
	"test_type" varchar(100) NOT NULL,
	"urgency" "lab_urgency" DEFAULT 'routine' NOT NULL,
	"notes" text,
	"status" "lab_status" DEFAULT 'pending' NOT NULL,
	"result" text,
	"result_entered_by_staff_id" uuid,
	"result_entered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lab_requests" ADD CONSTRAINT "lab_requests_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_requests" ADD CONSTRAINT "lab_requests_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_requests" ADD CONSTRAINT "lab_requests_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_requests" ADD CONSTRAINT "lab_requests_requested_by_staff_id_staff_id_fk" FOREIGN KEY ("requested_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_requests" ADD CONSTRAINT "lab_requests_result_entered_by_staff_id_staff_id_fk" FOREIGN KEY ("result_entered_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lab_requests_patient_idx" ON "lab_requests" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "lab_requests_encounter_idx" ON "lab_requests" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "lab_requests_status_idx" ON "lab_requests" USING btree ("status");