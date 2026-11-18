DROP INDEX "sync_ops_cursor_idx";--> statement-breakpoint
ALTER TABLE "phcs" ADD COLUMN "sync_version" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_operations" ADD COLUMN "operation_id" varchar(160);--> statement-breakpoint
ALTER TABLE "sync_operations" ADD COLUMN "version" bigint;--> statement-breakpoint
WITH ranked AS (
	SELECT
		"id",
		ROW_NUMBER() OVER (
			PARTITION BY "phc_id"
			ORDER BY "server_received_at", "id"
		) AS "version"
	FROM "sync_operations"
)
UPDATE "sync_operations" AS operation
SET
	"operation_id" = 'legacy:' || operation."id"::text,
	"version" = ranked."version"
FROM ranked
WHERE ranked."id" = operation."id";--> statement-breakpoint
UPDATE "phcs" AS phc
SET "sync_version" = COALESCE((
	SELECT MAX(operation."version")
	FROM "sync_operations" AS operation
	WHERE operation."phc_id" = phc."id"
), 0);--> statement-breakpoint
ALTER TABLE "sync_operations" ALTER COLUMN "operation_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_operations" ALTER COLUMN "version" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "sync_ops_operation_id_idx" ON "sync_operations" USING btree ("operation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_ops_phc_version_idx" ON "sync_operations" USING btree ("phc_id","version");--> statement-breakpoint
CREATE INDEX "sync_ops_cursor_idx" ON "sync_operations" USING btree ("phc_id","version");
