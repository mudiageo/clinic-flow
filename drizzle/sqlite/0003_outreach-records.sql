CREATE TABLE `outreach_records` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`recorded_by_staff_id` text NOT NULL,
	`activity_type` text NOT NULL,
	`community` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`households_visited` integer DEFAULT 0 NOT NULL,
	`people_reached` integer DEFAULT 0 NOT NULL,
	`immunizations_given` integer DEFAULT 0 NOT NULL,
	`bednets_distributed` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `outreach_records_phc_occurred_idx` ON `outreach_records` (`phc_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `outreach_records_recorded_by_idx` ON `outreach_records` (`recorded_by_staff_id`);