<script lang="ts">
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

<div class="space-y-6 max-w-6xl mx-auto">
	<div
		class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Compliance &amp; Traceability
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Audit Log</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				A complete record of all actions performed in this system
			</p>
		</div>
		<Button
			variant="outline"
			class="gap-2 min-h-10"
			aria-expanded={showFilters}
			onclick={() => (showFilters = !showFilters)}
		>
			<Filter class="size-4" />
			Filter Log
		</Button>
	</div>

	{#if showFilters}
		<section class="rounded-xl border border-border bg-card p-5 space-y-4">
			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-1.5">
					<label for="audit-action-filter" class="text-xs font-medium">Action</label>
					<Input
						id="audit-action-filter"
						placeholder="e.g. patient.update"
						class="h-10"
						bind:value={actionFilter}
					/>
				</div>
				<div class="space-y-1.5">
					<label for="audit-entity-filter" class="text-xs font-medium">Entity type</label>
					<Input
						id="audit-entity-filter"
						placeholder="e.g. patient"
						class="h-10"
						bind:value={entityFilter}
					/>
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
					}}
				>
					Clear
				</Button>
			</div>
		</section>
	{/if}

	{#await getAuditLog({ page, action: actionFilter, entityType: entityFilter })}
		<div class="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
			Loading audit log...
		</div>
	{:then result}
		<section class="rounded-xl border border-border bg-card overflow-hidden">
			<div class="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center justify-between">
				<div>
					<h2 class="text-base font-semibold">Recent Actions</h2>
					<p class="text-xs font-mono text-muted-foreground mt-0.5">
						Showing {result.entries.length} of {result.total} entries
					</p>
				</div>
			</div>

			<Table>
				<TableHeader class="bg-muted/40">
					<TableRow class="hover:bg-transparent">
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5">Timestamp</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5">Staff Name</TableHead
						>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5">Action</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5"
							>Entity Type</TableHead
						>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 text-right"
							>Entity ID</TableHead
						>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if result.entries.length === 0}
						<TableRow>
							<TableCell colspan={5} class="h-72 text-center">
								<div class="flex flex-col items-center justify-center space-y-3">
									<div class="p-4 bg-primary/8 rounded-full">
										<ClipboardList class="size-10 text-primary/40" />
									</div>
									<h3 class="text-base font-bold">
										{#if actionFilter || entityFilter}
											No entries match these filters.
										{:else}
											No audit entries yet
										{/if}
									</h3>
									<p class="text-xs text-muted-foreground max-w-md">
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
						{#each result.entries as entry, idx (entry.id)}
							<TableRow
								class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}
							>
								<TableCell class="text-muted-foreground font-mono text-xs px-5">
									{formatDateTime(entry.createdAt)}
								</TableCell>
								<TableCell class="font-medium px-5">{entry.staffName}</TableCell>
								<TableCell class="px-5 font-mono text-xs">{entry.action}</TableCell>
								<TableCell class="px-5 capitalize text-sm">{entry.entityType}</TableCell>
								<TableCell class="text-right text-muted-foreground px-5 font-mono text-xs">
									{entry.entityId}
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>

			<div class="flex items-center justify-between border-t border-border px-5 py-3 bg-muted/15">
				<p class="text-xs font-mono text-muted-foreground">
					Page {result.page} of {Math.max(1, Math.ceil(result.total / result.pageSize))}
				</p>
				<div class="flex gap-2">
					<Button variant="outline" size="sm" disabled={page <= 1} onclick={() => (page -= 1)}>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={page * result.pageSize >= result.total}
						onclick={() => (page += 1)}
					>
						Next
					</Button>
				</div>
			</div>
		</section>
	{:catch}
		<div class="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
			Unable to load audit log.
		</div>
	{/await}
</div>
