<script lang="ts">
	import { getPlatformPermissionsAudit } from '#lib/remote/permissions.remote.ts';
	import { Skeleton } from '#lib/components/ui/skeleton/index.ts';
	import DataTable from './data-table.svelte';
	import { columns } from './columns';

	type AuditRow = Awaited<ReturnType<typeof getPlatformPermissionsAudit>>[number];

	let data: AuditRow[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		getPlatformPermissionsAudit()
			.then((res) => {
				data = res;
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
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Superadmin // Access Control
		</p>
		<h1 class="text-2xl font-bold tracking-tight text-foreground">Platform Permissions Audit</h1>
		<p class="text-muted-foreground text-sm mt-0.5">
			View all granular permission grants across all primary healthcare centers.
		</p>
	</div>

	{#if loading}
		<div class="p-6 space-y-4 bg-card border border-border rounded-xl">
			<Skeleton class="h-10 w-full" />
			<Skeleton class="h-10 w-full" />
			<Skeleton class="h-10 w-full" />
			<Skeleton class="h-10 w-full" />
		</div>
	{:else if error}
		<div class="p-6 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
			<h3 class="font-bold">Error loading audit data</h3>
			<p class="text-sm mt-1">{error}</p>
		</div>
	{:else}
		<DataTable {data} {columns} />
	{/if}
</div>
