<script lang="ts">
	import { pharmacyStore } from '#lib/state/pharmacy.svelte.ts';
	import { prescriptionStore } from '#lib/state/prescriptions.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { vitalsStore } from '#lib/state/vitals.svelte.ts';
	import { getRxBrainAnalysis } from '#lib/remote/ai.remote.ts';
	import AiDisclaimer from '#lib/components/ui/ai-disclaimer.svelte';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { toast } from 'svelte-sonner';
	import {
		Check,
		User,
		PackageOpen,
		Loader2,
		Sparkles,
		Brain,
		AlertTriangle,
		ShieldCheck,
		ShieldAlert,
		AlertCircle
	} from '@lucide/svelte';

	const pendingPrescriptions = $derived(prescriptionStore.pending);

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
		};
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
					age: patient.dob
						? new Date().getFullYear() - new Date(patient.dob).getFullYear()
						: 'Unknown',
					sex: patient.sex,
					isPregnant: patient.isPregnant,
					latestVitals
				},
				prescriptions: items.map((i) => ({
					drug: i.medicationName,
					dosage: i.dosage,
					qty: i.quantity
				}))
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

<div class="space-y-6 max-w-5xl mx-auto">
	<!-- Page Header -->
	<div
		class="pb-2 border-b border-border flex flex-col sm:flex-row sm:items-end justify-between gap-3"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Dispensary Counter
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Dispense Queue</h1>
			<p class="text-sm text-muted-foreground mt-0.5">
				Pending prescriptions ready to be dispensed
			</p>
		</div>
		<span class="text-xs font-mono tabular-nums text-muted-foreground">
			{dispenseQueue.length} patient{dispenseQueue.length === 1 ? '' : 's'} waiting
		</span>
	</div>

	<div class="space-y-4">
		{#if dispenseQueue.length === 0}
			<div
				class="py-16 text-center text-muted-foreground flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50"
			>
				<PackageOpen class="size-9 text-muted-foreground/40 mb-2" />
				<p class="text-base font-medium text-foreground">No patients waiting for medication</p>
				<p class="text-xs mt-0.5">Prescriptions ordered by doctors will appear here.</p>
			</div>
		{:else}
			{#each dispenseQueue as queueItem (queueItem.patientId)}
				{@const patient = patientStore.get(queueItem.patientId)}
				<article
					class="rounded-xl border border-border border-l-4 border-l-primary bg-card overflow-hidden"
				>
					<!-- Stub Header -->
					<div
						class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-dashed border-border bg-muted/25"
					>
						<div class="flex items-center gap-2.5 min-w-0">
							<User class="size-4 text-primary shrink-0" />
							<span class="font-semibold text-foreground truncate"
								>{patient?.name || 'Unknown'}</span
							>
							{#if patient?.clinicId}
								<span class="text-xs font-mono text-muted-foreground">{patient.clinicId}</span>
							{/if}
						</div>

						<div class="flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								class="h-9 border-primary/30 text-primary hover:bg-primary/10"
								onclick={() => runRxBrain(queueItem.patientId, queueItem.items)}
								disabled={rxBrainState[queueItem.patientId]?.loading}
							>
								{#if rxBrainState[queueItem.patientId]?.loading}
									<Loader2 class="size-3.5 mr-1.5 animate-spin" />
									Analyzing…
								{:else}
									<Sparkles class="size-3.5 mr-1.5" />
									RxBrain Check
								{/if}
							</Button>
							<Badge variant="secondary" class="font-mono text-xs tabular-nums">
								{queueItem.items.length} item{queueItem.items.length === 1 ? '' : 's'}
							</Badge>
						</div>
					</div>

					<div class="p-4 space-y-4">
						{#if rxBrainState[queueItem.patientId]?.result}
							{@const rxRes = rxBrainState[queueItem.patientId].result}
							<div class="p-4 rounded-xl border border-primary/25 bg-primary/5 space-y-3">
								<div class="flex items-center justify-between gap-2">
									<h4 class="font-semibold text-sm text-foreground flex items-center gap-2">
										<Brain class="size-4 text-primary" /> RxBrain Safety Report
									</h4>
									{#if rxRes.safeToDispense}
										<Badge class="bg-triage-green text-triage-green-foreground">
											<Check class="size-3 mr-1" /> Safe
										</Badge>
									{:else}
										<Badge variant="destructive">
											<AlertTriangle class="size-3 mr-1" /> Warnings Detected
										</Badge>
									{/if}
								</div>

								<AiDisclaimer />

								{#if rxRes.interactions.length > 0}
									<div class="space-y-1.5">
										<p
											class="text-xs font-semibold text-amber-700 dark:text-triage-amber flex items-center gap-1.5"
										>
											<AlertTriangle class="size-3.5" /> Drug Interactions
										</p>
										<ul class="list-disc list-inside text-xs text-foreground/85 space-y-1">
											{#each rxRes.interactions as interaction}
												<li>
													<strong>{interaction.drugs.join(' + ')} ({interaction.severity}):</strong>
													{interaction.description}
												</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if rxRes.contraindications.length > 0}
									<div class="space-y-1.5">
										<p class="text-xs font-semibold text-destructive flex items-center gap-1.5">
											<ShieldAlert class="size-3.5" /> Contraindications
										</p>
										<ul class="list-disc list-inside text-xs text-foreground/85 space-y-1">
											{#each rxRes.contraindications as warning}
												<li>{warning}</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if rxRes.dosageWarnings.length > 0}
									<div class="space-y-1.5">
										<p
											class="text-xs font-semibold text-amber-700 dark:text-triage-amber flex items-center gap-1.5"
										>
											<AlertCircle class="size-3.5" /> Dosage Warnings
										</p>
										<ul class="list-disc list-inside text-xs text-foreground/85 space-y-1">
											{#each rxRes.dosageWarnings as warning}
												<li>{warning}</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if rxRes.interactions.length === 0 && rxRes.contraindications.length === 0 && rxRes.dosageWarnings.length === 0}
									<p
										class="text-xs text-triage-green bg-triage-green/10 p-3 rounded-lg border border-triage-green/25 flex items-center gap-2"
									>
										<ShieldCheck class="size-4 shrink-0" />
										No obvious contraindications or interactions detected based on available data. Pharmacist
										must still verify.
									</p>
								{/if}
							</div>
						{/if}

						<Table>
							<TableHeader>
								<TableRow class="hover:bg-transparent">
									<TableHead class="font-mono text-xs uppercase tracking-wider"
										>Medication</TableHead
									>
									<TableHead class="font-mono text-xs uppercase tracking-wider">Dosage</TableHead>
									<TableHead class="font-mono text-xs uppercase tracking-wider text-right"
										>Qty</TableHead
									>
									<TableHead class="font-mono text-xs uppercase tracking-wider text-right"
										>Action</TableHead
									>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each queueItem.items as p (p.id)}
									<TableRow class="border-border hover:bg-muted/30">
										<TableCell class="font-medium text-foreground">{p.medicationName}</TableCell>
										<TableCell class="text-muted-foreground text-sm">{p.dosage}</TableCell>
										<TableCell class="font-mono font-bold text-right tabular-nums"
											>{p.quantity}</TableCell
										>
										<TableCell class="text-right">
											<Button
												size="sm"
												class="min-h-9 px-3.5 font-semibold"
												onclick={() => handleDispense(p.id, p.inventoryId, p.quantity)}
											>
												<Check class="size-3.5 mr-1.5" />
												Dispense
											</Button>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				</article>
			{/each}
		{/if}
	</div>
</div>
