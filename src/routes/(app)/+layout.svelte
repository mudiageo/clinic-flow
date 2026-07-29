<script lang="ts">
	import { getCurrentSession } from '$lib/remote/auth.remote';
	import { syncEngine } from '$lib/sync/sync-engine.svelte';
	import { settingsStore } from '$lib/state/settings.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { ModeWatcher } from 'mode-watcher';
	import { setContext, onMount, onDestroy } from 'svelte';

	let { children } = $props();

	onMount(() => {
		// 4. Start sync engine
		syncEngine.start();

		// 5. Fetch remote settings
		settingsStore.fetchFromServer();
	});

	onDestroy(() => {
		syncEngine.stop();
	});
</script>

<ModeWatcher />

{#await getCurrentSession()}
	<!-- Loading skeleton while checking auth -->
	<div class="min-h-screen bg-background flex flex-col items-center justify-center p-8">
		<div class="w-full max-w-sm space-y-4">
			<Skeleton class="h-12 w-12 rounded-2xl" />
			<Skeleton class="h-6 w-1/2" />
			<Skeleton class="h-4 w-3/4" />
			<div class="space-y-2 pt-8">
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-10 w-full" />
			</div>
		</div>
	</div>
{:then sessionData}
	{#if !sessionData.user}
		<meta http-equiv="refresh" content="0;url=/login" />
	{:else}
		<!-- Pass session down via context so child layouts don't re-fetch -->
		{#if setContext('session', sessionData)}<!-- side-effect only -->{/if}
		{@render children()}
	{/if}
{/await}
