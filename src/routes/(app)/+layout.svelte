<script lang="ts">
	import { getCurrentSession } from '$lib/remote/auth.remote';
	import { syncStore } from '$lib/state/sync.svelte';
	import { settingsStore } from '$lib/state/settings.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { ModeWatcher } from 'mode-watcher';
	import { setContext, onMount, onDestroy } from 'svelte';

	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let { children } = $props();

	let sessionContext = $state<any>(null);
	setContext('session', {
		get user() { return sessionContext?.user; },
		get role() { return sessionContext?.role; },
		get phcId() { return sessionContext?.phcId; },
		get session() { return sessionContext?.session; }
	});

	// Check auth session
	let sessionData;
	try {
		sessionData = await getCurrentSession();
		if (browser && sessionData?.user) {
			// Cache session for offline survival
			localStorage.setItem('clinicflow_offline_session', JSON.stringify(sessionData));
		}
	} catch (error) {
		console.error('Failed to fetch session (offline):', error);
		if (browser) {
			const cached = localStorage.getItem('clinicflow_offline_session');
			if (cached) {
				sessionData = JSON.parse(cached);
				// We don't have access to toast here easily since it's layout script, but we can rely on UI to show offline
			} else {
				goto('/login');
			}
		}
	}
	
	sessionContext = sessionData;

	if (browser && !sessionData?.user) {
		goto('/login');
	}

	onMount(() => {
		// 5. Fetch remote settings
		settingsStore.fetchFromServer();
	});

	onDestroy(() => {
		// syncStore auto-manages its lifecycle for now
	});

</script>

<ModeWatcher />

{#if sessionData?.user}
	{@render children()}
{/if}
