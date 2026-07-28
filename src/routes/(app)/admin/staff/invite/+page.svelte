<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { inviteStaff } from '$lib/remote/admin.remote';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Send } from '@lucide/svelte';

	let email = $state('');
	let role = $state<'receptionist' | 'nurse' | 'doctor' | 'pharmacy' | 'admin' | 'superadmin'>('nurse');
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

<div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
	<Button variant="ghost" href="/admin/staff" class="pl-0 hover:bg-transparent">
		<ArrowLeft class="size-4 mr-2" />
		Back to Staff List
	</Button>

	<Card>
		<CardHeader>
			<CardTitle>Invite New Staff</CardTitle>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleSubmit} class="space-y-6">
				<div class="space-y-2">
					<Label for="email">Email Address</Label>
					<Input
						id="email"
						type="email"
						bind:value={email}
						placeholder="staff@clinic.com"
						required
					/>
				</div>

				<div class="space-y-2">
					<Label for="role">Role</Label>
					<select
						id="role"
						bind:value={role}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="receptionist">Receptionist</option>
						<option value="nurse">Nurse</option>
						<option value="doctor">Doctor</option>
						<option value="pharmacy">Pharmacy</option>
						<option value="admin">Admin</option>
						<option value="superadmin">Superadmin</option>
					</select>
				</div>

				<div class="space-y-4">
					<Label>Additional Permissions</Label>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each availablePermissions as perm}
							<div class="flex items-center space-x-2">
								<Checkbox
									id={perm.id}
									checked={selectedPermissions.includes(perm.id)}
									onCheckedChange={(v) => togglePermission(perm.id, !!v)}
								/>
								<Label
									for={perm.id}
									class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									{perm.label}
								</Label>
							</div>
						{/each}
					</div>
				</div>

				<Button type="submit" disabled={loading} class="w-full">
					{#if loading}
						Sending...
					{:else}
						<Send class="size-4 mr-2" />
						Send Invitation
					{/if}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
