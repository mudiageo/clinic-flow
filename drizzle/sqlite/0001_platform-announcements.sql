CREATE TABLE `announcement_receipts` (
	`announcement_id` text NOT NULL,
	`staff_id` text NOT NULL,
	`read_at` integer,
	`acknowledged_at` integer,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`announcement_id`, `staff_id`),
	FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `announcement_receipts_staff_idx` ON `announcement_receipts` (`staff_id`);--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`severity` text DEFAULT 'info' NOT NULL,
	`audience` text NOT NULL,
	`target_phc_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`requires_acknowledgement` integer DEFAULT false NOT NULL,
	`action_label` text,
	`action_url` text,
	`scheduled_for` integer,
	`published_at` integer,
	`expires_at` integer,
	`created_by_staff_id` text,
	`estimated_recipients` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`target_phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `announcements_status_idx` ON `announcements` (`status`,`scheduled_for`);--> statement-breakpoint
CREATE INDEX `announcements_audience_idx` ON `announcements` (`audience`,`target_phc_id`);--> statement-breakpoint
CREATE INDEX `announcements_created_at_idx` ON `announcements` (`created_at`);