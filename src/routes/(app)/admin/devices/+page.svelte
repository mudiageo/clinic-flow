<script lang="ts">
	import { getDevices, registerDevice } from '#lib/remote/devices.remote.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '#lib/components/ui/select/index.ts';
	import {
		TabletSmartphone,
		ShieldCheck,
		AlertTriangle,
		MoreVertical,
		CheckCircle2,
		XCircle,
		Trash2,
		RefreshCw,
		Plus
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.ts';

	type Device = {
		id: string;
		name: string;
		macAddress: string | null;
		role: 'kiosk' | 'triage' | 'doctor_tablet' | 'pharmacy_terminal';
		status: 'pending' | 'approved' | 'revoked';
		lastSyncAt: Date | string | null;
	};

	type DeviceRole = 'kiosk' | 'triage' | 'doctor_tablet' | 'pharmacy_terminal';

	const deviceRoles: { value: DeviceRole; label: string }[] = [
		{ value: 'kiosk', label: 'Kiosk' },
		{ value: 'triage', label: 'Triage' },
		{ value: 'doctor_tablet', label: 'Doctor tablet' },
		{ value: 'pharmacy_terminal', label: 'Pharmacy terminal' }
	];

	let devices: Device[] = $state([]);
	let isLoading = $state(true);
	let registerDialogOpen = $state(false);
	let registering = $state(false);
	let newDeviceRole = $state<DeviceRole>('kiosk');

	async function loadDevices() {
		isLoading = true;
		try {
			const res = await getDevices();
			if (res) devices = res as Device[];
		} catch (e) {
			toast.error('Failed to load devices');
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadDevices();
	});

	async function handleApprove(id: string) {
		toast.loading('Approving device...', { id: 'approve' });
		const formData = new FormData();
		formData.append('deviceId', id);
		formData.append('status', 'approved');

		try {
			const res = await fetch('?/_remote/updateDevice', {
				method: 'POST',
				body: formData
			});
			if (res.ok) {
				toast.success('Device approved successfully', { id: 'approve' });
				loadDevices();
			} else {
				throw new Error();
			}
		} catch (e) {
			toast.error('Failed to approve device', { id: 'approve' });
		}
	}

	async function handleRevoke(id: string) {
		const formData = new FormData();
		formData.append('deviceId', id);
		formData.append('status', 'revoked');

		try {
			const res = await fetch('?/_remote/updateDevice', { method: 'POST', body: formData });
			if (res.ok) {
				toast.success('Device revoked');
				loadDevices();
			}
		} catch (e) {
			toast.error('Failed to revoke device');
		}
	}

	async function handleDelete(id: string) {
		const formData = new FormData();
		formData.append('deviceId', id);
		try {
			const res = await fetch('?/_remote/removeDevice', { method: 'POST', body: formData });
			if (res.ok) {
				toast.success('Device permanently removed');
				loadDevices();
			}
		} catch (e) {
			toast.error('Failed to delete device');
		}
	}

	function getRoleColor(role: string) {
		switch (role) {
			case 'triage':
				return 'bg-triage-amber/15 text-foreground border-triage-amber/40';
			case 'doctor_tablet':
				return 'bg-primary/10 text-primary border-primary/30';
			case 'pharmacy_terminal':
				return 'bg-secondary text-secondary-foreground border-border';
			default:
				return 'bg-muted text-muted-foreground border-border';
		}
	}

	async function handleRegister(form: {
		submit: () => Promise<boolean>;
		element: HTMLFormElement;
	}): Promise<void> {
		registering = true;
		try {
			if (await form.submit()) {
				if (registerDevice.result?.success) {
					toast.success('Device registered and awaiting approval.');
					registerDialogOpen = false;
					form.element.reset();
					registerDevice.fields.set({ name: '', role: 'kiosk' });
					newDeviceRole = 'kiosk';
					await loadDevices();
				} else {
					toast.error('The device could not be registered.');
				}
			} else {
				toast.error('Enter a device name and select a role.');
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to register device.');
		} finally {
			registering = false;
		}
	}
</script>

<svelte:head>
	<title>Device Management — Admin | ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<!-- Header -->
	<div
		class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Hardware &amp; LAN
			</p>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Devices &amp; Kiosks</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Manage linked hardware and approve new tablets on your network
			</p>
		</div>
		<div class="flex items-center gap-2.5 w-full sm:w-auto">
			<Button variant="outline" class="flex-1 sm:flex-initial min-h-10" onclick={loadDevices}>
				<RefreshCw class="size-4 mr-2 {isLoading ? 'animate-spin' : ''}" /> Refresh
			</Button>
			<Button
				class="flex-1 sm:flex-initial min-h-10 font-semibold"
				onclick={() => (registerDialogOpen = true)}
			>
				<Plus class="size-4 mr-2" /> Add Manually
			</Button>
		</div>
	</div>

	{#if devices.some((d) => d.status === 'pending')}
		<div
			class="bg-triage-amber/12 border border-triage-amber/40 border-l-4 border-l-triage-amber p-4 rounded-xl flex items-start gap-3"
		>
			<AlertTriangle class="size-5 text-amber-700 dark:text-triage-amber shrink-0 mt-0.5" />
			<div>
				<h2 class="font-semibold text-sm text-foreground">New Devices Pending Approval</h2>
				<p class="text-xs text-muted-foreground mt-0.5">
					There are devices trying to connect to this PHC network. Review and assign them a role.
				</p>
			</div>
		</div>
	{/if}

	<!-- Devices List -->
	<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
		{#if isLoading && devices.length === 0}
			{#each [1, 2, 3] as i (i)}
				<div class="rounded-xl border border-border bg-card p-5 space-y-3 opacity-60">
					<div class="h-5 w-1/2 bg-muted rounded animate-pulse"></div>
					<div class="h-16 bg-muted rounded animate-pulse"></div>
				</div>
			{/each}
		{:else if devices.length === 0}
			<div
				class="col-span-full py-16 text-center border border-dashed border-border rounded-xl bg-card/50"
			>
				<TabletSmartphone class="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
				<h2 class="text-base font-semibold">No Devices Found</h2>
				<p class="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
					You haven't linked any tablets or kiosks to this local server yet.
				</p>
			</div>
		{:else}
			{#each devices as device (device.id)}
				<article
					class="rounded-xl border border-border border-l-4 bg-card overflow-hidden flex flex-col {device.status ===
					'approved'
						? 'border-l-triage-green'
						: device.status === 'pending'
							? 'border-l-triage-amber'
							: 'border-l-destructive'}"
				>
					<div
						class="p-4 border-b border-dashed border-border flex items-start justify-between gap-2 bg-muted/15"
					>
						<div class="min-w-0">
							<h2 class="text-base font-bold text-foreground truncate">{device.name}</h2>
							<p class="mt-0.5 font-mono text-xs text-muted-foreground">
								{device.id.split('-')[0]}...{device.id.split('-')[4]}
							</p>
						</div>

						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								<Button variant="ghost" size="icon" class="size-8 text-muted-foreground">
									<MoreVertical class="size-4" />
								</Button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="w-48">
								{#if device.status !== 'approved'}
									<DropdownMenu.Item
										onclick={() => handleApprove(device.id)}
										class="text-triage-green cursor-pointer"
									>
										<CheckCircle2 class="size-4 mr-2" /> Approve Access
									</DropdownMenu.Item>
								{/if}
								{#if device.status !== 'revoked'}
									<DropdownMenu.Item
										onclick={() => handleRevoke(device.id)}
										class="text-amber-700 dark:text-triage-amber cursor-pointer"
									>
										<XCircle class="size-4 mr-2" /> Revoke Access
									</DropdownMenu.Item>
								{/if}
								<DropdownMenu.Separator />
								<DropdownMenu.Item
									onclick={() => handleDelete(device.id)}
									class="text-destructive cursor-pointer"
								>
									<Trash2 class="size-4 mr-2" /> Delete Permanently
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>

					<div class="p-4 space-y-3 text-sm flex-1 flex flex-col justify-between">
						<div class="space-y-2.5">
							<div class="flex items-center justify-between">
								<span class="text-xs text-muted-foreground">Status</span>
								{#if device.status === 'approved'}
									<Badge class="bg-triage-green/15 text-triage-green border-triage-green/30">
										Active / Approved
									</Badge>
								{:else if device.status === 'pending'}
									<Badge class="bg-triage-amber/15 text-foreground border-triage-amber/40">
										Pending Approval
									</Badge>
								{:else}
									<Badge variant="destructive">Revoked</Badge>
								{/if}
							</div>

							<div class="flex items-center justify-between">
								<span class="text-xs text-muted-foreground">Assigned Role</span>
								<Badge variant="outline" class="font-mono text-[11px] {getRoleColor(device.role)}">
									{device.role.replace('_', ' ').toUpperCase()}
								</Badge>
							</div>
						</div>

						{#if device.status === 'pending'}
							<div class="pt-3 border-t border-border flex gap-2">
								<Button
									class="flex-1 min-h-10 font-semibold"
									onclick={() => handleApprove(device.id)}
								>
									Approve
								</Button>
								<Button
									variant="outline"
									class="flex-1 min-h-10 border-destructive/30 text-destructive hover:bg-destructive/10"
									onclick={() => handleRevoke(device.id)}
								>
									Deny
								</Button>
							</div>
						{:else}
							<div class="pt-3 border-t border-border">
								<p class="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
									<ShieldCheck class="size-3.5 shrink-0" />
									Last Sync: {device.lastSyncAt
										? new Date(device.lastSyncAt).toLocaleString()
										: 'Never'}
								</p>
							</div>
						{/if}
					</div>
				</article>
			{/each}
		{/if}
	</div>
</div>

<Dialog.Root bind:open={registerDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add device manually</Dialog.Title>
			<Dialog.Description>
				Register a device without a pairing token. It will remain pending until you approve it.
			</Dialog.Description>
		</Dialog.Header>

		<form class="space-y-4" {...registerDevice.enhance(handleRegister)}>
			<div class="space-y-2">
				<Label for="device-name">Device name</Label>
				<Input
					{...registerDevice.fields.name.as('text')}
					id="device-name"
					placeholder="Reception tablet"
					maxlength={80}
					required
				/>
				{#each registerDevice.fields.name.issues() ?? [] as issue (issue.message)}
					<p class="text-xs text-destructive">{issue.message}</p>
				{/each}
			</div>
			<div class="space-y-2">
				<Label for="device-role">Role</Label>
				<Select
					type="single"
					bind:value={newDeviceRole}
					name={registerDevice.fields.role.as('select').name}
				>
					<SelectTrigger id="device-role" class="w-full">
						{deviceRoles.find((role) => role.value === newDeviceRole)?.label ?? 'Select a role'}
					</SelectTrigger>
					<SelectContent>
						{#each deviceRoles as role (role.value)}
							<SelectItem value={role.value}>{role.label}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
				{#each registerDevice.fields.role.issues() ?? [] as issue (issue.message)}
					<p class="text-xs text-destructive">{issue.message}</p>
				{/each}
			</div>
			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					disabled={registering}
					onclick={() => (registerDialogOpen = false)}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={registering}>
					{registering ? 'Adding…' : 'Add device'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
