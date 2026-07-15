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
	import * as Stepper from '$lib/components/ui/stepper';
	import { ShinyButton } from '$lib/components/ui/shiny-button';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import {
		Thermometer,
		Heart,
		Activity,
		Weight,
		Percent,
		Scan,
		User,
		ArrowRight,
		Search,
		ShieldAlert,
		Check
	} from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	let showScanner = $state(false);
	let searchQuery = $state('');
	let selectedPatient = $state<any>(null);
	let currentStep = $state(1);

	// Vitals inputs
	let temperature = $state<number | undefined>(undefined);
	let systolicBp = $state<number | undefined>(undefined);
	let diastolicBp = $state<number | undefined>(undefined);
	let pulse = $state<number | undefined>(undefined);
	let weight = $state<number | undefined>(undefined);
	let spo2 = $state<number | undefined>(undefined);

	let isSubmitting = $state(false);

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
		currentStep = 2; // Move to vitals step

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

		isSubmitting = true;

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
			currentStep = 1;
			isSubmitting = false;
		} catch (e: any) {
			toast.error(`Error saving vitals: ${e.message}`);
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Vitals &amp; Triage — ClinicFlow</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8 animate-fade-in mt-6">
	<div class="flex items-start gap-3 border-b border-border pb-6">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<Thermometer class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Vitals &amp; Triage</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Record vitals and automatically determine patient urgency level
			</p>
		</div>
	</div>

	<div class="bg-card border rounded-xl p-6 shadow-sm flex flex-col min-h-[500px]">
		<!-- Stepper Header -->
		<div class="mb-8">
			<Stepper.Root bind:value={currentStep} class="w-full max-w-xl mx-auto">
				<Stepper.Item step={1}>
					<Stepper.Trigger step={1}>
						<Stepper.Indicator step={1}>1</Stepper.Indicator>
						<div class="flex flex-col items-start hidden sm:flex">
							<Stepper.Title>Identify</Stepper.Title>
							<Stepper.Description>Select patient</Stepper.Description>
						</div>
					</Stepper.Trigger>
					<Stepper.Separator />
				</Stepper.Item>

				<Stepper.Item step={2}>
					<Stepper.Trigger step={2}>
						<Stepper.Indicator step={2}>2</Stepper.Indicator>
						<div class="flex flex-col items-start hidden sm:flex">
							<Stepper.Title>Vitals</Stepper.Title>
							<Stepper.Description>Record & triage</Stepper.Description>
						</div>
					</Stepper.Trigger>
				</Stepper.Item>
			</Stepper.Root>
		</div>

		<!-- Step Content -->
		<div class="flex-1 max-w-2xl mx-auto w-full">
			{#if currentStep === 1}
				<div in:fade={{ duration: 150 }} class="space-y-6">
					<div class="text-center mb-6">
						<h2 class="text-xl font-semibold">Who are we triaging today?</h2>
						<p class="text-muted-foreground text-sm mt-1">
							Search the registry or scan their QR card
						</p>
					</div>

					{#if selectedPatient}
						<div class="p-5 bg-primary/10 border border-primary/20 rounded-xl relative">
							<div class="font-bold text-foreground text-lg flex items-center gap-2">
								<User class="size-5 text-primary" />
								{selectedPatient.name}
							</div>
							<div class="text-sm text-primary font-mono mt-1">{selectedPatient.clinicId}</div>
							<div class="text-sm text-muted-foreground mt-3 flex flex-wrap gap-2 items-center">
								<span class="capitalize">{selectedPatient.sex}</span>
								<span>•</span>
								<span>{selectedPatient.phone ?? 'No Phone'}</span>
								{#if selectedPatient.isPregnant}
									<span>•</span>
									<span class="text-triage-red font-semibold bg-triage-red/10 px-2 py-0.5 rounded"
										>Pregnant</span
									>
								{/if}
							</div>
							<Button
								variant="ghost"
								class="absolute top-3 right-3 text-muted-foreground hover:text-foreground h-8 px-3"
								onclick={() => (selectedPatient = null)}
							>
								Clear
							</Button>
						</div>
					{:else}
						<div class="space-y-4">
							<div class="relative">
								<Search class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
								<Input
									bind:value={searchQuery}
									placeholder="Search name or clinic ID..."
									class="pl-9 h-12 bg-background/50 text-base"
								/>
							</div>

							{#if showScanner}
								<div class="mt-4 border border-border rounded-xl overflow-hidden bg-background p-2">
									<QrScanner onResult={handleQrResult} />
									<Button
										variant="ghost"
										class="w-full text-muted-foreground hover:text-foreground mt-2"
										onclick={() => (showScanner = false)}
									>
										Cancel Scan
									</Button>
								</div>
							{:else}
								<Button
									variant="outline"
									class="w-full border-border h-12 border-dashed"
									onclick={() => (showScanner = true)}
								>
									<Scan class="size-4 mr-2" />
									Scan QR Code Instead
								</Button>
							{/if}

							<!-- Search Results -->
							{#if searchResults.length > 0}
								<div
									class="space-y-2 mt-4 max-h-60 overflow-y-auto no-scrollbar border rounded-lg p-2 bg-muted/20"
								>
									{#each searchResults as patient}
										<button
											class="w-full text-left p-3 bg-background border rounded-lg hover:border-primary/50 transition-colors flex items-center justify-between group"
											onclick={() => handleSelectPatient(patient)}
										>
											<div>
												<div
													class="font-medium text-foreground text-sm group-hover:text-primary transition-colors"
												>
													{patient.name}
												</div>
												<div class="text-xs text-muted-foreground font-mono mt-0.5">
													{patient.clinicId}
												</div>
											</div>
											<ArrowRight
												class="size-4 text-muted-foreground group-hover:text-primary transition-colors"
											/>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{:else if currentStep === 2}
				<div in:fade={{ duration: 150 }} class="space-y-6">
					{#if selectedPatient}
						<div
							class="flex items-center justify-between bg-muted/30 border rounded-lg p-3 px-4 text-sm mb-6"
						>
							<div class="flex items-center gap-2">
								<User class="size-4 text-muted-foreground" />
								<span class="font-medium">{selectedPatient.name}</span>
								<span class="text-muted-foreground font-mono ml-2">{selectedPatient.clinicId}</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								class="h-6 text-xs px-2"
								onclick={() => {
									currentStep = 1;
									selectedPatient = null;
								}}>Change</Button
							>
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="temp">Temp (°C)</Label>
							<div class="relative">
								<Thermometer class="absolute left-3 top-3 size-4 text-muted-foreground" />
								<Input
									id="temp"
									type="number"
									step="0.1"
									bind:value={temperature}
									placeholder="36.5"
									class="pl-9 h-10"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="pulse">Heart Rate</Label>
							<div class="relative">
								<Heart class="absolute left-3 top-3 size-4 text-muted-foreground" />
								<Input
									id="pulse"
									type="number"
									bind:value={pulse}
									placeholder="72"
									class="pl-9 h-10"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="systolic">Systolic (mmHg)</Label>
							<div class="relative">
								<Activity class="absolute left-3 top-3 size-4 text-muted-foreground" />
								<Input
									id="systolic"
									type="number"
									bind:value={systolicBp}
									placeholder="120"
									class="pl-9 h-10"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="diastolic">Diastolic (mmHg)</Label>
							<div class="relative">
								<Activity class="absolute left-3 top-3 size-4 text-muted-foreground" />
								<Input
									id="diastolic"
									type="number"
									bind:value={diastolicBp}
									placeholder="80"
									class="pl-9 h-10"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="spo2">SpO2 (%)</Label>
							<div class="relative">
								<Percent class="absolute left-3 top-3 size-4 text-muted-foreground" />
								<Input
									id="spo2"
									type="number"
									bind:value={spo2}
									placeholder="98"
									class="pl-9 h-10"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="weight">Weight (kg)</Label>
							<div class="relative">
								<Weight class="absolute left-3 top-3 size-4 text-muted-foreground" />
								<Input
									id="weight"
									type="number"
									step="0.1"
									bind:value={weight}
									placeholder="70"
									class="pl-9 h-10"
								/>
							</div>
						</div>
					</div>

					<!-- Live Triage Banner -->
					{#if triageResult}
						{@const isRed = triageResult.level === 'red'}
						{@const isAmber = triageResult.level === 'amber'}
						<div
							class="p-5 mt-6 rounded-xl border flex flex-col justify-center items-center text-center transition-all duration-300 animate-fade-in
							{isRed ? 'bg-triage-red/10 border-triage-red/30 text-triage-red glow-triage-red' : ''}
							{isAmber ? 'bg-triage-amber/10 border-triage-amber/30 text-triage-amber' : ''}
							{!isRed && !isAmber ? 'bg-triage-green/10 border-triage-green/30 text-triage-green' : ''}
						"
						>
							<div class="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
								<ShieldAlert class="size-3.5" />
								Triage Severity
							</div>
							<div class="text-lg font-extrabold mt-1">
								{#if isRed}
									RED FLAG
								{:else if isAmber}
									AMBER FLAG
								{:else}
									GREEN FLAG
								{/if}
							</div>
							<div class="text-sm mt-1.5 font-medium opacity-90">{triageResult.reason}</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Navigation -->
		<div class="flex justify-between mt-8 pt-6 border-t border-border mt-auto">
			<Button
				variant="outline"
				disabled={currentStep === 1}
				onclick={() => {
					currentStep--;
					selectedPatient = null;
				}}
			>
				Back
			</Button>

			{#if currentStep === 1}
				<Button onclick={() => currentStep++} disabled={!selectedPatient}>
					Next Step <ArrowRight class="size-4 ml-2" />
				</Button>
			{:else}
				<ShinyButton
					class="bg-primary text-primary-foreground font-semibold px-6"
					onclick={handleSaveVitals}
					disabled={isSubmitting || !selectedPatient}
				>
					{#if isSubmitting}
						Saving...
					{:else}
						Save &amp; Queue Patient <Check class="size-4 ml-2" />
					{/if}
				</ShinyButton>
			{/if}
		</div>
	</div>
</div>
