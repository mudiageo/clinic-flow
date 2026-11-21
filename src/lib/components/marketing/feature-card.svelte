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
		default: 'bg-muted text-foreground',
		accent: 'bg-primary/10 text-primary',
		primary: 'bg-primary text-primary-foreground'
	};
</script>

<div
	class="flex flex-col gap-3.5 rounded-lg border border-border bg-card p-6 transition-colors hover:border-border/80"
>
	<div class="size-10 rounded-md {iconStyles[variant]} flex items-center justify-center shrink-0">
		{@render icon()}
	</div>
	<div>
		<h3 class="text-base font-bold text-foreground mb-1.5 tracking-tight">{title}</h3>
		<p class="text-muted-foreground text-sm leading-relaxed">{description}</p>
	</div>
</div>
