CREATE TABLE `immunization_records` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`appointment_id` text,
	`vaccine_name` text NOT NULL,
	`dose_number` integer NOT NULL,
	`administered_at` integer NOT NULL,
	`batch_number` text,
	`expiry_date` integer,
	`route` text,
	`recorded_by_staff_id` text NOT NULL,
	`correction_of` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `immunization_records_phc_idx` ON `immunization_records` (`phc_id`);--> statement-breakpoint
CREATE INDEX `immunization_records_patient_idx` ON `immunization_records` (`patient_id`);--> statement-breakpoint
CREATE INDEX `immunization_records_administered_at_idx` ON `immunization_records` (`administered_at`);--> statement-breakpoint
CREATE TABLE `temperature_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`fridge_label` text NOT NULL,
	`temperature_celsius` real NOT NULL,
	`recorded_at` integer NOT NULL,
	`recorded_by_staff_id` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `temperature_logs_phc_idx` ON `temperature_logs` (`phc_id`);--> statement-breakpoint
CREATE INDEX `temperature_logs_recorded_at_idx` ON `temperature_logs` (`recorded_at`);--> statement-breakpoint
ALTER TABLE `pharmacy_inventory` ADD `batch_number` text;--> statement-breakpoint
ALTER TABLE `pharmacy_inventory` ADD `expiry_date` integer;--> statement-breakpoint
ALTER TABLE `phcs` ADD `cold_chain_enabled` integer DEFAULT true NOT NULL;