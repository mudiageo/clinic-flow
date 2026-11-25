<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import { updateStaffStatus } from '#lib/remote/admin.remote.ts';
	import { setStaffPin } from '#lib/remote/staff.remote.ts';
	import { toast } from 'svelte-sonner';
	import { Plus, KeyRound, Loader2 } from '@lucide/svelte';

	type StaffMember = {
		id: string;
		fullName: string;
		role: string;
		active: boolean;
		authUserId: string;
		createdAt: string | number | Date;
	};

	let { data } = $props<{ data: { staffList: StaffMember[] } }>();

	let pinDialogOpen = $state(false);
	let selectedStaffId = $state<string | null>(null);
	let pinInput = $state('');
	let isSettingPin = $state(false);

	async function toggleStatus(staffId: string, currentStatus: boolean) {
		const result = await updateStaffStatus({ staffId, active: !currentStatus });
		if (result?.success) {
			toast.success('Staff status updated successfully');
			const staff = data.staffList.find((s: StaffMember) => s.id === staffId);
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
</script>

<svelte:head>
	<title>Staff Management — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<div
		class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Administration
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Staff Management</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Manage PHC staff accounts, PINs, and access status
			</p>
		</div>
		<Button href="/admin/staff/invite" class="min-h-11 px-5 font-semibold w-full md:w-auto">
			<Plus class="size-4 mr-2" />
			Invite Staff
		</Button>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center justify-between">
			<h2 class="text-base font-semibold">Active Staff Members</h2>
			<span class="text-xs font-mono tabular-nums text-muted-foreground">
				{data.staffList.length} total
			</span>
		</div>
		<Table>
			<TableHeader class="bg-muted/40">
				<TableRow class="hover:bg-transparent">
					<TableHead class="font-mono text-xs uppercase tracking-wider px-5">Name</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider px-5">Role</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider px-5">Joined</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider px-5 text-center"
						>Status</TableHead
					>
					<TableHead class="font-mono text-xs uppercase tracking-wider px-5 text-right"
						>Actions</TableHead
					>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if data.staffList.length === 0}
					<TableRow>
						<TableCell colspan={5} class="text-center py-14 text-muted-foreground">
							No staff members found.
						</TableCell>
					</TableRow>
				{:else}
					{#each data.staffList as staff, idx (staff.id)}
						<TableRow class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}>
							<TableCell class="font-semibold px-5">
								{staff.fullName}
								{#if staff.authUserId.startsWith('pending-')}
									<span
										class="ml-2 text-xs text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full"
									>
										Invited
									</span>
								{/if}
							</TableCell>
							<TableCell class="px-5">
								<Badge variant="outline" class="capitalize font-mono text-xs">{staff.role}</Badge>
							</TableCell>
							<TableCell class="text-muted-foreground font-mono text-xs px-5">
								{new Date(staff.createdAt).toLocaleDateString()}
							</TableCell>
							<TableCell class="text-center px-5">
								<Switch
									checked={staff.active}
									onCheckedChange={() => toggleStatus(staff.id, staff.active)}
								/>
							</TableCell>
							<TableCell class="text-right px-5 flex justify-end gap-2">
								<Button variant="outline" size="sm" onclick={() => openPinDialog(staff.id)}>
									<KeyRound class="size-3.5 mr-1.5" />
									Set PIN
								</Button>
								{@const revokePin = setStaffPin.for(staff.id)}
								<form
									{...revokePin.enhance(async (form) => {
										try {
											if (await form.submit()) {
												if (revokePin.result?.success) toast.success('PIN revoked successfully');
											}
										} catch (error) {
											toast.error('Error revoking PIN');
										}
									})}
								>
									<input {...revokePin.fields.staffId.as('hidden', staff.id)} />
									<input {...revokePin.fields.pin.as('hidden', '0000')} />
									<Button
										type="submit"
										variant="ghost"
										size="sm"
										class="text-destructive hover:text-destructive hover:bg-destructive/10"
									>
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
	</section>
</div>

<Dialog.Root bind:open={pinDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Set Staff PIN</Dialog.Title>
			<Dialog.Description>
				Enter a 4-digit PIN for this staff member. They can use this to quickly log in on shared
				devices.
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
				<Button type="button" variant="outline" onclick={() => (pinDialogOpen = false)}>
					Cancel
				</Button>
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
