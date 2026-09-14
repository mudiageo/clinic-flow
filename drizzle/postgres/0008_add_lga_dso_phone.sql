CREATE TYPE "public"."device_role" AS ENUM('kiosk', 'triage', 'doctor_tablet', 'pharmacy_terminal');--> statement-breakpoint
CREATE TYPE "public"."device_status" AS ENUM('pending', 'approved', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."pregnancy_status" AS ENUM('active', 'delivered', 'miscarriage', 'transferred');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phc_id" uuid NOT NULL,
	"staff_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"metadata" text,
	"ip" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phc_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"mac_address" varchar(50),
	"role" "device_role" DEFAULT 'kiosk' NOT NULL,
	"status" "device_status" DEFAULT 'pending' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pregnancy_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"phc_id" uuid NOT NULL,
	"lmp_date" timestamp,
	"edd_date" timestamp,
	"status" "pregnancy_status" DEFAULT 'active' NOT NULL,
	"gravida" integer,
	"parity" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_inbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phc_id" uuid,
	"patient_id" uuid,
	"from_phone" varchar(20) NOT NULL,
	"to_phone" varchar(20),
	"message" text NOT NULL,
	"provider_message_id" varchar(120),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uplink_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phc_id" uuid NOT NULL,
	"cloud_url" varchar(255) NOT NULL,
	"uplink_key" varchar(512) NOT NULL,
	"super_admin_email" varchar(255),
	"super_admin_password_hash" varchar(512),
	"last_sync_at" timestamp with time zone,
	"sync_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uplink_config_phc_id_unique" UNIQUE("phc_id")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "is_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "maternal_health_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "immunization_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "ai_voice_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "outbreak_detection_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "two_way_sms_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "referrals_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "family_health_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "real_time_notifications_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "nhis_tracking_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "ai_auto_triage_escalation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "lga_dso_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "queue_tickets" ADD COLUMN "ai_risk_score" integer;--> statement-breakpoint
ALTER TABLE "queue_tickets" ADD COLUMN "ai_risk_rationale" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "pin" varchar(255);--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pregnancy_records" ADD CONSTRAINT "pregnancy_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pregnancy_records" ADD CONSTRAINT "pregnancy_records_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_inbox" ADD CONSTRAINT "sms_inbox_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_inbox" ADD CONSTRAINT "sms_inbox_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uplink_config" ADD CONSTRAINT "uplink_config_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_phc_idx" ON "audit_log" USING btree ("phc_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pregnancy_patient_idx" ON "pregnancy_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "pregnancy_status_idx" ON "pregnancy_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sms_inbox_phc_idx" ON "sms_inbox" USING btree ("phc_id");--> statement-breakpoint
CREATE INDEX "sms_inbox_phone_idx" ON "sms_inbox" USING btree ("from_phone");