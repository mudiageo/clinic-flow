<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Checkbox } from '#lib/components/ui/checkbox/index.ts';
	import { inviteStaff } from '#lib/remote/admin.remote.ts';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Send } from '@lucide/svelte';

	let email = $state('');
	let role = $state<
		| 'receptionist'
		| 'nurse'
		| 'doctor'
		| 'pharmacy'
		| 'admin'
		| 'superadmin'
		| 'oic'
		| 'cho'
		| 'nurse_midwife'
		| 'chew'
		| 'jchew'
		| 'eho'
	>('nurse');
	let loading = $state(false);

	const availablePermissions = [
		{ id: 'manage:patients', label: 'Manage Patients' },
		{ id: 'manage:appointments', label: 'Manage Appointments' },
		{ id: 'manage:inventory', label: 'Manage Inventory' },
		{ id: 'manage:staff', label: 'Manage Staff' },
		{ id: 'manage:phc', label: 'Manage PHC Settings' },
		{ id: 'view:reports', label: 'View Reports' }
	];

	let selectedPermissions = $state<string[]>([]);

	function togglePermission(id: string, checked: boolean) {
		if (checked) {
			selectedPermissions = [...selectedPermissions, id];
		} else {
			selectedPermissions = selectedPermissions.filter((p) => p !== id);
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		try {
			const res = await inviteStaff({ email, role, permissions: selectedPermissions });
			if (res?.success) {
				toast.success('Invitation sent successfully');
				goto('/admin/staff');
			} else {
				toast.error('Failed to send invitation');
			}
		} catch (err) {
			toast.error('An error occurred');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Invite Staff — ClinicFlow</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<div class="flex items-center gap-3 pb-2 border-b border-border">
		<Button variant="ghost" size="icon" href="/admin/staff" class="rounded-lg">
			<ArrowLeft class="size-5" />
		</Button>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground">
				Staff Management
			</p>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Invite New Staff</h1>
		</div>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<form onsubmit={handleSubmit} class="p-5 sm:p-6 space-y-5">
			<div class="space-y-1.5">
				<Label for="email">Email Address</Label>
				<Input
					id="email"
					type="email"
					bind:value={email}
					placeholder="staff@clinic.com"
					class="h-11"
					required
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="role">Role</Label>
				<select
					id="role"
					bind:value={role}
					class="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="oic">OIC (Officer in Charge)</option>
					<option value="cho">Community Health Officer (CHO)</option>
					<option value="nurse_midwife">Nurse / Midwife</option>
					<option value="chew">CHEW (Extension Worker)</option>
					<option value="jchew">JCHEW (Junior Extension Worker)</option>
					<option value="eho">EHO (Environmental Health)</option>
					<option value="receptionist">Receptionist</option>
					<option value="pharmacy">Pharmacy Technician</option>
					<option value="doctor">Visiting Doctor</option>
					<option value="admin">System Admin</option>
				</select>
			</div>

			<div class="space-y-3 pt-2 border-t border-border">
				<Label>Additional Permissions</Label>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					{#each availablePermissions as perm}
						<label
							class="flex items-center space-x-2.5 p-2.5 rounded-lg border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
						>
							<Checkbox
								id={perm.id}
								checked={selectedPermissions.includes(perm.id)}
								onCheckedChange={(v) => togglePermission(perm.id, !!v)}
							/>
							<span class="text-sm font-medium">{perm.label}</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="pt-3 border-t border-border">
				<Button type="submit" disabled={loading} class="w-full min-h-11 font-semibold">
					{#if loading}
						Sending…
					{:else}
						<Send class="size-4 mr-2" />
						Send Invitation
					{/if}
				</Button>
			</div>
		</form>
	</section>
</div>
