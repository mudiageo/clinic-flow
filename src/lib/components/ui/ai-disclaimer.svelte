<script lang="ts">
	import { AlertTriangle } from '@lucide/svelte';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';

	let { compact = false } = $props();
</script>

<Alert variant="default" class="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
	<AlertTriangle class="size-4 text-amber-600 dark:text-amber-500" />
	<AlertTitle class="font-bold tracking-wide uppercase text-xs mb-1">
		Experimental AI Feature
	</AlertTitle>
	<AlertDescription class="text-xs font-medium leading-relaxed">
		This system uses Artificial Intelligence to process healthcare data. It is for <strong>informational and research purposes only</strong>. It can make severe mistakes and is <strong>not a substitute for professional clinical judgment</strong>. Always verify outputs independently.
	</AlertDescription>
</Alert>
