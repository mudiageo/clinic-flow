<script lang="ts">
	import { getPlatformPermissionsAudit } from '$lib/remote/permissions.remote';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Shield } from '@lucide/svelte';
	import DataTable from './data-table.svelte';
	import { columns } from './columns';

	let data: any[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		getPlatformPermissionsAudit()
			.then((res) => {
				data = res as unknown as any[];
				loading = false;
			})
			.catch((err) => {
				error = err.message;
				loading = false;
			});
	});
</script>

<svelte:head>
	<title>Permissions Audit — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-6xl">
	<div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="p-2 rounded-xl bg-primary/10 text-primary">
				<Shield class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-foreground">
					Platform Permissions Audit
				</h1>
				<p class="text-muted-foreground text-sm">
					View all granular permission grants across all primary healthcare centers.
				</p>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="p-8 space-y-4 bg-card border rounded-2xl">
			<Skeleton class="h-10 w-full" />
			<Skeleton class="h-10 w-full" />
			<Skeleton class="h-10 w-full" />
			<Skeleton class="h-10 w-full" />
		</div>
	{:else if error}
		<div class="p-6 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl">
			<h3 class="font-bold">Error loading audit data</h3>
			<p>{error}</p>
		</div>
	{:else}
		<DataTable {data} {columns} />
	{/if}
</div>
