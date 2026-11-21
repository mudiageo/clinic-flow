<script lang="ts">
	let {
		value,
		label,
		source = '',
		accent = false
	}: {
		value: string;
		label: string;
		source?: string;
		accent?: boolean;
	} = $props();
</script>

<div
	class="flex flex-col gap-2 rounded-lg border border-border bg-card p-5 transition-colors {accent
		? 'border-primary/30 bg-primary/5'
		: ''}"
>
	<div
		class="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono {accent
			? 'text-primary'
			: 'text-foreground'}"
	>
		{value}
	</div>
	<div class="text-xs sm:text-sm font-medium text-foreground leading-snug">{label}</div>
	{#if source}
		<div class="text-[11px] text-muted-foreground/80 mt-auto pt-1">{source}</div>
	{/if}
</div>
