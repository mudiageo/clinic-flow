<script lang="ts">
	import { patientStore } from '$lib/state/patients.svelte';
	import { encounterStore } from '$lib/state/encounters.svelte';
	import { vitalsStore } from '$lib/state/vitals.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import { Download, FileJson, AlertTriangle } from '@lucide/svelte';

	let isExporting = $state(false);
	let previewData = $state<any>(null);

	// Generate a standard DHIS2 JSON Event Payload
	function generatePayload() {
		// In a real DHIS2 integration, we would map these to specific Data Elements and Option Sets.
		// Here, we aggregate local clinic data into a simplified JSON representation.
		
		const totalPatients = patientStore.items.length;
		const totalEncounters = encounterStore.items.length;
		
		// Simple aggregation for demo purposes
		const genderSplit = patientStore.items.reduce((acc, p) => {
			acc[p.sex] = (acc[p.sex] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		const triageStats = vitalsStore.items.reduce((acc, v) => {
			acc[v.triageLevel] = (acc[v.triageLevel] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		const now = new Date();
		const period = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`; // YYYYMM format for DHIS2

		const payload = {
			dataSet: 'CLINIC_FLOW_DATASET_UID',
			completeDate: now.toISOString().split('T')[0],
			orgUnit: 'CLINIC_FLOW_LOCAL_PHC_UID',
			period: period,
			dataValues: [
				{ dataElement: 'TOTAL_PATIENTS_UID', value: totalPatients.toString() },
				{ dataElement: 'TOTAL_ENCOUNTERS_UID', value: totalEncounters.toString() },
				{ dataElement: 'PATIENTS_MALE_UID', value: (genderSplit['M'] || 0).toString() },
				{ dataElement: 'PATIENTS_FEMALE_UID', value: (genderSplit['F'] || 0).toString() },
				{ dataElement: 'TRIAGE_RED_UID', value: (triageStats['red'] || 0).toString() },
				{ dataElement: 'TRIAGE_AMBER_UID', value: (triageStats['amber'] || 0).toString() },
				{ dataElement: 'TRIAGE_GREEN_UID', value: (triageStats['green'] || 0).toString() }
			]
		};

		previewData = payload;
		return payload;
	}

	function handleDownload() {
		isExporting = true;
		try {
			const payload = generatePayload();
			const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			
			const a = document.createElement('a');
			a.href = url;
			a.download = `dhis2-dataValueSet-${previewData.period}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			toast.success('DHIS2 dataValueSet downloaded successfully');
		} catch (error: any) {
			toast.error('Export failed: ' + error.message);
		} finally {
			isExporting = false;
		}
	}
</script>

<svelte:head>
	<title>DHIS2 Export — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-10">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">DHIS2 Data Bridge</h1>
		<p class="text-muted-foreground">Export aggregated clinical data to the National Health Management Information System.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<FileJson class="size-5 text-indigo-600" />
					Export Payload
				</CardTitle>
				<CardDescription>
					Generates a deterministic JSON payload mapping local encounters to standard DHIS2 data elements.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 text-sm flex items-start gap-2">
					<AlertTriangle class="size-4 mt-0.5 shrink-0" />
					<p class="leading-relaxed">
						<strong>Clinical Integrity Warning:</strong> This module uses deterministic aggregation. 
						No AI processing is used to generate the final DHIS2 payload to prevent hallucinated data sets entering national records.
					</p>
				</div>

				<div class="flex justify-between items-center pt-4 border-t">
					<Button variant="outline" onclick={generatePayload}>Preview Data</Button>
					<Button onclick={handleDownload} disabled={isExporting || !previewData} class="bg-indigo-600 hover:bg-indigo-700">
						<Download class="size-4 mr-2" />
						Download JSON
					</Button>
				</div>
			</CardContent>
		</Card>

		{#if previewData}
			<Card class="border-border shadow-sm overflow-hidden animate-fade-in">
				<CardHeader class="bg-muted/30 pb-3 border-b border-border/50">
					<CardTitle class="text-base flex items-center justify-between">
						<span>dataValueSet Preview</span>
						<Badge variant="outline" class="font-mono bg-background">Period: {previewData.period}</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent class="p-0">
					<div class="overflow-x-auto">
						<table class="w-full text-sm text-left">
							<thead class="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/50">
								<tr>
									<th class="px-4 py-3 font-medium">Data Element UID</th>
									<th class="px-4 py-3 font-medium text-right">Value</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border/30">
								{#each previewData.dataValues as item}
									<tr class="hover:bg-muted/10 transition-colors">
										<td class="px-4 py-3 font-mono text-xs text-primary">{item.dataElement}</td>
										<td class="px-4 py-3 font-semibold text-right tabular-nums">{item.value}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div class="bg-muted/10 p-3 border-t border-border/30 text-xs text-muted-foreground flex justify-between">
						<span>OrgUnit: <span class="font-mono">{previewData.orgUnit}</span></span>
						<span>DataSet: <span class="font-mono">{previewData.dataSet}</span></span>
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
