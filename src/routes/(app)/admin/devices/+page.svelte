<script lang="ts">
	import {
		getDevices,
		registerDevice,
		updateDevice,
		removeDevice
	} from '#lib/remote/devices.remote.ts';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '#lib/components/ui/card/index.ts';
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
	import { slide, fade } from 'svelte/transition';

	// We use the raw type from the db schema roughly:
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
			if (res) devices = res as any[];
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
			// Submitting directly to the remote form action
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
				return 'bg-triage-amber/20 text-triage-amber border-triage-amber/50';
			case 'doctor_tablet':
				return 'bg-blue-500/20 text-blue-600 border-blue-500/50';
			case 'pharmacy_terminal':
				return 'bg-purple-500/20 text-purple-600 border-purple-500/50';
			default:
				return 'bg-slate-500/20 text-slate-600 border-slate-500/50';
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

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Devices & Kiosks</h1>
			<p class="text-muted-foreground mt-1">
				Manage linked hardware and approve new tablets on your network.
			</p>
		</div>
		<div class="flex items-center gap-3 w-full sm:w-auto">
			<Button variant="outline" class="w-full sm:w-auto" onclick={loadDevices}>
				<RefreshCw class="size-4 mr-2 {isLoading ? 'animate-spin' : ''}" /> Refresh
			</Button>
			<Button class="w-full sm:w-auto" onclick={() => (registerDialogOpen = true)}>
				<Plus class="size-4 mr-2" /> Add Manually
			</Button>
		</div>
	</div>

	<!-- Alert for pending devices -->
	{#if devices.some((d) => d.status === 'pending')}
		<div
			class="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-4 animate-in slide-in-from-top-4"
		>
			<AlertTriangle class="size-6 text-amber-500 shrink-0 mt-0.5" />
			<div class="flex-1">
				<h3 class="font-bold text-amber-700 dark:text-amber-400">New Devices Pending Approval</h3>
				<p class="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
					There are devices trying to connect to this PHC network. Please review and assign them a
					role.
				</p>
			</div>
		</div>
	{/if}

	<!-- Devices List -->
	<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
		{#if isLoading && devices.length === 0}
			{#each [1, 2, 3] as i (i)}
				<Card class="opacity-50">
					<CardHeader><div class="h-6 w-1/2 bg-muted rounded animate-pulse"></div></CardHeader>
					<CardContent><div class="h-20 bg-muted rounded animate-pulse"></div></CardContent>
				</Card>
			{/each}
		{:else if devices.length === 0}
			<div class="col-span-full py-16 text-center border-2 border-dashed rounded-2xl">
				<TabletSmartphone class="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
				<h3 class="text-xl font-bold">No Devices Found</h3>
				<p class="text-muted-foreground mt-2 max-w-sm mx-auto">
					You haven't linked any tablets or kiosks to this local server yet.
				</p>
			</div>
		{:else}
			{#each devices as device (device.id)}
				<Card
					class="group transition-all hover:shadow-md border-border/60 relative overflow-hidden"
				>
					<!-- Status Indicator Stripe -->
					<div
						class="absolute top-0 left-0 w-1 h-full {device.status === 'approved'
							? 'bg-emerald-500'
							: device.status === 'pending'
								? 'bg-amber-500'
								: 'bg-destructive'}"
					></div>

					<CardHeader class="pb-3 flex flex-row items-start justify-between">
						<div>
							<CardTitle class="text-lg flex items-center gap-2">
								{device.name}
							</CardTitle>
							<CardDescription class="mt-1 font-mono text-xs"
								>{device.id.split('-')[0]}...{device.id.split('-')[4]}</CardDescription
							>
						</div>

						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								<Button variant="ghost" size="icon" class="-mr-3 -mt-3 text-muted-foreground">
									<MoreVertical class="size-4" />
								</Button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="w-48">
								{#if device.status !== 'approved'}
									<DropdownMenu.Item
										onclick={() => handleApprove(device.id)}
										class="text-emerald-500 cursor-pointer"
									>
										<CheckCircle2 class="size-4 mr-2" /> Approve Access
									</DropdownMenu.Item>
								{/if}
								{#if device.status !== 'revoked'}
									<DropdownMenu.Item
										onclick={() => handleRevoke(device.id)}
										class="text-amber-500 cursor-pointer"
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
					</CardHeader>

					<CardContent>
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Status</span>
								{#if device.status === 'approved'}
									<Badge class="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
										>Active / Approved</Badge
									>
								{:else if device.status === 'pending'}
									<Badge class="bg-amber-500/10 text-amber-600 border-amber-500/20"
										>Pending Approval</Badge
									>
								{:else}
									<Badge variant="destructive">Revoked</Badge>
								{/if}
							</div>

							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Assigned Role</span>
								<Badge variant="outline" class={getRoleColor(device.role)}>
									{device.role.replace('_', ' ').toUpperCase()}
								</Badge>
							</div>

							{#if device.status === 'pending'}
								<div class="pt-4 border-t border-border/50 flex gap-2">
									<Button
										class="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
										onclick={() => handleApprove(device.id)}
									>
										Approve
									</Button>
									<Button
										variant="outline"
										class="w-full border-destructive/20 text-destructive hover:bg-destructive/10"
										onclick={() => handleRevoke(device.id)}
									>
										Deny
									</Button>
								</div>
							{:else}
								<div class="pt-4 border-t border-border/50">
									<p class="text-xs text-muted-foreground flex items-center">
										<ShieldCheck class="size-3 mr-1" /> Last Sync: {device.lastSyncAt
											? new Date(device.lastSyncAt).toLocaleString()
											: 'Never'}
									</p>
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>
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
