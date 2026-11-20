<script lang="ts">
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { encounterStore } from '#lib/state/encounters.svelte.ts';
	import { vitalsStore } from '#lib/state/vitals.svelte.ts';
	import { getDhis2Config, updateDhis2Config } from '#lib/remote/dhis2.remote.ts';
	import { DHIS2_DEFAULT_UIDS, type Dhis2UidKey } from '#lib/config/dhis2.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from '#lib/components/ui/dialog/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '#lib/components/ui/card/index.ts';
	import { toast } from 'svelte-sonner';
	import {
		Download,
		FileJson,
		AlertTriangle,
		Settings2,
		CheckCircle2,
		Save,
		Loader2
	} from '@lucide/svelte';

	type Dhis2Draft = Record<Dhis2UidKey, string>;

	const UID_FIELDS: { key: Dhis2UidKey; label: string }[] = [
		{ key: 'dataSetUid', label: 'Dataset UID' },
		{ key: 'orgUnitUid', label: 'Organisation unit UID' },
		{ key: 'totalPatientsUid', label: 'Total patients data element UID' },
		{ key: 'totalEncountersUid', label: 'Total encounters data element UID' },
		{ key: 'patientsMaleUid', label: 'Male patients data element UID' },
		{ key: 'patientsFemaleUid', label: 'Female patients data element UID' },
		{ key: 'triageRedUid', label: 'Triage red data element UID' },
		{ key: 'triageAmberUid', label: 'Triage amber data element UID' },
		{ key: 'triageGreenUid', label: 'Triage green data element UID' }
	];

	const configQuery = getDhis2Config();
	const config = $derived(
		configQuery.current ?? {
			...DHIS2_DEFAULT_UIDS,
			configured: false,
			updatedAt: null
		}
	);
	let draft = $state<Dhis2Draft>({ ...DHIS2_DEFAULT_UIDS });
	let isExporting = $state(false);
	let previewData = $state<any>(null);
	let configDialogOpen = $state(false);
	let isSavingConfig = $state(false);

	function uidValue(key: Dhis2UidKey): string {
		return config[key]?.trim() || DHIS2_DEFAULT_UIDS[key];
	}

	function openConfigDialog() {
		draft = { ...DHIS2_DEFAULT_UIDS };
		for (const field of UID_FIELDS) draft[field.key] = uidValue(field.key);
		configDialogOpen = true;
	}

	async function saveConfig() {
		if (UID_FIELDS.some((field) => !draft[field.key].trim())) {
			toast.error('All nine DHIS2 UIDs are required.');
			return;
		}
		isSavingConfig = true;
		try {
			await updateDhis2Config({
				dataSetUid: draft.dataSetUid.trim(),
				orgUnitUid: draft.orgUnitUid.trim(),
				totalPatientsUid: draft.totalPatientsUid.trim(),
				totalEncountersUid: draft.totalEncountersUid.trim(),
				patientsMaleUid: draft.patientsMaleUid.trim(),
				patientsFemaleUid: draft.patientsFemaleUid.trim(),
				triageRedUid: draft.triageRedUid.trim(),
				triageAmberUid: draft.triageAmberUid.trim(),
				triageGreenUid: draft.triageGreenUid.trim()
			});
			await configQuery.refresh();
			configDialogOpen = false;
			if (previewData) generatePayload();
			toast.success('DHIS2 UIDs saved.');
		} catch (error) {
			toast.error(
				'Unable to save DHIS2 configuration: ' +
					(error instanceof Error ? error.message : 'Unknown error')
			);
		} finally {
			isSavingConfig = false;
		}
	}

	// Generate a standard DHIS2 JSON Event Payload
	function generatePayload() {
		// In a real DHIS2 integration, we would map these to specific Data Elements and Option Sets.
		// Here, we aggregate local clinic data into a simplified JSON representation.

		const totalPatients = patientStore.items.length;
		const totalEncounters = encounterStore.items.length;

		// Simple aggregation for demo purposes
		const genderSplit = patientStore.items.reduce(
			(acc, p) => {
				acc[p.sex] = (acc[p.sex] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const triageStats = vitalsStore.items.reduce(
			(acc, v) => {
				acc[v.triageLevel] = (acc[v.triageLevel] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const now = new Date();
		const period = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`; // YYYYMM format for DHIS2

		const payload = {
			dataSet: uidValue('dataSetUid'),
			completeDate: now.toISOString().split('T')[0],
			orgUnit: uidValue('orgUnitUid'),
			period: period,
			dataValues: [
				{ dataElement: uidValue('totalPatientsUid'), value: totalPatients.toString() },
				{ dataElement: uidValue('totalEncountersUid'), value: totalEncounters.toString() },
				{ dataElement: uidValue('patientsMaleUid'), value: (genderSplit['M'] || 0).toString() },
				{ dataElement: uidValue('patientsFemaleUid'), value: (genderSplit['F'] || 0).toString() },
				{ dataElement: uidValue('triageRedUid'), value: (triageStats['red'] || 0).toString() },
				{ dataElement: uidValue('triageAmberUid'), value: (triageStats['amber'] || 0).toString() },
				{ dataElement: uidValue('triageGreenUid'), value: (triageStats['green'] || 0).toString() }
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
		<p class="text-muted-foreground">
			Export aggregated clinical data to the National Health Management Information System.
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<FileJson class="size-5 text-indigo-600" />
					Export Payload
				</CardTitle>
				<CardDescription>
					Generates a deterministic JSON payload mapping local encounters to standard DHIS2 data
					elements.
				</CardDescription>
				<div class="flex flex-wrap items-center justify-between gap-3 pt-1">
					{#if config.configured}
						<Badge class="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
							<CheckCircle2 class="size-3 mr-1" />
							Configured
						</Badge>
					{:else}
						<Badge variant="outline" class="bg-amber-500/10 text-amber-700 border-amber-500/20">
							<AlertTriangle class="size-3 mr-1" />
							Using default placeholder UIDs
						</Badge>
					{/if}
					<Button variant="outline" size="sm" onclick={openConfigDialog}>
						<Settings2 class="size-4 mr-2" />
						Configure DHIS2 UIDs
					</Button>
				</div>
			</CardHeader>
			<CardContent class="space-y-4">
				<div
					class="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 text-sm flex items-start gap-2"
				>
					<AlertTriangle class="size-4 mt-0.5 shrink-0" />
					<p class="leading-relaxed">
						<strong>Clinical Integrity Warning:</strong> This module uses deterministic aggregation. No
						AI processing is used to generate the final DHIS2 payload to prevent hallucinated data sets
						entering national records.
					</p>
				</div>

				<div class="flex justify-between items-center pt-4 border-t">
					<Button variant="outline" onclick={generatePayload}>Preview Data</Button>
					<Button
						onclick={handleDownload}
						disabled={isExporting || !previewData}
						class="bg-indigo-600 hover:bg-indigo-700"
					>
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
						<Badge variant="outline" class="font-mono bg-background"
							>Period: {previewData.period}</Badge
						>
					</CardTitle>
				</CardHeader>
				<CardContent class="p-0">
					<div class="overflow-x-auto">
						<table class="w-full text-sm text-left">
							<thead
								class="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/50"
							>
								<tr>
									<th class="px-4 py-3 font-medium">Data Element UID</th>
									<th class="px-4 py-3 font-medium text-right">Value</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border/30">
								{#each previewData.dataValues as item, index (index)}
									<tr class="hover:bg-muted/10 transition-colors">
										<td class="px-4 py-3 font-mono text-xs text-primary">{item.dataElement}</td>
										<td class="px-4 py-3 font-semibold text-right tabular-nums">{item.value}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div
						class="bg-muted/10 p-3 border-t border-border/30 text-xs text-muted-foreground flex justify-between"
					>
						<span>OrgUnit: <span class="font-mono">{previewData.orgUnit}</span></span>
						<span>DataSet: <span class="font-mono">{previewData.dataSet}</span></span>
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>

<Dialog bind:open={configDialogOpen}>
	<DialogContent class="sm:max-w-2xl">
		<DialogHeader>
			<DialogTitle>Configure DHIS2 UIDs</DialogTitle>
			<DialogDescription>
				Enter the dataset, organisation unit and data element UIDs from your DHIS2 instance. Values
				are stored for this facility only.
			</DialogDescription>
		</DialogHeader>
		<form
			onsubmit={(event) => {
				event.preventDefault();
				void saveConfig();
			}}
			class="space-y-4 py-2"
		>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{#each UID_FIELDS as field (field.key)}
					<div class="space-y-2">
						<Label for={`dhis2-${field.key}`}>{field.label}</Label>
						<Input
							id={`dhis2-${field.key}`}
							bind:value={draft[field.key]}
							class="font-mono text-xs"
						/>
					</div>
				{/each}
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => (configDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSavingConfig}>
					{#if isSavingConfig}
						<Loader2 class="size-4 mr-2 animate-spin" />
					{:else}
						<Save class="size-4 mr-2" />
					{/if}
					Save UIDs
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
