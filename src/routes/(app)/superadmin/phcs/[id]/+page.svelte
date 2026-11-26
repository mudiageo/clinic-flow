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
	<div
		class="pb-2 border-b border-border flex flex-col md:flex-row md:items-end justify-between gap-4"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Superadmin // Facility Dossier
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">{phc.name}</h1>
			<div class="flex flex-wrap items-center gap-2 mt-1 text-muted-foreground text-xs font-mono">
				<span class="inline-flex items-center gap-1">
					<MapPin class="size-3.5" />
					{phc.lga}, {phc.state}
				</span>
				<span class="text-muted-foreground/40">•</span>
				<span>Registered {new Date(phc.createdAt).toLocaleDateString()}</span>
			</div>
		</div>
		<div class="flex gap-2">
			<Button
				variant="outline"
				size="sm"
				class={syncStatus?.active
					? 'text-amber-700 dark:text-triage-amber border-triage-amber/30 hover:bg-triage-amber/10'
					: 'text-triage-green border-triage-green/30 hover:bg-triage-green/10'}
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
				size="sm"
				class="text-destructive border-destructive/30 hover:bg-destructive/10"
				onclick={() => (resetDialogOpen = true)}
			>
				<Trash2 class="size-4 mr-2" />
				Reset Data
			</Button>
		</div>
	</div>

	<div
		class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border rounded-xl border border-border bg-card overflow-hidden"
	>
		<div class="p-5 flex items-center justify-between gap-3">
			<div>
				<p class="text-xs font-mono uppercase tracking-wider text-muted-foreground">Total Staff</p>
				<p class="text-3xl font-bold font-mono tabular-nums text-foreground mt-1">
					{phc.staffCount}
				</p>
			</div>
			<div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
				<Users class="size-5" />
			</div>
		</div>
		<div class="p-5 flex items-center justify-between gap-3">
			<div>
				<p class="text-xs font-mono uppercase tracking-wider text-muted-foreground">
					Total Patients
				</p>
				<p class="text-3xl font-bold font-mono tabular-nums text-foreground mt-1">
					{phc.patientCount}
				</p>
			</div>
			<div
				class="size-10 rounded-lg bg-triage-green/10 flex items-center justify-center text-triage-green"
			>
				<Activity class="size-5" />
			</div>
		</div>
		<div class="p-5 flex items-center justify-between gap-3">
			<div class="min-w-0">
				<p class="text-xs font-mono uppercase tracking-wider text-muted-foreground">Sync Status</p>
				<div class="flex items-center gap-2 mt-1">
					<Badge
						variant={syncStatus?.status === 'up-to-date' ? 'outline' : 'destructive'}
						class={syncStatus?.status === 'up-to-date'
							? 'text-triage-green border-triage-green/30 bg-triage-green/10'
							: ''}
					>
						{statusLabel}
					</Badge>
				</div>
				<p class="text-xs font-mono text-muted-foreground mt-2">{lastSyncLabel}</p>
				<p class="text-xs font-mono text-muted-foreground">
					{deviceLabel} · {operationLabel}
				</p>
				{#if syncStatus && !syncStatus.active}
					<p class="text-xs text-destructive mt-1 font-medium">PHC inactive</p>
				{/if}
			</div>
			<div
				class="size-10 shrink-0 rounded-lg bg-triage-green/10 flex items-center justify-center text-triage-green"
			>
				<Settings2 class="size-5" />
			</div>
		</div>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="px-6 py-4 border-b border-border bg-muted/20">
			<h2 class="text-base font-semibold text-foreground">Staff Members</h2>
			<p class="text-xs text-muted-foreground mt-0.5">Personnel registered under this PHC.</p>
		</div>
		<Table>
			<TableHeader>
				<TableRow class="bg-muted/30">
					<TableHead class="font-mono text-xs uppercase tracking-wider">Name</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Role</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Status</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each phc.staff as member, idx (member.id)}
					<TableRow class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}>
						<TableCell class="font-medium">{member.name}</TableCell>
						<TableCell>
							<Badge variant="secondary" class="capitalize font-mono text-xs">{member.role}</Badge>
						</TableCell>
						<TableCell>
							{#if member.active}
								<Badge
									variant="outline"
									class="text-triage-green border-triage-green/30 bg-triage-green/10"
								>
									Active
								</Badge>
							{:else}
								<Badge variant="destructive">Inactive</Badge>
							{/if}
						</TableCell>
					</TableRow>
				{:else}
					<TableRow>
						<TableCell colspan={3} class="text-center py-8 text-muted-foreground">
							No staff members found.
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</section>
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
