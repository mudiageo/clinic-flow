<script lang="ts">
	import { syncStore } from '#lib/state/sync.svelte.ts';
	import { formatDateTime } from '#lib/utils/date.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import {
		AlertTriangle,
		CheckCircle,
		RefreshCcw,
		Wifi,
		WifiOff,
		ShieldCheck,
		Database
	} from '@lucide/svelte';
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.ts';

	const conflicts = $derived(syncStore.conflicts);
	let refreshing = $state(false);
	let reconciling = $state(false);

	async function loadConflicts() {
		refreshing = true;
		try {
			await syncStore.refreshConflicts();
		} finally {
			refreshing = false;
		}
	}

	async function reconcileAll() {
		reconciling = true;
		try {
			await syncStore.reconcileFromBeginning();
		} finally {
			reconciling = false;
		}
	}
</script>

<svelte:head>
	<title>Sync Engine — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<div
		class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Local-First Engine
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Sync Engine</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Monitor local-first synchronization and resolve conflicts
			</p>
		</div>
		<Button variant="outline" class="min-h-10" onclick={reconcileAll} disabled={reconciling}>
			<RefreshCcw class="mr-2 size-4 {reconciling ? 'animate-spin' : ''}" />
			Reconcile All Data
		</Button>
	</div>

	<!-- Ruled Sync Status Strip -->
	<div
		class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border rounded-xl border border-border bg-card"
	>
		<div class="p-4 flex items-start justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
					Connectivity
				</p>
				<p class="text-2xl font-bold mt-1">{syncStore.online ? 'Online' : 'Offline'}</p>
				<p class="text-xs text-muted-foreground mt-1">
					{syncStore.online ? 'Syncing with server' : 'Local Dexie mode'}
				</p>
			</div>
			{#if syncStore.online}
				<Wifi class="size-4 text-triage-green shrink-0" />
			{:else}
				<WifiOff class="size-4 text-triage-red shrink-0" />
			{/if}
		</div>

		<div class="p-4 flex items-start justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
					Pending Changes
				</p>
				<p class="text-2xl font-bold font-mono tabular-nums mt-1">{syncStore.pendingCount}</p>
				<p class="text-xs text-muted-foreground mt-1">Queued local mutations</p>
			</div>
			<Database class="size-4 text-primary shrink-0" />
		</div>

		<div class="p-4 flex items-start justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
					Data Freshness
				</p>
				<p class="text-2xl font-bold capitalize mt-1">{syncStore.dataState}</p>
				<p class="text-xs text-muted-foreground mt-1">Realtime: {syncStore.realtimeState}</p>
			</div>
			<ShieldCheck class="size-4 text-primary shrink-0" />
		</div>

		<div class="p-4 flex items-start justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
					Last Successful Sync
				</p>
				<p class="text-base font-bold font-mono mt-1.5">
					{#if syncStore.lastSyncedAt}
						{formatDateTime(syncStore.lastSyncedAt)}
					{:else}
						Never
					{/if}
				</p>
				<p class="text-xs text-muted-foreground mt-1">Push &amp; authoritative pull</p>
			</div>
			<ShieldCheck class="size-4 text-primary shrink-0" />
		</div>
	</div>

	<!-- Sync Conflicts Panel -->
	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div
			class="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center justify-between gap-3"
		>
			<div>
				<h2 class="text-base font-semibold">Sync Conflicts</h2>
				<p class="text-xs text-muted-foreground">
					Rejected local edits preserved beside the server version
				</p>
			</div>
			<Button variant="outline" size="sm" onclick={loadConflicts} disabled={refreshing} class="h-9">
				<RefreshCcw class="size-3.5 mr-1.5 {refreshing ? 'animate-spin' : ''}" />
				Refresh
			</Button>
		</div>

		<div class="p-5">
			{#if conflicts.length === 0}
				<div class="text-center py-14 border border-dashed border-border rounded-xl bg-muted/15">
					<div
						class="size-11 rounded-full bg-triage-green/15 flex items-center justify-center mx-auto mb-3"
					>
						<CheckCircle class="size-5 text-triage-green" />
					</div>
					<h3 class="text-sm font-semibold text-foreground">No Conflicts Detected</h3>
					<p class="text-muted-foreground text-xs mt-1">
						All local Dexie records are synchronized with the master database.
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each conflicts as conflict (conflict.id)}
						<div
							class="p-4 border border-border border-l-4 border-l-triage-red bg-triage-red/5 rounded-xl flex flex-col md:flex-row md:items-start md:justify-between gap-4"
						>
							<div class="flex items-start gap-3 flex-1 min-w-0">
								<AlertTriangle class="size-5 text-triage-red shrink-0 mt-0.5" />
								<div class="flex-1 min-w-0">
									<div class="font-bold text-triage-red text-sm capitalize">
										{conflict.entityType} Record Conflict
									</div>
									<div class="mt-1 text-xs font-mono text-muted-foreground">
										ID: {conflict.entityId} · {conflict.reason}
									</div>

									<ScrollArea
										class="h-40 w-full mt-3 border border-border rounded-lg bg-background p-3"
									>
										<pre class="text-[11px] font-mono text-foreground">{JSON.stringify(
												{
													localEdit: conflict.localPayload,
													serverVersion: conflict.serverRecord
												},
												null,
												2
											)}</pre>
									</ScrollArea>
								</div>
							</div>
							<div class="flex flex-row md:flex-col gap-2 min-w-[140px] shrink-0">
								<Button
									variant="default"
									size="sm"
									class="w-full min-h-9 text-xs font-semibold"
									onclick={() => syncStore.retryLocalVersion(conflict.id)}
								>
									Retry Local Edit
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="w-full min-h-9 text-xs"
									onclick={() => syncStore.acceptServerVersion(conflict.id)}
								>
									Discard Local
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>
