<script lang="ts">
	import { getCurrentSession } from '$lib/remote/auth.remote';
	import { syncStore } from '$lib/state/sync.svelte';
	import { settingsStore } from '$lib/state/settings.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { ModeWatcher } from 'mode-watcher';
	import { setContext, onMount, onDestroy } from 'svelte';

	let { children } = $props();

	let sessionContext = $state<any>(null);
	setContext('session', {
		get user() { return sessionContext?.user; },
		get role() { return sessionContext?.role; },
		get phcId() { return sessionContext?.phcId; },
		get session() { return sessionContext?.session; }
	});

	// Check auth session
	const sessionData = await getCurrentSession();
	sessionContext = sessionData;

	onMount(() => {
		// 5. Fetch remote settings
		settingsStore.fetchFromServer();
	});

	onDestroy(() => {
		// syncStore auto-manages its lifecycle for now
	});

</script>

<ModeWatcher />

{#if !sessionData?.user}
	<meta http-equiv="refresh" content="0;url=/login" />
{:else}
	{@render children()}
{/if}
