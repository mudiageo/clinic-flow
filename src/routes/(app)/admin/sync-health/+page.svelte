<script lang="ts">
	import { getSyncHealth } from '#lib/remote/sync-health.remote.ts';
	import { formatDateTime } from '#lib/utils/date.ts';
	import { syncStore } from '#lib/state/sync.svelte.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { AlertOctagon, CheckCircle2, RotateCw } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	const syncHealthQuery = getSyncHealth();
	const emptyHealth = {
		devices: [] as NonNullable<typeof syncHealthQuery.current>['devices'],
		recent: [] as NonNullable<typeof syncHealthQuery.current>['recent'],
		totals: { devices: 0, syncedDevices: 0, operations: 0 }
	};
	const health = $derived(syncHealthQuery.current ?? emptyHealth);

	function formatTimestamp(value: string | null): string {
		return value ? formatDateTime(value) : 'Never';
	}

	function dismissConflict(id: string) {
		syncStore.conflicts = syncStore.conflicts.filter((c) => c.id !== id);
		toast.success('Conflict dismissed. The server version has been kept.');
	}

	function retrySync() {
		syncStore.flush();
		toast.info('Manual sync triggered.');
	}
</script>

<svelte:head>
	<title>Sync Health — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<div
		class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Fleet Diagnostics
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Offline Sync Health</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Monitor local-first synchronization status and resolve data conflicts
			</p>
		</div>
		<Button class="min-h-10 px-4 font-semibold" onclick={retrySync} disabled={syncStore.isSyncing}>
			<RotateCw class="size-4 mr-2 {syncStore.isSyncing ? 'animate-spin' : ''}" />
			Force Sync
		</Button>
	</div>

	<!-- Ruled Summary Strip -->
	<div class="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card">
		<div class="px-4 py-3.5">
			<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Devices</p>
			<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{health.totals.devices}</p>
		</div>
		<div class="px-4 py-3.5">
			<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
				Synced Devices
			</p>
			<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{health.totals.syncedDevices}</p>
		</div>
		<div class="px-4 py-3.5">
			<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Operations</p>
			<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{health.totals.operations}</p>
		</div>
	</div>

	{#if syncHealthQuery.error}
		<div
			class="rounded-xl border border-destructive/30 bg-destructive/8 p-4 text-sm text-destructive"
		>
			Unable to load sync health data. Cached values, if any, may be out of date.
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<section class="rounded-xl border border-border bg-card overflow-hidden">
			<div class="px-5 py-3.5 border-b border-border bg-muted/20">
				<h2 class="text-base font-semibold flex items-center gap-2 text-destructive">
					<AlertOctagon class="size-4" /> Active Conflicts
					{#if syncStore.conflicts.length > 0}
						<Badge variant="destructive" class="ml-1 font-mono">{syncStore.conflicts.length}</Badge>
					{/if}
				</h2>
				<p class="text-xs text-muted-foreground mt-0.5">
					Records rejected by the central server due to conflicting edits
				</p>
			</div>
			<div class="p-5">
				{#if syncStore.conflicts.length > 0}
					<div class="space-y-3">
						{#each syncStore.conflicts as conflict (conflict.id)}
							<div
								class="p-3.5 border border-border border-l-4 border-l-destructive rounded-lg bg-destructive/5 flex justify-between items-center gap-4"
							>
								<div>
									<p class="font-bold text-sm font-mono capitalize">
										{conflict.entityType}
										<span class="text-xs text-muted-foreground normal-case">
											({conflict.id.substring(0, 8)}...)
										</span>
									</p>
									<p class="text-xs text-muted-foreground mt-0.5">Reason: {conflict.reason}</p>
								</div>
								<Button variant="outline" size="sm" onclick={() => dismissConflict(conflict.id)}>
									Accept Server
								</Button>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-muted-foreground flex flex-col items-center">
						<CheckCircle2 class="size-8 text-triage-green mb-2 opacity-60" />
						<p class="text-sm">No active sync conflicts.</p>
					</div>
				{/if}
			</div>
		</section>

		<section class="rounded-xl border border-border bg-card overflow-hidden">
			<div class="px-5 py-3.5 border-b border-border bg-muted/20">
				<h2 class="text-base font-semibold">Device Sync Log</h2>
				<p class="text-xs text-muted-foreground mt-0.5">
					Recent synchronization operations recorded by the server
				</p>
			</div>
			<Table>
				<TableHeader class="bg-muted/40">
					<TableRow class="hover:bg-transparent">
						<TableHead class="font-mono text-xs uppercase tracking-wider">Device</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider">Operation</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider">Version</TableHead>
						<TableHead class="text-right font-mono text-xs uppercase tracking-wider">Time</TableHead
						>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if health.recent.length === 0}
						<TableRow>
							<TableCell colspan={4} class="h-24 text-center text-muted-foreground">
								No sync operations recorded yet.
							</TableCell>
						</TableRow>
					{:else}
						{#each health.recent as row, idx (row.id)}
							<TableRow class={idx % 2 === 1 ? 'bg-muted/20' : ''}>
								<TableCell class="font-medium text-sm">{row.device}</TableCell>
								<TableCell>
									<div class="flex flex-wrap items-center gap-2">
										<span class="text-xs font-mono">{row.entityType}</span>
										<Badge variant="outline" class="font-mono text-[10px]">{row.operation}</Badge>
									</div>
								</TableCell>
								<TableCell class="font-mono text-xs">{row.version}</TableCell>
								<TableCell
									class="text-right text-muted-foreground font-mono text-xs whitespace-nowrap"
								>
									{row.receivedAt ? formatDateTime(row.receivedAt) : '—'}
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</section>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="px-5 py-3.5 border-b border-border bg-muted/20">
			<h2 class="text-base font-semibold">Device Summary</h2>
			<p class="text-xs text-muted-foreground mt-0.5">
				Registered devices and their recorded sync activity
			</p>
		</div>
		{#if health.devices.length === 0}
			<p class="py-10 text-center text-sm text-muted-foreground">No devices registered yet.</p>
		{:else}
			<Table>
				<TableHeader class="bg-muted/40">
					<TableRow class="hover:bg-transparent">
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5">Device</TableHead>
						<TableHead class="text-right font-mono text-xs uppercase tracking-wider">
							Operations
						</TableHead>
						<TableHead class="text-right font-mono text-xs uppercase tracking-wider px-5">
							Last sync
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each health.devices as device, idx (device.id)}
						<TableRow class={idx % 2 === 1 ? 'bg-muted/20' : ''}>
							<TableCell class="font-medium text-sm px-5">{device.name}</TableCell>
							<TableCell class="text-right font-mono tabular-nums"
								>{device.operationCount}</TableCell
							>
							<TableCell
								class="text-right text-muted-foreground font-mono text-xs whitespace-nowrap px-5"
							>
								{formatTimestamp(device.lastSyncAt)}
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		{/if}
	</section>
</div>
