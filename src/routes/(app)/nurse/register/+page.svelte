<script lang="ts">
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { queueStore } from '#lib/state/queue.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import QrScanner from '#lib/components/QrScanner.svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import {
		Select,
		SelectTrigger,
		SelectContent,
		SelectItem
	} from '#lib/components/ui/select/index.ts';
	import { PhoneInput } from '#lib/components/ui/phone-input/index.ts';
	import * as Stepper from '#lib/components/ui/stepper/index.ts';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import QRCode from 'qrcode';
	import { Search, Printer, Scan, ArrowRight, Check } from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	let showScanner = $state(false);
	let searchQuery = $state('');

	let showQrDialog = $state(false);
	let registeredPatientInfo = $state<{ name: string; clinicId: string } | null>(null);
	let qrCanvas = $state<HTMLCanvasElement | null>(null);

	$effect(() => {
		if (showQrDialog && registeredPatientInfo && qrCanvas) {
			QRCode.toCanvas(qrCanvas, registeredPatientInfo.clinicId, {
				width: 200,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#ffffff'
				}
			});
		}
	});

	let currentStep = $state(1);

	let form = $state({
		name: '',
		phone: '',
		dob: '',
		sex: 'female' as 'female' | 'male' | 'other',
		isPregnant: false,
		isNhis: false,
		address: '',
		community: '',
		nextOfKinName: '',
		nextOfKinPhone: '',
		hasConsent: false
	});

	let isSubmitting = $state(false);
	let generatedId = $state<string | null>(null);
	let generatedClinicId = $state<string | null>(null);

	const searchResults = $derived(searchQuery ? patientStore.search(searchQuery) : []);

	function handleQrResult(clinicId: string) {
		showScanner = false;
		const found = patientStore.findByClinicId(clinicId);
		if (found) {
			toast.success(`Found patient: ${found.name}`);
			searchQuery = found.name;
		} else {
			toast.error(`No patient found with Clinic ID: ${clinicId}`);
		}
	}

	async function handleSubmit() {
		if (!form.hasConsent) {
			toast.error('Patient must consent to electronic records and SMS.');
			return;
		}
		if (!form.name) {
			toast.error('Full name is required');
			return;
		}

		isSubmitting = true;

		try {
			const initialParts = form.name.toUpperCase().split(' ');
			const prefix = initialParts
				.map((p) => p[0] || '')
				.join('')
				.slice(0, 4);
			const clinicId = patientStore.allocateClinicId(prefix);

			const id = await patientStore.create({
				clinicId,
				phcId: sessionStore.activePhcId,
				familyId: null,
				guardianId: null,
				name: form.name,
				phone: form.phone || null,
				dob: form.dob || null,
				sex: form.sex,
				address: form.address || null,
				community: form.community || null,
				nextOfKinName: form.nextOfKinName || null,
				nextOfKinPhone: form.nextOfKinPhone || null,
				isPregnant: form.isPregnant,
				isNhis: form.isNhis,
				serverUpdatedAt: null,
				deleted: false
			});

			await queueStore.create({
				patientId: id,
				phcId: sessionStore.activePhcId,
				encounterId: null,
				ticketNumber: queueStore.allocateTicketNumber(sessionStore.activePhcId),
				status: 'waiting',
				triageLevel: 'green',
				triageReason: 'New Registration',
				department: 'general',
				calledAt: null,
				completedAt: null,
				createdAt: Date.now()
			});

			generatedId = id;
			generatedClinicId = clinicId;
			registeredPatientInfo = { name: form.name, clinicId };
			isSubmitting = false;
			currentStep = 4;
			showQrDialog = true;
		} catch (e) {
			toast.error(`Failed to register: ${e instanceof Error ? e.message : String(e)}`);
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Register Patient — ClinicFlow</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
	<!-- Page Header -->
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Intake Window
		</p>
		<h1 class="text-2xl font-bold text-foreground tracking-tight">Patient Registry</h1>
		<p class="text-sm text-muted-foreground mt-0.5">
			Register new patients or check existing records before creating a folder
		</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left Column: Quick Lookup / QR -->
		<aside class="lg:col-span-1">
			<div class="rounded-xl border border-border bg-card p-5 space-y-4">
				<div>
					<h2 class="text-base font-semibold text-foreground">Find Existing Patient</h2>
					<p class="text-xs text-muted-foreground mt-0.5">Search local registry or scan ID card</p>
				</div>

				<div class="relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						bind:value={searchQuery}
						placeholder="Search by name or ID..."
						class="pl-9 h-11 bg-background"
					/>
				</div>

				{#if showScanner}
					<div class="border border-border rounded-xl overflow-hidden bg-background p-2">
						<QrScanner onResult={handleQrResult} />
						<Button
							variant="ghost"
							class="w-full text-muted-foreground hover:text-foreground mt-2 min-h-10"
							onclick={() => (showScanner = false)}
						>
							Cancel Scan
						</Button>
					</div>
				{:else}
					<Button
						variant="outline"
						class="w-full border-border min-h-11"
						onclick={() => (showScanner = true)}
					>
						<Scan class="size-4 mr-2" />
						Scan QR Code
					</Button>
				{/if}

				{#if searchResults.length > 0}
					<div
						class="divide-y divide-border border border-border rounded-xl bg-background max-h-64 overflow-y-auto"
					>
						{#each searchResults as patient (patient.id)}
							<a
								href="/patients/{patient.clinicId}"
								class="block px-3.5 py-2.5 hover:bg-muted/40 transition-colors"
							>
								<div class="font-medium text-foreground text-sm">{patient.name}</div>
								<div class="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
									<span class="font-mono">{patient.clinicId}</span>
									<span>{patient.phone ?? 'No phone'}</span>
								</div>
							</a>
						{/each}
					</div>
				{:else if searchQuery}
					<p class="text-xs text-muted-foreground text-center py-4">No matching records found.</p>
				{/if}
			</div>
		</aside>

		<!-- Right Column: Registration Folder -->
		<div class="lg:col-span-2">
			{#if currentStep < 4}
				<div class="bg-card border border-border rounded-xl p-5 sm:p-6 flex flex-col h-full">
					<!-- Stepper -->
					<div class="mb-6 pb-4 border-b border-border">
						<Stepper.Root bind:value={currentStep} class="w-full">
							<Stepper.Item step={1}>
								<Stepper.Trigger step={1}>
									<Stepper.Indicator step={1}>1</Stepper.Indicator>
									<div class="flex flex-col items-start">
										<Stepper.Title>Identity</Stepper.Title>
										<Stepper.Description>Basic details</Stepper.Description>
									</div>
								</Stepper.Trigger>
								<Stepper.Separator />
							</Stepper.Item>

							<Stepper.Item step={2}>
								<Stepper.Trigger step={2}>
									<Stepper.Indicator step={2}>2</Stepper.Indicator>
									<div class="flex flex-col items-start">
										<Stepper.Title>Contact</Stepper.Title>
										<Stepper.Description>Address &amp; Next of Kin</Stepper.Description>
									</div>
								</Stepper.Trigger>
								<Stepper.Separator />
							</Stepper.Item>

							<Stepper.Item step={3}>
								<Stepper.Trigger step={3}>
									<Stepper.Indicator step={3}>3</Stepper.Indicator>
									<div class="flex flex-col items-start">
										<Stepper.Title>Review</Stepper.Title>
										<Stepper.Description>Confirm &amp; submit</Stepper.Description>
									</div>
								</Stepper.Trigger>
							</Stepper.Item>
						</Stepper.Root>
					</div>

					<!-- Forms -->
					<div class="flex-1">
						{#if currentStep === 1}
							<div in:fade={{ duration: 120 }} class="space-y-5">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
									<div class="space-y-1.5">
										<Label for="name">Full Name <span class="text-destructive">*</span></Label>
										<Input
											id="name"
											bind:value={form.name}
											placeholder="e.g. Jane Doe"
											class="h-11"
										/>
									</div>
									<div class="space-y-1.5">
										<Label for="dob">Date of Birth</Label>
										<Input id="dob" type="date" bind:value={form.dob} class="h-11" />
									</div>
									<div class="space-y-1.5">
										<Label for="sex">Biological Sex <span class="text-destructive">*</span></Label>
										<Select
											type="single"
											value={form.sex}
											onValueChange={(v) => (form.sex = v as any)}
										>
											<SelectTrigger class="h-11 w-full capitalize">{form.sex}</SelectTrigger>
											<SelectContent>
												<SelectItem value="female">Female</SelectItem>
												<SelectItem value="male">Male</SelectItem>
												<SelectItem value="other">Other</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{#if form.sex === 'female'}
										<div class="space-y-1.5">
											<Label class="block">Pregnancy Status</Label>
											<label
												class="flex items-center gap-2.5 text-sm border border-border px-3 h-11 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors"
											>
												<input
													type="checkbox"
													bind:checked={form.isPregnant}
													class="accent-primary size-4"
												/>
												Patient is currently pregnant
											</label>
										</div>
									{/if}
								</div>

								<div>
									<label
										class="flex items-center gap-2.5 text-sm border border-border px-3 h-11 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors"
									>
										<input
											type="checkbox"
											bind:checked={form.isNhis}
											class="accent-primary size-4"
										/>
										Patient is an NHIS / HMO enrollee
									</label>
								</div>
							</div>
						{:else if currentStep === 2}
							<div in:fade={{ duration: 120 }} class="space-y-5">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
									<div class="space-y-1.5">
										<Label>Phone Number</Label>
										<PhoneInput bind:value={form.phone} />
									</div>
									<div class="space-y-1.5">
										<Label for="address">Residential Address</Label>
										<Input
											id="address"
											bind:value={form.address}
											placeholder="Street, landmark, etc."
											class="h-11"
										/>
									</div>
									<div class="space-y-1.5">
										<Label for="community">Community / Ward</Label>
										<Input
											id="community"
											bind:value={form.community}
											placeholder="Community name"
											class="h-11"
										/>
									</div>
								</div>

								<div class="pt-5 border-t border-border">
									<h3 class="text-sm font-semibold mb-3">Next of Kin Details</h3>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
										<div class="space-y-1.5">
											<Label for="nokName">Full Name</Label>
											<Input
												id="nokName"
												bind:value={form.nextOfKinName}
												placeholder="Emergency contact name"
												class="h-11"
											/>
										</div>
										<div class="space-y-1.5">
											<Label>Phone Number</Label>
											<PhoneInput bind:value={form.nextOfKinPhone} />
										</div>
									</div>
								</div>
							</div>
						{:else if currentStep === 3}
							<div in:fade={{ duration: 120 }} class="space-y-5">
								<div class="bg-muted/30 border border-border rounded-xl p-5">
									<h3 class="font-semibold text-base mb-4">Review Patient Details</h3>

									<div class="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
										<div>
											<p class="text-xs text-muted-foreground">Full Name</p>
											<p class="font-semibold text-foreground text-base">{form.name || '—'}</p>
										</div>
										<div>
											<p class="text-xs text-muted-foreground">Biological Sex</p>
											<p class="font-semibold text-foreground capitalize text-base">{form.sex}</p>
											{#if form.sex === 'female'}
												<p class="text-xs text-primary font-medium">
													{form.isPregnant ? 'Pregnant' : 'Not Pregnant'}
												</p>
											{/if}
										</div>
										<div>
											<p class="text-xs text-muted-foreground">Phone</p>
											<p class="font-medium text-foreground font-mono">{form.phone || '—'}</p>
										</div>
										<div>
											<p class="text-xs text-muted-foreground">Date of Birth</p>
											<p class="font-medium text-foreground font-mono">{form.dob || '—'}</p>
										</div>
										<div>
											<p class="text-xs text-muted-foreground">Address</p>
											<p class="font-medium text-foreground">{form.address || '—'}</p>
										</div>
										<div>
											<p class="text-xs text-muted-foreground">Next of Kin</p>
											<p class="font-medium text-foreground">
												{form.nextOfKinName || '—'}
												{form.nextOfKinPhone ? `(${form.nextOfKinPhone})` : ''}
											</p>
										</div>
									</div>
								</div>

								<div class="p-4 border rounded-xl bg-triage-amber/10 border-triage-amber/30">
									<label class="flex items-start gap-3 cursor-pointer">
										<input
											type="checkbox"
											bind:checked={form.hasConsent}
											class="mt-1 accent-primary size-5 shrink-0"
										/>
										<div class="space-y-1">
											<p class="font-semibold text-sm text-foreground">
												Patient Consent &amp; Data Privacy (NDPR)
											</p>
											<p class="text-xs text-muted-foreground leading-relaxed">
												I confirm that the patient has been informed of and explicitly consented to
												the digital storage of their medical records and agrees to receive
												health-related SMS notifications.
											</p>
										</div>
									</label>
								</div>
							</div>
						{/if}
					</div>

					<!-- Navigation -->
					<div class="flex justify-between mt-8 pt-5 border-t border-border">
						<Button
							variant="outline"
							class="min-h-11 px-5"
							disabled={currentStep === 1}
							onclick={() => currentStep--}
						>
							Back
						</Button>

						{#if currentStep < 3}
							<Button class="min-h-11 px-5" onclick={() => currentStep++} disabled={!form.name}>
								Next Step <ArrowRight class="size-4 ml-2" />
							</Button>
						{:else}
							<Button
								class="min-h-11 px-6 font-semibold"
								onclick={handleSubmit}
								disabled={isSubmitting}
							>
								{#if isSubmitting}
									Saving…
								{:else}
									Complete Registration <Check class="size-4 ml-2" />
								{/if}
							</Button>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Success State -->
				<div
					class="bg-card border-2 border-triage-green/40 rounded-xl p-8 text-center max-w-xl mx-auto mt-6"
				>
					<div
						class="size-16 bg-triage-green/15 text-triage-green rounded-full flex items-center justify-center mx-auto mb-5"
					>
						<Check class="size-8" />
					</div>
					<h2 class="text-xl font-bold mb-1.5">Registration Complete</h2>
					<p class="text-sm text-muted-foreground mb-6">
						{form.name} has been registered and added to the waiting queue.
					</p>

					<div class="flex flex-wrap gap-3 justify-center">
						<Button variant="outline" class="min-h-11" href="/nurse">Back to Queue Board</Button>
						<Button
							class="min-h-11"
							onclick={() => {
								currentStep = 1;
								form = {
									name: '',
									phone: '',
									dob: '',
									sex: 'female',
									isPregnant: false,
									isNhis: false,
									address: '',
									community: '',
									nextOfKinName: '',
									nextOfKinPhone: '',
									hasConsent: false
								};
							}}
						>
							Register Another Patient
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- QR Print Dialog -->
<Dialog.Root bind:open={showQrDialog}>
	<Dialog.Content class="sm:max-w-md bg-card border-border">
		<Dialog.Header>
			<Dialog.Title class="text-foreground">Patient Registered</Dialog.Title>
			<Dialog.Description class="text-muted-foreground">
				Scan this QR code to quickly retrieve the patient folder.
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex flex-col items-center justify-center py-6 space-y-4">
			<div class="bg-white p-4 rounded-xl border border-border">
				<canvas bind:this={qrCanvas}></canvas>
			</div>
			<div class="text-center">
				<p class="text-foreground font-bold text-lg">{registeredPatientInfo?.name}</p>
				<p class="text-primary font-mono text-sm mt-1">{registeredPatientInfo?.clinicId}</p>
			</div>
		</div>
		<Dialog.Footer class="sm:justify-between gap-2">
			<Button variant="outline" onclick={() => (showQrDialog = false)}>Close</Button>
			<Button onclick={() => window.print()}>
				<Printer class="size-4 mr-1.5" />
				Print ID Card
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
