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
	class="flex flex-col gap-1 rounded-2xl border border-border bg-card p-6 shadow-sm {accent
		? 'border-primary/20 bg-primary/5'
		: ''}"
>
	<div class="text-3xl font-extrabold tracking-tight {accent ? 'text-primary' : 'text-foreground'}">
		{value}
	</div>
	<div class="text-sm font-medium text-foreground leading-snug">{label}</div>
	{#if source}
		<div class="text-xs text-muted-foreground mt-1">{source}</div>
	{/if}
</div>
