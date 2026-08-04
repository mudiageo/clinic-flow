<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { ClipboardList, Filter } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props<{ data: { entries: any[], total: number } }>();
</script>

<svelte:head>
	<title>Audit Log — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<ClipboardList class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Audit Log</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					A complete record of all actions performed in this system.
				</p>
			</div>
		</div>
		<Button variant="outline" class="gap-2">
			<Filter class="size-4" />
			Filter Log
		</Button>
	</div>

	<Card class="overflow-hidden card-hover">
		<CardHeader class="border-b border-border bg-muted/20 px-6 py-4">
			<CardTitle class="text-base font-semibold">Recent Actions</CardTitle>
		</CardHeader>
		
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead class="font-semibold px-6">Timestamp</TableHead>
					<TableHead class="font-semibold px-6">Staff Name</TableHead>
					<TableHead class="font-semibold px-6">Action</TableHead>
					<TableHead class="font-semibold px-6">Entity Type</TableHead>
					<TableHead class="font-semibold px-6 text-right">Entity ID</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if !data?.entries || data.entries.length === 0}
					<TableRow>
						<TableCell colspan={5} class="h-[400px]">
							<div class="flex flex-col items-center justify-center text-center h-full space-y-4">
								<div class="p-6 bg-primary/5 rounded-full mb-4">
									<ClipboardList class="size-16 text-primary/40" />
								</div>
								<h3 class="text-xl font-bold">No audit entries yet</h3>
								<p class="text-muted-foreground max-w-md">
									Actions will appear here as staff use the system to create patients, update records, and manage the clinic.
								</p>
							</div>
						</TableCell>
					</TableRow>
				{:else}
					{#each data.entries as entry}
						<TableRow class="hover:bg-muted/40 transition-colors">
							<TableCell class="text-muted-foreground px-6">{new Date(entry.createdAt).toLocaleString()}</TableCell>
							<TableCell class="font-medium px-6">{entry.staffName}</TableCell>
							<TableCell class="px-6">{entry.action}</TableCell>
							<TableCell class="px-6 capitalize">{entry.entityType}</TableCell>
							<TableCell class="text-right text-muted-foreground px-6 font-mono text-xs">{entry.entityId}</TableCell>
						</TableRow>
					{/each}
				{/if}
			</TableBody>
		</Table>
	</Card>
</div>
