<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	
	let needRefresh = $state(false);
	let offlineReady = $state(false);
	
	onMount(async () => {
		try {
			const { pwaInfo } = await import('virtual:pwa-info');
			if (pwaInfo) {
				const { registerSW } = await import('virtual:pwa-register');
				registerSW({
					immediate: true,
					onNeedRefresh() {
						needRefresh = true;
						toast.info('New app version available. Refresh to update.', {
							action: {
								label: 'Refresh',
								onClick: () => {
									if (typeof window !== 'undefined') {
										window.location.reload();
									}
								}
							},
							duration: 10000
						});
					},
					onOfflineReady() {
						offlineReady = true;
						toast.success('App is ready for offline use.');
					}
				});
			}
		} catch (e) {
			console.log('PWA not available or in dev mode.');
		}
	});
</script>

<!-- The web manifest link is injected by vite-plugin-pwa during build, or we can manually use virtual:pwa-info, but it's easier to just link it directly if we generated it, wait, let's just let it be handled by the plugin or use the html tags below -->
<svelte:head>
	<meta name="theme-color" content="#ffffff" />
	<link rel="apple-touch-icon" href="/pwa-192x192.png" />
	<link rel="mask-icon" href="/pwa-512x512.png" color="#FFFFFF" />
	<!-- This is standard injection for sveltekit-pwa -->
	{#await import('virtual:pwa-info') then { pwaInfo }}
		{@html pwaInfo?.webManifest?.linkTag ?? ''}
	{:catch _}
		<!-- ignore in environments where pwa isn't supported -->
	{/await}
</svelte:head>
