<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		icon,
		title,
		description,
		variant = 'default'
	}: {
		icon: Snippet;
		title: string;
		description: string;
		variant?: 'default' | 'accent' | 'primary';
	} = $props();

	const iconStyles = {
		default: 'bg-primary/10 text-primary',
		accent: 'bg-accent/20 text-accent-foreground',
		primary: 'bg-primary text-primary-foreground'
	};
</script>

<div
	class="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
>
	<div class="size-12 rounded-xl {iconStyles[variant]} flex items-center justify-center shrink-0">
		{@render icon()}
	</div>
	<div>
		<h3 class="text-lg font-bold text-foreground mb-2">{title}</h3>
		<p class="text-muted-foreground text-sm leading-relaxed">{description}</p>
	</div>
</div>
