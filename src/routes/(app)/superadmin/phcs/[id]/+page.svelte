<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import {
		getPhcDetails,
		getPhcSyncStatus,
		resetPhcSyncState,
		setPhcActive
	} from '#lib/remote/superadmin.remote.ts';
	import { formatDateTime } from '#lib/utils/date.ts';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '#lib/components/ui/card/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import {
		Activity,
		AlertTriangle,
		Building2,
		Loader2,
		MapPin,
		Power,
		PowerOff,
		RefreshCw,
		Settings2,
		Trash2,
		Users
	} from '@lucide/svelte';

	type PhcDetails = NonNullable<Awaited<ReturnType<typeof getPhcDetails>>>;

	let { data, params }: { data: { phc: PhcDetails }; params: { id: string } } = $props();
	const phc = $derived(data.phc);
	const syncStatusQuery = $derived(getPhcSyncStatus(params.id));
	const syncStatus = $derived(syncStatusQuery.current);

	const statusLabel = $derived(
		!syncStatus ? 'Loading…' : syncStatus.status === 'up-to-date' ? 'Up to date' : 'Needs attention'
	);
	const lastSyncLabel = $derived(
		syncStatus?.lastSyncAt
			? `Last sync ${formatDateTime(syncStatus.lastSyncAt)}`
			: 'Last sync: unknown'
	);
	const deviceLabel = $derived(
		syncStatus
			? `${syncStatus.devices} device${syncStatus.devices === 1 ? '' : 's'}`
			: 'Devices: loading…'
	);
	const operationLabel = $derived(
		syncStatus
			? `${syncStatus.recentOperations} recent operation${syncStatus.recentOperations === 1 ? '' : 's'}`
			: 'Operations: loading…'
	);

	let activeDialogOpen = $state(false);
	let resetDialogOpen = $state(false);
	let syncConfirmation = $state('');
	let submitting = $state(false);

	const expectedConfirmation = 'RESET SYNC STATE';

	async function handleSetActive(): Promise<void> {
		if (submitting || !syncStatus) return;
		const nextActive = !syncStatus.active;
		submitting = true;
		try {
			await setPhcActive({ phcId: params.id, active: nextActive });
			toast.success(
				nextActive ? `${phc.name} has been reactivated.` : `${phc.name} has been deactivated.`
			);
			activeDialogOpen = false;
			await refreshAll();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Unable to update the PHC status.');
		} finally {
			submitting = false;
		}
	}

	async function handleResetSyncState(): Promise<void> {
		if (syncConfirmation !== expectedConfirmation || submitting) return;
		submitting = true;
		try {
			await resetPhcSyncState({ phcId: params.id, confirmation: expectedConfirmation });
			toast.success('Sync history cleared. No clinical records were deleted.');
			resetDialogOpen = false;
			syncConfirmation = '';
			await refreshAll();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Unable to reset the sync state.');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{phc.name} — Superadmin</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-6xl mx-auto">
	<div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-3 rounded-xl bg-primary/10 text-primary">
				<Building2 class="size-8" />
			</div>
			<div>
				<h1 class="text-3xl font-bold text-foreground tracking-tight">{phc.name}</h1>
				<div class="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
					<MapPin class="size-4" />
					<span>{phc.lga}, {phc.state}</span>
					<span class="mx-2 text-muted-foreground/30">•</span>
					<span>Registered {new Date(phc.createdAt).toLocaleDateString()}</span>
				</div>
			</div>
		</div>
		<div class="flex gap-2">
			<Button
				variant="outline"
				class={syncStatus?.active
					? 'text-orange-600 border-orange-200 hover:bg-orange-50'
					: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}
				disabled={!syncStatus}
				onclick={() => (activeDialogOpen = true)}
			>
				{#if syncStatus?.active}
					<PowerOff class="size-4 mr-2" />
					Deactivate
				{:else}
					<Power class="size-4 mr-2" />
					Reactivate
				{/if}
			</Button>
			<Button
				variant="outline"
				class="text-destructive border-destructive/30 hover:bg-destructive/10"
				onclick={() => (resetDialogOpen = true)}
			>
				<Trash2 class="size-4 mr-2" />
				Reset Data
			</Button>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
		<Card>
			<CardContent class="p-6 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Total Staff
					</p>
					<p class="text-3xl font-bold text-foreground mt-1">{phc.staffCount}</p>
				</div>
				<div
					class="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"
				>
					<Users class="size-5" />
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-6 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Total Patients
					</p>
					<p class="text-3xl font-bold text-foreground mt-1">{phc.patientCount}</p>
				</div>
				<div
					class="size-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500"
				>
					<Activity class="size-5" />
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-6 flex items-center justify-between gap-3">
				<div class="min-w-0">
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Sync Status
					</p>
					<div class="flex items-center gap-2 mt-1">
						<Badge
							variant={syncStatus?.status === 'up-to-date' ? 'default' : 'destructive'}
							class={syncStatus?.status === 'up-to-date'
								? 'text-green-700 border-green-200 bg-green-50'
								: ''}
						>
							{statusLabel}
						</Badge>
					</div>
					<p class="text-xs text-muted-foreground mt-2">{lastSyncLabel}</p>
					<p class="text-xs text-muted-foreground">
						{deviceLabel} · {operationLabel}
					</p>
					{#if syncStatus && !syncStatus.active}
						<p class="text-xs text-destructive mt-1">PHC inactive</p>
					{/if}
				</div>
				<div
					class="size-12 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"
				>
					<Settings2 class="size-5" />
				</div>
			</CardContent>
		</Card>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Staff Members</CardTitle>
			<CardDescription>Personnel registered under this PHC.</CardDescription>
		</CardHeader>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each phc.staff as member (member.id)}
						<TableRow>
							<TableCell class="font-medium">{member.name}</TableCell>
							<TableCell>
								<Badge variant="secondary" class="capitalize">{member.role}</Badge>
							</TableCell>
							<TableCell>
								{#if member.active}
									<Badge variant="outline" class="text-green-600 border-green-200 bg-green-50"
										>Active</Badge
									>
								{:else}
									<Badge variant="destructive">Inactive</Badge>
								{/if}
							</TableCell>
						</TableRow>
					{:else}
						<TableRow>
							<TableCell colspan={3} class="text-center py-8 text-muted-foreground"
								>No staff members found.</TableCell
							>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>

<Dialog.Root bind:open={activeDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-destructive">
				{#if syncStatus?.active}
					<PowerOff class="size-5" />
					Deactivate {phc.name}
				{:else}
					<Power class="size-5" />
					Reactivate {phc.name}
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{#if syncStatus?.active}
					This marks the PHC inactive and blocks its users from accessing the platform. Confirm only
					if this clinic should stop operating on ClinicFlow.
				{:else}
					This restores the PHC to active status so its staff can sign in again.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" disabled={submitting} onclick={() => (activeDialogOpen = false)}>
				Cancel
			</Button>
			<Button
				variant={syncStatus?.active ? 'destructive' : 'default'}
				disabled={submitting}
				onclick={handleSetActive}
			>
				{#if submitting}
					<Loader2 class="size-4 mr-2 animate-spin" />
					Working…
				{:else}
					{syncStatus?.active ? 'Deactivate PHC' : 'Reactivate PHC'}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={resetDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-destructive">
				<AlertTriangle class="size-5" />
				Reset sync state for {phc.name}
			</Dialog.Title>
			<Dialog.Description>
				This clears the server-side sync history. The sync counter is preserved so device cursors
				stay valid. Clinical records are NOT deleted. Devices will reconcile on their next
				connection.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-2 py-2">
			<Label for="reset-sync-confirmation">
				Type <span class="font-mono font-semibold">{expectedConfirmation}</span> to confirm
			</Label>
			<Input
				id="reset-sync-confirmation"
				bind:value={syncConfirmation}
				autocomplete="off"
				placeholder={expectedConfirmation}
			/>
			{#if syncConfirmation && syncConfirmation !== expectedConfirmation}
				<p class="text-xs text-destructive">Confirmation text does not match.</p>
			{/if}
		</div>
		<Dialog.Footer>
			<Button
				variant="outline"
				disabled={submitting}
				onclick={() => {
					resetDialogOpen = false;
					syncConfirmation = '';
				}}
			>
				Cancel
			</Button>
			<Button
				variant="destructive"
				disabled={submitting || syncConfirmation !== expectedConfirmation}
				onclick={handleResetSyncState}
			>
				{#if submitting}
					<Loader2 class="size-4 mr-2 animate-spin" />
					Resetting…
				{:else}
					<RefreshCw class="size-4 mr-2" />
					Reset sync state
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
