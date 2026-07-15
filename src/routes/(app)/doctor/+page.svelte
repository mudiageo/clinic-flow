<script lang="ts">
	import { queueStore } from '$lib/state/queue.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import { vitalsStore } from '$lib/state/vitals.svelte';
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import { reminderStore } from '$lib/state/reminders.svelte';
	import { prescriptionStore } from '$lib/state/prescriptions.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Select as SelectPrimitive } from 'bits-ui';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Separator } from '$lib/components/ui/separator';
	import Sparkline from '$lib/components/Sparkline.svelte';
	import { AudioWave } from '$lib/components/ui/audio-wave';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { aiService } from '$lib/services/ai/ai.service';
	import {
		Stethoscope,
		Mic,
		MicOff,
		Loader2,
		Pill,
		Bell,
		Clipboard,
		FileSpreadsheet,
		User,
		Activity,
		Clock,
		Plus,
		Trash,
		Trash2,
		Calendar,
		Send,
		CheckCircle2,
		AlertTriangle
	} from '@lucide/svelte';

	let selectedTicket = $state<any>(null);
	let chiefComplaint = $state('');
	let doctorNotes = $state('');

	// Prescription builder state
	let selectedMedId = $state('');
	let quantity = $state<number>(1);
	let dosage = $state('');
	let prescriptions = $state<Array<{ id: string; name: string; quantity: number; dosage: string }>>(
		[]
	);

	// Reminder builder state
	let reminderLabel = $state('');
	let reminderDays = $state<number>(7);
	let reminderType = $state<'follow_up' | 'immunization' | 'antenatal'>('follow_up');

	// Voice Recording state
	let isRecording = $state(false);
	let aiProcessing = $state(false);
	let recognition: any = null;
	let interimTranscript = $state('');
	let finalTranscript = $state('');

	onMount(() => {
		const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (SpeechRec) {
			recognition = new SpeechRec();
			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.onresult = (event: any) => {
				let interim = '';
				let final = '';
				for (let i = event.resultIndex; i < event.results.length; ++i) {
					if (event.results[i].isFinal) {
						final += event.results[i][0].transcript;
					} else {
						interim += event.results[i][0].transcript;
					}
				}
				finalTranscript += final;
				interimTranscript = interim;
			};
			recognition.onerror = (e: any) => {
				console.error('Speech recognition error', e);
				isRecording = false;
				toast.error('Voice recognition error. Please check microphone permissions.');
			};
		}
	});

	function startRecording() {
		if (!recognition) {
			toast.error('Voice dictation not supported in this browser.');
			return;
		}
		finalTranscript = '';
		interimTranscript = '';
		isRecording = true;
		recognition.start();
	}

	async function stopRecording() {
		if (!isRecording || !recognition) return;
		isRecording = false;
		recognition.stop();

		const textToProcess = (finalTranscript + ' ' + interimTranscript).trim();
		if (!textToProcess) return;

		aiProcessing = true;
		toast.info('Structuring intake with AI (falls back to local offline model if needed)...');
		try {
			const structured = await aiService.structureIntake(textToProcess);

			chiefComplaint = structured.chiefComplaint || '';

			let note = `[AI Structuring]\nDuration: ${structured.duration || 'N/A'}\nAssociated Symptoms: ${(structured.associatedSymptoms || []).join(', ')}\nLanguage: ${structured.detectedLanguage || 'Unknown'}\n\n[Raw Transcript]:\n${textToProcess}`;

			if (doctorNotes) {
				doctorNotes += '\n\n' + note;
			} else {
				doctorNotes = note;
			}

			toast.success('Intake structured successfully');
		} catch (e: any) {
			toast.error('AI processing failed. Raw transcript appended to notes.');
			if (doctorNotes) {
				doctorNotes += `\n\n[Raw Transcript]: ${textToProcess}`;
			} else {
				doctorNotes = `[Raw Transcript]: ${textToProcess}`;
			}
		} finally {
			aiProcessing = false;
		}
	}

	const activeTickets = $derived(
		queueStore.sortedQueue.filter((t: any) => t.status === 'called' || t.status === 'waiting')
	);

	const patient = $derived(selectedTicket ? patientStore.get(selectedTicket.patientId) : null);
	const vitalsHistory = $derived(
		selectedTicket ? vitalsStore.forPatient(selectedTicket.patientId) : []
	);
	const vitals = $derived(vitalsHistory.length > 0 ? vitalsHistory[0] : null);

	const chronoVitals = $derived([...vitalsHistory].reverse());
	const tempTrend = $derived(
		chronoVitals.map((v) => v.temperatureCelsius).filter((v) => v !== null) as number[]
	);
	const bpSysTrend = $derived(
		chronoVitals.map((v) => v.systolicBp).filter((v) => v !== null) as number[]
	);
	const pulseTrend = $derived(
		chronoVitals.map((v) => v.pulseBpm).filter((v) => v !== null) as number[]
	);
	const spo2Trend = $derived(
		chronoVitals.map((v) => v.spo2Percent).filter((v) => v !== null) as number[]
	);
	const weightTrend = $derived(
		chronoVitals.map((v) => v.weightKg).filter((v) => v !== null) as number[]
	);

	function handleSelectTicket(ticket: any) {
		selectedTicket = ticket;
		chiefComplaint = '';
		doctorNotes = '';
		prescriptions = [];
		selectedMedId = '';
		quantity = 1;
		dosage = '';
		reminderLabel = '';
		reminderDays = 7;
		reminderType = 'follow_up';
	}

	function handleAddMed() {
		if (!selectedMedId) {
			toast.error('Select a medication first');
			return;
		}
		const med = pharmacyStore.get(selectedMedId);
		if (!med) return;

		if (quantity <= 0) {
			toast.error('Quantity must be greater than zero');
			return;
		}

		prescriptions = [
			...prescriptions,
			{
				id: selectedMedId,
				name: med.itemName,
				quantity,
				dosage
			}
		];

		selectedMedId = '';
		quantity = 1;
		dosage = '';
	}

	function handleRemoveMed(index: number) {
		prescriptions = prescriptions.filter((_, i) => i !== index);
	}

	async function handleCompleteEncounter() {
		if (!selectedTicket) return;

		try {
			// 1. Delta-decrement pharmacy inventory for each prescription (offline-first)
			for (const p of prescriptions) {
				await pharmacyStore.deltaDecrement(p.id, p.quantity);
			}

			// 2. Mark queue ticket as completed/done
			await queueStore.update(selectedTicket.id, {
				status: 'done',
				completedAt: Date.now()
			} as any);

			// 3. Schedule SMS Reminder if provided
			if (reminderLabel && patient?.phone) {
				await reminderStore.create({
					patientId: selectedTicket.patientId,
					phcId: selectedTicket.phcId,
					type: reminderType,
					label: reminderLabel,
					dueDate: Date.now() + reminderDays * 24 * 60 * 60 * 1000,
					recipientPhone: patient.phone,
					status: 'scheduled',
					sentAt: null,
					provider: null,
					providerMessageId: null
				} as any);
			}

			// 4. Save prescriptions
			for (const p of prescriptions) {
				await prescriptionStore.create({
					patientId: selectedTicket.patientId,
					encounterId: 'temp-encounter', // would be linked to an encounter in real app
					phcId: selectedTicket.phcId,
					inventoryId: p.id,
					medicationName: p.name,
					quantity: p.quantity,
					dosage: p.dosage,
					status: 'pending',
					syncStatus: 'pending',
					updatedAt: Date.now()
				} as any);
			}

			toast.success('Consultation completed successfully!');

			// Clear workspace
			selectedTicket = null;
		} catch (e: any) {
			toast.error(`Failed to complete: ${e.message}`);
		}
	}
