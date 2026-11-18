PRAGMA defer_foreign_keys = ON;--> statement-breakpoint
CREATE TABLE `__new_families` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`household_name` text,
	`community` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `__new_families` (`id`, `phc_id`, `household_name`, `community`, `created_at`)
SELECT
	family.`id`,
	COALESCE(
		(
			SELECT patient.`phc_id`
			FROM `patients` AS patient
			WHERE patient.`family_id` = family.`id`
			LIMIT 1
		),
		(
			SELECT sync_entry.`phc_id`
			FROM `sync_operations` AS sync_entry
			WHERE sync_entry.`entity_type` = 'families' AND sync_entry.`entity_id` = family.`id`
			ORDER BY sync_entry.`server_received_at` DESC
			LIMIT 1
		)
	),
	family.`household_name`,
	family.`community`,
	family.`created_at`
FROM `families` AS family;--> statement-breakpoint
DROP TABLE `families`;--> statement-breakpoint
ALTER TABLE `__new_families` RENAME TO `families`;--> statement-breakpoint
CREATE INDEX `families_phc_idx` ON `families` (`phc_id`);
