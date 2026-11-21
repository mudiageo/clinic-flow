<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import { Sun, Moon } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button';

	let { class: className = '' }: { class?: string } = $props();
</script>

<Button
	variant="ghost"
	size="icon"
	onclick={toggleMode}
	class="size-9 rounded-md text-muted-foreground hover:text-foreground transition-colors {className}"
	aria-label="Toggle color theme"
>
	<Sun class="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
	<Moon class="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
	<span class="sr-only">Toggle theme</span>
</Button>
