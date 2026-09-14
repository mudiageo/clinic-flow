<script lang="ts">
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import { prescriptionStore } from '$lib/state/prescriptions.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import { vitalsStore } from '$lib/state/vitals.svelte';
	import { getRxBrainAnalysis } from '../../../../../routes/ai/ai.remote';
	import AiDisclaimer from '$lib/components/ui/ai-disclaimer.svelte';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { Pill, Check, User, ClipboardList, PackageOpen, Loader2, Sparkles, Brain, AlertTriangle, ShieldCheck, ShieldAlert, AlertCircle } from '@lucide/svelte';

	const pendingPrescriptions = $derived(prescriptionStore.pending);

	// Group by patient
	const dispenseQueue = $derived.by(() => {
		const map = new Map<string, typeof pendingPrescriptions>();
		for (const p of pendingPrescriptions) {
			if (!map.has(p.patientId)) map.set(p.patientId, []);
			map.get(p.patientId)!.push(p);
		}
		return Array.from(map.entries()).map(([patientId, items]) => ({
			patientId,
			items
		}));
	});

	let rxBrainState = $state<{
		[patientId: string]: {
			loading: boolean;
			result: any | null;
		}
	}>({});

	async function runRxBrain(patientId: string, items: any[]) {
		const patient = patientStore.get(patientId);
		if (!patient) return;
		
		const vitalsHistory = vitalsStore.forPatient(patient.id);
		const latestVitals = vitalsHistory.length > 0 ? vitalsHistory[0] : null;

		rxBrainState[patientId] = { loading: true, result: null };
		
		try {
			const result = await getRxBrainAnalysis({
				patientData: {
					age: patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 'Unknown',
					sex: patient.sex,
					isPregnant: patient.isPregnant,
					latestVitals
				},
				prescriptions: items.map(i => ({ drug: i.medicationName, dosage: i.dosage, qty: i.quantity }))
			});
			rxBrainState[patientId] = { loading: false, result };
		} catch (err: any) {
			toast.error('RxBrain failed: ' + err.message);
			rxBrainState[patientId] = { loading: false, result: null };
		}
	}

	async function handleDispense(prescriptionId: string, inventoryId: string, qty: number) {
		try {
			await pharmacyStore.deltaDecrement(inventoryId, qty);
			await prescriptionStore.update(prescriptionId, { status: 'dispensed' } as any);
			toast.success('Medication dispensed and inventory updated.');
		} catch (err: any) {
			toast.error('Dispense failed: ' + err.message);
		}
	}
</script>

