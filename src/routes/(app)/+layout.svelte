<script lang="ts">
	import { getCurrentSession } from '$lib/remote/auth.remote';
	import { syncStore } from '$lib/state/sync.svelte';
	import { settingsStore } from '$lib/state/settings.svelte';
	import { sessionStore } from '$lib/state/session.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { ModeWatcher } from 'mode-watcher';
	import { setContext, onMount, onDestroy } from 'svelte';

	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let { children } = $props();

	setContext('session', {
		get user() { return sessionStore.user; },
		get role() { return sessionStore.role; },
		get phcId() { return sessionStore.phcId; },
		get permissions() { return sessionStore.permissions; }
	});

	// Check auth session
	let sessionData: any;
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
			} else {
				goto('/login');
			}
		}
	}

	if (sessionData) {
		sessionStore.init(sessionData);
	}

	if (browser && !sessionData?.user) {
		goto('/login');
	}

	onMount(() => {
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
