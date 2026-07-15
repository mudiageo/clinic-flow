export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
	receptionist: ['view:patient_records', 'manage:appointments'],
	nurse: [
		'view:patient_records',
		'create:encounter',
		'record:vitals',
		'view:appointments',
		'manage:appointments'
	],
	doctor: [
		'view:patient_records',
		'view:medical_records',
		'create:encounter',
		'record:vitals',
		'prescribe:medication',
		'request:lab',
		'view:appointments'
	],
	pharmacy: ['dispense:medication', 'manage:inventory'],
	admin: [
		'view:patient_records',
		'view:medical_records',
		'manage:inventory',
		'manage:staff',
		'manage:triage_rules',
		'view:reports',
		'manage:phc',
		'view:appointments',
		'manage:appointments'
	],
	superadmin: ['superadmin:all']
};

export function getRoleDefaults(role: string): string[] {
	if (role === 'superadmin') return ['superadmin:all'];
	return ROLE_DEFAULT_PERMISSIONS[role] || [];
}
