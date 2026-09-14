<script lang="ts">
	let { children } = $props();
</script>

<article class="prose prose-slate dark:prose-invert prose-headings:font-bold prose-a:text-primary max-w-[800px] w-full">
	{@render children()}
</article>
