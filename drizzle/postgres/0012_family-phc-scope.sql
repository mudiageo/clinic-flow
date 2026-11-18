ALTER TABLE "families" ADD COLUMN "phc_id" uuid;--> statement-breakpoint
UPDATE "families" AS family
SET "phc_id" = scoped_patient."phc_id"
FROM (
	SELECT DISTINCT ON ("family_id") "family_id", "phc_id"
	FROM "patients"
	WHERE "family_id" IS NOT NULL
	ORDER BY "family_id", "created_at"
) AS scoped_patient
WHERE family."id" = scoped_patient."family_id";--> statement-breakpoint
UPDATE "families" AS family
SET "phc_id" = scoped_sync."phc_id"
FROM (
	SELECT DISTINCT ON ("entity_id") "entity_id", "phc_id"
	FROM "sync_operations"
	WHERE "entity_type" = 'families'
	ORDER BY "entity_id", "server_received_at" DESC
) AS scoped_sync
WHERE family."phc_id" IS NULL AND family."id" = scoped_sync."entity_id";--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "families" WHERE "phc_id" IS NULL) THEN
		RAISE EXCEPTION 'Cannot scope orphan family records to a PHC';
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "families" ALTER COLUMN "phc_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_phc_id_phcs_id_fk" FOREIGN KEY ("phc_id") REFERENCES "public"."phcs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "families_phc_idx" ON "families" USING btree ("phc_id");
