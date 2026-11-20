<script lang="ts">
	import { getSyncHealth } from '#lib/remote/sync-health.remote.ts';
	import { formatDateTime } from '#lib/utils/date.ts';
	import { syncStore } from '#lib/state/sync.svelte.ts';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '#lib/components/ui/card/index.ts';
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
	import { CloudSync, AlertOctagon, CheckCircle2, RotateCw } from '@lucide/svelte';
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

<div class="space-y-6 animate-fade-in max-w-5xl mx-auto">
	<div class="flex items-start justify-between">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<CloudSync class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Offline Sync Health</h1>
				<p class="text-muted-foreground text-sm mt-0.5">
					Monitor local-first synchronization status and resolve data conflicts.
				</p>
			</div>
		</div>
		<Button onclick={retrySync} disabled={syncStore.isSyncing}>
			<RotateCw class="size-4 mr-2 {syncStore.isSyncing ? 'animate-spin' : ''}" />
			Force Sync
		</Button>
	</div>

	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
		<div class="rounded-lg border bg-card p-4">
			<p class="text-xs text-muted-foreground">Devices</p>
			<p class="mt-1 text-2xl font-semibold tabular-nums">{health.totals.devices}</p>
		</div>
		<div class="rounded-lg border bg-card p-4">
			<p class="text-xs text-muted-foreground">Synced devices</p>
			<p class="mt-1 text-2xl font-semibold tabular-nums">{health.totals.syncedDevices}</p>
		</div>
		<div class="rounded-lg border bg-card p-4">
			<p class="text-xs text-muted-foreground">Operations</p>
			<p class="mt-1 text-2xl font-semibold tabular-nums">{health.totals.operations}</p>
		</div>
	</div>

	{#if syncHealthQuery.error}
		<div
			class="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
		>
			Unable to load sync health data. Cached values, if any, may be out of date.
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<Card class="border-destructive/30">
			<CardHeader class="pb-3">
				<CardTitle class="flex items-center gap-2 text-destructive">
					<AlertOctagon class="size-5" /> Active Conflicts
					{#if syncStore.conflicts.length > 0}
						<Badge variant="destructive" class="ml-2">{syncStore.conflicts.length}</Badge>
					{/if}
				</CardTitle>
				<CardDescription
					>Records that were rejected by the central server due to conflicting edits.</CardDescription
				>
			</CardHeader>
			<CardContent>
				{#if syncStore.conflicts.length > 0}
					<div class="space-y-3">
						{#each syncStore.conflicts as conflict (conflict.id)}
							<div
								class="p-3 border rounded-lg bg-destructive/5 flex justify-between items-center gap-4"
							>
								<div>
									<p class="font-bold text-sm font-mono capitalize">
										{conflict.entityType}
										<span class="text-xs text-muted-foreground normal-case"
											>({conflict.id.substring(0, 8)}...)</span
										>
									</p>
									<p class="text-sm text-muted-foreground mt-0.5">Reason: {conflict.reason}</p>
								</div>
								<Button variant="outline" size="sm" onclick={() => dismissConflict(conflict.id)}>
									Accept Server
								</Button>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-muted-foreground flex flex-col items-center">
						<CheckCircle2 class="size-8 text-emerald-500 mb-2 opacity-50" />
						<p>No active sync conflicts.</p>
					</div>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-3">
				<CardTitle>Device Sync Log</CardTitle>
				<CardDescription>Recent synchronization operations recorded by the server.</CardDescription>
			</CardHeader>
			<CardContent class="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Device</TableHead>
							<TableHead>Operation</TableHead>
							<TableHead>Version</TableHead>
							<TableHead class="text-right">Time</TableHead>
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
							{#each health.recent as row (row.id)}
								<TableRow>
									<TableCell class="font-medium text-sm">{row.device}</TableCell>
									<TableCell>
										<div class="flex flex-wrap items-center gap-2">
											<span class="text-sm">{row.entityType} · {row.operation}</span>
											<Badge variant="outline" class="font-normal">{row.operation}</Badge>
										</div>
									</TableCell>
									<TableCell class="font-mono text-xs">{row.version}</TableCell>
									<TableCell class="text-right text-muted-foreground text-xs whitespace-nowrap">
										{row.receivedAt ? formatDateTime(row.receivedAt) : '—'}
									</TableCell>
								</TableRow>
							{/each}
						{/if}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	</div>

	<Card>
		<CardHeader class="pb-3">
			<CardTitle>Device Summary</CardTitle>
			<CardDescription>Registered devices and their recorded sync activity.</CardDescription>
		</CardHeader>
		<CardContent class="p-0">
			{#if health.devices.length === 0}
				<p class="py-10 text-center text-sm text-muted-foreground">No devices registered yet.</p>
			{:else}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Device</TableHead>
							<TableHead class="text-right">Operations</TableHead>
							<TableHead class="text-right">Last sync</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each health.devices as device (device.id)}
							<TableRow>
								<TableCell class="font-medium text-sm">{device.name}</TableCell>
								<TableCell class="text-right tabular-nums">{device.operationCount}</TableCell>
								<TableCell class="text-right text-muted-foreground text-xs whitespace-nowrap">
									{formatTimestamp(device.lastSyncAt)}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</CardContent>
	</Card>
</div>
