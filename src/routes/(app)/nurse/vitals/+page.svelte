<script lang="ts">
	import { patientStore } from '$lib/state/patients.svelte';
	import { vitalsStore } from '$lib/state/vitals.svelte';
	import { queueStore } from '$lib/state/queue.svelte';
	import { triageRuleStore } from '$lib/state/triage-rules.svelte';
	import QrScanner from '$lib/components/QrScanner.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	let showScanner = $state(false);
	let searchQuery = $state('');
	let selectedPatient = $state<any>(null);

	// Vitals inputs
	let temperature = $state<number | undefined>(undefined);
	let systolicBp = $state<number | undefined>(undefined);
	let diastolicBp = $state<number | undefined>(undefined);
	let pulse = $state<number | undefined>(undefined);
	let weight = $state<number | undefined>(undefined);
	let spo2 = $state<number | undefined>(undefined);

	// Active triage rules loaded from local store
	const rules = $derived(triageRuleStore.activeRules);

	onMount(async () => {
		try {
			// Seed default rules if empty
			await triageRuleStore.seedDefaults('00000000-0000-0000-0000-000000000000');
		} catch (err) {
			console.error('Failed to initialize triage rules:', err);
		}
	});

	const searchResults = $derived(searchQuery ? patientStore.search(searchQuery) : []);

	// Compute live triage status
	const currentVitals = $derived({
		temperatureCelsius: temperature,
		systolicBp,
		diastolicBp,
		pulseBpm: pulse,
		weightKg: weight,
		spo2Percent: spo2
	});

	const triageResult = $derived(
		vitalsStore.evaluateTriage(currentVitals, rules, selectedPatient?.isPregnant ?? false)
	);

	function handleSelectPatient(patient: any) {
		selectedPatient = patient;
		searchQuery = '';

		// Clear vitals
		temperature = undefined;
		systolicBp = undefined;
		diastolicBp = undefined;
		pulse = undefined;
		weight = undefined;
		spo2 = undefined;
	}

	function handleQrResult(clinicId: string) {
		showScanner = false;
		const found = patientStore.findByClinicId(clinicId);
		if (found) {
			handleSelectPatient(found);
			toast.success(`Patient: ${found.name} selected.`);
		} else {
			toast.error(`Patient not found: ${clinicId}`);
		}
	}

	async function handleSaveVitals() {
		if (!selectedPatient) {
			toast.error('Select a patient first');
			return;
		}

		try {
			const encounterId = crypto.randomUUID();

			// Save vitals to local DB
			await vitalsStore.create({
				encounterId,
				patientId: selectedPatient.id,
				temperatureCelsius: temperature ?? null,
				systolicBp: systolicBp ?? null,
				diastolicBp: diastolicBp ?? null,
				pulseBpm: pulse ?? null,
				weightKg: weight ?? null,
				spo2Percent: spo2 ?? null,
				triageLevel: triageResult.level,
				triageReason: triageResult.reason,
				recordedAt: Date.now()
			});

			// Find if patient has an active ticket in the queue, update it
			const activeTickets = queueStore.items.filter(
				(t: any) => t.patientId === selectedPatient.id && t.status === 'waiting'
			);

			if (activeTickets.length > 0) {
				for (const ticket of activeTickets) {
					await queueStore.applyTriageFlag(ticket.id, triageResult.level, triageResult.reason);
				}
			} else {
				// Issue new ticket if none active
				await queueStore.create({
					patientId: selectedPatient.id,
					phcId: crypto.randomUUID(),
					encounterId,
					ticketNumber: 0,
					status: 'waiting',
					triageLevel: triageResult.level,
					triageReason: triageResult.reason,
					calledAt: null,
					completedAt: null,
					createdAt: Date.now()
				});
			}

			toast.success(`Vitals saved. Patient triaged as ${triageResult.level.toUpperCase()}`);

			// Reset state
			selectedPatient = null;
		} catch (e: any) {
			toast.error(`Error saving vitals: ${e.message}`);
		}
	}
</script>

