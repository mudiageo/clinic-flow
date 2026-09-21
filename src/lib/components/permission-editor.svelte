<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { grantPermission, revokePermission } from '$lib/remote/permissions.remote';
	
	let pending = $state<Record<string, boolean>>({});

	let {
		staffId,
		role,
		roleDefaults = [],
		activePermissions = $bindable([]),
		auditLog = $bindable([])
	}: {
		staffId: string;
		role: string;
		roleDefaults: string[];
		activePermissions: any[];
		auditLog: any[];
	} = $props();

	const ALL_PERMISSIONS = [
		{
			key: 'view:patient_records',
			label: 'View Patient Records',
			desc: 'Read patient demographics'
		},
		{
			key: 'view:medical_records',
			label: 'View Medical Records',
			desc: 'Read doctor notes & diagnoses'
		},
		{ key: 'create:encounter', label: 'Create Encounter', desc: 'Open a new encounter' },
		{ key: 'record:vitals', label: 'Record Vitals', desc: 'Record vitals & triage' },
		{ key: 'prescribe:medication', label: 'Prescribe Medication', desc: 'Create prescriptions' },
		{ key: 'dispense:medication', label: 'Dispense Medication', desc: 'Dispense prescriptions' },
		{ key: 'manage:inventory', label: 'Manage Inventory', desc: 'Edit pharmacy stock' },
		{ key: 'manage:staff', label: 'Manage Staff', desc: 'Invite/deactivate staff' },
		{ key: 'manage:triage_rules', label: 'Manage Triage Rules', desc: 'Edit triage thresholds' },
		{ key: 'view:reports', label: 'View Reports', desc: 'Access analytics' },
		{ key: 'request:lab', label: 'Request Lab', desc: 'Create lab requests' },
		{ key: 'manage:phc', label: 'Manage PHC', desc: 'Edit PHC profile & settings' },
		{ key: 'view:appointments', label: 'View Appointments', desc: 'View appointment calendar' },
		{ key: 'manage:appointments', label: 'Manage Appointments', desc: 'Create/edit appointments' }
	];

	async function handleToggle(permission: string, currentActive: boolean) {
		const action = currentActive ? revokePermission : grantPermission;
		pending[permission] = true;
		
		const previousPermissions = activePermissions;
		const previousAuditLog = auditLog;
		
		// 1. Optimistic UI Update: Permissions Array
		activePermissions = [
			...activePermissions.filter(p => p.permission !== permission),
			{
				id: `optimistic-${Date.now()}`,
				permission,
				revoked: currentActive,
				expiresAt: null
			}
		];
		
		// 2. Optimistic UI Update: Audit Log
		auditLog = [
			{
				permission,
				revoked: currentActive,
				grantedAt: new Date().toISOString(),
				grantedByStaff: { fullName: 'You (Pending Sync)' }
			},
			...auditLog
		];

		try {
			const res = await action({ staffId, permission });
			if (!res || !res.success) {
				activePermissions = previousPermissions;
				auditLog = previousAuditLog;
				toast.error('Failed to update permission');
			} else {
				toast.success(`Permission ${currentActive ? 'revoked' : 'granted'}`);
				// Optionally, we could silently fetch the true audit log here to get the real DB IDs
				// but the optimistic one perfectly satisfies the user's immediate visual feedback
			}
		} catch (e: any) {
			activePermissions = previousPermissions;
			auditLog = previousAuditLog;
			toast.error(e.message || 'Failed to update permission');
		} finally {
			pending[permission] = false;
		}
	}

	function getStatus(permKey: string) {
		const isDefault = roleDefaults.includes(permKey);
		const manualGrant = activePermissions.find((p) => p.permission === permKey);

		if (manualGrant) {
			if (manualGrant.revoked) return { active: false, label: 'Revoked', type: 'manual' };
			if (manualGrant.expiresAt && new Date(manualGrant.expiresAt) < new Date()) {
				return { active: isDefault, label: isDefault ? 'Inherited' : 'Expired', type: 'expired' };
			}
			return { active: true, label: 'Manually Granted', type: 'manual' };
		}

		return { active: isDefault, label: isDefault ? 'Inherited' : 'No Access', type: 'default' };
	}
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Permissions & Access</h3>
		<p class="text-sm text-muted-foreground">
			Manage granular permissions for this staff member. Toggling a permission will instantly save
			it.
		</p>
	</div>

	<div class="divide-y rounded-md border">
		{#each ALL_PERMISSIONS as perm (perm.key)}
			{@const status = getStatus(perm.key)}
			<div class="flex items-center justify-between p-4">
				<div class="flex flex-col gap-1">
					<Label class="text-base font-semibold">{perm.label}</Label>
					<span class="text-sm text-muted-foreground">{perm.desc}</span>
					<div class="mt-1 flex items-center gap-2">
						{#if status.type === 'default' && status.active}
							<Badge variant="secondary">Inherited via {role}</Badge>
						{:else if status.type === 'manual' && status.active}
							<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600"
								>Manually Granted</Badge
							>
						{:else if status.type === 'manual' && !status.active}
							<Badge variant="destructive">Explicitly Revoked</Badge>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-3">
					{#if pending[perm.key]}
						<span class="text-xs text-muted-foreground animate-pulse">Saving...</span>
					{/if}
					<Switch 
						checked={status.active} 
						disabled={pending[perm.key]}
						onCheckedChange={() => handleToggle(perm.key, status.active)} 
					/>
				</div>
			</div>
		{/each}
	</div>
</div>
