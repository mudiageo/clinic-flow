<script lang="ts">
	import { page } from '$app/state';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import ProfileContent from './profile-content.svelte';
</script>

<svelte:head>
	<title>Staff Profile & Permissions — ClinicFlow</title>
</svelte:head>

<svelte:boundary>
	<ProfileContent staffId={page.params.id} />
	
	{#snippet pending()}
		<div class="space-y-6 animate-fade-in max-w-4xl p-6">
			<Skeleton class="h-32 w-full rounded-2xl" />
			<Skeleton class="h-64 w-full rounded-2xl" />
		</div>
	{/snippet}

	{#snippet failed(error, reset)}
		<div class="p-6 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl m-6">
			<h3 class="font-bold">Error loading staff member</h3>
			<p>{error.message}</p>
			<button class="mt-4 text-sm font-medium underline" onclick={reset}>Try again</button>
		</div>
	{/snippet}
</svelte:boundary>
