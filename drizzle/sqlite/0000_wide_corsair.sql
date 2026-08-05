CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`phc_id` text NOT NULL,
	`assigned_staff_id` text,
	`type` text NOT NULL,
	`scheduled_at` integer NOT NULL,
	`duration_minutes` integer DEFAULT 30 NOT NULL,
	`notes` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`sms_reminder_sent` integer DEFAULT false NOT NULL,
	`is_confirmed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`staff_id` text,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`metadata` text,
	`ip` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_log_phc_idx` ON `audit_log` (`phc_id`);--> statement-breakpoint
CREATE INDEX `audit_log_created_at_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`name` text NOT NULL,
	`mac_address` text,
	`role` text DEFAULT 'kiosk' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`last_sync_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `encounters` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`phc_id` text NOT NULL,
	`recorded_by_staff_id` text,
	`chief_complaint` text,
	`chief_complaint_raw` text,
	`chief_complaint_language` text,
	`doctor_notes` text,
	`visit_date` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `encounters_patient_idx` ON `encounters` (`patient_id`);--> statement-breakpoint
CREATE INDEX `encounters_visit_date_idx` ON `encounters` (`visit_date`);--> statement-breakpoint
CREATE TABLE `families` (
	`id` text PRIMARY KEY NOT NULL,
	`household_name` text,
	`community` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `family_relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`related_patient_id` text NOT NULL,
	`relationship` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`related_patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `family_rel_unique` ON `family_relationships` (`patient_id`,`related_patient_id`);--> statement-breakpoint
CREATE TABLE `lab_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`phc_id` text NOT NULL,
	`requested_by_staff_id` text NOT NULL,
	`test_type` text NOT NULL,
	`urgency` text DEFAULT 'routine' NOT NULL,
	`notes` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`result` text,
	`result_entered_by_staff_id` text,
	`result_entered_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`result_entered_by_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`phc_id` text NOT NULL,
	`family_id` text,
	`guardian_id` text,
	`full_name` text NOT NULL,
	`phone` text,
	`dob` integer,
	`estimated_age` integer,
	`sex` text NOT NULL,
	`address` text,
	`community` text,
	`next_of_kin_name` text,
	`next_of_kin_phone` text,
	`is_pregnant` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patients_clinic_id_idx` ON `patients` (`phc_id`,`clinic_id`);--> statement-breakpoint
CREATE INDEX `patients_name_idx` ON `patients` (`full_name`);--> statement-breakpoint
CREATE INDEX `patients_phone_idx` ON `patients` (`phone`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`staff_id` text NOT NULL,
	`phc_id` text NOT NULL,
	`permission` text NOT NULL,
	`granted_by` text,
	`granted_at` integer NOT NULL,
	`expires_at` integer,
	`revoked` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pharmacy_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`item_name` text NOT NULL,
	`category` text,
	`unit` text NOT NULL,
	`current_stock` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 10 NOT NULL,
	`is_critical` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `phcs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`lga` text NOT NULL,
	`state` text NOT NULL,
	`termii_api_key` text,
	`sync_poll_interval` integer DEFAULT 30 NOT NULL,
	`maternal_health_enabled` integer DEFAULT true NOT NULL,
	`immunization_enabled` integer DEFAULT true NOT NULL,
	`ai_voice_enabled` integer DEFAULT true NOT NULL,
	`outbreak_detection_enabled` integer DEFAULT true NOT NULL,
	`two_way_sms_enabled` integer DEFAULT true NOT NULL,
	`referrals_enabled` integer DEFAULT true NOT NULL,
	`family_health_enabled` integer DEFAULT true NOT NULL,
	`real_time_notifications_enabled` integer DEFAULT true NOT NULL,
	`nhis_tracking_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pregnancy_records` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`phc_id` text NOT NULL,
	`lmp_date` integer,
	`edd_date` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`gravida` integer,
	`parity` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`inventory_item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`dosage_instructions` text,
	`dispensed` integer DEFAULT false NOT NULL,
	`dispensed_at` integer,
	`dispensed_by_staff_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `pharmacy_inventory`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`dispensed_by_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `queue_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`phc_id` text NOT NULL,
	`encounter_id` text,
	`ticket_number` integer NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`triage_level` text DEFAULT 'green' NOT NULL,
	`triage_reason` text,
	`called_at` integer,
	`completed_at` integer,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `queue_status_idx` ON `queue_tickets` (`status`);--> statement-breakpoint
CREATE INDEX `queue_phc_date_idx` ON `queue_tickets` (`phc_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`phc_id` text NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`due_date` integer NOT NULL,
	`recipient_phone` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`sent_at` integer,
	`provider` text,
	`provider_message_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `restock_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`inventory_item_id` text NOT NULL,
	`phc_id` text NOT NULL,
	`requested_by_staff_id` text,
	`quantity_requested` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `pharmacy_inventory`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sms_inbox` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text,
	`patient_id` text,
	`from_phone` text NOT NULL,
	`to_phone` text,
	`message` text NOT NULL,
	`provider_message_id` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_user_id` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text NOT NULL,
	`phc_id` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`preferences` text,
	`pin` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_auth_user_id_unique` ON `staff` (`auth_user_id`);--> statement-breakpoint
CREATE TABLE `sync_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`device_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`operation` text NOT NULL,
	`payload` text NOT NULL,
	`client_updated_at` integer NOT NULL,
	`server_received_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `triage_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`field` text NOT NULL,
	`operator` text NOT NULL,
	`threshold` real NOT NULL,
	`resulting_level` text NOT NULL,
	`reason_template` text NOT NULL,
	`requires_pregnant` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `uplink_config` (
	`id` text PRIMARY KEY NOT NULL,
	`phc_id` text NOT NULL,
	`cloud_url` text NOT NULL,
	`uplink_key` text NOT NULL,
	`super_admin_email` text,
	`super_admin_password_hash` text,
	`last_sync_at` integer,
	`sync_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`phc_id`) REFERENCES `phcs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uplink_config_phc_id_unique` ON `uplink_config` (`phc_id`);--> statement-breakpoint
CREATE TABLE `vitals_records` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`temperature_celsius` real,
	`systolic_bp` integer,
	`diastolic_bp` integer,
	`pulse_bpm` integer,
	`weight_kg` real,
	`spo2_percent` integer,
	`triage_level` text DEFAULT 'green' NOT NULL,
	`triage_reason` text,
	`recorded_at` integer NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vitals_patient_idx` ON `vitals_records` (`patient_id`);--> statement-breakpoint
CREATE INDEX `vitals_encounter_idx` ON `vitals_records` (`encounter_id`);