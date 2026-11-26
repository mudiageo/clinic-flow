<script lang="ts">
	import { getOutbreakData } from '#lib/remote/epidemiology.remote.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { AlertTriangle, Download } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button/index.ts';

	let isGenerating = $state(false);

	function generateReport() {
		isGenerating = true;
		setTimeout(() => {
			isGenerating = false;
			alert('Weekly Epidemiological Summary downloaded as PDF (Demo).');
		}, 1500);
	}
</script>

<svelte:head>
	<title>Epidemiology Map — Superadmin</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<div
		class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Surveillance
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">
				Disease Surveillance &amp; Outbreaks
			</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				LGA-level heatmap and epidemiological trends across all facilities
			</p>
		</div>
		<Button class="min-h-10 px-4 font-semibold" onclick={generateReport} disabled={isGenerating}>
			<Download class="size-4 mr-2" />
			{isGenerating ? 'Generating…' : 'Weekly Summary PDF'}
		</Button>
	</div>

	{#await getOutbreakData()}
		<div class="flex items-center justify-center py-20 text-muted-foreground animate-pulse">
			Compiling surveillance data...
		</div>
	{:then data}
		{#if data.length === 0}
			<div
				class="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-muted-foreground"
			>
				No encounter data recorded in the last 30 days.
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<section class="md:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
					<div class="px-5 py-3.5 border-b border-border bg-muted/20">
						<h2 class="text-base font-semibold">LGA-Level Outbreak Heatmap</h2>
						<p class="text-xs text-muted-foreground">
							Consolidated reports mapped by Local Government Area
						</p>
					</div>
					<p class="px-5 py-2.5 text-xs text-muted-foreground border-b border-border bg-muted/10">
						Counts are indicative keyword matches from encounter notes over the last 30 days, not
						diagnoses.
					</p>
					<Table>
						<TableHeader class="bg-muted/40">
							<TableRow class="hover:bg-transparent">
								<TableHead class="font-mono text-xs uppercase tracking-wider px-5"
									>Location (LGA)</TableHead
								>
								<TableHead class="text-right font-mono text-xs uppercase tracking-wider"
									>Malaria</TableHead
								>
								<TableHead class="text-right font-mono text-xs uppercase tracking-wider"
									>Cholera</TableHead
								>
								<TableHead class="text-right font-mono text-xs uppercase tracking-wider"
									>Measles</TableHead
								>
								<TableHead class="text-right font-mono text-xs uppercase tracking-wider"
									>Typhoid</TableHead
								>
								<TableHead class="text-right font-mono text-xs uppercase tracking-wider px-5"
									>Risk</TableHead
								>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each data as lga, idx (lga.lga)}
								<TableRow class={idx % 2 === 1 ? 'bg-muted/20' : ''}>
									<TableCell class="font-medium px-5">{lga.lga}, {lga.state}</TableCell>
									<TableCell class="text-right font-mono tabular-nums text-sm"
										>{lga.cases.malaria}</TableCell
									>
									<TableCell class="text-right font-mono tabular-nums text-sm"
										>{lga.cases.cholera}</TableCell
									>
									<TableCell class="text-right font-mono tabular-nums text-sm"
										>{lga.cases.measles}</TableCell
									>
									<TableCell class="text-right font-mono tabular-nums text-sm"
										>{lga.cases.typhoid}</TableCell
									>
									<TableCell class="text-right px-5">
										{#if lga.riskLevel === 'High'}
											<Badge class="bg-triage-red text-triage-red-foreground">HIGH</Badge>
										{:else if lga.riskLevel === 'Medium'}
											<Badge class="bg-triage-amber text-triage-amber-foreground">MEDIUM</Badge>
										{:else}
											<Badge class="bg-triage-green text-triage-green-foreground">LOW</Badge>
										{/if}
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</section>

				<section class="rounded-xl border border-border bg-card overflow-hidden h-fit">
					<div class="px-5 py-3.5 border-b border-border bg-muted/20">
						<h2 class="text-base font-semibold flex items-center gap-2 text-triage-red">
							<AlertTriangle class="size-4" /> Active Alerts
						</h2>
					</div>
					<div class="p-5 space-y-3">
						{#each data.filter((d) => d.riskLevel === 'High') as alert (alert.lga)}
							<div
								class="p-3.5 border border-triage-red/30 border-l-4 border-l-triage-red bg-triage-red/8 rounded-lg text-sm"
							>
								<p class="font-bold text-triage-red mb-1">{alert.lga}, {alert.state}</p>
								<p class="text-xs text-foreground/85">
									Elevated risk of transmission. Monitoring recommended.
								</p>
							</div>
						{/each}
						{#if data.filter((d) => d.riskLevel === 'High').length === 0}
							<p class="text-sm text-muted-foreground text-center py-4">No high-risk LGAs.</p>
						{/if}
					</div>
				</section>
			</div>
		{/if}
	{/await}
</div>
