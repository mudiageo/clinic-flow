<script lang="ts">
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '#lib/components/ui/card/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { ClipboardList, Filter } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { getAuditLog } from '#lib/remote/audit.remote.ts';
	import { formatDateTime } from '#lib/utils/date.ts';

	let page = $state(1);
	let actionFilter = $state('');
	let entityFilter = $state('');
	let showFilters = $state(false);
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
		<Button
			variant="outline"
			class="gap-2"
			aria-expanded={showFilters}
			onclick={() => (showFilters = !showFilters)}
		>
			<Filter class="size-4" />
			Filter Log
		</Button>
	</div>

	{#if showFilters}
		<Card>
			<CardContent class="p-4 space-y-4">
				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<label for="audit-action-filter" class="text-sm font-medium">Action</label>
						<Input
							id="audit-action-filter"
							placeholder="e.g. patient.update"
							bind:value={actionFilter}
						/>
					</div>
					<div class="space-y-2">
						<label for="audit-entity-filter" class="text-sm font-medium">Entity type</label>
						<Input id="audit-entity-filter" placeholder="e.g. patient" bind:value={entityFilter} />
					</div>
				</div>
				<div class="flex gap-2">
					<Button size="sm" onclick={() => (page = 1)}>Apply</Button>
					<Button
						size="sm"
						variant="outline"
						onclick={() => {
							actionFilter = '';
							entityFilter = '';
							page = 1;
						}}>Clear</Button
					>
				</div>
			</CardContent>
		</Card>
	{/if}

	{#await getAuditLog({ page, action: actionFilter, entityType: entityFilter })}
		<Card>
			<CardContent class="p-12 text-center text-muted-foreground">Loading audit log...</CardContent>
		</Card>
	{:then result}
		<Card class="overflow-hidden card-hover">
			<CardHeader class="border-b border-border bg-muted/20 px-6 py-4">
				<CardTitle class="text-base font-semibold">Recent Actions</CardTitle>
				<CardDescription class="mt-1">
					Showing {result.entries.length} of {result.total} entries
				</CardDescription>
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
					{#if result.entries.length === 0}
						<TableRow>
							<TableCell colspan={5} class="h-[400px]">
								<div class="flex flex-col items-center justify-center text-center h-full space-y-4">
									<div class="p-6 bg-primary/5 rounded-full mb-4">
										<ClipboardList class="size-16 text-primary/40" />
									</div>
									<h3 class="text-xl font-bold">
										{#if actionFilter || entityFilter}
											No entries match these filters.
										{:else}
											No audit entries yet
										{/if}
									</h3>
									<p class="text-muted-foreground max-w-md">
										{#if actionFilter || entityFilter}
											Try adjusting or clearing the filters to see more entries.
										{:else}
											Actions will appear here as staff use the system to create patients, update
											records, and manage the clinic.
										{/if}
									</p>
								</div>
							</TableCell>
						</TableRow>
					{:else}
						{#each result.entries as entry (entry.id)}
							<TableRow class="hover:bg-muted/40 transition-colors">
								<TableCell class="text-muted-foreground px-6"
									>{formatDateTime(entry.createdAt)}</TableCell
								>
								<TableCell class="font-medium px-6">{entry.staffName}</TableCell>
								<TableCell class="px-6">{entry.action}</TableCell>
								<TableCell class="px-6 capitalize">{entry.entityType}</TableCell>
								<TableCell class="text-right text-muted-foreground px-6 font-mono text-xs"
									>{entry.entityId}</TableCell
								>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>

			<div class="flex items-center justify-between border-t border-border px-6 py-3">
				<p class="text-xs text-muted-foreground">
					Page {result.page} of {Math.max(1, Math.ceil(result.total / result.pageSize))}
				</p>
				<div class="flex gap-2">
					<Button variant="outline" size="sm" disabled={page <= 1} onclick={() => (page -= 1)}
						>Previous</Button
					>
					<Button
						variant="outline"
						size="sm"
						disabled={page * result.pageSize >= result.total}
						onclick={() => (page += 1)}>Next</Button
					>
				</div>
			</div>
		</Card>
	{:catch}
		<Card>
			<CardContent class="p-12 text-center text-muted-foreground">
				Unable to load audit log.
			</CardContent>
		</Card>
	{/await}
</div>