<svelte:head>
	<title>Dispense Queue — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in max-w-5xl mx-auto">
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<Pill class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Dispense Queue</h1>
			<p class="text-muted-foreground text-sm mt-0.5 font-medium">
				Pending prescriptions to be dispensed to patients
			</p>
		</div>
	</div>

	<div class="space-y-4">
		{#if dispenseQueue.length === 0}
			<Card class="bg-card/60 card-hover">
				<CardContent
					class="py-16 text-center text-muted-foreground flex flex-col items-center justify-center"
				>
					<PackageOpen class="size-8 text-muted-foreground/60 mb-2" />
					<span class="text-sm font-medium">No patients waiting for medication</span>
				</CardContent>
			</Card>
		{:else}
			{#each dispenseQueue as queueItem (queueItem.patientId)}
				{@const patient = patientStore.get(queueItem.patientId)}
				<Card class="bg-card/60 card-hover mb-4 border-l-4 border-l-primary/60">
					<CardHeader class="pb-3 border-b border-border/60 bg-muted/10">
						<CardTitle class="text-sm font-semibold flex items-center justify-between">
							<span class="flex items-center gap-1.5">
								<User class="size-4 text-primary" />
								<span class="text-foreground font-bold">{patient?.name || 'Unknown'}</span>
								<span class="text-xs font-mono text-muted-foreground">({patient?.clinicId})</span>
							</span>
							<div class="flex items-center gap-3">
								<Button size="sm" variant="outline" class="h-8 bg-indigo-50/50 text-indigo-600 border-indigo-200 hover:bg-indigo-100" onclick={() => runRxBrain(queueItem.patientId, queueItem.items)} disabled={rxBrainState[queueItem.patientId]?.loading}>
									{#if rxBrainState[queueItem.patientId]?.loading}
										<Loader2 class="size-3.5 mr-2 animate-spin" /> Analyzing...
									{:else}
										<Sparkles class="size-3.5 mr-2" /> RxBrain Check
									{/if}
								</Button>
								<Badge variant="secondary" class="font-semibold text-xs"
									>{queueItem.items.length} items</Badge
								>
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent class="pt-4 space-y-4">
						{#if rxBrainState[queueItem.patientId]?.result}
							{@const rxRes = rxBrainState[queueItem.patientId].result}
							<div class="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-4 animate-in fade-in slide-in-from-top-2">
								<div class="flex items-center justify-between">
									<h4 class="font-bold text-indigo-900 flex items-center gap-2">
										<Brain class="size-4 text-indigo-600" /> RxBrain Safety Report
									</h4>
									{#if rxRes.safeToDispense}
										<Badge class="bg-emerald-500 hover:bg-emerald-600"><Check class="size-3 mr-1"/> Safe</Badge>
									{:else}
										<Badge variant="destructive"><AlertTriangle class="size-3 mr-1"/> Warnings Detected</Badge>
									{/if}
								</div>
								
								<AiDisclaimer />
								
								{#if rxRes.interactions.length > 0}
									<div class="space-y-2">
										<p class="text-sm font-semibold text-amber-700 flex items-center gap-1.5"><AlertTriangle class="size-3.5"/> Drug Interactions</p>
										<ul class="list-disc list-inside text-sm text-amber-900/80">
											{#each rxRes.interactions as interaction}
												<li><strong>{interaction.drugs.join(' + ')} ({interaction.severity}):</strong> {interaction.description}</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if rxRes.contraindications.length > 0}
									<div class="space-y-2">
										<p class="text-sm font-semibold text-red-600 flex items-center gap-1.5"><ShieldAlert class="size-3.5"/> Contraindications</p>
										<ul class="list-disc list-inside text-sm text-red-900/80">
											{#each rxRes.contraindications as warning}
												<li>{warning}</li>
											{/each}
										</ul>
									</div>
								{/if}
								
								{#if rxRes.dosageWarnings.length > 0}
									<div class="space-y-2">
										<p class="text-sm font-semibold text-amber-700 flex items-center gap-1.5"><AlertCircle class="size-3.5"/> Dosage Warnings</p>
										<ul class="list-disc list-inside text-sm text-amber-900/80">
											{#each rxRes.dosageWarnings as warning}
												<li>{warning}</li>
											{/each}
										</ul>
									</div>
								{/if}
								
								{#if rxRes.interactions.length === 0 && rxRes.contraindications.length === 0 && rxRes.dosageWarnings.length === 0}
									<p class="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex items-center gap-2">
										<ShieldCheck class="size-4" /> No obvious contraindications or interactions detected based on available data. Pharmacist must still verify.
									</p>
								{/if}
							</div>
						{/if}

						<Table>
							<TableHeader>
								<TableRow class="hover:bg-transparent">
									<TableHead
										class="font-semibold text-muted-foreground text-xs uppercase tracking-wider"
										>Medication</TableHead
									>
									<TableHead
										class="font-semibold text-muted-foreground text-xs uppercase tracking-wider"
										>Dosage</TableHead
									>
									<TableHead
										class="font-semibold text-muted-foreground text-right text-xs uppercase tracking-wider"
										>Qty</TableHead
									>
									<TableHead
										class="font-semibold text-muted-foreground text-right text-xs uppercase tracking-wider"
										>Action</TableHead
									>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each queueItem.items as p (p.id)}
									<TableRow class="border-border hover:bg-muted/40 transition-colors">
										<TableCell class="text-foreground font-medium">{p.medicationName}</TableCell>
										<TableCell class="text-muted-foreground">{p.dosage}</TableCell>
										<TableCell class="text-foreground font-bold text-right tabular-nums"
											>{p.quantity}</TableCell
										>
										<TableCell class="text-right">
											<Button
												size="sm"
												class="bg-primary text-primary-foreground hover:bg-primary/95 btn-press h-8 px-3"
												onclick={() => handleDispense(p.id, p.inventoryId, p.quantity)}
											>
												<Check class="size-3.5 mr-1" />
												Dispense
											</Button>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			{/each}
		{/if}
	</div>
</div>
