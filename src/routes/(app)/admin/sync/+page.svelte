<script lang="ts">
	import { syncStore } from '#lib/state/sync.svelte.ts';
	import { formatDateTime } from '#lib/utils/date.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '#lib/components/ui/card/index.ts';
	import {
		AlertTriangle,
		CheckCircle,
		RefreshCcw,
		Wifi,
		WifiOff,
		ShieldCheck,
		Database
	} from '@lucide/svelte';
	import { SpotlightCard } from '#lib/components/ui/spotlight-card/index.ts';
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

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<RefreshCcw class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Sync Engine</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Monitor local-first synchronization and resolve conflicts
				</p>
			</div>
		</div>
		<Button variant="outline" onclick={reconcileAll} disabled={reconciling}>
			<RefreshCcw class="mr-2 size-4 {reconciling ? 'animate-spin' : ''}" />
			Reconcile All Data
		</Button>
	</div>

	<div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3 animate-stagger">
		<!-- Connectivity Card -->
		<SpotlightCard class="card-hover cursor-default">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
					>Connectivity</CardTitle
				>
				{#if syncStore.online}
					<Wifi class="h-4.5 w-4.5 text-triage-green" />
				{:else}
					<WifiOff class="h-4.5 w-4.5 text-triage-red" />
				{/if}
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-extrabold text-foreground">
					{syncStore.online ? 'Online' : 'Offline'}
				</div>
				<p class="text-xs text-muted-foreground mt-1.5 font-medium">
					{syncStore.online
						? 'Actively syncing with SvelteKit server'
						: 'Operating fully locally in Dexie database'}
				</p>
			</CardContent>
		</SpotlightCard>

		<!-- Pending Mutations Card -->
		<SpotlightCard class="card-hover cursor-default">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
					>Pending Changes</CardTitle
				>
				<Database class="h-4.5 w-4.5 text-primary" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-extrabold text-foreground tabular-nums">
					{syncStore.pendingCount}
				</div>
				<p class="text-xs text-muted-foreground mt-1.5 font-medium">
					Local database mutations waiting to push to server
				</p>
			</CardContent>
		</SpotlightCard>

		<!-- Data freshness card -->
		<SpotlightCard class="card-hover cursor-default">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
					>Data Freshness</CardTitle
				>
				<ShieldCheck class="h-4.5 w-4.5 text-primary" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-extrabold capitalize text-foreground">
					{syncStore.dataState}
				</div>
				<p class="mt-1.5 text-xs font-medium text-muted-foreground">
					Durable data freshness; connection state is {syncStore.realtimeState}
				</p>
			</CardContent>
		</SpotlightCard>

		<SpotlightCard class="card-hover cursor-default">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Last Successful Sync
				</CardTitle>
				<ShieldCheck class="h-4.5 w-4.5 text-primary" />
			</CardHeader>
			<CardContent>
				<div class="text-xl font-extrabold text-foreground">
					{#if syncStore.lastSyncedAt}
						{formatDateTime(syncStore.lastSyncedAt)}
					{:else}
						Never
					{/if}
				</div>
				<p class="text-xs text-muted-foreground mt-1.5 font-medium">
					Completed push and authoritative catch-up
				</p>
			</CardContent>
		</SpotlightCard>
	</div>

	<!-- Sync Conflicts Section -->
	<Card class="overflow-hidden card-hover bg-card/60">
		<CardHeader
			class="border-b border-border/60 bg-muted/20 px-6 py-4 flex flex-row items-center justify-between"
		>
			<div>
				<CardTitle class="text-base font-semibold">Sync Conflicts</CardTitle>
				<CardDescription>Rejected local edits preserved beside the server version.</CardDescription>
			</div>
			<Button
				variant="outline"
				size="sm"
				onclick={loadConflicts}
				disabled={refreshing}
				class="h-9 btn-press border-border"
			>
				<RefreshCcw class="h-3.5 w-3.5 mr-1.5 {refreshing ? 'animate-spin' : ''}" />
				Refresh
			</Button>
		</CardHeader>
		<CardContent class="pt-6">
			{#if conflicts.length === 0}
				<div class="text-center py-16 border border-dashed border-border rounded-xl">
					<div
						class="size-12 rounded-full bg-triage-green/10 flex items-center justify-center mx-auto mb-3"
					>
						<CheckCircle class="h-6 w-6 text-triage-green" />
					</div>
					<h3 class="text-sm font-semibold text-foreground">No Conflicts Detected</h3>
					<p class="text-muted-foreground text-xs mt-1 font-medium">
						All local Dexie records are smoothly synchronized with the master database.
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each conflicts as conflict (conflict.id)}
						<div
							class="p-5 border border-border bg-triage-red/5 rounded-xl flex flex-col md:flex-row md:items-start md:justify-between gap-4 animate-fade-in"
						>
							<div class="flex items-start gap-3 flex-1 min-w-0">
								<AlertTriangle class="h-5 w-5 text-triage-red shrink-0 mt-0.5" />
								<div class="flex-1 min-w-0">
									<div class="font-bold text-triage-red text-sm capitalize">
										{conflict.entityType} Record Conflict
									</div>
									<div class="mt-1 text-xs font-mono text-muted-foreground">
										ID: {conflict.entityId} · {conflict.reason}
									</div>

									<!-- Pretty JSON View -->
									<ScrollArea
										class="h-40 w-full mt-3 border border-border rounded-lg bg-background/80 p-3"
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
									class="w-full bg-primary text-primary-foreground hover:bg-primary/95 btn-press text-xs h-9"
									onclick={() => syncStore.retryLocalVersion(conflict.id)}
								>
									Retry Local Edit
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="w-full border-border btn-press text-xs h-9"
									onclick={() => syncStore.acceptServerVersion(conflict.id)}
								>
									Discard Local
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
