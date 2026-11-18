ALTER TABLE `phcs` ADD `sync_version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE `__new_sync_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`device_id` text NOT NULL,
	`operation_id` text NOT NULL,
	`version` integer NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`operation` text NOT NULL,
	`payload` text NOT NULL,
	`client_updated_at` integer NOT NULL,
	`server_received_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `__new_sync_operations` (
	`id`,
	`phc_id`,
	`device_id`,
	`operation_id`,
	`version`,
	`entity_type`,
	`entity_id`,
	`operation`,
	`payload`,
	`client_updated_at`,
	`server_received_at`
)
SELECT
	`id`,
	`phc_id`,
	`device_id`,
	'legacy:' || `id`,
	ROW_NUMBER() OVER (PARTITION BY `phc_id` ORDER BY `server_received_at`, `id`),
	`entity_type`,
	`entity_id`,
	`operation`,
	`payload`,
	`client_updated_at`,
	`server_received_at`
FROM `sync_operations`;--> statement-breakpoint
DROP TABLE `sync_operations`;--> statement-breakpoint
ALTER TABLE `__new_sync_operations` RENAME TO `sync_operations`;--> statement-breakpoint
UPDATE `phcs`
SET `sync_version` = COALESCE((
	SELECT MAX(operation.`version`)
	FROM `sync_operations` AS operation
	WHERE operation.`phc_id` = `phcs`.`id`
), 0);--> statement-breakpoint
CREATE UNIQUE INDEX `sync_ops_operation_id_idx` ON `sync_operations` (`operation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sync_ops_phc_version_idx` ON `sync_operations` (`phc_id`,`version`);--> statement-breakpoint
CREATE INDEX `sync_ops_entity_idx` ON `sync_operations` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `sync_ops_cursor_idx` ON `sync_operations` (`phc_id`,`version`);
