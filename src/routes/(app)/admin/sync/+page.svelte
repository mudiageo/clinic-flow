<script lang="ts">
	import { db } from '$lib/local-db/db';
	import { syncStore } from '$lib/state/sync.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import { onMount } from 'svelte';
	import {
		AlertTriangle,
		CheckCircle,
		RefreshCcw,
		Wifi,
		WifiOff,
		Activity,
		ShieldCheck,
		Database
	} from '@lucide/svelte';
	import { SpotlightCard } from '$lib/components/ui/spotlight-card';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	let conflicts = $state<{ table: string; id: string; record: any }[]>([]);
	let refreshing = $state(false);

	async function loadConflicts() {
		refreshing = true;
		const tables = [
			'patients',
			'queueTickets',
			'vitalsRecords',
			'pharmacyInventory',
			'reminders',
			'triageRules',
			'prescriptions'
		];
		const found: any[] = [];

		for (const t of tables) {
			const tableObj = (db as any)[t];
			if (tableObj) {
				const records = await tableObj.where('syncStatus').equals('conflict').toArray();
				for (const r of records) {
					found.push({ table: t, id: r.id, record: r });
				}
			}
		}

		conflicts = found;
		refreshing = false;
	}

	onMount(() => {
		loadConflicts();
		const interval = setInterval(loadConflicts, 5000);
		return () => clearInterval(interval);
	});

	async function forceLocal(table: string, id: string, record: any) {
		const tableObj = (db as any)[table];

		await db.syncLog.add({
			entityType: table,
			entityId: id,
			operation: 'update',
			payload: record,
			timestamp: Date.now(),
			synced: 0
		});

		await tableObj.update(id, { syncStatus: 'pending', updatedAt: Date.now() });
		await syncStore.flush();
		loadConflicts();
	}

	async function forceRemote(table: string, id: string) {
		const tableObj = (db as any)[table];
		await tableObj.update(id, { syncStatus: 'synced' });
		await syncStore.flush();
		loadConflicts();
	}
</script>

<svelte:head>
	<title>Sync Engine — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
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

		<!-- Last Synced Date Card -->
		<SpotlightCard class="card-hover cursor-default">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
					>Last Synced</CardTitle
				>
				<ShieldCheck class="h-4.5 w-4.5 text-primary" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-extrabold text-foreground">
					{#if syncStore.lastSyncedAt}
						{new Date(syncStore.lastSyncedAt).toLocaleTimeString()}
					{:else}
						Never
					{/if}
				</div>
				<p class="text-xs text-muted-foreground mt-1.5 font-medium">
					Time of last successful push or pull session
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
				<CardDescription
					>Records that could not be automatically merged using LWW (Last-Write-Wins) rules.</CardDescription
				>
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
					{#each conflicts as conflict}
						<div
							class="p-5 border border-border bg-triage-red/5 rounded-xl flex flex-col md:flex-row md:items-start md:justify-between gap-4 animate-fade-in"
						>
							<div class="flex items-start gap-3 flex-1 min-w-0">
								<AlertTriangle class="h-5 w-5 text-triage-red shrink-0 mt-0.5" />
								<div class="flex-1 min-w-0">
									<div class="font-bold text-triage-red text-sm capitalize">
										{conflict.table} Record Conflict
									</div>
									<div class="text-xs font-mono text-muted-foreground mt-1">ID: {conflict.id}</div>

									<!-- Pretty JSON View -->
									<ScrollArea
										class="h-40 w-full mt-3 border border-border rounded-lg bg-background/80 p-3"
									>
										<pre class="text-[11px] font-mono text-foreground">{JSON.stringify(
												conflict.record,
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
									onclick={() => forceLocal(conflict.table, conflict.id, conflict.record)}
								>
									Force Local Win
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="w-full border-border btn-press text-xs h-9"
									onclick={() => forceRemote(conflict.table, conflict.id)}
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
