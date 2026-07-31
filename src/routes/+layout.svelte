<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner';
	import PWAManager from '$lib/components/PWAManager.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let { children } = $props();

	function handleKeydown(event: KeyboardEvent) {
		// Admin escape shortcut: Ctrl + Alt + Escape
		if (event.ctrlKey && event.altKey && event.key === 'Escape') {
			if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
				import('@tauri-apps/api/window')
					.then(({ getCurrentWindow }) => {
						const appWindow = getCurrentWindow();
						appWindow.setFullscreen(false);
						appWindow.setAlwaysOnTop(false);
						appWindow.setResizable(true);
					})
					.catch((err) => console.error(err));
			}
		}
	}

	function handleContextMenu(event: MouseEvent) {
		// Disable right-click menu in production kiosk mode
		if (process.env.NODE_ENV === 'production') {
			event.preventDefault();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} oncontextmenu={handleContextMenu} />

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Toaster richColors position="top-right" />
<PWAManager />
<svelte:boundary>
	{#snippet pending()}
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
	{/snippet}

	{#snippet failed(error, reset)}
		<div class="min-h-screen flex flex-col items-center justify-center p-8 text-destructive">
			<h2 class="text-2xl font-bold">Failed to load</h2>
			<p>{error?.message || "Unknown error"}</p>
			<button class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg" onclick={reset}>Retry</button>
		</div>
	{/snippet}

	{@render children()}
</svelte:boundary>
