<script lang="ts">
	import { patientStore } from '$lib/state/patients.svelte';
	import { queueStore } from '$lib/state/queue.svelte';
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
	import { Select as SelectPrimitive } from 'bits-ui';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { PhoneInput } from '$lib/components/ui/phone-input';
	import * as Stepper from '$lib/components/ui/stepper';
	import { ShinyButton } from '$lib/components/ui/shiny-button';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog';
	import QRCode from 'qrcode';
	import {
		Search,
		Printer,
		FolderOpen,
		User,
		Scan,
		Sparkles,
		UserPlus,
		ArrowRight,
		Check,
		QrCode
	} from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	let showScanner = $state(false);
	let searchQuery = $state('');

	// QR Display
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

	// Stepper State
	let currentStep = $state(1);

	// Form State
	let form = $state({
		name: '',
		phone: '',
		dob: '',
		sex: 'female' as 'female' | 'male' | 'other',
		isPregnant: false,
		address: '',
		community: '',
		nextOfKinName: '',
		nextOfKinPhone: ''
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
		if (!form.name) {
			toast.error('Full name is required');
			return;
		}

		isSubmitting = true;

		try {
			// Auto-generate Clinic ID format OR-XXXX-01
			const initialParts = form.name.toUpperCase().split(' ');
			const prefix = initialParts
				.map((p) => p[0] || '')
				.join('')
				.slice(0, 4);
			const rand = Math.floor(10 + Math.random() * 90);
			const clinicId = `OR-${prefix}-${rand}`;

			const id = await patientStore.create({
				clinicId,
				phcId: crypto.randomUUID(), // Stub or current PHC
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
				serverUpdatedAt: null,
				deleted: false
			});

			// Auto-issue a waiting ticket in the queue
			await queueStore.create({
				patientId: id,
				phcId: crypto.randomUUID(),
				encounterId: null,
				ticketNumber: 0, // Auto-computed sequentially in state
				status: 'waiting',
				triageLevel: 'green',
				triageReason: 'New Registration',
				calledAt: null,
				completedAt: null,
				createdAt: Date.now()
			});

			generatedId = id;
			generatedClinicId = clinicId;
			registeredPatientInfo = { name: form.name, clinicId };
			isSubmitting = false;
			currentStep = 4; // Move to Success state
			showQrDialog = true;
		} catch (e: any) {
			toast.error(`Failed to register: ${e.message}`);
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Register Patient — ClinicFlow</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-8 animate-fade-in mt-6">
	<!-- Header -->
	<div class="flex items-start gap-3 border-b border-border pb-6">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<FolderOpen class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Patient Registry</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Register new patients or search existing records
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left Column: Search / QR -->
		<div class="space-y-6 lg:col-span-1">
			<Card class="bg-card/60 card-hover">
				<CardHeader class="pb-3">
					<CardTitle class="text-base font-semibold">Find Patient</CardTitle>
					<CardDescription>Search registry or scan barcode/QR code</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="relative">
						<Search class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
						<Input
							bind:value={searchQuery}
							placeholder="Search by name/ID..."
							class="pl-9 h-11 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
						/>
					</div>

					{#if showScanner}
						<div class="mt-4 border border-border rounded-xl overflow-hidden bg-background p-2">
							<QrScanner onResult={handleQrResult} />
							<Button
								variant="ghost"
								class="w-full text-muted-foreground hover:text-foreground mt-2 btn-press"
								onclick={() => (showScanner = false)}
							>
								Cancel Scan
							</Button>
						</div>
					{:else}
						<Button
							variant="outline"
							class="w-full border-border text-foreground hover:bg-muted btn-press h-10"
							onclick={() => (showScanner = true)}
						>
							<Scan class="size-4 mr-2" />
							Scan QR Code
						</Button>
					{/if}

					<!-- Search Results List -->
					{#if searchResults.length > 0}
						<div class="space-y-2 mt-4 max-h-60 overflow-y-auto pr-1 no-scrollbar animate-stagger">
							{#each searchResults as patient}
								<a
									href="/patients/{patient.clinicId}"
									class="block p-3 bg-muted/40 border border-border rounded-xl transition-all hover:bg-muted/80"
								>
									<div class="font-medium text-foreground text-sm">{patient.name}</div>
									<div class="text-xs text-muted-foreground mt-1 flex items-center justify-between">
										<span class="font-mono">{patient.clinicId}</span>
										<span>{patient.phone ?? 'No Phone'}</span>
									</div>
								</a>
							{/each}
						</div>
					{:else if searchQuery}
						<p class="text-xs text-muted-foreground text-center py-4">No matching records found.</p>
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Right Column: Registration -->
		<div class="lg:col-span-2">
			{#if currentStep < 4}
				<div class="bg-card border rounded-xl p-6 shadow-sm flex flex-col h-full relative">
					<!-- Stepper -->
					<div class="mb-8">
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
										<Stepper.Description>Address & Next of Kin</Stepper.Description>
									</div>
								</Stepper.Trigger>
								<Stepper.Separator />
							</Stepper.Item>

							<Stepper.Item step={3}>
								<Stepper.Trigger step={3}>
									<Stepper.Indicator step={3}>3</Stepper.Indicator>
									<div class="flex flex-col items-start">
										<Stepper.Title>Review</Stepper.Title>
										<Stepper.Description>Confirm & submit</Stepper.Description>
									</div>
								</Stepper.Trigger>
							</Stepper.Item>
						</Stepper.Root>
					</div>

					<!-- Forms -->
					<div class="flex-1">
						{#if currentStep === 1}
							<div in:fade={{ duration: 150 }} class="space-y-6">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div class="space-y-2">
										<Label for="name">Full Name <span class="text-destructive">*</span></Label>
										<Input
											id="name"
											bind:value={form.name}
											placeholder="e.g. Jane Doe"
											class="h-11"
										/>
									</div>
									<div class="space-y-2">
										<Label for="dob">Date of Birth</Label>
										<Input id="dob" type="date" bind:value={form.dob} class="h-11" />
									</div>
									<div class="space-y-2">
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
										<div class="space-y-2">
											<Label class="block mb-2">Pregnancy Status</Label>
											<label
												class="flex items-center gap-2 text-sm border p-3 h-11 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
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
							</div>
						{:else if currentStep === 2}
							<div in:fade={{ duration: 150 }} class="space-y-6">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div class="space-y-2">
										<Label>Phone Number</Label>
										<PhoneInput bind:value={form.phone} />
									</div>
									<div class="space-y-2">
										<Label for="address">Residential Address</Label>
										<Input
											id="address"
											bind:value={form.address}
											placeholder="Street, landmark, etc."
											class="h-11"
										/>
									</div>
									<div class="space-y-2">
										<Label for="community">Community / Ward</Label>
										<Input
											id="community"
											bind:value={form.community}
											placeholder="Community name"
											class="h-11"
										/>
									</div>
								</div>

								<div class="pt-4 border-t mt-6">
									<h3 class="font-medium mb-4">Next of Kin Details</h3>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div class="space-y-2">
											<Label for="nokName">Full Name</Label>
											<Input
												id="nokName"
												bind:value={form.nextOfKinName}
												placeholder="Emergency contact name"
												class="h-11"
											/>
										</div>
										<div class="space-y-2">
											<Label>Phone Number</Label>
											<PhoneInput bind:value={form.nextOfKinPhone} />
										</div>
									</div>
								</div>
							</div>
						{:else if currentStep === 3}
							<div in:fade={{ duration: 150 }} class="space-y-6">
								<div class="bg-muted/30 border rounded-lg p-6">
									<h3 class="font-semibold text-lg mb-4">Review Patient Details</h3>

									<div class="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
										<div>
											<p class="text-muted-foreground">Full Name</p>
											<p class="font-medium text-foreground text-base">{form.name || '—'}</p>
										</div>
										<div>
											<p class="text-muted-foreground">Biological Sex</p>
											<p class="font-medium text-foreground capitalize text-base">{form.sex}</p>
											{#if form.sex === 'female'}
												<p class="text-xs text-primary font-medium">
													{form.isPregnant ? 'Pregnant' : 'Not Pregnant'}
												</p>
											{/if}
										</div>
										<div>
											<p class="text-muted-foreground">Phone</p>
											<p class="font-medium text-foreground">{form.phone || '—'}</p>
										</div>
										<div>
											<p class="text-muted-foreground">Date of Birth</p>
											<p class="font-medium text-foreground">{form.dob || '—'}</p>
										</div>
										<div>
											<p class="text-muted-foreground">Address</p>
											<p class="font-medium text-foreground">{form.address || '—'}</p>
										</div>
										<div>
											<p class="text-muted-foreground">Next of Kin</p>
											<p class="font-medium text-foreground">
												{form.nextOfKinName || '—'}
												{form.nextOfKinPhone ? `(${form.nextOfKinPhone})` : ''}
											</p>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Navigation -->
					<div class="flex justify-between mt-8 pt-6 border-t border-border mt-auto">
						<Button variant="outline" disabled={currentStep === 1} onclick={() => currentStep--}>
							Back
						</Button>

						{#if currentStep < 3}
							<Button onclick={() => currentStep++} disabled={!form.name}>
								Next Step <ArrowRight class="size-4 ml-2" />
							</Button>
						{:else}
							<ShinyButton
								class="bg-primary text-primary-foreground font-semibold px-6"
								onclick={handleSubmit}
								disabled={isSubmitting}
							>
								{#if isSubmitting}
									Saving...
								{:else}
									Complete Registration <Check class="size-4 ml-2" />
								{/if}
							</ShinyButton>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Success State -->
				<div
					class="bg-card border-2 border-emerald-500/20 rounded-2xl p-8 text-center animate-fade-in shadow-lg shadow-emerald-500/5 max-w-xl mx-auto mt-12"
				>
					<div
						class="size-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"
					>
						<Check class="size-10" />
					</div>
					<h2 class="text-2xl font-bold mb-2">Registration Complete!</h2>
					<p class="text-muted-foreground mb-8">
						{form.name} has been successfully registered into the system.
					</p>

					<div class="flex gap-4 justify-center">
						<Button variant="outline" href="/nurse">Back to Dashboard</Button>
						<Button
							onclick={() => {
								currentStep = 1;
								form = {
									name: '',
									phone: '',
									dob: '',
									sex: 'female',
									isPregnant: false,
									address: '',
									community: '',
									nextOfKinName: '',
									nextOfKinPhone: ''
								};
							}}>Register Another Patient</Button
						>
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
				Scan this QR code to quickly retrieve the patient profile.
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex flex-col items-center justify-center py-6 space-y-4">
			<div class="bg-white p-4 rounded-xl shadow-inner border border-border">
				<canvas bind:this={qrCanvas}></canvas>
			</div>
			<div class="text-center">
				<p class="text-foreground font-bold text-lg">{registeredPatientInfo?.name}</p>
				<p class="text-primary font-mono text-sm mt-1">{registeredPatientInfo?.clinicId}</p>
			</div>
		</div>
		<Dialog.Footer class="sm:justify-between gap-2">
			<Button
				variant="outline"
				class="border-border text-muted-foreground btn-press"
				onclick={() => (showQrDialog = false)}
			>
				Close
			</Button>
			<Button
				class="bg-primary text-primary-foreground hover:bg-primary/95 btn-press"
				onclick={() => window.print()}
			>
				<Printer class="size-4 mr-1.5" />
				Print ID Card
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
