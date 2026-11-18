CREATE TYPE "public"."outreach_activity_type" AS ENUM('household_visit', 'health_talk', 'immunization', 'bednet_distribution', 'screening', 'other');--> statement-breakpoint
CREATE TABLE "outreach_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phc_id" uuid NOT NULL,
	"recorded_by_staff_id" uuid NOT NULL,
	"activity_type" "outreach_activity_type" NOT NULL,
	"community" varchar(160) NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"households_visited" integer DEFAULT 0 NOT NULL,
	"people_reached" integer DEFAULT 0 NOT NULL,
	"immunizations_given" integer DEFAULT 0 NOT NULL,
	"bednets_distributed" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "outreach_records" ADD CONSTRAINT "outreach_records_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_records" ADD CONSTRAINT "outreach_records_recorded_by_staff_id_staff_id_fk" FOREIGN KEY ("recorded_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outreach_records_phc_occurred_idx" ON "outreach_records" USING btree ("phc_id","occurred_at");--> statement-breakpoint
CREATE INDEX "outreach_records_recorded_by_idx" ON "outreach_records" USING btree ("recorded_by_staff_id");