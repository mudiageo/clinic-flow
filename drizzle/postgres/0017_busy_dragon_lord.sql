CREATE TABLE "dhis2_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phc_id" uuid NOT NULL,
	"data_set_uid" varchar(64) DEFAULT 'CLINIC_FLOW_DATASET_UID' NOT NULL,
	"org_unit_uid" varchar(64) DEFAULT 'CLINIC_FLOW_LOCAL_PHC_UID' NOT NULL,
	"total_patients_uid" varchar(64) DEFAULT 'TOTAL_PATIENTS_UID' NOT NULL,
	"total_encounters_uid" varchar(64) DEFAULT 'TOTAL_ENCOUNTERS_UID' NOT NULL,
	"patients_male_uid" varchar(64) DEFAULT 'PATIENTS_MALE_UID' NOT NULL,
	"patients_female_uid" varchar(64) DEFAULT 'PATIENTS_FEMALE_UID' NOT NULL,
	"triage_red_uid" varchar(64) DEFAULT 'TRIAGE_RED_UID' NOT NULL,
	"triage_amber_uid" varchar(64) DEFAULT 'TRIAGE_AMBER_UID' NOT NULL,
	"triage_green_uid" varchar(64) DEFAULT 'TRIAGE_GREEN_UID' NOT NULL,
	"updated_by_staff_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhis_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phc_id" uuid NOT NULL,
	"encounter_id" uuid,
	"patient_id" uuid,
	"created_by_staff_id" uuid,
	"claim_reference" varchar(120) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"provider_mode" varchar(10) DEFAULT 'console' NOT NULL,
	"provider_reference" varchar(160),
	"enrollee_number" varchar(80),
	"authorization_code" varchar(80),
	"claim_data" text NOT NULL,
	"note" text,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "dhis2_configs" ADD CONSTRAINT "dhis2_configs_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dhis2_configs" ADD CONSTRAINT "dhis2_configs_updated_by_staff_id_staff_id_fk" FOREIGN KEY ("updated_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhis_claims" ADD CONSTRAINT "nhis_claims_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhis_claims" ADD CONSTRAINT "nhis_claims_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhis_claims" ADD CONSTRAINT "nhis_claims_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhis_claims" ADD CONSTRAINT "nhis_claims_created_by_staff_id_staff_id_fk" FOREIGN KEY ("created_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dhis2_configs_phc_idx" ON "dhis2_configs" USING btree ("phc_id");--> statement-breakpoint
CREATE INDEX "nhis_claims_phc_idx" ON "nhis_claims" USING btree ("phc_id");--> statement-breakpoint
CREATE INDEX "nhis_claims_status_idx" ON "nhis_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nhis_claims_encounter_idx" ON "nhis_claims" USING btree ("encounter_id");