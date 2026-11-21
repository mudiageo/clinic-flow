CREATE TABLE `anc_visits` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`pregnancy_record_id` text NOT NULL,
	`phc_id` text NOT NULL,
	`visit_number` integer,
	`visit_date` integer NOT NULL,
	`systolic_bp` integer,
	`diastolic_bp` integer,
	`weight_kg` real,
	`fetal_heart_rate_bpm` integer,
	`fundal_height_cm` real,
	`notes` text,
	`recorded_by_staff_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pregnancy_record_id`) REFERENCES `pregnancy_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `anc_visits_patient_idx` ON `anc_visits` (`patient_id`);--> statement-breakpoint
CREATE INDEX `anc_visits_pregnancy_idx` ON `anc_visits` (`pregnancy_record_id`);--> statement-breakpoint
CREATE INDEX `anc_visits_phc_idx` ON `anc_visits` (`phc_id`);--> statement-breakpoint
CREATE INDEX `anc_visits_visit_date_idx` ON `anc_visits` (`visit_date`);