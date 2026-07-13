<script lang="ts">
	import type { HTMLTextareaAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	let {
		value = $bindable(""),
		ref = $bindable(null),
		class: className,
		...restProps
	}: HTMLTextareaAttributes & {
		ref?: HTMLTextAreaElement | null;
		value?: string;
	} = $props();
</script>

<textarea
	bind:this={ref}
	bind:value={value}
	class={cn(
		"border-input placeholder:text-muted-foreground focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1",
		className
	)}
	{...restProps}
></textarea>
