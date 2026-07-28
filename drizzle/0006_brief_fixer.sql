ALTER TABLE "phcs" ADD COLUMN "termii_api_key" varchar(255);--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "sync_poll_interval" integer DEFAULT 30 NOT NULL;