<script lang="ts">
	import { getFacilityDataQualityReview } from '#lib/remote/facility-registry.remote.ts';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
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
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Building2, ShieldAlert } from '@lucide/svelte';

	function errorMessage(error: unknown): string {
		return error instanceof Error ? error.message : 'Unknown error';
	}
</script>

<svelte:head>
	<title>Facility Review — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-5xl mx-auto">
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<Building2 class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Facility Registry Review</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Compare locally registered PHC identity with Nigeria's national Health Facility Registry.
			</p>
		</div>
	</div>

	<div
		class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300 flex gap-3"
	>
		<ShieldAlert class="size-5 shrink-0 mt-0.5" />
		<div class="space-y-1">
			<p class="font-semibold">Advisory data — not authoritative</p>
			<p>
				Registry matches and suggestions are reference data for review only. They are never applied
				to PHC records automatically. Verify every facility detail with the facility and an
				authorized administrator before making any change. Locally maintained records remain the
				source of truth.
			</p>
		</div>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Facility data quality</CardTitle>
			<CardDescription>Local PHC identity versus registry lookup results</CardDescription>
		</CardHeader>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>PHC Name</TableHead>
						<TableHead>State</TableHead>
						<TableHead>LGA</TableHead>
						<TableHead>Registry Match</TableHead>
						<TableHead>Availability</TableHead>
						<TableHead>Suggestions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#await getFacilityDataQualityReview()}
						<TableRow>
							<TableCell colspan={6} class="text-center py-8 text-muted-foreground animate-pulse">
								Loading facility review...
							</TableCell>
						</TableRow>
					{:then rows}
						{#each rows as row (row.phcId)}
							<TableRow>
								<TableCell class="font-medium">{row.phcName}</TableCell>
								<TableCell class="text-muted-foreground">{row.state || '—'}</TableCell>
								<TableCell class="text-muted-foreground">{row.lga || '—'}</TableCell>
								<TableCell>
									{#if row.matched}
										<Badge
											variant="outline"
											class="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
										>
											Matched
										</Badge>
									{:else}
										<Badge
											variant="outline"
											class="bg-amber-500/10 text-amber-600 border-amber-500/20"
										>
											No match
										</Badge>
									{/if}
								</TableCell>
								<TableCell>
									{#if row.availability === 'live'}
										<Badge variant="outline" class="bg-primary/10 text-primary border-primary/20">
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
								<TableCell>
									{#if row.suggestions.length > 0}
										<ul class="space-y-0.5 text-xs text-muted-foreground">
											{#each row.suggestions.slice(0, 3) as suggestion (suggestion.registryId ?? suggestion.name)}
												<li class="truncate max-w-[240px]">{suggestion.name}</li>
											{/each}
											{#if row.suggestions.length > 3}
												<li>+{row.suggestions.length - 3} more</li>
											{/if}
										</ul>
									{:else}
										<span class="text-xs text-muted-foreground">—</span>
									{/if}
								</TableCell>
							</TableRow>
						{:else}
							<TableRow>
								<TableCell colspan={6} class="text-center py-8 text-muted-foreground">
									No facilities to review.
								</TableCell>
							</TableRow>
						{/each}
					{:catch error}
						<TableRow>
							<TableCell colspan={6} class="text-center py-8 text-destructive">
								Unable to load the facility review: {errorMessage(error)}
							</TableCell>
						</TableRow>
					{/await}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
