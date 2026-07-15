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

	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Select as SelectPrimitive } from 'bits-ui';
	import * as Resizable from '$lib/components/ui/resizable';
	import { AudioWave } from '$lib/components/ui/audio-wave';
	import Sparkline from '$lib/components/Sparkline.svelte';
	
	import { toast } from 'svelte-sonner';
	import { aiService } from '$lib/services/ai/ai.service';
	import {
		Stethoscope, Mic, MicOff, Loader2, Pill, Bell, Clipboard, Activity,
		FileSpreadsheet, User, Trash2, Plus, CheckCircle2, ChevronLeft, FlaskConical, Link
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const ticketId = page.params.id;
	const ticket = $derived(queueStore.get(ticketId));
	const patient = $derived(ticket ? patientStore.get(ticket.patientId) : null);
	const vitalsHistory = $derived(patient ? vitalsStore.forPatient(patient.id) : []);
	const vitals = $derived(vitalsHistory.length > 0 ? vitalsHistory[0] : null);

	const chronoVitals = $derived([...vitalsHistory].reverse());
	const tempTrend = $derived(chronoVitals.map((v) => v.temperatureCelsius).filter((v) => v !== null) as number[]);
	const bpSysTrend = $derived(chronoVitals.map((v) => v.systolicBp).filter((v) => v !== null) as number[]);
	const pulseTrend = $derived(chronoVitals.map((v) => v.pulseBpm).filter((v) => v !== null) as number[]);

	// Form state
	let chiefComplaint = $state('');
	let doctorNotes = $state('');

	// Prescriptions state
	let selectedMedId = $state('');
	let quantity = $state<number>(1);
	let dosage = $state('');
	let prescriptions = $state<Array<{ id: string; name: string; quantity: number; dosage: string }>>([]);

	// Lab request state
	let testType = $state('');
	let urgency = $state<'routine' | 'urgent' | 'stat'>('routine');
	let labNotes = $state('');

	// Voice dictation
	let isRecording = $state(false);
	let aiProcessing = $state(false);
	let recognition: any = null;
	let interimTranscript = $state('');
	let finalTranscript = $state('');

	onMount(() => {
		// Just in case they navigate directly to an invalid ticket
		if (!ticket) {
			toast.error('Queue ticket not found');
			goto('/doctor');
			return;
		}

		if (ticket.status === 'waiting') {
			queueStore.update(ticket.id, { status: 'in_progress', calledAt: Date.now() });
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
		toast.info('Structuring intake with AI...');
		try {
			const structured = await aiService.structureIntake(text);
			chiefComplaint = structured.chiefComplaint || '';
			let note = `[AI Structuring]\nDuration: ${structured.duration || 'N/A'}\nAssociated Symptoms: ${(structured.associatedSymptoms || []).join(', ')}\n\n[Raw Transcript]:\n${text}`;
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
		selectedMedId = ''; quantity = 1; dosage = '';
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
					visitDate: Date.now()
				} as any);
				encounterId = enc.id;
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
						<Badge variant="outline" class="uppercase font-mono text-[10px]">{patient.clinicId}</Badge>
						{#if ticket.triageLevel === 'red'}
							<Badge class="bg-triage-red hover:bg-triage-red">RED</Badge>
						{:else if ticket.triageLevel === 'amber'}
							<Badge class="bg-triage-amber hover:bg-triage-amber">AMBER</Badge>
						{:else if ticket.triageLevel === 'green'}
							<Badge class="bg-triage-green hover:bg-triage-green">GREEN</Badge>
						{/if}
					</div>
					<p class="text-xs text-muted-foreground font-medium mt-0.5">
						Age: {patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 'Unknown'} • Sex: <span class="capitalize">{patient.sex}</span>
					</p>
				</div>
			</div>
			<Button onclick={handleCompleteEncounter} class="bg-primary shadow-md hover:bg-primary/95">
				<CheckCircle2 class="size-4 mr-2" /> Complete
			</Button>
		</div>

		<!-- Main Workspace (Resizable Split Pane) -->
		<Resizable.PaneGroup direction="horizontal" class="rounded-xl border bg-card flex-1 hidden md:flex">
			
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
								<CardTitle class="text-xs flex justify-between items-center text-muted-foreground font-semibold">
									<span>Today's Vitals</span>
									<Activity class="size-3" />
								</CardTitle>
							</CardHeader>
							<CardContent class="p-3 grid grid-cols-2 gap-3">
								<div>
									<div class="text-[10px] text-muted-foreground font-semibold uppercase">Temp</div>
									<div class="text-sm font-bold text-foreground">{vitals.temperatureCelsius ?? '—'}°C</div>
									{#if tempTrend.length} <Sparkline data={tempTrend} width={80} height={12} color="var(--primary)" /> {/if}
								</div>
								<div>
									<div class="text-[10px] text-muted-foreground font-semibold uppercase">BP</div>
									<div class="text-sm font-bold text-foreground">{vitals.systolicBp ?? '—'}/{vitals.diastolicBp ?? '—'}</div>
									{#if bpSysTrend.length} <Sparkline data={bpSysTrend} width={80} height={12} color="var(--accent)" /> {/if}
								</div>
							</CardContent>
						</Card>
					{:else}
						<div class="text-xs text-muted-foreground italic p-3 border rounded-lg bg-card text-center">
							No vitals recorded for this visit.
						</div>
					{/if}

					<!-- Recent Encounters -->
					<div>
						<h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">History (Demo)</h4>
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
							<TabsTrigger value="notes" class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-2">Clinical Notes</TabsTrigger>
							<TabsTrigger value="rx" class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-2">Prescriptions</TabsTrigger>
							<TabsTrigger value="lab" class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-2">Lab Request</TabsTrigger>
							<TabsTrigger value="referral" class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-2">Referral</TabsTrigger>
						</TabsList>
					</div>

					<div class="flex-1 overflow-y-auto p-6">
						<TabsContent value="notes" class="m-0 space-y-6 animate-in fade-in-50 zoom-in-95">
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<Label class="font-semibold flex items-center gap-1.5"><Clipboard class="size-4" /> Chief Complaint</Label>
									<Button variant={isRecording ? 'destructive' : 'outline'} size="sm" class="h-7 text-xs"
										onmousedown={startRecording} onmouseup={stopRecording} onmouseleave={stopRecording} disabled={aiProcessing}>
										{#if aiProcessing} <Loader2 class="size-3 animate-spin mr-1" /> Processing...
										{:else if isRecording} <MicOff class="size-3 mr-1 animate-pulse" /> Recording...
										{:else} <Mic class="size-3 mr-1" /> Hold to Dictate {/if}
									</Button>
								</div>
								<Textarea bind:value={chiefComplaint} class="min-h-[80px]" placeholder="Patient presents with..." />
							</div>
							<div class="space-y-2">
								<Label class="font-semibold flex items-center gap-1.5"><FileSpreadsheet class="size-4" /> Doctor Notes</Label>
								<Textarea bind:value={doctorNotes} class="min-h-[200px]" placeholder="Diagnosis and treatment plan..." />
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
												<SelectTrigger class="h-9"><SelectPrimitive.Value placeholder="Select Medication"/></SelectTrigger>
												<SelectContent>
													{#each pharmacyStore.items || [] as med}
														<SelectItem value={med.id}>{med.itemName} (Stock: {med.currentStock})</SelectItem>
													{/each}
												</SelectContent>
											</Select>
										</div>
										<div class="space-y-2">
											<Label>Qty</Label>
											<Input type="number" bind:value={quantity} min={1} class="h-9" />
										</div>
										<Button onclick={handleAddMed} class="h-9"><Plus class="size-4 mr-2" /> Add</Button>
									</div>
								</CardContent>
							</Card>

							{#if prescriptions.length > 0}
								<div class="border rounded-lg overflow-hidden">
									<table class="w-full text-sm">
										<thead class="bg-muted/50 border-b"><tr><th class="px-3 py-2 text-left font-medium">Medication</th><th class="px-3 py-2 text-left font-medium">Qty</th><th class="px-3 py-2 text-right"></th></tr></thead>
										<tbody class="divide-y">
											{#each prescriptions as p, i}
												<tr class="hover:bg-muted/30"><td class="px-3 py-2">{p.name}</td><td class="px-3 py-2">{p.quantity}</td><td class="px-3 py-2 text-right"><Button variant="ghost" size="sm" class="text-destructive h-7 px-2" onclick={() => (prescriptions = prescriptions.filter((_, idx) => idx !== i))}><Trash2 class="size-3" /></Button></td></tr>
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
							<div class="p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs flex gap-2">
								<FlaskConical class="size-4 shrink-0" />
								This request will be sent to the Pharmacy/Lab dashboard immediately upon completing the consultation.
							</div>
						</TabsContent>

						<TabsContent value="referral" class="m-0 space-y-4 animate-in fade-in-50 zoom-in-95">
							<div class="p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-3">
								<div class="p-3 bg-muted rounded-full text-muted-foreground"><Link class="size-6" /></div>
								<div>
									<h4 class="font-semibold text-foreground">External Referral</h4>
									<p class="text-sm text-muted-foreground mt-1 max-w-sm">Need to transfer to a secondary facility? Generate a standardized referral letter.</p>
								</div>
								<Button variant="outline" class="mt-2">Generate Referral Letter</Button>
							</div>
						</TabsContent>
					</div>
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
				<p class="text-xs text-muted-foreground">Please use a tablet or desktop for the full consultation interface.</p>
			</div>
			<!-- Tab content stacked for mobile -->
		</div>
	</div>
{/if}
