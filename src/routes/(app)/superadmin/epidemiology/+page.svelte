<script lang="ts">
	import { getOutbreakData } from '$lib/remote/epidemiology.remote';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Globe, AlertTriangle, ShieldAlert, FileText, Download } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	let isGenerating = false;

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

<div class="space-y-8 animate-fade-in max-w-6xl mx-auto py-8">
	<div class="flex items-start justify-between">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-destructive/10 text-destructive">
				<Globe class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Disease Surveillance & Outbreaks</h1>
				<p class="text-muted-foreground text-sm mt-0.5">
					LGA-level heatmap and epidemiological trends across all facilities.
				</p>
			</div>
		</div>
		<Button onclick={generateReport} disabled={isGenerating}>
			<Download class="size-4 mr-2" /> 
			{isGenerating ? 'Generating...' : 'Weekly Summary PDF'}
		</Button>
	</div>

	{#await getOutbreakData()}
		<div class="flex items-center justify-center py-20 text-muted-foreground animate-pulse">
			Compiling surveillance data...
		</div>
	{:then data}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<Card class="md:col-span-2">
				<CardHeader>
					<CardTitle>LGA-Level Outbreak Heatmap</CardTitle>
					<CardDescription>Consolidated reports mapped by Local Government Area</CardDescription>
				</CardHeader>
				<CardContent class="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Location (LGA)</TableHead>
								<TableHead class="text-right">Malaria/Fever</TableHead>
								<TableHead class="text-right">Cholera/Diarrhea</TableHead>
								<TableHead class="text-right">Measles</TableHead>
								<TableHead class="text-right">Typhoid</TableHead>
								<TableHead class="text-right">Risk Level</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each data as lga}
								<TableRow>
									<TableCell class="font-medium">
										{lga.lga}, {lga.state}
									</TableCell>
									<TableCell class="text-right font-mono text-sm">{lga.cases.malaria}</TableCell>
									<TableCell class="text-right font-mono text-sm">{lga.cases.cholera}</TableCell>
									<TableCell class="text-right font-mono text-sm">{lga.cases.measles}</TableCell>
									<TableCell class="text-right font-mono text-sm">{lga.cases.typhoid}</TableCell>
									<TableCell class="text-right">
										{#if lga.riskLevel === 'High'}
											<Badge class="bg-destructive hover:bg-destructive text-destructive-foreground">HIGH</Badge>
										{:else if lga.riskLevel === 'Medium'}
											<Badge class="bg-amber-500 hover:bg-amber-600 text-white">MEDIUM</Badge>
										{:else}
											<Badge class="bg-green-500 hover:bg-green-600 text-white">LOW</Badge>
										{/if}
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<div class="space-y-6">
				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-base flex items-center gap-2 text-destructive">
							<AlertTriangle class="size-4" /> Active Alerts
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						{#each data.filter(d => d.riskLevel === 'High') as alert}
							<div class="p-3 border border-destructive/20 bg-destructive/5 rounded-lg text-sm">
								<p class="font-bold text-destructive mb-1">{alert.lga}, {alert.state}</p>
								<p class="text-muted-foreground">Elevated risk of transmission. Monitoring recommended.</p>
							</div>
						{/each}
						{#if data.filter(d => d.riskLevel === 'High').length === 0}
							<p class="text-sm text-muted-foreground text-center py-4">No high-risk LGAs.</p>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>
	{/await}
</div>
