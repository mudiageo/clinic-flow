import type { PermissionKey } from './permissions';

export interface DashboardModule {
	id: string;
	label: string;
	iconName: string; // Using string to dynamically lookup Lucide icons
	href: string;
	permission: PermissionKey;
	category: string;
}

export const DASHBOARD_MODULES: DashboardModule[] = [
	// Patient Care
	{ id: 'register-patient', label: 'Register Patient', iconName: 'UserPlus', href: '/nurse/register', permission: 'manage:patients', category: 'Patient Care' },
	{ id: 'search-patient', label: 'Search Patients', iconName: 'Search', href: '/nurse/search', permission: 'view:patients', category: 'Patient Care' },
	{ id: 'patient-records', label: 'Patient Records', iconName: 'FolderOpen', href: '/doctor/patients', permission: 'view:patients', category: 'Patient Care' },
	{ id: 'family-health', label: 'Family Health', iconName: 'Home', href: '/families', permission: 'manage:families', category: 'Patient Care' },

	// Queue & Triage
	{ id: 'triage-board', label: 'Triage Board', iconName: 'ClipboardList', href: '/nurse?tab=general', permission: 'view:queue:general', category: 'Queue & Triage' },
	{ id: 'anc-queue', label: 'ANC Queue', iconName: 'Baby', href: '/nurse?tab=anc', permission: 'view:queue:anc', category: 'Queue & Triage' },
	{ id: 'epi-queue', label: 'Immunization Queue', iconName: 'Syringe', href: '/nurse?tab=epi', permission: 'view:queue:epi', category: 'Queue & Triage' },
	{ id: 'vitals-station', label: 'Vitals & Triage', iconName: 'Activity', href: '/nurse/vitals', permission: 'manage:vitals', category: 'Queue & Triage' },

	// Clinical
	{ id: 'doctor-queue', label: "Doctor's Queue", iconName: 'Stethoscope', href: '/doctor', permission: 'manage:consultations', category: 'Clinical' },
	{ id: 'lab-requests', label: 'Lab Requests', iconName: 'FlaskConical', href: '/doctor/lab', permission: 'manage:labs', category: 'Clinical' },
	{ id: 'view-labs', label: 'Lab Results', iconName: 'Microscope', href: '/doctor/lab', permission: 'view:labs', category: 'Clinical' },

	// Maternal Health
	{ id: 'anc-clinics', label: 'ANC Clinics', iconName: 'HeartHandshake', href: '/maternity/anc', permission: 'view:anc', category: 'Maternal Health' },
	{ id: 'maternity-ward', label: 'Maternity Ward', iconName: 'Heart', href: '/maternity', permission: 'view:maternity', category: 'Maternal Health' },
	{ id: 'partograph', label: 'Partograph (Labour)', iconName: 'Waves', href: '/maternity/partograph', permission: 'manage:maternity', category: 'Maternal Health' },
	{ id: 'immunization', label: 'EPI Immunization', iconName: 'Syringe', href: '/immunization', permission: 'manage:immunization', category: 'Maternal Health' },

	// Pharmacy
	{ id: 'dispense', label: 'Dispense Meds', iconName: 'Pill', href: '/pharmacy/dispense', permission: 'manage:dispensing', category: 'Pharmacy' },
	{ id: 'inventory', label: 'Drug Inventory', iconName: 'Package', href: '/pharmacy', permission: 'view:inventory', category: 'Pharmacy' },
	{ id: 'cold-chain', label: 'Cold Chain', iconName: 'Thermometer', href: '/pharmacy/cold-chain', permission: 'view:cold_chain', category: 'Pharmacy' },
	{ id: 'restock', label: 'Restock Requests', iconName: 'PackagePlus', href: '/pharmacy/restock', permission: 'manage:restock', category: 'Pharmacy' },

	// Appointments
	{ id: 'appointments', label: 'Appointments', iconName: 'CalendarDays', href: '/admin/appointments', permission: 'view:appointments', category: 'Appointments' },
	{ id: 'reminders', label: 'SMS Reminders', iconName: 'Bell', href: '/nurse/reminders', permission: 'manage:reminders', category: 'Appointments' },

	// Field & Community
	{ id: 'field-mode', label: 'Field Outreach Mode', iconName: 'MapPin', href: '/field', permission: 'use:field_mode', category: 'Field & Community' },
	{ id: 'outreach-log', label: 'Outreach Log', iconName: 'Users', href: '/field/outreach', permission: 'manage:outreach', category: 'Field & Community' },

	// Analytics & Reporting
	{ id: 'reports', label: 'HMIS Analytics', iconName: 'BarChart3', href: '/admin/reports', permission: 'view:reports', category: 'Analytics & Reporting' },
	{ id: 'dhis2-export', label: 'Export to DHIS2', iconName: 'Download', href: '/admin/reports?export=dhis2', permission: 'export:dhis2', category: 'Analytics & Reporting' },
	{ id: 'outbreak-radar', label: 'Outbreak Radar', iconName: 'Radar', href: '/admin/outbreak-radar', permission: 'view:outbreaks', category: 'Analytics & Reporting' },
	{ id: 'idsr-report', label: 'IDSR Weekly Report', iconName: 'FileText', href: '/admin/outbreak-radar?tab=idsr', permission: 'view:idsr', category: 'Analytics & Reporting' },

	// Administration
	{ id: 'staff-management', label: 'Staff Management', iconName: 'Users', href: '/admin/staff', permission: 'manage:staff', category: 'Administration' },
	{ id: 'permission-editor', label: 'Permission Editor', iconName: 'ShieldCheck', href: '/admin/permissions', permission: 'manage:permissions', category: 'Administration' },
	{ id: 'phc-settings', label: 'PHC Settings', iconName: 'Settings', href: '/admin/settings', permission: 'manage:phc', category: 'Administration' },
	{ id: 'device-management', label: 'Device Management', iconName: 'Monitor', href: '/admin/devices', permission: 'manage:devices', category: 'Administration' },
	{ id: 'triage-rules', label: 'Triage Rules', iconName: 'Sliders', href: '/admin/triage', permission: 'manage:triage_rules', category: 'Administration' },
	{ id: 'nhis-claims', label: 'NHIS Claims', iconName: 'CreditCard', href: '/admin/nhis-claims', permission: 'manage:nhis', category: 'Administration' },
	{ id: 'sms-inbox', label: 'SMS Inbox', iconName: 'MessageSquare', href: '/admin/sms-inbox', permission: 'view:sms_inbox', category: 'Administration' },
	{ id: 'sync-health', label: 'Server Sync', iconName: 'Wifi', href: '/admin/sync-health', permission: 'view:sync_health', category: 'Administration' },
	{ id: 'audit-log', label: 'Audit Log', iconName: 'FileSearch', href: '/admin/audit', permission: 'view:audit', category: 'Administration' }
];
