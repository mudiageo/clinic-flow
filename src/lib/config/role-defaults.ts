import type { PermissionKey } from './permissions';

// Role Default Permission Sets

export const ROLE_DEFAULTS: Record<string, PermissionKey[]> = {
	receptionist: [
		'view:patients',
		'manage:patients',
		'manage:queue',
		'manage:appointments',
		'view:appointments'
	],
	chew: [
		'view:patients',
		'manage:patients',
		'manage:queue',
		'manage:vitals',
		'view:queue:general',
		'view:queue:epi',
		'manage:immunization',
		'use:field_mode',
		'manage:outreach',
		'manage:reminders'
	],
	jchew: [
		'view:patients',
		'manage:queue',
		'manage:vitals',
		'view:queue:general',
		'use:field_mode'
	],
	nurse: [
		'view:patients',
		'manage:patients',
		'manage:queue',
		'manage:vitals',
		'view:queue:general',
		'view:queue:anc',
		'view:queue:epi',
		'view:anc',
		'manage:reminders',
		'view:appointments'
	],
	nurse_midwife: [
		'view:patients',
		'manage:patients',
		'manage:queue',
		'manage:vitals',
		'view:queue:general',
		'view:queue:anc',
		'view:queue:epi',
		'view:anc',
		'manage:reminders',
		'view:appointments',
		'manage:anc',
		'view:maternity',
		'manage:maternity',
		'manage:immunization'
	],
	eho: [
		'view:patients',
		'view:queue:general',
		'manage:outreach',
		'view:reports'
	],
	cho: [
		'view:patients',
		'manage:patients',
		'manage:queue',
		'manage:vitals',
		'view:queue:general',
		'view:queue:anc',
		'view:queue:epi',
		'view:anc',
		'manage:reminders',
		'view:appointments',
		'manage:consultations',
		'manage:prescriptions',
		'manage:labs',
		'manage:referrals',
		'manage:anc',
		'view:maternity',
		'manage:immunization',
		'view:reports'
	],
	doctor: [
		'view:patients',
		'view:queue:general',
		'manage:consultations',
		'manage:prescriptions',
		'manage:labs',
		'manage:referrals',
		'view:reports',
		'manage:nhis'
	],
	pharmacy: [
		'view:patients',
		'view:inventory',
		'manage:inventory',
		'manage:dispensing',
		'view:cold_chain',
		'manage:restock',
		'view:prescriptions'
	],
	oic: [
		// Everything up to OIC
		'view:patients', 'manage:patients', 'manage:families', 'manage:queue', 'manage:vitals', 
		'view:queue:general', 'view:queue:anc', 'view:queue:epi', 'manage:consultations', 
		'manage:prescriptions', 'manage:labs', 'view:labs', 'manage:referrals', 'view:anc', 
		'manage:anc', 'view:maternity', 'manage:maternity', 'manage:immunization', 
		'manage:inventory', 'view:inventory', 'manage:dispensing', 'view:cold_chain', 
		'manage:restock', 'view:prescriptions', 'manage:appointments', 'view:appointments', 
		'manage:reminders', 'use:field_mode', 'manage:outreach', 'view:reports', 
		'export:dhis2', 'view:outbreaks', 'view:idsr', 'view:audit', 
		'manage:staff', 'manage:permissions', 'manage:phc', 'manage:devices', 
		'manage:triage_rules', 'view:sms_inbox', 'view:sync_health'
	],
	admin: [
		// Everything OIC has + super admin capabilities
		'view:patients', 'manage:patients', 'manage:families', 'manage:queue', 'manage:vitals', 
		'view:queue:general', 'view:queue:anc', 'view:queue:epi', 'manage:consultations', 
		'manage:prescriptions', 'manage:labs', 'view:labs', 'manage:referrals', 'view:anc', 
		'manage:anc', 'view:maternity', 'manage:maternity', 'manage:immunization', 
		'manage:inventory', 'view:inventory', 'manage:dispensing', 'view:cold_chain', 
		'manage:restock', 'view:prescriptions', 'manage:appointments', 'view:appointments', 
		'manage:reminders', 'use:field_mode', 'manage:outreach', 'view:reports', 
		'export:dhis2', 'view:outbreaks', 'view:idsr', 'view:audit', 
		'manage:staff', 'manage:permissions', 'manage:phc', 'manage:devices', 
		'manage:triage_rules', 'manage:nhis', 'view:sms_inbox', 'view:sync_health'
	],
	superadmin: [
		// Everything
		'view:patients', 'manage:patients', 'manage:families', 'manage:queue', 'manage:vitals', 
		'view:queue:general', 'view:queue:anc', 'view:queue:epi', 'manage:consultations', 
		'manage:prescriptions', 'manage:labs', 'view:labs', 'manage:referrals', 'view:anc', 
		'manage:anc', 'view:maternity', 'manage:maternity', 'manage:immunization', 
		'manage:inventory', 'view:inventory', 'manage:dispensing', 'view:cold_chain', 
		'manage:restock', 'view:prescriptions', 'manage:appointments', 'view:appointments', 
		'manage:reminders', 'use:field_mode', 'manage:outreach', 'view:reports', 
		'export:dhis2', 'view:outbreaks', 'view:idsr', 'view:audit', 
		'manage:staff', 'manage:permissions', 'manage:phc', 'manage:devices', 
		'manage:triage_rules', 'manage:nhis', 'view:sms_inbox', 'view:sync_health'
	]
};
