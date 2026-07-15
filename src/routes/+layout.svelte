<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner';

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
{@render children()}
