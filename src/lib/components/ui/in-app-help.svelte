<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import { Info } from '@lucide/svelte';
	
	let { content, title = "Help" } = $props();
</script>

<Popover.Root>
	<Popover.Trigger class="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary p-1 hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
		<Info class="size-3.5" />
	</Popover.Trigger>
	<Popover.Content class="w-64 p-3 text-sm shadow-md" side="top">
		<div class="space-y-2">
			<h4 class="font-medium text-foreground">{title}</h4>
			<p class="text-muted-foreground text-xs leading-relaxed">{content}</p>
		</div>
	</Popover.Content>
</Popover.Root>
