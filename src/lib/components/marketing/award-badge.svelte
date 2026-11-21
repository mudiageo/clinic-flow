<script lang="ts">
	import { Trophy } from '@lucide/svelte';

	let {
		label,
		sublabel = '',
		variant = 'gold'
	}: {
		label: string;
		sublabel?: string;
		variant?: 'gold' | 'silver' | 'primary';
	} = $props();

	const styles = {
		gold: 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300',
		silver: 'bg-muted border-border text-foreground',
		primary: 'bg-primary/10 border-primary/20 text-primary'
	};
</script>

<div
	class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium {styles[
		variant
	]}"
>
	<Trophy class="size-3 shrink-0 text-current opacity-80" />
	<span class="font-semibold">{label}</span>
	{#if sublabel}
		<span class="opacity-70 font-normal">· {sublabel}</span>
	{/if}
</div>
