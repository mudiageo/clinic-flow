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
		gold: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
		silver: 'bg-slate-400/10 border-slate-400/30 text-slate-600 dark:text-slate-300',
		primary: 'bg-primary/10 border-primary/30 text-primary'
	};
</script>

<div
	class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold {styles[variant]}"
>
	<Trophy class="size-3.5 shrink-0" />
	<span>{label}</span>
	{#if sublabel}
		<span class="font-normal opacity-70">· {sublabel}</span>
	{/if}
</div>
