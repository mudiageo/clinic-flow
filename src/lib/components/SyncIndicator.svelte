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
		{#if syncStore.online && syncStore.realtimeState !== 'offline'}
			{#if syncStore.isSyncing}
				<Badge
					variant="outline"
					class="bg-blue-500/10 text-blue-500 border-blue-500/30 flex items-center gap-1.5 px-2.5 py-1"
				>
					<Loader2 class="size-3 animate-spin" />
					Syncing...
				</Badge>
			{:else if syncStore.realtimeState === 'stale' || syncStore.realtimeState === 'error'}
				<Badge
					variant="outline"
					class="flex cursor-pointer items-center gap-1.5 border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-500 transition-colors hover:bg-amber-500/20"
					onclick={() => void syncStore.flush()}
				>
					<AlertCircle class="size-3" />
					{connectionLabel}
					{syncStore.pendingCount > 0 ? `(${syncStore.pendingCount})` : ''}
				</Badge>
			{:else}
				<Badge
					variant="outline"
					class="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 px-2.5 py-1 hover:bg-emerald-500/20 cursor-pointer transition-colors"
					onclick={() => void syncStore.flush()}
				>
					<span
						class="w-2 h-2 rounded-full bg-emerald-500 {syncStore.pendingCount > 0
							? 'animate-pulse'
							: ''}"
					></span>
					{connectionLabel}
					{syncStore.pendingCount > 0 ? `(${syncStore.pendingCount})` : ''}
				</Badge>
			{/if}
		{:else}
			<Badge
				variant="outline"
				class="bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1.5 px-2.5 py-1"
			>
				<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
				Offline ({syncStore.pendingCount} pending)
			</Badge>
		{/if}

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
