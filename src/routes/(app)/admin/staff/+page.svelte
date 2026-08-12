<script lang="ts">
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Switch } from '$lib/components/ui/switch';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog';
	import { updateStaffStatus } from '$lib/remote/admin.remote';
	import { setStaffPin } from '$lib/remote/staff.remote';
	import { toast } from 'svelte-sonner';
	import { UserCog, Plus, ShieldCheck, KeyRound, Loader2 } from '@lucide/svelte';

	let { data } = $props<{ data: { staffList: any[] } }>();

	let pinDialogOpen = $state(false);
	let selectedStaffId = $state<string | null>(null);
	let pinInput = $state('');
	let isSettingPin = $state(false);

	async function toggleStatus(staffId: string, currentStatus: boolean) {
		const result = await updateStaffStatus({ staffId, active: !currentStatus });
		if (result?.success) {
			toast.success('Staff status updated successfully');
			const staff = data.staffList.find((s: any) => s.id === staffId);
			if (staff) staff.active = !currentStatus;
		} else {
			toast.error('Failed to update status');
		}
	}

	function openPinDialog(staffId: string) {
		selectedStaffId = staffId;
		pinInput = '';
		pinDialogOpen = true;
	}

	// savePin and revokePin are now handled by enhance forms in the markup
	

</script>

<svelte:head>
	<title>Staff Management — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<UserCog class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Staff Management</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Manage PHC staff accounts and permissions
				</p>
			</div>
		</div>
		<Button href="/admin/staff/invite" class="bg-primary text-primary-foreground">
			<Plus class="size-4 mr-2" />
			Invite Staff
		</Button>
	</div>

	<Card class="overflow-hidden card-hover">
		<CardHeader class="border-b border-border bg-muted/20 px-6 py-4">
			<CardTitle class="text-base font-semibold">Active Staff Members</CardTitle>
		</CardHeader>
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead class="font-semibold px-6">Name</TableHead>
					<TableHead class="font-semibold px-6">Role</TableHead>
					<TableHead class="font-semibold px-6">Joined</TableHead>
					<TableHead class="font-semibold px-6 text-center">Status</TableHead>
					<TableHead class="font-semibold px-6 text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if data.staffList.length === 0}
					<TableRow>
						<TableCell colspan={5} class="text-center py-16 text-muted-foreground">
							No staff members found.
						</TableCell>
					</TableRow>
				{:else}
					{#each data.staffList as staff (staff.id)}
						<TableRow class="hover:bg-muted/40 transition-colors">
							<TableCell class="font-semibold px-6">
								{staff.fullName}
								{#if staff.authUserId.startsWith('pending-')}
									<span class="ml-2 text-xs text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full">Invited</span>
								{/if}
							</TableCell>
							<TableCell class="px-6">
								<Badge variant="outline" class="capitalize">{staff.role}</Badge>
							</TableCell>
							<TableCell class="text-muted-foreground text-sm px-6">
								{new Date(staff.createdAt).toLocaleDateString()}
							</TableCell>
							<TableCell class="text-center px-6">
								<Switch
									checked={staff.active}
									onCheckedChange={() => toggleStatus(staff.id, staff.active)}
								/>
							</TableCell>
							<TableCell class="text-right px-6 flex justify-end gap-2">
								<Button variant="outline" size="sm" onclick={() => openPinDialog(staff.id)}>
									<KeyRound class="size-4 mr-2" />
									Set PIN
								</Button>
								{const revokePin = setStaffPin.for(staff.id)}
								<form {...revokePin.enhance(async (form) => {
									try {
										if (await form.submit()) {
											if (revokePin.result?.success) toast.success('PIN revoked successfully');
										}
									} catch (error) {
										toast.error('Error revoking PIN');
									}
								})}>
									<input {...revokePin.fields.staffId.as('hidden', staff.id)} />
									<input {...revokePin.fields.pin.as('hidden', '0000')} />
									<Button type="submit" variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10">
										Revoke PIN
									</Button>
								</form>
								<Button variant="ghost" size="sm" href={`/admin/staff/${staff.id}`}>
									View Profile
								</Button>
							</TableCell>
						</TableRow>
					{/each}
				{/if}
			</TableBody>
		</Table>
	</Card>
</div>

<Dialog.Root bind:open={pinDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Set Staff PIN</Dialog.Title>
			<Dialog.Description>
				Enter a 4-digit PIN for this staff member. They can use this to quickly log in on shared devices.
			</Dialog.Description>
		</Dialog.Header>
		<form
			{...setStaffPin.enhance(async (form) => {
				if (!selectedStaffId) return;
				if (!/^\d{4}$/.test(pinInput)) {
					toast.error('PIN must be exactly 4 digits');
					return;
				}
				isSettingPin = true;
				try {
					if (await form.submit()) {
						if (setStaffPin.result?.success) {
							toast.success('PIN set successfully');
							pinDialogOpen = false;
						} else {
							toast.error('Failed to set PIN');
						}
					}
				} catch (error) {
					toast.error('Error setting PIN');
				} finally {
					isSettingPin = false;
				}
			})}
		>
			<input {...setStaffPin.fields.staffId.as('hidden', selectedStaffId ?? '')} />
			<div class="flex flex-col items-center justify-center space-y-6 py-6">
				<Input 
					{...setStaffPin.fields.pin.as('password')}
					inputmode="numeric" 
					maxlength={4}
					bind:value={pinInput} 
					class="text-center text-4xl tracking-[1em] h-20 w-64 font-mono font-bold"
					placeholder="••••"
				/>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => pinDialogOpen = false}>Cancel</Button>
				<Button type="submit" disabled={isSettingPin || pinInput.length !== 4}>
					{#if isSettingPin}
						<Loader2 class="size-4 mr-2 animate-spin" /> Saving...
					{:else}
						Save PIN
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
