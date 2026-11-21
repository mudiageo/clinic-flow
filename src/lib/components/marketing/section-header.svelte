<script lang="ts">
	let {
		eyebrow = '',
		heading,
		subheading = '',
		align = 'left'
	}: {
		eyebrow?: string;
		heading: string;
		subheading?: string;
		align?: 'left' | 'center';
	} = $props();
</script>

<div class="mb-12 {align === 'center' ? 'text-center mx-auto max-w-2xl' : 'text-left max-w-3xl'}">
	{#if eyebrow}
		<p class="text-xs font-mono font-semibold tracking-wider text-primary mb-2.5">
			{eyebrow}
		</p>
	{/if}
	<h2
		class="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]"
	>
		{heading}
	</h2>
	{#if subheading}
		<p class="mt-3.5 text-muted-foreground text-base sm:text-lg leading-relaxed">
			{subheading}
		</p>
	{/if}
</div>
