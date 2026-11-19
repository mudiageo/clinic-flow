<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import { Bell } from '@lucide/svelte';

	let {
		title,
		description,
		eta = ''
	}: {
		title: string;
		description: string;
		eta?: string;
	} = $props();
</script>

<div class="container mx-auto px-4 md:px-8 max-w-2xl py-24 md:py-36 text-center space-y-6">
	<div class="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
		<Bell class="size-8" />
	</div>
	<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">{title}</h1>
	<p class="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">{description}</p>
	{#if eta}
		<p class="text-sm text-muted-foreground">Expected: <strong class="text-foreground">{eta}</strong></p>
	{/if}
	<div class="flex flex-col sm:flex-row gap-3 justify-center pt-2">
		<Button href="/" variant="outline" class="rounded-full font-semibold">← Back to home</Button>
		<Button href="/contact" class="rounded-full font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20">
			Get notified
		</Button>
	</div>
</div>
