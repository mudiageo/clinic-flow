CREATE TABLE "anc_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"pregnancy_record_id" uuid NOT NULL,
	"phc_id" uuid NOT NULL,
	"visit_number" integer,
	"visit_date" timestamp with time zone NOT NULL,
	"systolic_bp" integer,
	"diastolic_bp" integer,
	"weight_kg" real,
	"fetal_heart_rate_bpm" integer,
	"fundal_height_cm" real,
	"notes" text,
	"recorded_by_staff_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anc_visits" ADD CONSTRAINT "anc_visits_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anc_visits" ADD CONSTRAINT "anc_visits_pregnancy_record_id_pregnancy_records_id_fk" FOREIGN KEY ("pregnancy_record_id") REFERENCES "public"."pregnancy_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anc_visits" ADD CONSTRAINT "anc_visits_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anc_visits" ADD CONSTRAINT "anc_visits_recorded_by_staff_id_staff_id_fk" FOREIGN KEY ("recorded_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anc_visits_patient_idx" ON "anc_visits" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "anc_visits_pregnancy_idx" ON "anc_visits" USING btree ("pregnancy_record_id");--> statement-breakpoint
CREATE INDEX "anc_visits_phc_idx" ON "anc_visits" USING btree ("phc_id");--> statement-breakpoint
CREATE INDEX "anc_visits_visit_date_idx" ON "anc_visits" USING btree ("visit_date");