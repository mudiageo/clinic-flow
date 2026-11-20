CREATE TABLE "immunization_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phc_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"appointment_id" uuid,
	"vaccine_name" varchar(120) NOT NULL,
	"dose_number" integer NOT NULL,
	"administered_at" timestamp with time zone NOT NULL,
	"batch_number" varchar(80),
	"expiry_date" timestamp,
	"route" varchar(40),
	"recorded_by_staff_id" uuid NOT NULL,
	"correction_of" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temperature_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phc_id" uuid NOT NULL,
	"fridge_label" varchar(80) NOT NULL,
	"temperature_celsius" real NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"recorded_by_staff_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pharmacy_inventory" ADD COLUMN "batch_number" varchar(80);--> statement-breakpoint
ALTER TABLE "pharmacy_inventory" ADD COLUMN "expiry_date" timestamp;--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "cold_chain_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "immunization_records" ADD CONSTRAINT "immunization_records_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunization_records" ADD CONSTRAINT "immunization_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunization_records" ADD CONSTRAINT "immunization_records_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunization_records" ADD CONSTRAINT "immunization_records_recorded_by_staff_id_staff_id_fk" FOREIGN KEY ("recorded_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_recorded_by_staff_id_staff_id_fk" FOREIGN KEY ("recorded_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "immunization_records_phc_idx" ON "immunization_records" USING btree ("phc_id");--> statement-breakpoint
CREATE INDEX "immunization_records_patient_idx" ON "immunization_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "immunization_records_administered_at_idx" ON "immunization_records" USING btree ("administered_at");--> statement-breakpoint
CREATE INDEX "temperature_logs_phc_idx" ON "temperature_logs" USING btree ("phc_id");--> statement-breakpoint
CREATE INDEX "temperature_logs_recorded_at_idx" ON "temperature_logs" USING btree ("recorded_at");