</script>

<svelte:head>
	<title>Doctor Desk — ClinicFlow</title>
</svelte:head>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
	<!-- Left Side: Consultation Queue -->
	<div class="space-y-6 lg:col-span-1">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<Stethoscope class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Doctor Desk</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">Consultation Waiting Room</p>
			</div>
		</div>

		<Card class="bg-card/60 card-hover overflow-hidden">
			<CardHeader class="pb-3 border-b border-border/60">
				<CardTitle class="text-base font-semibold">Active Consultations</CardTitle>
			</CardHeader>
			<CardContent class="p-0">
				<div class="divide-y divide-border">
					{#if activeTickets.length === 0}
						<div class="flex flex-col items-center justify-center py-16 text-center px-6">
							<Clock class="size-6 text-muted-foreground/60 mb-2" />
							<p class="text-sm text-muted-foreground font-medium">No active patients waiting</p>
						</div>
					{:else}
						{#each activeTickets as ticket (ticket.id)}
							{@const p = patientStore.get(ticket.patientId)}
							<button
								class="w-full text-left p-4 hover:bg-muted/40 flex items-center justify-between transition-colors outline-none
                  {selectedTicket?.id === ticket.id
									? 'bg-primary/5 border-l-2 border-primary'
									: ''}"
								onclick={() => handleSelectTicket(ticket)}
							>
								<div>
									{#if p}
										<div class="font-semibold text-foreground text-sm">{p.name}</div>
										<div class="text-xs text-muted-foreground font-mono mt-0.5">{p.clinicId}</div>
									{:else}
										<div class="text-muted-foreground italic text-sm">Unknown Patient</div>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									{#if ticket.triageLevel === 'red'}
										<Badge
											class="bg-triage-red text-triage-red-foreground font-semibold px-2 py-0.5 hover:bg-triage-red"
											>RED</Badge
										>
									{:else}
										{#if ticket.triageLevel === 'amber'}
											<Badge
												class="bg-triage-amber text-triage-amber-foreground font-semibold px-2 py-0.5 hover:bg-triage-amber"
												>AMBER</Badge
											>
										{:else}
											<Badge
												class="bg-triage-green text-triage-green-foreground font-semibold px-2 py-0.5 hover:bg-triage-green"
												>GREEN</Badge
											>
										{/if}
									{/if}
								</div>
							</button>
						{/each}
					{/if}
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Right Side: Consultation Form Workspace -->
	<div class="lg:col-span-2 space-y-6">
		{#if selectedTicket}
			<Card class="bg-card/60 card-hover overflow-hidden">
				<CardHeader
					class="border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between py-4"
				>
					<div>
						<CardTitle class="text-lg font-bold text-foreground">{patient?.name}</CardTitle>
						<CardDescription class="mt-0.5 font-medium"
							>{patient?.clinicId} • Sex:
							<span class="capitalize">{patient?.sex}</span></CardDescription
						>
					</div>
					<div>
						{#if selectedTicket.triageLevel === 'red'}
							<Badge
								class="bg-triage-red text-triage-red-foreground glow-triage-red font-semibold animate-pulse"
								>RED - IMMEDIATE</Badge
							>
						{:else if selectedTicket.triageLevel === 'amber'}
							<Badge class="bg-triage-amber text-triage-amber-foreground font-semibold"
								>AMBER - STABLE ALERT</Badge
							>
						{:else}
							<Badge class="bg-triage-green text-triage-green-foreground font-semibold"
								>GREEN - STABLE</Badge
							>
						{/if}
					</div>
				</CardHeader>

				<CardContent class="pt-6 space-y-6">
					<!-- Vitals Summary Card -->
					{#if vitals}
						<div
							class="p-4 bg-background/50 border border-border/60 rounded-xl grid grid-cols-3 md:grid-cols-6 gap-3 text-center"
						>
							<div class="flex flex-col items-center">
								<p class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
									Temp
								</p>
								<p class="text-base font-extrabold text-foreground mt-0.5">
									{vitals.temperatureCelsius ?? '—'}°C
								</p>
								<Sparkline
									data={tempTrend}
									width={60}
									height={18}
									color="oklch(from var(--destructive) l c h)"
								/>
							</div>
							<div class="flex flex-col items-center">
								<p class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
									BP
								</p>
								<p class="text-base font-extrabold text-foreground mt-0.5">
									{vitals.systolicBp ?? '—'}/{vitals.diastolicBp ?? '—'}
								</p>
								<Sparkline
									data={bpSysTrend}
									width={60}
									height={18}
									color="oklch(from var(--primary) l c h)"
								/>
							</div>
							<div class="flex flex-col items-center">
								<p class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
									Pulse
								</p>
								<p class="text-base font-extrabold text-foreground mt-0.5">
									{vitals.pulseBpm ?? '—'} BPM
								</p>
								<Sparkline
									data={pulseTrend}
									width={60}
									height={18}
									color="oklch(from var(--accent) l c h)"
								/>
							</div>
							<div class="flex flex-col items-center">
								<p class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
									SpO2
								</p>
								<p class="text-base font-extrabold text-foreground mt-0.5">
									{vitals.spo2Percent ?? '—'}%
								</p>
								<Sparkline
									data={spo2Trend}
									width={60}
									height={18}
									color="oklch(from var(--triage-green) l c h)"
								/>
							</div>
							<div class="flex flex-col items-center">
								<p class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
									Weight
								</p>
								<p class="text-base font-extrabold text-foreground mt-0.5">
									{vitals.weightKg ?? '—'} kg
								</p>
								<Sparkline
									data={weightTrend}
									width={60}
									height={18}
									color="oklch(from var(--triage-amber) l c h)"
								/>
							</div>
							<div class="flex flex-col items-center justify-center border-l border-border/60 pl-2">
								<p class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
									Triage Reason
								</p>
								<p
									class="text-xs font-semibold text-primary mt-1 truncate px-1 max-w-[90px]"
									title={vitals.triageReason ?? 'Normal'}
								>
									{vitals.triageReason ?? 'Normal'}
								</p>
							</div>
						</div>
					{/if}

					<!-- Encounter Form -->
					<div class="space-y-4">
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<Label class="text-foreground font-semibold flex items-center gap-1.5">
									<Clipboard class="size-4 text-muted-foreground" />
									Chief Complaint
								</Label>
								<div class="flex items-center gap-2">
									{#if isRecording}
										<AudioWave
											playing={true}
											bars={6}
											class="h-5 w-8 mr-1"
											barColor="bg-destructive"
										/>
									{/if}
									<Button
										variant={isRecording ? 'destructive' : 'outline'}
										size="sm"
										class="h-8 gap-1.5 border-border btn-press text-xs font-medium"
										onmousedown={startRecording}
										onmouseup={stopRecording}
										onmouseleave={stopRecording}
										ontouchstart={startRecording}
										ontouchend={stopRecording}
										disabled={aiProcessing}
									>
										{#if aiProcessing}
											<Loader2 class="size-3 animate-spin text-primary" />
											Processing AI...
										{:else if isRecording}
											<MicOff class="size-3 animate-pulse" />
											Release to Stop
										{:else}
											<Mic class="size-3" />
											Hold to Dictate
										{/if}
									</Button>
								</div>
							</div>
							<Textarea
								bind:value={chiefComplaint}
								placeholder="Type or hold voice dictation button to speak intake details..."
								class="bg-background/50 border-border text-foreground min-h-[90px] focus-visible:ring-primary/20"
							/>
							{#if isRecording || aiProcessing}
								<p class="text-xs text-muted-foreground italic">
									{isRecording
										? 'Listening: ' + (interimTranscript || '...')
										: 'AI model structuring voice recording into clinical intake format...'}
								</p>
							{/if}
						</div>

						<div class="space-y-2">
							<Label class="text-foreground font-semibold flex items-center gap-1.5">
								<FileSpreadsheet class="size-4 text-muted-foreground" />
								Clinical Consultation Notes
							</Label>
							<Textarea
								bind:value={doctorNotes}
								placeholder="Document clinical observations, diagnosis, treatment plans, and notes here..."
								class="bg-background/50 border-border text-foreground min-h-[140px] focus-visible:ring-primary/20"
							/>
						</div>
					</div>

					<!-- Prescription Builder Section -->
					<Separator class="bg-border/60" />
					<div class="space-y-4">
						<h3 class="text-foreground font-bold text-sm flex items-center gap-1.5">
							<Pill class="size-4 text-muted-foreground" />
							Prescription Builder
						</h3>

						<div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
							<div class="md:col-span-2 space-y-2">
								<Label class="text-foreground">Medication Item</Label>
								<Select type="single" bind:value={selectedMedId}>
									<SelectTrigger class="bg-background/50 border-border text-foreground h-10">
										<SelectPrimitive.Value placeholder="Select Medication" />
									</SelectTrigger>
									<SelectContent class="bg-card border-border max-h-60 overflow-y-auto">
										{#each pharmacyStore.items || [] as med}
											<SelectItem value={med.id} class="hover:bg-muted"
												>{med.itemName} ({med.currentStock} in stock)</SelectItem
											>
										{/each}
									</SelectContent>
								</Select>
							</div>

							<div class="space-y-2">
								<Label class="text-foreground">Quantity</Label>
								<Input
									type="number"
									bind:value={quantity}
									min={1}
									class="bg-background/50 border-border text-foreground h-10"
								/>
							</div>

							<Button
								onclick={handleAddMed}
								class="bg-secondary text-secondary-foreground hover:bg-muted btn-press h-10"
							>
								<Plus class="size-4 mr-1.5" />
								Add Item
							</Button>
						</div>

						<!-- Prescription List Table -->
						{#if prescriptions.length > 0}
							<div class="border border-border rounded-xl overflow-hidden mt-3 animate-fade-in">
								<Table>
									<TableHeader class="bg-muted/30">
										<TableRow class="hover:bg-transparent">
											<TableHead
												class="font-semibold text-muted-foreground px-4 py-2.5 text-xs uppercase tracking-wider"
												>Item Name</TableHead
											>
											<TableHead
												class="font-semibold text-muted-foreground px-4 py-2.5 w-24 text-xs uppercase tracking-wider"
												>Quantity</TableHead
											>
											<TableHead
												class="font-semibold text-muted-foreground px-4 py-2.5 text-right w-24 text-xs uppercase tracking-wider"
												>Action</TableHead
											>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each prescriptions as item, idx}
											<TableRow class="border-border hover:bg-muted/40 transition-colors">
												<TableCell class="text-foreground px-4 py-2.5 font-medium"
													>{item.name}</TableCell
												>
												<TableCell class="text-foreground px-4 py-2.5 font-bold tabular-nums"
													>{item.quantity}</TableCell
												>
												<TableCell class="text-right px-4 py-2.5">
													<Button
														variant="ghost"
														size="sm"
														class="text-destructive hover:text-destructive hover:bg-destructive/10 btn-press h-8 px-2"
														onclick={() => handleRemoveMed(idx)}
													>
														<Trash2 class="size-3.5" />
													</Button>
												</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							</div>
						{/if}
					</div>

					<!-- Reminder Builder Section -->
					<Separator class="bg-border/60" />
					<div class="space-y-4">
						<h3 class="text-foreground font-bold text-sm flex items-center gap-1.5">
							<Bell class="size-4 text-muted-foreground" />
							Schedule Follow-Up SMS
						</h3>
						{#if !patient?.phone}
							<div
								class="p-3 bg-accent/10 border border-accent/20 rounded-xl text-accent-foreground text-xs flex items-center gap-2"
							>
								<AlertTriangle class="size-4" />
								Patient does not have a phone number on file. SMS scheduling disabled.
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
								<div class="space-y-2">
									<Label class="text-foreground">Type</Label>
									<Select type="single" bind:value={reminderType}>
										<SelectTrigger class="bg-background/50 border-border text-foreground h-10">
											<SelectPrimitive.Value placeholder="Select Type" />
										</SelectTrigger>
										<SelectContent class="bg-card border-border">
											<SelectItem value="follow_up" class="hover:bg-muted">Follow Up</SelectItem>
											<SelectItem value="immunization" class="hover:bg-muted"
												>Immunization</SelectItem
											>
											<SelectItem value="antenatal" class="hover:bg-muted">Antenatal</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div class="md:col-span-2 space-y-2">
									<Label class="text-foreground">Reminder message to send</Label>
									<Input
										bind:value={reminderLabel}
										placeholder="e.g. Come back for your follow-up check..."
										class="bg-background/50 border-border text-foreground h-10"
									/>
								</div>
								<div class="space-y-2">
									<Label class="text-foreground">Days from now</Label>
									<Input
										type="number"
										bind:value={reminderDays}
										min={1}
										class="bg-background/50 border-border text-foreground h-10"
									/>
								</div>
							</div>
						{/if}
					</div>

					<!-- Footer Actions -->
					<div class="flex justify-end gap-3 pt-4 border-t border-border/60">
						<Button
							onclick={() => (selectedTicket = null)}
							variant="outline"
							class="border-border text-muted-foreground btn-press h-10 px-5"
						>
							Discard
						</Button>
						<Button
							onclick={handleCompleteEncounter}
							class="bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 btn-press h-10 px-6"
						>
							<CheckCircle2 class="size-4 mr-1.5" />
							Complete Consultation
						</Button>
					</div>
				</CardContent>
			</Card>
		{:else}
			<div
				class="min-h-[400px] flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-8 text-muted-foreground bg-card/25 animate-pulse text-center"
			>
				<Stethoscope class="size-10 text-muted-foreground/40 mb-3" />
				<span class="text-sm font-medium"
					>Select a patient from the waiting room queue to begin consultation</span
				>
			</div>
		{/if}
	</div>
</div>
