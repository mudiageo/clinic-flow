<script lang="ts">
	import { syncStore } from '$lib/state/sync.svelte';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { CloudSync, AlertOctagon, CheckCircle2, RotateCw } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	// Mock sync history for demo purposes
	const syncHistory = [
		{ id: 1, device: 'Tablet 1 (Reception)', time: '5 mins ago', status: 'Success', items: 12 },
		{ id: 2, device: 'Tablet 2 (Consultation)', time: '15 mins ago', status: 'Success', items: 4 },
		{ id: 3, device: 'Tablet 3 (Pharmacy)', time: '1 hr ago', status: 'Conflict', items: 1 },
		{ id: 4, device: 'Tablet 1 (Reception)', time: '2 hrs ago', status: 'Success', items: 25 },
	];

	function dismissConflict(id: string) {
		syncStore.conflicts = syncStore.conflicts.filter(c => c.id !== id);
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

<div class="space-y-6 animate-fade-in max-w-5xl mx-auto py-8">
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

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<Card class="border-destructive/30">
			<CardHeader class="pb-3">
				<CardTitle class="flex items-center gap-2 text-destructive">
					<AlertOctagon class="size-5" /> Active Conflicts
					{#if syncStore.conflicts.length > 0}
						<Badge variant="destructive" class="ml-2">{syncStore.conflicts.length}</Badge>
					{/if}
				</CardTitle>
				<CardDescription>Records that were rejected by the central server due to conflicting edits.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if syncStore.conflicts.length > 0}
					<div class="space-y-3">
						{#each syncStore.conflicts as conflict}
							<div class="p-3 border rounded-lg bg-destructive/5 flex justify-between items-center gap-4">
								<div>
									<p class="font-bold text-sm font-mono capitalize">{conflict.entityType} <span class="text-xs text-muted-foreground normal-case">({conflict.id.substring(0,8)}...)</span></p>
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
				<CardDescription>Recent synchronization events from clinic devices.</CardDescription>
			</CardHeader>
			<CardContent class="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Device</TableHead>
							<TableHead>Status</TableHead>
							<TableHead class="text-right">Time</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each syncHistory as log}
							<TableRow>
								<TableCell class="font-medium text-sm">{log.device}</TableCell>
								<TableCell>
									{#if log.status === 'Success'}
										<Badge variant="outline" class="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Success</Badge>
									{:else}
										<Badge variant="outline" class="bg-destructive/10 text-destructive border-destructive/20">Conflict</Badge>
									{/if}
								</TableCell>
								<TableCell class="text-right text-muted-foreground text-xs whitespace-nowrap">{log.time}</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	</div>
</div>
