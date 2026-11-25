<script lang="ts">
	import { page } from '$app/state';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { vitalsStore } from '#lib/state/vitals.svelte.ts';
	import { queueStore } from '#lib/state/queue.svelte.ts';
	import { triageRuleStore } from '#lib/state/triage-rules.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import { encounterStore } from '#lib/state/encounters.svelte.ts';
	import type { LocalPatient, LocalQueueTicket } from '#lib/local-db/db.ts';
	import { getPatientRiskScore } from '#lib/remote/ai.remote.ts';
	import { settingsStore } from '#lib/state/settings.svelte.ts';
	import QrScanner from '#lib/components/QrScanner.svelte';
	import AiDisclaimer from '#lib/components/ui/ai-disclaimer.svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import * as Stepper from '#lib/components/ui/stepper/index.ts';
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
		AlertTriangle
	} from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	let showScanner = $state(false);
	let searchQuery = $state('');
	let selectedPatient = $state<LocalPatient | null>(null);
	let currentStep = $state(1);
	let showDuplicateWarning = $state(false);

	// Vitals inputs
	let temperature = $state<number | undefined>(undefined);
	let systolicBp = $state<number | undefined>(undefined);
	let diastolicBp = $state<number | undefined>(undefined);
	let pulse = $state<number | undefined>(undefined);
	let weight = $state<number | undefined>(undefined);
	let spo2 = $state<number | undefined>(undefined);

	let isSubmitting = $state(false);

	onMount(() => {
		const handoffPatientId = page.url.searchParams.get('patient');
		if (!handoffPatientId) return;

		let attempts = 0;
		let timer: ReturnType<typeof setTimeout> | undefined;

		const tryHandoff = () => {
			const patient = patientStore.get(handoffPatientId);
			if (patient) {
				applyPatientSelection(patient);
				return;
			}
			if (attempts++ < 30) timer = setTimeout(tryHandoff, 100);
		};

		tryHandoff();
		return () => {
			if (timer) clearTimeout(timer);
		};
	});

	const rules = $derived(triageRuleStore.activeRules);

	onMount(async () => {
		try {
			await triageRuleStore.seedDefaults(sessionStore.activePhcId);
		} catch (err) {
			console.error('Failed to initialize triage rules:', err);
		}
	});

	const searchResults = $derived(searchQuery ? patientStore.search(searchQuery) : []);

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

	function applyPatientSelection(patient: LocalPatient) {
		selectedPatient = patient;
		searchQuery = '';
		currentStep = 2;

		temperature = undefined;
		systolicBp = undefined;
		diastolicBp = undefined;
		pulse = undefined;
		weight = undefined;
		spo2 = undefined;
	}

	function handleSelectPatient(patient: LocalPatient) {
		applyPatientSelection(patient);
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

	function preSaveVitals() {
		if (!selectedPatient) return;
		const activeTickets = queueStore.items.filter(
			(t) => t.patientId === selectedPatient?.id && t.status === 'waiting'
		);
		if (activeTickets.length > 0) {
			showDuplicateWarning = true;
		} else {
			handleSaveVitals();
		}
	}

	async function handleSaveVitals() {
		showDuplicateWarning = false;
		if (!selectedPatient) {
			toast.error('Select a patient first');
			return;
		}

		isSubmitting = true;

		try {
			const now = Date.now();
			const encounterId = await encounterStore.create({
				patientId: selectedPatient.id,
				phcId: sessionStore.activePhcId,
				recordedByStaffId: sessionStore.staffId,
				chiefComplaint: null,
				chiefComplaintRaw: null,
				chiefComplaintLanguage: null,
				doctorNotes: null,
				visitDate: now,
				createdAt: now
			});

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

			const activeTickets = queueStore.items.filter(
				(t) => t.patientId === selectedPatient?.id && t.status === 'waiting'
			);

			let savedTicketIds = [];
			if (activeTickets.length > 0) {
				for (const ticket of activeTickets) {
					await queueStore.applyTriageFlag(ticket.id, triageResult.level, triageResult.reason);
					if (!ticket.encounterId) {
						await queueStore.update(ticket.id, { encounterId });
					}
					savedTicketIds.push(ticket.id);
				}
			} else {
				const newTicketId = await queueStore.create({
					patientId: selectedPatient.id,
					phcId: sessionStore.activePhcId,
					encounterId,
					ticketNumber: queueStore.allocateTicketNumber(sessionStore.activePhcId),
					status: 'waiting',
					triageLevel: triageResult.level,
					triageReason: triageResult.reason,
					department: 'general',
					calledAt: null,
					completedAt: null,
					createdAt: Date.now()
				});
				savedTicketIds.push(newTicketId);
			}

			toast.success(`Vitals saved. Patient triaged as ${triageResult.level.toUpperCase()}`);

			const vitalsPayload = {
				temperatureCelsius: temperature ?? null,
				systolicBp: systolicBp ?? null,
				diastolicBp: diastolicBp ?? null,
				pulseBpm: pulse ?? null,
				weightKg: weight ?? null,
				spo2Percent: spo2 ?? null
			};
			const p = selectedPatient;

			const pastVitals = vitalsStore.items
				.filter((v) => v.patientId === p.id && v.encounterId !== encounterId)
				.sort((a, b) => b.recordedAt - a.recordedAt)
				.slice(0, 3);

			getPatientRiskScore({
				vitals: vitalsPayload,
				patient: p,
				chiefComplaint: triageResult.reason || 'Routine Checkup',
				pastVitals
			})
				.then(async (aiRes) => {
					for (const tId of savedTicketIds) {
						const updatePayload: Partial<LocalQueueTicket> = {
							aiRiskScore: aiRes.score,
							aiRiskRationale: aiRes.rationale
						};

						if (aiRes.score >= 85 && settingsStore.current?.aiAutoTriageEscalation) {
							updatePayload.triageLevel = 'red';
							updatePayload.triageReason =
								(triageResult.reason || '') + ` | AI Escalated: ${aiRes.rationale}`;
						}

						await queueStore.update(tId, updatePayload);
					}
					toast.info(`AI Risk Scored: ${aiRes.score}/100 for ${p.name}`);
				})
				.catch((err) => {
					console.warn('AI Risk calculation failed (likely offline):', err);
				});

			selectedPatient = null;
			currentStep = 1;
			isSubmitting = false;
		} catch (e) {
			toast.error(`Error saving vitals: ${e instanceof Error ? e.message : String(e)}`);
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Vitals &amp; Triage — ClinicFlow</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Page Header -->
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Triage Station
		</p>
		<h1 class="text-2xl font-bold text-foreground tracking-tight">Vitals &amp; Triage</h1>
		<p class="text-sm text-muted-foreground mt-0.5">
			Record measurements and assign patient urgency level
		</p>
	</div>

	<div class="bg-card border border-border rounded-xl p-5 sm:p-6 flex flex-col min-h-[480px]">
		<!-- Stepper Header -->
		<div class="mb-6 pb-4 border-b border-border">
			<Stepper.Root bind:value={currentStep} class="w-full max-w-lg mx-auto">
				<Stepper.Item step={1}>
					<Stepper.Trigger step={1}>
						<Stepper.Indicator step={1}>1</Stepper.Indicator>
						<div class="hidden sm:flex flex-col items-start">
							<Stepper.Title>Identify</Stepper.Title>
							<Stepper.Description>Select patient</Stepper.Description>
						</div>
					</Stepper.Trigger>
					<Stepper.Separator />
				</Stepper.Item>

				<Stepper.Item step={2}>
					<Stepper.Trigger step={2}>
						<Stepper.Indicator step={2}>2</Stepper.Indicator>
						<div class="hidden sm:flex flex-col items-start">
							<Stepper.Title>Vitals</Stepper.Title>
							<Stepper.Description>Record &amp; triage</Stepper.Description>
						</div>
					</Stepper.Trigger>
				</Stepper.Item>
			</Stepper.Root>
		</div>

		<!-- Step Content -->
		<div class="flex-1 max-w-2xl mx-auto w-full">
			{#if currentStep === 1}
				<div in:fade={{ duration: 120 }} class="space-y-5">
					<div>
						<h2 class="text-lg font-semibold text-foreground">Select patient to triage</h2>
						<p class="text-muted-foreground text-sm mt-0.5">
							Search the local registry or scan their QR card
						</p>
					</div>

					{#if selectedPatient}
						<div class="p-4 bg-primary/8 border border-primary/30 rounded-xl relative">
							<div class="font-semibold text-foreground text-base flex items-center gap-2">
								<User class="size-4 text-primary" />
								{selectedPatient.name}
							</div>
							<div class="text-xs text-primary font-mono mt-1">{selectedPatient.clinicId}</div>
							<div class="text-xs text-muted-foreground mt-2 flex flex-wrap gap-2 items-center">
								<span class="capitalize">{selectedPatient.sex}</span>
								<span>·</span>
								<span>{selectedPatient.phone ?? 'No phone'}</span>
								{#if selectedPatient.isPregnant}
									<span>·</span>
									<span class="text-triage-red font-semibold bg-triage-red/10 px-2 py-0.5 rounded">
										Pregnant
									</span>
								{/if}
							</div>
							<Button
								variant="ghost"
								class="absolute top-3 right-3 text-muted-foreground hover:text-foreground h-9 px-3"
								onclick={() => (selectedPatient = null)}
							>
								Clear
							</Button>
						</div>
					{:else}
						<div class="space-y-4">
							<div class="relative">
								<Search
									class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
								/>
								<Input
									bind:value={searchQuery}
									placeholder="Search name, phone, or clinic ID..."
									class="pl-9 h-12 bg-background text-base"
								/>
							</div>

							{#if showScanner}
								<div class="border border-border rounded-xl overflow-hidden bg-background p-2">
									<QrScanner onResult={handleQrResult} />
									<Button
										variant="ghost"
										class="w-full text-muted-foreground hover:text-foreground mt-2 min-h-11"
										onclick={() => (showScanner = false)}
									>
										Cancel Scan
									</Button>
								</div>
							{:else}
								<Button
									variant="outline"
									class="w-full border-border min-h-12 border-dashed"
									onclick={() => (showScanner = true)}
								>
									<Scan class="size-4 mr-2" />
									Scan QR Code Instead
								</Button>
							{/if}

							{#if searchResults.length > 0}
								<div
									class="divide-y divide-border border border-border rounded-xl bg-background max-h-64 overflow-y-auto"
								>
									{#each searchResults as patient (patient.id)}
										<button
											class="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-center justify-between group min-h-12"
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
				<div in:fade={{ duration: 120 }} class="space-y-5">
					{#if selectedPatient}
						<div
							class="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-4 py-2.5 text-sm"
						>
							<div class="flex items-center gap-2 min-w-0">
								<User class="size-4 text-muted-foreground shrink-0" />
								<span class="font-semibold truncate">{selectedPatient.name}</span>
								<span class="text-muted-foreground font-mono text-xs"
									>{selectedPatient.clinicId}</span
								>
							</div>
							<Button
								variant="ghost"
								size="sm"
								class="h-8 text-xs px-2.5"
								onclick={() => {
									currentStep = 1;
									selectedPatient = null;
								}}
							>
								Change
							</Button>
						</div>
					{/if}

					<AiDisclaimer compact />

					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1.5">
							<Label for="temp">Temp (°C)</Label>
							<div class="relative">
								<Thermometer
									class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
								/>
								<Input
									id="temp"
									type="number"
									step="0.1"
									bind:value={temperature}
									placeholder="36.5"
									class="pl-9 h-11 font-mono tabular-nums"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<Label for="pulse">Heart Rate (bpm)</Label>
							<div class="relative">
								<Heart
									class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
								/>
								<Input
									id="pulse"
									type="number"
									bind:value={pulse}
									placeholder="72"
									class="pl-9 h-11 font-mono tabular-nums"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<Label for="systolic">Systolic (mmHg)</Label>
							<div class="relative">
								<Activity
									class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
								/>
								<Input
									id="systolic"
									type="number"
									bind:value={systolicBp}
									placeholder="120"
									class="pl-9 h-11 font-mono tabular-nums"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<Label for="diastolic">Diastolic (mmHg)</Label>
							<div class="relative">
								<Activity
									class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
								/>
								<Input
									id="diastolic"
									type="number"
									bind:value={diastolicBp}
									placeholder="80"
									class="pl-9 h-11 font-mono tabular-nums"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<Label for="spo2">SpO2 (%)</Label>
							<div class="relative">
								<Percent
									class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
								/>
								<Input
									id="spo2"
									type="number"
									bind:value={spo2}
									placeholder="98"
									class="pl-9 h-11 font-mono tabular-nums"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<Label for="weight">Weight (kg)</Label>
							<div class="relative">
								<Weight
									class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
								/>
								<Input
									id="weight"
									type="number"
									step="0.1"
									bind:value={weight}
									placeholder="70"
									class="pl-9 h-11 font-mono tabular-nums"
								/>
							</div>
						</div>
					</div>

					<!-- Live Triage Assessment Banner -->
					{#if triageResult}
						{@const isRed = triageResult.level === 'red'}
						{@const isAmber = triageResult.level === 'amber'}
						<div
							class="p-4 rounded-xl border border-l-4 flex items-start gap-3 transition-colors
							{isRed ? 'bg-triage-red/10 border-triage-red/30 border-l-triage-red text-triage-red' : ''}
							{isAmber ? 'bg-triage-amber/12 border-triage-amber/40 border-l-triage-amber text-foreground' : ''}
							{!isRed && !isAmber
								? 'bg-triage-green/10 border-triage-green/30 border-l-triage-green text-triage-green'
								: ''}
						"
						>
							<ShieldAlert class="size-5 shrink-0 mt-0.5" />
							<div class="space-y-0.5">
								<p class="text-xs font-mono uppercase tracking-widest font-semibold">
									Triage Severity:
									{#if isRed}
										RED · CRITICAL
									{:else if isAmber}
										AMBER · PRIORITY
									{:else}
										GREEN · ROUTINE
									{/if}
								</p>
								<p class="text-sm font-medium opacity-90">{triageResult.reason}</p>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Navigation Footer -->
		<div class="flex justify-between mt-8 pt-5 border-t border-border">
			<Button
				variant="outline"
				class="min-h-11 px-5"
				disabled={currentStep === 1}
				onclick={() => {
					currentStep--;
					selectedPatient = null;
				}}
			>
				Back
			</Button>

			{#if currentStep === 1}
				<Button class="min-h-11 px-5" onclick={() => currentStep++} disabled={!selectedPatient}>
					Next Step <ArrowRight class="size-4 ml-2" />
				</Button>
			{:else}
				<Button
					class="min-h-11 px-6 font-semibold"
					onclick={preSaveVitals}
					disabled={isSubmitting || !selectedPatient}
				>
					{#if isSubmitting}
						Saving…
					{:else}
						Save &amp; Triage <ArrowRight class="size-4 ml-2" />
					{/if}
				</Button>
			{/if}
		</div>
	</div>
</div>

<Dialog.Root bind:open={showDuplicateWarning}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-amber-700 dark:text-triage-amber">
				<AlertTriangle class="size-5" /> Patient Already in Queue
			</Dialog.Title>
			<Dialog.Description>
				{selectedPatient?.name} already has an active ticket in the waiting queue. Proceeding will update
				their current triage level instead of creating a new ticket.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showDuplicateWarning = false)}>Cancel</Button>
			<Button onclick={handleSaveVitals}>Update Existing Ticket</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
