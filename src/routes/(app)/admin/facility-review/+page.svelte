<script lang="ts">
	import { getFacilityDataQualityReview } from '#lib/remote/facility-registry.remote.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { ShieldAlert } from '@lucide/svelte';

	function errorMessage(error: unknown): string {
		return error instanceof Error ? error.message : 'Unknown error';
	}
</script>

<svelte:head>
	<title>Facility Review — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Registry Verification
		</p>
		<h1 class="text-2xl font-bold text-foreground tracking-tight">Facility Registry Review</h1>
		<p class="text-muted-foreground text-sm mt-0.5">
			Compare locally registered PHC identity with Nigeria's national Health Facility Registry
		</p>
	</div>

	<div
		class="rounded-xl border border-triage-amber/40 border-l-4 border-l-triage-amber bg-triage-amber/10 p-4 text-sm text-foreground flex gap-3"
	>
		<ShieldAlert class="size-5 shrink-0 mt-0.5 text-amber-700 dark:text-triage-amber" />
		<div class="space-y-1">
			<p class="font-semibold">Advisory data — not authoritative</p>
			<p class="text-xs text-muted-foreground leading-relaxed">
				Registry matches and suggestions are reference data for review only. They are never applied
				to PHC records automatically. Verify every facility detail with the facility and an
				authorized administrator before making any change. Locally maintained records remain the
				source of truth.
			</p>
		</div>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="px-5 py-3.5 border-b border-border bg-muted/20">
			<h2 class="text-base font-semibold">Facility Data Quality</h2>
			<p class="text-xs text-muted-foreground">Local PHC identity versus registry lookup results</p>
		</div>
		<Table>
			<TableHeader class="bg-muted/40">
				<TableRow class="hover:bg-transparent">
					<TableHead class="font-mono text-xs uppercase tracking-wider px-5">PHC Name</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">State</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">LGA</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Registry Match</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Availability</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider px-5">Suggestions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#await getFacilityDataQualityReview()}
					<TableRow>
						<TableCell colspan={6} class="text-center py-10 text-muted-foreground animate-pulse">
							Loading facility review...
						</TableCell>
					</TableRow>
				{:then rows}
					{#each rows as row, idx (row.phcId)}
						<TableRow class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}>
							<TableCell class="font-semibold px-5">{row.phcName}</TableCell>
							<TableCell class="text-muted-foreground text-sm">{row.state || '—'}</TableCell>
							<TableCell class="text-muted-foreground text-sm">{row.lga || '—'}</TableCell>
							<TableCell>
								{#if row.matched}
									<Badge
										variant="outline"
										class="bg-triage-green/15 text-triage-green border-triage-green/30"
									>
										Matched
									</Badge>
								{:else}
									<Badge
										variant="outline"
										class="bg-triage-amber/15 text-foreground border-triage-amber/40"
									>
										No match
									</Badge>
								{/if}
							</TableCell>
							<TableCell>
								{#if row.availability === 'live'}
									<Badge variant="outline" class="bg-primary/10 text-primary border-primary/25">
										Live
									</Badge>
								{:else}
									<Badge variant="outline" class="text-muted-foreground">
										{row.availability}
									</Badge>
								{/if}
								{#if row.reason}
									<p class="mt-1 text-[11px] text-muted-foreground max-w-[220px]">
										{row.reason}
									</p>
								{/if}
							</TableCell>
							<TableCell class="px-5">
								{#if row.suggestions.length > 0}
									<ul class="space-y-0.5 text-xs text-muted-foreground">
										{#each row.suggestions.slice(0, 3) as suggestion (suggestion.registryId ?? suggestion.name)}
											<li class="truncate max-w-[240px]">{suggestion.name}</li>
										{/each}
										{#if row.suggestions.length > 3}
											<li class="font-mono">+{row.suggestions.length - 3} more</li>
										{/if}
									</ul>
								{:else}
									<span class="text-xs text-muted-foreground">—</span>
								{/if}
							</TableCell>
						</TableRow>
					{:else}
						<TableRow>
							<TableCell colspan={6} class="text-center py-10 text-muted-foreground">
								No facilities to review.
							</TableCell>
						</TableRow>
					{/each}
				{:catch error}
					<TableRow>
						<TableCell colspan={6} class="text-center py-10 text-destructive">
							Unable to load the facility review: {errorMessage(error)}
						</TableCell>
					</TableRow>
				{/await}
			</TableBody>
		</Table>
	</section>
</div>