<svelte:head>
	<title>Vitals & Triage — ClinicFlow</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
	<div>
		<h1 class="text-3xl font-extrabold text-white tracking-tight">Vitals & Triage</h1>
		<p class="text-slate-400 mt-1">
			Record vitals and automatically determine patient urgency level
		</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Left Column: Patient Selector -->
		<div class="space-y-6 lg:col-span-1">
			<Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
				<CardHeader>
					<CardTitle class="text-white text-lg">Select Patient</CardTitle>
					<CardDescription class="text-slate-400">Scan card or search records</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					{#if selectedPatient}
						<div class="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl relative">
							<div class="font-bold text-white text-lg">{selectedPatient.name}</div>
							<div class="text-sm text-teal-400 font-medium mt-1">{selectedPatient.clinicId}</div>
							<div class="text-xs text-slate-400 mt-2">
								{selectedPatient.sex.toUpperCase()} · {selectedPatient.phone ?? 'No Phone'}
								{#if selectedPatient.isPregnant}
									<span class="text-rose-400 ml-1 font-semibold">· Pregnant</span>
								{/if}
							</div>
							<Button
								variant="ghost"
								size="sm"
								class="absolute top-2 right-2 text-slate-500 hover:text-white"
								onclick={() => (selectedPatient = null)}
							>
								Clear
							</Button>
						</div>
					{:else}
						<Input
							bind:value={searchQuery}
							placeholder="Search by name or ID..."
							class="bg-slate-950/50 border-slate-800 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
						/>

						{#if showScanner}
							<div class="mt-4">
								<QrScanner onResult={handleQrResult} />
								<Button
									variant="ghost"
									class="w-full text-slate-400 hover:text-white mt-2"
									onclick={() => (showScanner = false)}
								>
									Cancel Scan
								</Button>
							</div>
						{:else}
							<Button
								variant="outline"
								class="w-full border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
								onclick={() => (showScanner = true)}
							>
								📷 Scan QR Code
							</Button>
						{/if}

						<!-- Search Results -->
						{#if searchResults.length > 0}
							<div class="space-y-2 mt-4 max-h-60 overflow-y-auto">
								{#each searchResults as patient}
									<button
										class="w-full text-left p-3 bg-slate-950/40 border border-slate-800 rounded-xl hover:bg-slate-900 transition-colors"
										onclick={() => handleSelectPatient(patient)}
									>
										<div class="font-medium text-white">{patient.name}</div>
										<div class="text-xs text-slate-500">{patient.clinicId}</div>
									</button>
								{/each}
							</div>
						{/if}
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Right Column: Vitals entry & live triage -->
		<div class="lg:col-span-2 space-y-6">
			<Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
				<CardHeader>
					<CardTitle class="text-white text-lg">Record Vitals</CardTitle>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div class="space-y-2">
							<Label for="temp" class="text-slate-300">Temperature (°C)</Label>
							<Input
								id="temp"
								type="number"
								step="0.1"
								bind:value={temperature}
								placeholder="36.5"
								class="h-12 bg-slate-950/50 border-slate-800 text-white"
							/>
						</div>

						<div class="space-y-2">
							<Label for="pulse" class="text-slate-300">Heart Rate / Pulse (BPM)</Label>
							<Input
								id="pulse"
								type="number"
								bind:value={pulse}
								placeholder="72"
								class="h-12 bg-slate-950/50 border-slate-800 text-white"
							/>
						</div>

						<div class="space-y-2">
							<Label for="systolic" class="text-slate-300">Systolic BP (mmHg)</Label>
							<Input
								id="systolic"
								type="number"
								bind:value={systolicBp}
								placeholder="120"
								class="h-12 bg-slate-950/50 border-slate-800 text-white"
							/>
						</div>

						<div class="space-y-2">
							<Label for="diastolic" class="text-slate-300">Diastolic BP (mmHg)</Label>
							<Input
								id="diastolic"
								type="number"
								bind:value={diastolicBp}
								placeholder="80"
								class="h-12 bg-slate-950/50 border-slate-800 text-white"
							/>
						</div>

						<div class="space-y-2">
							<Label for="spo2" class="text-slate-300">Oxygen Saturation - SpO2 (%)</Label>
							<Input
								id="spo2"
								type="number"
								bind:value={spo2}
								placeholder="98"
								class="h-12 bg-slate-950/50 border-slate-800 text-white"
							/>
						</div>

						<div class="space-y-2">
							<Label for="weight" class="text-slate-300">Weight (kg)</Label>
							<Input
								id="weight"
								type="number"
								step="0.1"
								bind:value={weight}
								placeholder="70"
								class="h-12 bg-slate-950/50 border-slate-800 text-white"
							/>
						</div>
					</div>

					<!-- Live Triage Banner -->
					{#if triageResult}
						{@const isRed = triageResult.level === 'red'}
						{@const isAmber = triageResult.level === 'amber'}
						<div
							class="p-4 rounded-xl border transition-all duration-300 flex flex-col justify-center items-center text-center
              {isRed ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : ''}
              {isAmber ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : ''}
              {!isRed && !isAmber ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : ''}
            "
						>
							<div class="text-xs font-semibold uppercase tracking-widest">Triage Category</div>
							<div class="text-2xl font-extrabold mt-1">
								{isRed ? '🔴 RED FLAG - URGENT' : ''}
								{isAmber ? '🟡 AMBER FLAG - WARNING' : ''}
								{!isRed && !isAmber ? '🟢 GREEN FLAG - STABLE' : ''}
							</div>
							<div class="text-sm mt-2 font-medium opacity-90">{triageResult.reason}</div>
						</div>
					{/if}

					<div class="flex justify-end pt-2">
						<Button
							disabled={!selectedPatient}
							onclick={handleSaveVitals}
							class="h-12 px-8 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/10"
						>
							Save Vitals & Queue
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
