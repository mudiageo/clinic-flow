<script lang="ts">
	import { syncStore } from '#lib/state/sync.svelte.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Loader2, AlertCircle } from '@lucide/svelte';
	import { onMount, onDestroy } from 'svelte';

	let timeAgo = $state('just now');
	let interval: ReturnType<typeof setInterval> | null = null;

	const connectionLabel = $derived.by(() => {
		if (!syncStore.online || syncStore.realtimeState === 'offline') return 'Offline';
		if (syncStore.realtimeState === 'live') return 'Live';
		if (syncStore.realtimeState === 'connecting') return 'Connecting';
		if (syncStore.realtimeState === 'stale' || syncStore.realtimeState === 'error') {
			return 'Stale';
		}
		return 'Connected';
	});

	const freshnessLabel = $derived.by(() => {
		if (syncStore.dataState === 'syncing') return 'Syncing';
		if (syncStore.dataState === 'current') return 'Current';
		if (syncStore.dataState === 'error') return 'Sync error';
		if (syncStore.dataState === 'offline') return 'Cached';
		if (syncStore.dataState === 'stale') return 'Stale data';
		return 'Not synced';
	});

	function updateTimeAgo() {
		if (!syncStore.lastSyncedAt) {
			timeAgo = 'never';
			return;
		}
		const diffMs = Date.now() - syncStore.lastSyncedAt;
		const diffMins = Math.floor(diffMs / 60000);
		if (diffMins < 1) timeAgo = 'just now';
		else if (diffMins === 1) timeAgo = '1 min ago';
		else timeAgo = `${diffMins} mins ago`;
	}

	onMount(() => {
		updateTimeAgo();
		interval = setInterval(updateTimeAgo, 30000); // update every 30s
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});
</script>

<div class="flex flex-col items-start gap-2">
	<div class="flex items-center gap-2">
		<Badge
			variant="outline"
			class={syncStore.realtimeState === 'live'
				? 'flex items-center gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-500'
				: 'flex items-center gap-1.5 border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-500'}
			title="Wake-up stream connection"
		>
			<span
				class="size-2 rounded-full {syncStore.realtimeState === 'live'
					? 'bg-emerald-500'
					: 'bg-amber-500'}"
			></span>
			{connectionLabel}
		</Badge>

		<button
			type="button"
			class="rounded-md"
			onclick={() => void syncStore.flush()}
			title={syncStore.lastSyncError ?? 'Durable record freshness — click to reconcile'}
		>
			<Badge
				variant="outline"
				class={syncStore.dataState === 'current'
					? 'flex cursor-pointer items-center gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-500'
					: syncStore.dataState === 'error'
						? 'flex cursor-pointer items-center gap-1.5 border-destructive/30 bg-destructive/10 px-2.5 py-1 text-destructive'
						: 'flex cursor-pointer items-center gap-1.5 border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-500'}
			>
				{#if syncStore.isSyncing}
					<Loader2 class="size-3 animate-spin" />
				{:else if syncStore.dataState === 'error' || syncStore.dataState === 'stale'}
					<AlertCircle class="size-3" />
				{/if}
				{freshnessLabel}
				{syncStore.pendingCount > 0 ? `(${syncStore.pendingCount})` : ''}
			</Badge>
		</button>

		{#if syncStore.conflicts.length > 0}
			<a
				href="/admin/sync-health"
				class="text-destructive hover:text-destructive/80 transition-colors"
			>
				<AlertCircle class="size-5 animate-pulse" />
			</a>
		{/if}
	</div>

	<div class="text-[10px] text-muted-foreground ml-1 font-mono">
		Last synced: {timeAgo}
	</div>
</div>
