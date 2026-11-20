CREATE TABLE `dhis2_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`data_set_uid` text DEFAULT 'CLINIC_FLOW_DATASET_UID' NOT NULL,
	`org_unit_uid` text DEFAULT 'CLINIC_FLOW_LOCAL_PHC_UID' NOT NULL,
	`total_patients_uid` text DEFAULT 'TOTAL_PATIENTS_UID' NOT NULL,
	`total_encounters_uid` text DEFAULT 'TOTAL_ENCOUNTERS_UID' NOT NULL,
	`patients_male_uid` text DEFAULT 'PATIENTS_MALE_UID' NOT NULL,
	`patients_female_uid` text DEFAULT 'PATIENTS_FEMALE_UID' NOT NULL,
	`triage_red_uid` text DEFAULT 'TRIAGE_RED_UID' NOT NULL,
	`triage_amber_uid` text DEFAULT 'TRIAGE_AMBER_UID' NOT NULL,
	`triage_green_uid` text DEFAULT 'TRIAGE_GREEN_UID' NOT NULL,
	`updated_by_staff_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dhis2_configs_phc_idx` ON `dhis2_configs` (`phc_id`);--> statement-breakpoint
CREATE TABLE `nhis_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`encounter_id` text,
	`patient_id` text,
	`created_by_staff_id` text,
	`claim_reference` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`provider_mode` text DEFAULT 'console' NOT NULL,
	`provider_reference` text,
	`enrollee_number` text,
	`authorization_code` text,
	`claim_data` text NOT NULL,
	`note` text,
	`submitted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `nhis_claims_phc_idx` ON `nhis_claims` (`phc_id`);--> statement-breakpoint
CREATE INDEX `nhis_claims_status_idx` ON `nhis_claims` (`status`);--> statement-breakpoint
CREATE INDEX `nhis_claims_encounter_idx` ON `nhis_claims` (`encounter_id`);--> statement-breakpoint
ALTER TABLE `phcs` ADD `active` integer DEFAULT true NOT NULL;