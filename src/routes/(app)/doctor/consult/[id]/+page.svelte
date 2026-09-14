<script lang="ts">
	import { page } from '$app/state';
	import { queueStore } from '$lib/state/queue.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import { vitalsStore } from '$lib/state/vitals.svelte';
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import { prescriptionStore } from '$lib/state/prescriptions.svelte';
	import { encounterStore } from '$lib/state/encounters.svelte';
	import { labRequestStore } from '$lib/state/lab-requests.svelte';
	import { reminderStore } from '$lib/state/reminders.svelte';
	import { settingsStore } from '$lib/state/settings.svelte';
	import { notificationStore } from '$lib/state/notifications.svelte';

	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Select as SelectPrimitive } from 'bits-ui';
	import * as Resizable from '$lib/components/ui/resizable';
	import { AudioWave } from '$lib/components/ui/audio-wave';
	import Sparkline from '$lib/components/Sparkline.svelte';

	import { toast } from 'svelte-sonner';
	import { aiService } from '$lib/services/ai/ai.service';
	import { getClinicalDecisionSupport, generateSoapNote } from '../../../../../routes/ai/ai.remote';
	import AiDisclaimer from '$lib/components/ui/ai-disclaimer.svelte';
	import {
		Stethoscope,
		Mic,
		MicOff,
		Loader2,
		Pill,
		Bell,
		Clipboard,
		Activity,
		FileSpreadsheet,
		User,
		Trash2,
		Plus,
		CheckCircle2,
		ChevronLeft,
		FlaskConical,
		Link,
		Send,
		Sparkles,
		AlertTriangle,
		ShieldCheck
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const ticketId = page.params.id as string;
	const ticket = $derived(queueStore.get(ticketId));
	const patient = $derived(ticket ? patientStore.get(ticket.patientId) : null);
	const vitalsHistory = $derived(patient ? vitalsStore.forPatient(patient.id) : []);
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

	// Form state
	let chiefComplaint = $state('');
	let doctorNotes = $state('');
	let isNhisBillable = $state(false);

	// Prescriptions state
	let selectedMedId = $state('');
	let quantity = $state<number>(1);
	let dosage = $state('');
	let prescriptions = $state<Array<{ id: string; name: string; quantity: number; dosage: string }>>(
		[]
	);

	// Lab Requests
	let testType = $state('');
	let urgency = $state('routine');
	let labNotes = $state('');

	// Referral
	let showReferralDialog = $state(false);
	let referralFacility = $state('');
	let referralReason = $state('');
	let referralUrgency = $state('routine');

	function generateReferral() {
		if (!patient) return;
		localStorage.setItem('temp_referral', JSON.stringify({
			patientName: patient.name,
			clinicId: patient.clinicId,
			age: patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 'Unknown',
			sex: patient.sex,
			facility: referralFacility,
			reason: referralReason,
			urgency: referralUrgency,
			date: new Date().toISOString(),
			vitals: vitals
		}));
		window.open(`/doctor/referral/print`, '_blank');
		showReferralDialog = false;
	}

	// Voice dictation
	let isRecording = $state(false);
	let aiProcessing = $state(false);
	let recognition: any = null;
	let interimTranscript = $state('');
	let finalTranscript = $state('');
	
	let selectedLanguage = $state('English');

	// Dr Assist (AI)
	let dssLoading = $state(false);
	let dssResult = $state<any>(null);
	let hasAcceptedAiTerms = $state(false);
	let showAiTermsModal = $state(false);

	function acceptAiTerms() {
		localStorage.setItem('clinicflow_ai_consent', 'true');
		hasAcceptedAiTerms = true;
		showAiTermsModal = false;
	}

	async function runDrAssist() {
		if (!chiefComplaint || chiefComplaint.length < 10) {
			return toast.error('Please enter a detailed Chief Complaint first.');
		}
		dssLoading = true;
		try {
			const res = await getClinicalDecisionSupport({
				vitals,
				chiefComplaint: chiefComplaint + '\n' + doctorNotes
			});
			dssResult = res;
		} catch (e: any) {
			toast.error(e.message);
		} finally {
			dssLoading = false;
		}
	}

	let soapLoading = $state(false);
	async function runSoapGenerator() {
		if (!chiefComplaint || chiefComplaint.length < 5) {
			return toast.error('Please enter a Chief Complaint first.');
		}
		soapLoading = true;
		try {
			const res = await generateSoapNote({
				vitals,
				transcript: chiefComplaint + '\n' + doctorNotes,
				patient
			});
			
			const formattedNote = 
`[AI-Drafted SOAP Note]
S: ${res.subjective}
O: ${res.objective}
A: ${res.assessment}
P: ${res.plan}`;
			
			doctorNotes = doctorNotes 
				? doctorNotes + '\n\n' + formattedNote 
				: formattedNote;
			
			toast.success('SOAP note drafted. Please review and edit.');
		} catch (e: any) {
			toast.error(e.message);
		} finally {
			soapLoading = false;
		}
	}

	onMount(() => {
		// Check local storage for consent
		hasAcceptedAiTerms = localStorage.getItem('clinicflow_ai_consent') === 'true';

		// Just in case they navigate directly to an invalid ticket
		if (!ticket) {
			toast.error('Queue ticket not found');
			goto('/doctor');
			return;
		}

		if (ticket.status === 'waiting') {
			queueStore.update(ticket.id, { status: 'in_progress', calledAt: Date.now() });
			
			// Notify nurse that patient has been called in by the doctor
			if (patient) {
				notificationStore.broadcast(
					'Patient Called',
					`Dr. has called ${patient.name} for consultation.`,
					'nurse',
					`/patients/${patient.clinicId}`
				);
			}
		}

		const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (SpeechRec) {
			recognition = new SpeechRec();
			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.onresult = (event: any) => {
				let interim = '';
				let final = '';
				for (let i = event.resultIndex; i < event.results.length; ++i) {
					if (event.results[i].isFinal) final += event.results[i][0].transcript;
					else interim += event.results[i][0].transcript;
				}
				finalTranscript += final;
				interimTranscript = interim;
			};
		}
	});

	function startRecording() {
		if (!recognition) return toast.error('Voice dictation not supported.');
		finalTranscript = '';
		interimTranscript = '';
		isRecording = true;
		recognition.start();
	}

	async function stopRecording() {
		if (!isRecording || !recognition) return;
		isRecording = false;
		recognition.stop();

		const text = (finalTranscript + ' ' + interimTranscript).trim();
		if (!text) return;

		aiProcessing = true;
		toast.info(`Structuring intake with AI (${selectedLanguage})...`);
		try {
			const structured = await aiService.structureIntake(text, selectedLanguage);
			chiefComplaint = structured.chiefComplaint || '';
			let note = `[AI Structuring]\nLanguage: ${selectedLanguage}\nDuration: ${structured.duration || 'N/A'}\nAssociated Symptoms: ${(structured.associatedSymptoms || []).join(', ')}\n\n[Raw Transcript]:\n${text}`;
			doctorNotes = doctorNotes ? doctorNotes + '\n\n' + note : note;
			toast.success('Intake structured');
		} catch (e) {
			toast.error('AI processing failed. Added raw text.');
			doctorNotes = doctorNotes ? doctorNotes + `\n\n[Raw]: ${text}` : `[Raw]: ${text}`;
		} finally {
			aiProcessing = false;
		}
	}

	function handleAddMed() {
		if (!selectedMedId) return toast.error('Select a medication');
		if (quantity <= 0) return toast.error('Quantity > 0');
		const med = pharmacyStore.get(selectedMedId);
		if (!med) return;
		prescriptions = [...prescriptions, { id: selectedMedId, name: med.itemName, quantity, dosage }];
		selectedMedId = '';
		quantity = 1;
		dosage = '';
	}

	async function handleCompleteEncounter() {
		if (!ticket || !patient) return;

		try {
			// 1. Create Encounter if it doesn't exist, or we just create a new one for this consultation
			let encounterId = ticket.encounterId;
			if (!encounterId) {
				const enc = await encounterStore.create({
					patientId: patient.id,
					phcId: ticket.phcId,
					chiefComplaint,
					doctorNotes,
					isNhisBillable,
					visitDate: Date.now()
				} as any);
				encounterId = enc;
			}

			// 2. Add lab request if filled out
			if (testType) {
				await labRequestStore.create({
					encounterId,
					patientId: patient.id,
					phcId: ticket.phcId,
					requestedByStaffId: 'none', // Will be overridden by remote
					testType,
					urgency,
					notes: labNotes,
					status: 'pending',
					result: null,
					resultEnteredByStaffId: null,
					resultEnteredAt: null
				} as any);
			}

			// 3. Process Prescriptions
			for (const p of prescriptions) {
				await pharmacyStore.deltaDecrement(p.id, p.quantity);
				await prescriptionStore.create({
					patientId: patient.id,
					encounterId,
					phcId: ticket.phcId,
					inventoryId: p.id,
					medicationName: p.name,
					quantity: p.quantity,
					dosage: p.dosage,
					status: 'pending'
				} as any);
			}

			if (prescriptions.length > 0) {
				notificationStore.broadcast(
					'New Prescription', 
					`Dr. has prescribed ${prescriptions.length} item(s) for ${patient.name}.`,
					'pharmacy',
					'/pharmacy'
				);
			}

			// 4. Mark ticket as done
			await queueStore.update(ticket.id, { status: 'done', completedAt: Date.now() });

			toast.success('Consultation completed successfully!');
			goto('/doctor');
		} catch (e: any) {
			toast.error(`Error completing consultation: ${e.message}`);
		}
	}
</script>

<svelte:head>
	<title>Consultation — ClinicFlow</title>
</svelte:head>

{#if !ticket || !patient}
	<div class="flex items-center justify-center min-h-[400px]">
		<Loader2 class="size-8 animate-spin text-primary" />
	</div>
{:else}
	<div class="h-[calc(100vh-80px)] flex flex-col gap-4 animate-fade-in -mx-4 sm:mx-0">
		<!-- Header -->
		<div class="flex items-center justify-between px-4 sm:px-0">
			<div class="flex items-center gap-3">
				<Button variant="outline" size="icon" href="/doctor" class="size-9 rounded-lg">
					<ChevronLeft class="size-4" />
				</Button>
				<div>
					<div class="flex items-center gap-3">
						<h1 class="text-xl font-bold text-foreground">{patient.name}</h1>
						<Badge variant="outline" class="uppercase font-mono text-[10px]"
							>{patient.clinicId}</Badge
						>
						{#if ticket.triageLevel === 'red'}
							<Badge class="bg-triage-red hover:bg-triage-red">RED</Badge>
						{:else if ticket.triageLevel === 'amber'}
							<Badge class="bg-triage-amber hover:bg-triage-amber">AMBER</Badge>
						{:else if ticket.triageLevel === 'green'}
							<Badge class="bg-triage-green hover:bg-triage-green">GREEN</Badge>
						{/if}
					</div>
					<p class="text-xs text-muted-foreground font-medium mt-0.5">
						Age: {patient.dob
							? new Date().getFullYear() - new Date(patient.dob).getFullYear()
							: 'Unknown'} • Sex: <span class="capitalize">{patient.sex}</span>
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<Button variant="outline" onclick={() => showReferralDialog = true}>
					<Send class="size-4 mr-2" /> Refer Patient
				</Button>
				<Button onclick={handleCompleteEncounter} class="bg-primary shadow-md hover:bg-primary/95">
					<CheckCircle2 class="size-4 mr-2" /> Complete
				</Button>
			</div>
		</div>

		<!-- Main Workspace (Resizable Split Pane) -->
		<Resizable.PaneGroup
			direction="horizontal"
			class="rounded-xl border bg-card flex-1 hidden md:flex"
		>
			<!-- Left Pane: Summary -->
			<Resizable.Pane defaultSize={30} minSize={20} class="p-4 bg-muted/10 overflow-y-auto">
				<div class="space-y-6">
					<h3 class="text-sm font-semibold flex items-center gap-2 text-foreground">
						<User class="size-4 text-primary" /> Patient Summary
					</h3>

					<!-- Vitals Snap -->
					{#if vitals}
						<Card class="border-border/50 shadow-sm">
							<CardHeader class="p-3 pb-2 border-b bg-muted/20">
								<CardTitle
									class="text-xs flex justify-between items-center text-muted-foreground font-semibold"
								>
									<span>Today's Vitals</span>
									<Activity class="size-3" />
								</CardTitle>
							</CardHeader>
							<CardContent class="p-3 grid grid-cols-2 gap-3">
								<div>
									<div class="text-[10px] text-muted-foreground font-semibold uppercase">Temp</div>
									<div class="text-sm font-bold text-foreground">
										{vitals.temperatureCelsius ?? '—'}°C
									</div>
									{#if tempTrend.length}
										<Sparkline data={tempTrend} width={80} height={12} color="var(--primary)" />
									{/if}
								</div>
								<div>
									<div class="text-[10px] text-muted-foreground font-semibold uppercase">BP</div>
									<div class="text-sm font-bold text-foreground">
										{vitals.systolicBp ?? '—'}/{vitals.diastolicBp ?? '—'}
									</div>
									{#if bpSysTrend.length}
										<Sparkline data={bpSysTrend} width={80} height={12} color="var(--accent)" />
									{/if}
								</div>
							</CardContent>
						</Card>
					{:else}
						<div
							class="text-xs text-muted-foreground italic p-3 border rounded-lg bg-card text-center"
						>
							No vitals recorded for this visit.
						</div>
					{/if}

					<!-- Recent Encounters -->
					<div>
						<h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
							History (Demo)
						</h4>
						<div class="space-y-2">
							<div class="p-3 border rounded-lg bg-card text-sm space-y-1">
								<div class="font-medium text-foreground">Malaria Follow-up</div>
								<div class="text-xs text-muted-foreground">Oct 10, 2023 • Dr. Okafor</div>
							</div>
							<div class="p-3 border rounded-lg bg-card text-sm space-y-1 opacity-70">
								<div class="font-medium text-foreground">Routine Checkup</div>
								<div class="text-xs text-muted-foreground">Sep 01, 2023 • Dr. Okafor</div>
							</div>
						</div>
					</div>
				</div>
			</Resizable.Pane>
			<Resizable.Handle withHandle />

			<!-- Right Pane: Tabs -->
			<Resizable.Pane defaultSize={70} class="bg-card">
				<Tabs value="notes" class="h-full flex flex-col">
					<div class="px-4 pt-3 border-b border-border/50 bg-muted/20">
						<TabsList class="bg-transparent h-auto p-0 gap-6">
							<TabsTrigger
								value="notes"
								class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-2"
								>Clinical Notes</TabsTrigger
							>
							<TabsTrigger
								value="rx"
								class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-2"
								>Prescriptions</TabsTrigger
							>
							<TabsTrigger
								value="lab"
								class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-2"
								>Lab Request</TabsTrigger
							>
							<TabsTrigger
								value="referral"
								class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-2"
								>Referral</TabsTrigger
							>
							<TabsTrigger
								value="ai-assist"
								class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-2 py-2"
							>
								<div class="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
									<Sparkles class="size-3.5" /> 
									Dr. Assist
								</div>
							</TabsTrigger>
						</TabsList>
					</div>

					<div class="flex-1 overflow-y-auto p-6">
						<TabsContent value="notes" class="m-0 space-y-6 animate-in fade-in-50 zoom-in-95">
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<Label class="font-semibold flex items-center gap-1.5"
										><Clipboard class="size-4" /> Chief Complaint</Label
									>
									
									{#if settingsStore.current.aiVoiceEnabled}
										<div class="flex items-center gap-2">
											<Select type="single" bind:value={selectedLanguage}>
												<SelectTrigger class="h-7 text-xs w-[110px]"><SelectPrimitive.Value placeholder="Language" /></SelectTrigger>
												<SelectContent>
													<SelectItem value="English">English</SelectItem>
													<SelectItem value="Nigerian Pidgin">Pidgin</SelectItem>
												</SelectContent>
											</Select>
											<Button
												variant={isRecording ? 'destructive' : 'outline'}
												size="sm"
												class="h-7 text-xs"
												onmousedown={startRecording}
												onmouseup={stopRecording}
												onmouseleave={stopRecording}
												disabled={aiProcessing}
											>
												{#if aiProcessing}
													<Loader2 class="size-3 animate-spin mr-1" /> Processing...
												{:else if isRecording}
													<MicOff class="size-3 mr-1 animate-pulse" /> Recording...
												{:else}
													<Mic class="size-3 mr-1" /> Hold to Dictate
												{/if}
											</Button>
										</div>
									{/if}
								</div>
								<Textarea
									bind:value={chiefComplaint}
									class="min-h-[80px]"
									placeholder="Patient presents with..."
								/>
							</div>
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<Label class="font-semibold flex items-center gap-1.5">
										<FileSpreadsheet class="size-4" /> Doctor Notes
									</Label>
									{#if settingsStore.current.aiVoiceEnabled && hasAcceptedAiTerms}
										<Button 
											variant="outline" 
											size="sm" 
											class="h-7 text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100" 
											onclick={runSoapGenerator} 
											disabled={soapLoading}
										>
											{#if soapLoading}
												<Loader2 class="size-3 mr-1.5 animate-spin" /> Drafting...
											{:else}
												<Sparkles class="size-3 mr-1.5" /> Generate SOAP Note
											{/if}
										</Button>
									{/if}
								</div>
								<Textarea
									bind:value={doctorNotes}
									class="min-h-[200px]"
									placeholder="Diagnosis and treatment plan..."
								/>
							</div>
						</TabsContent>

						<TabsContent value="rx" class="m-0 space-y-6 animate-in fade-in-50 zoom-in-95">
							<Card class="border-dashed shadow-sm">
								<CardHeader class="pb-3">
									<CardTitle class="text-sm">Add Medication</CardTitle>
								</CardHeader>
								<CardContent>
									<div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
										<div class="md:col-span-2 space-y-2">
											<Label>Item</Label>
											<Select type="single" bind:value={selectedMedId}>
												<SelectTrigger class="h-9"
													><SelectPrimitive.Value placeholder="Select Medication" /></SelectTrigger
												>
												<SelectContent>
													{#each pharmacyStore.items || [] as med}
														<SelectItem value={med.id}
															>{med.itemName} (Stock: {med.currentStock})</SelectItem
														>
													{/each}
												</SelectContent>
											</Select>
										</div>
										<div class="space-y-2">
											<Label>Qty</Label>
											<Input type="number" bind:value={quantity} min={1} class="h-9" />
										</div>
										<Button onclick={handleAddMed} class="h-9"
											><Plus class="size-4 mr-2" /> Add</Button
										>
									</div>
								</CardContent>
							</Card>

							{#if prescriptions.length > 0}
								<div class="border rounded-lg overflow-hidden">
									<table class="w-full text-sm">
										<thead class="bg-muted/50 border-b"
											><tr
												><th class="px-3 py-2 text-left font-medium">Medication</th><th
													class="px-3 py-2 text-left font-medium">Qty</th
												><th class="px-3 py-2 text-right"></th></tr
											></thead
										>
										<tbody class="divide-y">
											{#each prescriptions as p, i}
												<tr class="hover:bg-muted/30"
													><td class="px-3 py-2">{p.name}</td><td class="px-3 py-2">{p.quantity}</td
													><td class="px-3 py-2 text-right"
														><Button
															variant="ghost"
															size="sm"
															class="text-destructive h-7 px-2"
															onclick={() =>
																(prescriptions = prescriptions.filter((_, idx) => idx !== i))}
															><Trash2 class="size-3" /></Button
														></td
													></tr
												>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</TabsContent>

						<TabsContent value="lab" class="m-0 space-y-6 animate-in fade-in-50 zoom-in-95">
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-2">
									<Label>Test Type</Label>
									<Input bind:value={testType} placeholder="e.g. Malaria RDT, FBC, Widal" />
								</div>
								<div class="space-y-2">
									<Label>Urgency</Label>
									<Select type="single" bind:value={urgency}>
										<SelectTrigger><SelectPrimitive.Value placeholder="Select" /></SelectTrigger>
										<SelectContent>
											<SelectItem value="routine">Routine</SelectItem>
											<SelectItem value="urgent">Urgent</SelectItem>
											<SelectItem value="stat">STAT (Immediate)</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div class="space-y-2">
								<Label>Clinical Notes for Lab</Label>
								<Textarea bind:value={labNotes} placeholder="Reason for test..." />
							</div>
							<div
								class="p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs flex gap-2"
							>
								<FlaskConical class="size-4 shrink-0" />
								This request will be sent to the Pharmacy/Lab dashboard immediately upon completing the
								consultation.
							</div>
						</TabsContent>

						<TabsContent value="referral" class="m-0 space-y-4 animate-in fade-in-50 zoom-in-95">
							<div
								class="p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-3"
							>
								<div class="p-3 bg-muted rounded-full text-muted-foreground">
									<Link class="size-6" />
								</div>
								<div>
									<h4 class="font-semibold text-foreground">External Referral</h4>
									<p class="text-sm text-muted-foreground mt-1 max-w-sm">
										Need to transfer to a secondary facility? Generate a standardized referral
										letter.
									</p>
								</div>
								<Button variant="outline" class="mt-2">Generate Referral Letter</Button>
							</div>
						</TabsContent>
						<TabsContent value="ai-assist" class="m-0 space-y-4 animate-in fade-in-50 zoom-in-95">
							<AiDisclaimer />
							
							{#if !hasAcceptedAiTerms}
								<div class="p-8 border rounded-xl flex flex-col items-center justify-center text-center space-y-4 bg-muted/30 mt-6">
									<ShieldCheck class="size-12 text-primary" />
									<div>
										<h3 class="font-bold text-lg">AI Clinical Decision Support</h3>
										<p class="text-sm text-muted-foreground max-w-md mt-2">
											Dr. Assist is an experimental AI tool designed to provide second opinions and differential diagnoses based on WHO guidelines.
										</p>
									</div>
									<Button onclick={() => showAiTermsModal = true}>Review & Accept Terms to Enable</Button>
								</div>
							{:else}
								<div class="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl mb-6">
									<div class="space-y-1">
										<h4 class="font-semibold text-indigo-900 dark:text-indigo-200">Run Analysis</h4>
										<p class="text-xs text-indigo-700/70 dark:text-indigo-300/70">Analyze current vitals and notes to generate clinical suggestions.</p>
									</div>
									<Button onclick={runDrAssist} disabled={dssLoading} class="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
										{#if dssLoading}
											<Loader2 class="size-4 mr-2 animate-spin" /> Analyzing...
										{:else}
											<Sparkles class="size-4 mr-2" /> Run AI Analysis
										{/if}
									</Button>
								</div>
								
								{#if dssResult}
									<div class="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
										{#if dssResult.redFlags && dssResult.redFlags.length > 0}
											<div class="p-4 rounded-xl border border-red-500/30 bg-red-500/10 space-y-2 shadow-sm">
												<h4 class="font-bold text-red-600 flex items-center gap-2">
													<AlertTriangle class="size-5" /> CRITICAL RED FLAGS DETECTED
												</h4>
												<ul class="list-disc list-inside text-sm font-medium text-red-700/90 space-y-1 pl-1">
													{#each dssResult.redFlags as flag}
														<li>{flag}</li>
													{/each}
												</ul>
											</div>
										{/if}
										
										<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
											<Card class="shadow-sm">
												<CardHeader class="pb-2 bg-muted/20 border-b">
													<CardTitle class="text-sm font-semibold flex items-center gap-2">
														<Activity class="size-4 text-indigo-500" /> Differentials
													</CardTitle>
												</CardHeader>
												<CardContent class="space-y-4 pt-4">
													{#each dssResult.differentials as diff}
														<div class="space-y-1.5">
															<div class="flex items-center justify-between">
																<span class="font-medium text-sm">{diff.condition}</span>
																<Badge variant={diff.probability === 'High' ? 'default' : 'outline'} class="text-[10px] uppercase {diff.probability === 'High' ? 'bg-indigo-600' : ''}">
																	{diff.probability}
																</Badge>
															</div>
															<p class="text-xs text-muted-foreground leading-relaxed">{diff.rationale}</p>
														</div>
														<Separator />
													{/each}
												</CardContent>
											</Card>
											
											<div class="space-y-4">
												<Card class="shadow-sm">
													<CardHeader class="pb-2 bg-muted/20 border-b">
														<CardTitle class="text-sm font-semibold flex justify-between items-center">
															<div class="flex items-center gap-2">
																<FlaskConical class="size-4 text-indigo-500" /> Suggested Tests
															</div>
															<Button variant="outline" size="sm" class="h-6 text-xs px-2" onclick={() => {
																labNotes = dssResult.suggestedTests.join(', ');
																toast.success('Tests copied to Lab Notes');
															}}>Copy to Lab</Button>
														</CardTitle>
													</CardHeader>
													<CardContent class="pt-4">
														<ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
															{#each dssResult.suggestedTests as test}
																<li>{test}</li>
															{/each}
														</ul>
													</CardContent>
												</Card>
												
												<Card class="shadow-sm">
													<CardHeader class="pb-2 bg-muted/20 border-b">
														<CardTitle class="text-sm font-semibold flex justify-between items-center">
															<div class="flex items-center gap-2">
																<Pill class="size-4 text-indigo-500" /> Treatment Plan
															</div>
															<Button variant="outline" size="sm" class="h-6 text-xs px-2" onclick={() => {
																const plan = '\n[AI Treatment Plan]:\n- ' + dssResult.treatments.join('\n- ');
																doctorNotes += plan;
																toast.success('Inserted into Doctor Notes');
															}}>Insert to Notes</Button>
														</CardTitle>
													</CardHeader>
													<CardContent class="pt-4">
														<ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
															{#each dssResult.treatments as tx}
																<li>{tx}</li>
															{/each}
														</ul>
													</CardContent>
												</Card>
											</div>
										</div>
										
										<p class="text-xs text-center text-muted-foreground italic bg-muted/50 p-2 rounded-md">{dssResult.disclaimer}</p>
									</div>
								{/if}
							{/if}
						</TabsContent>
					</div>
					
					{#if patient.isNhis}
						<div class="mt-6 p-4 border rounded-xl bg-blue-500/5 border-blue-500/20">
							<label class="flex items-center gap-3 cursor-pointer">
								<input type="checkbox" bind:checked={isNhisBillable} class="accent-blue-600 size-5" />
								<div class="space-y-0.5">
									<p class="font-semibold text-blue-900 dark:text-blue-200">Submit as NHIS Claim</p>
									<p class="text-xs text-blue-700/70 dark:text-blue-300/70">Flag this encounter and its services for HMO billing.</p>
								</div>
							</label>
						</div>
					{/if}
				</Tabs>
			</Resizable.Pane>
		</Resizable.PaneGroup>

		<!-- Mobile Fallback (Stack) -->
		<div class="md:hidden space-y-4 pb-20">
			<div class="p-4 bg-muted/10 rounded-xl border">
				<h3 class="text-sm font-semibold flex items-center gap-2 text-foreground mb-3">
					<User class="size-4 text-primary" /> Patient Summary
				</h3>
				<!-- Same content as left pane for mobile -->
				<p class="text-xs text-muted-foreground">
					Please use a tablet or desktop for the full consultation interface.
				</p>
			</div>
			<!-- Tab content stacked for mobile -->
		</div>
	</div>
{/if}

<Dialog.Root bind:open={showReferralDialog}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Generate Referral Letter</Dialog.Title>
			<Dialog.Description>
				Create a structured referral for {patient?.name}.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="space-y-2">
				<Label>Receiving Facility</Label>
				<Input bind:value={referralFacility} placeholder="e.g. General Hospital, Benin City" />
			</div>
			<div class="space-y-2">
				<Label>Reason for Referral / Provisional Diagnosis</Label>
				<Textarea bind:value={referralReason} placeholder="Enter reason for referral..." rows={3} />
			</div>
			<div class="space-y-2">
				<Label>Urgency</Label>
				<Select type="single" bind:value={referralUrgency}>
					<SelectTrigger><SelectPrimitive.Value placeholder="Select Urgency" /></SelectTrigger>
					<SelectContent>
						<SelectItem value="routine">Routine</SelectItem>
						<SelectItem value="urgent">Urgent</SelectItem>
						<SelectItem value="emergency">Emergency (Stat)</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => showReferralDialog = false}>Cancel</Button>
			<Button onclick={generateReferral} disabled={!referralFacility || !referralReason}>
				Generate PDF
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showAiTermsModal}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-amber-600">
				<AlertTriangle class="size-5" /> AI Safety & Liability
			</Dialog.Title>
		</Dialog.Header>
		<div class="py-4 space-y-4 text-sm text-foreground">
			<p>
				You are enabling <strong>Dr. Assist</strong>, an experimental AI clinical decision support tool.
			</p>
			<ul class="list-disc list-inside space-y-2 text-muted-foreground">
				<li>Dr. Assist is for <strong>informational purposes only</strong>.</li>
				<li>It may hallucinate or provide incorrect medical advice.</li>
				<li><strong>You are solely responsible</strong> for the final diagnosis and treatment plan.</li>
				<li>Do not blindly prescribe medication without verifying clinical appropriateness.</li>
			</ul>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => showAiTermsModal = false}>Decline</Button>
			<Button onclick={acceptAiTerms} class="bg-amber-600 hover:bg-amber-700 text-white font-medium">
				I Understand & Accept
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
