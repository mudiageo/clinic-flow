<script lang="ts">
	import { patientStore } from '$lib/state/patients.svelte';
	import { encounterStore } from '$lib/state/encounters.svelte';
	import { vitalsStore } from '$lib/state/vitals.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import { Download, FileJson, AlertTriangle } from 'lucide-svelte';

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

		const payload = {
			orgUnit: 'CLINIC_FLOW_LOCAL_PHC',
			period: new Date().toISOString().slice(0, 7), // YYYY-MM
			dataValues: [
				{ dataElement: 'TOTAL_PATIENTS', value: totalPatients },
				{ dataElement: 'TOTAL_ENCOUNTERS', value: totalEncounters },
				{ dataElement: 'PATIENTS_MALE', value: genderSplit['M'] || 0 },
				{ dataElement: 'PATIENTS_FEMALE', value: genderSplit['F'] || 0 },
				{ dataElement: 'TRIAGE_RED', value: triageStats['red'] || 0 },
				{ dataElement: 'TRIAGE_AMBER', value: triageStats['amber'] || 0 },
				{ dataElement: 'TRIAGE_GREEN', value: triageStats['green'] || 0 }
			],
			timestamp: new Date().toISOString()
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
			a.download = `dhis2-export-${new Date().toISOString().slice(0, 10)}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			toast.success('DHIS2 Payload downloaded successfully');
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

<div class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">DHIS2 Data Bridge</h1>
		<p class="text-muted-foreground">Export aggregated clinical data to the National Health Management Information System.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
					<Button onclick={handleDownload} disabled={isExporting} class="bg-indigo-600 hover:bg-indigo-700">
						<Download class="size-4 mr-2" />
						Download JSON
					</Button>
				</div>
			</CardContent>
		</Card>

		{#if previewData}
			<Card class="bg-slate-950 text-slate-50 border-slate-800 overflow-hidden">
				<CardHeader class="border-b border-slate-800 pb-3">
					<CardTitle class="text-sm font-mono text-slate-300">Payload Preview</CardTitle>
				</CardHeader>
				<CardContent class="p-0">
					<pre class="p-4 text-xs font-mono overflow-auto max-h-[300px] text-green-400">{JSON.stringify(previewData, null, 2)}</pre>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
