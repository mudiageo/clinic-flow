<script lang="ts">
	let {
		eyebrow = '',
		heading,
		subheading = '',
		align = 'center'
	}: {
		eyebrow?: string;
		heading: string;
		subheading?: string;
		align?: 'center' | 'left';
	} = $props();
</script>

<div class="mb-14 {align === 'center' ? 'text-center' : 'text-left'}">
	{#if eyebrow}
		<div
			class="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary mb-4"
		>
			{eyebrow}
		</div>
	{/if}
	<h2
		class="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground {align === 'center'
			? 'max-w-2xl mx-auto'
			: ''}"
	>
		{heading}
	</h2>
	{#if subheading}
		<p
			class="mt-4 text-muted-foreground text-lg leading-relaxed {align === 'center'
				? 'max-w-2xl mx-auto'
				: 'max-w-2xl'}"
		>
			{subheading}
		</p>
	{/if}
</div>
