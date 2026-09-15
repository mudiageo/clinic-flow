// Permission Registry for ClinicFlow

export type PermissionKey =
	// Patient Management
	| 'manage:patients'
	| 'view:patients'
	| 'manage:families'
	
	// Queue & Triage
	| 'manage:queue'
	| 'manage:vitals'
	| 'view:queue:general'
	| 'view:queue:anc'
	| 'view:queue:epi'
	
	// Clinical
	| 'manage:consultations'
	| 'manage:prescriptions'
	| 'manage:labs'
	| 'view:labs'
	| 'manage:referrals'
	
	// Maternal & Reproductive Health
	| 'view:anc'
	| 'manage:anc'
	| 'view:maternity'
	| 'manage:maternity'
	| 'manage:immunization'
	
	// Pharmacy & Inventory
	| 'manage:inventory'
	| 'view:inventory'
	| 'manage:dispensing'
	| 'view:cold_chain'
	| 'manage:restock'
	| 'view:prescriptions'
	
	// Appointments & Reminders
	| 'manage:appointments'
	| 'view:appointments'
	| 'manage:reminders'
	
	// Field & Community Health
	| 'use:field_mode'
	| 'manage:outreach'
	
	// Reporting & Analytics
	| 'view:reports'
	| 'export:dhis2'
	| 'view:outbreaks'
	| 'view:idsr'
	| 'view:audit'
	
	// Administration
	| 'manage:staff'
	| 'manage:permissions'
	| 'manage:phc'
	| 'manage:devices'
	| 'manage:triage_rules'
	| 'manage:nhis'
	| 'view:sms_inbox'
	| 'view:sync_health';

export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, { label: string; description: string; category: string }> = {
	'manage:patients': { label: 'Manage Patients', description: 'Register, edit, view all patient records', category: 'Patient Management' },
	'view:patients': { label: 'View Patients', description: 'Read-only patient search & profiles', category: 'Patient Management' },
	'manage:families': { label: 'Manage Families', description: 'Register and edit household/family units', category: 'Patient Management' },
	
	'manage:queue': { label: 'Manage Queue', description: 'Add patients to queue, call next, mark done', category: 'Queue & Triage' },
	'manage:vitals': { label: 'Manage Vitals', description: 'Record vitals & apply triage flags', category: 'Queue & Triage' },
	'view:queue:general': { label: 'View General Queue', description: 'View General Outpatient queue tab', category: 'Queue & Triage' },
	'view:queue:anc': { label: 'View ANC Queue', description: 'View ANC queue tab', category: 'Queue & Triage' },
	'view:queue:epi': { label: 'View EPI Queue', description: 'View EPI/Immunization queue tab', category: 'Queue & Triage' },
	
	'manage:consultations': { label: 'Manage Consultations', description: 'Conduct doctor consultations, write SOAP notes', category: 'Clinical' },
	'manage:prescriptions': { label: 'Manage Prescriptions', description: 'Prescribe medications', category: 'Clinical' },
	'manage:labs': { label: 'Manage Labs', description: 'Request and review lab tests', category: 'Clinical' },
	'view:labs': { label: 'View Labs', description: 'View lab request status (read-only)', category: 'Clinical' },
	'manage:referrals': { label: 'Manage Referrals', description: 'Issue patient referral letters', category: 'Clinical' },
	
	'view:anc': { label: 'View ANC', description: 'Access ANC workflow views', category: 'Maternal & Reproductive Health' },
	'manage:anc': { label: 'Manage ANC', description: 'Run ANC consultations, update pregnancy records', category: 'Maternal & Reproductive Health' },
	'view:maternity': { label: 'View Maternity Ward', description: 'View Maternity Ward Board', category: 'Maternal & Reproductive Health' },
	'manage:maternity': { label: 'Manage Maternity', description: 'Manage labour & delivery (Partograph, etc.)', category: 'Maternal & Reproductive Health' },
	'manage:immunization': { label: 'Manage Immunizations', description: 'Administer EPI immunizations', category: 'Maternal & Reproductive Health' },
	
	'manage:inventory': { label: 'Manage Inventory', description: 'Add, edit, delete inventory items', category: 'Pharmacy & Inventory' },
	'view:inventory': { label: 'View Inventory', description: 'View drug stock levels', category: 'Pharmacy & Inventory' },
	'manage:dispensing': { label: 'Manage Dispensing', description: 'Dispense medications to patients', category: 'Pharmacy & Inventory' },
	'view:cold_chain': { label: 'View Cold Chain', description: 'View cold chain vaccine tracker', category: 'Pharmacy & Inventory' },
	'manage:restock': { label: 'Manage Restock', description: 'Raise restock requests', category: 'Pharmacy & Inventory' },
	'view:prescriptions': { label: 'View Prescriptions', description: 'View prescription records', category: 'Pharmacy & Inventory' },
	
	'manage:appointments': { label: 'Manage Appointments', description: 'Book, edit, cancel appointments', category: 'Appointments & Reminders' },
	'view:appointments': { label: 'View Appointments', description: 'View appointment calendar', category: 'Appointments & Reminders' },
	'manage:reminders': { label: 'Manage Reminders', description: 'Set and manage SMS reminders', category: 'Appointments & Reminders' },
	
	'use:field_mode': { label: 'Use Field Mode', description: 'Access CHEW Field Outreach Mode (offline-first)', category: 'Field & Community Health' },
	'manage:outreach': { label: 'Manage Outreach', description: 'Log household visits and community outreach data', category: 'Field & Community Health' },
	
	'view:reports': { label: 'View Reports', description: 'View clinic HMIS analytics & charts', category: 'Reporting & Analytics' },
	'export:dhis2': { label: 'Export DHIS2', description: 'Export data in DHIS2/HMIS format to LGA', category: 'Reporting & Analytics' },
	'view:outbreaks': { label: 'View Outbreaks', description: 'View Outbreak Radar dashboard', category: 'Reporting & Analytics' },
	'view:idsr': { label: 'View IDSR', description: 'View/Generate IDSR weekly reports', category: 'Reporting & Analytics' },
	'view:audit': { label: 'View Audit Log', description: 'View system audit log', category: 'Reporting & Analytics' },
	
	'manage:staff': { label: 'Manage Staff', description: 'Invite, activate/deactivate staff', category: 'Administration' },
	'manage:permissions': { label: 'Manage Permissions', description: 'Grant/revoke permissions for staff', category: 'Administration' },
	'manage:phc': { label: 'Manage PHC', description: 'Edit PHC name, LGA, feature flags', category: 'Administration' },
	'manage:devices': { label: 'Manage Devices', description: 'Register and approve clinic devices', category: 'Administration' },
	'manage:triage_rules': { label: 'Manage Triage Rules', description: 'Edit AI triage thresholds', category: 'Administration' },
	'manage:nhis': { label: 'Manage NHIS', description: 'Manage NHIS claims & billing', category: 'Administration' },
	'view:sms_inbox': { label: 'View SMS Inbox', description: 'View two-way SMS inbox', category: 'Administration' },
	'view:sync_health': { label: 'View Sync Health', description: 'View server sync health & status', category: 'Administration' }
};
