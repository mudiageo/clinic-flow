<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription,
		CardFooter
	} from '#lib/components/ui/card/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import {
		HeartPulse,
		PlayCircle,
		Building2,
		Database,
		UserPlus,
		Users,
		CheckCircle2,
		ShieldCheck,
		HardDrive,
		ArrowRight,
		ArrowLeft,
		Search,
		Loader2,
		TriangleAlert
	} from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { registerPhc } from '#lib/remote/auth.remote.ts';
	import { checkServerStatus, initDatabase } from '#lib/remote/setup.remote.ts';
	import { lookupRegistryFacilities } from '#lib/remote/facility-registry.remote.ts';
	import { formatDateTime } from '#lib/utils/date.ts';

	let currentStep = $state(1);
	let totalSteps = 7;

	// Form states
	let phcName = $state('');
	let phcState = $state('');
	let phcLga = $state('');
	let adminName = $state('');
	let adminEmail = $state('');
	let adminPassword = $state('');
	let adminPin = $state('');

	// DB init progress is indeterminate: it reflects the real initDatabase promise,
	// never a fabricated percentage.
	let dbInitializing = $state(false);
	let dbInitFailed = $state(false);

	// Real setup verification results, returned only by checkServerStatus().
	type VerificationResult = { reachable: boolean; isConfigured: boolean; checkedAt: string };
	let verification = $state<VerificationResult | null>(null);
	let isVerifying = $state(false);

	// Optional advisory national facility registry lookup. Results are only
	// applied when the user explicitly clicks "Use suggestion".
	type RegistryLookupResult = Awaited<ReturnType<typeof lookupRegistryFacilities>>;
	type RegistryFacilitySuggestion = RegistryLookupResult['facilities'][number];
	let registryLookup = $state<RegistryLookupResult | null>(null);
	let registrySearching = $state(false);
	let registryRequestId = 0;

	function errorMessage(error: unknown, fallback: string): string {
		return error instanceof Error ? error.message : fallback;
	}

	async function checkRegistry() {
		const requestId = ++registryRequestId;
		registrySearching = true;
		try {
			const result = await lookupRegistryFacilities({
				name: phcName.trim().length >= 2 ? phcName.trim() : undefined,
				state: phcState.trim() || undefined,
				lga: phcLga.trim() || undefined
			});
			if (requestId === registryRequestId) registryLookup = result;
		} catch (error: unknown) {
			if (requestId === registryRequestId) {
				registryLookup = {
					availability: 'unavailable',
					facilities: [],
					reason: errorMessage(error, 'Registry lookup failed.'),
					checkedAt: new Date().toISOString()
				};
			}
		} finally {
			if (requestId === registryRequestId) registrySearching = false;
		}
	}

	function applySuggestion(facility: RegistryFacilitySuggestion) {
		phcName = facility.name;
		if (facility.state) phcState = facility.state;
		if (facility.lga) phcLga = facility.lga;
		toast.success('Registry suggestion applied — please review before continuing.');
	}

	function nextStep() {
		if (currentStep === 2) {
			if (!phcName.trim()) return toast.error('Facility Name is required');
			if (!phcState.trim()) return toast.error('State is required');
			if (!phcLga.trim()) return toast.error('LGA is required');
		}
		if (currentStep === 4) {
			if (!adminName.trim()) return toast.error('Admin Name is required');
			if (!adminEmail.trim() || !adminEmail.includes('@'))
				return toast.error('Valid Email is required');
			if (!adminPassword.trim() || adminPassword.length < 8)
				return toast.error('Password must be at least 8 characters');
			if (!adminPin.trim() || adminPin.length !== 4 || !/^\d{4}$/.test(adminPin))
				return toast.error('Admin PIN must be exactly 4 digits');
		}

		if (currentStep < totalSteps) {
			currentStep++;
			if (currentStep === 3) {
				runDbInit();
			}
		}
	}

	function prevStep() {
		if (currentStep > 1) currentStep--;
	}

	async function runDbInit() {
		dbInitializing = true;
		dbInitFailed = false;
		try {
			const result = await initDatabase({});
			if (!result.success) {
				throw new Error(result.error || 'Database initialization failed.');
			}
			toast.success('Database initialized successfully');
			nextStep();
		} catch (error: unknown) {
			dbInitFailed = true;
			toast.error(errorMessage(error, 'Failed to initialize database'));
			console.error(error);
		} finally {
			dbInitializing = false;
		}
	}

	/** Real verification: only reports what checkServerStatus actually returns. */
	async function runVerification() {
		isVerifying = true;
		const checkedAt = new Date().toISOString();
		try {
			const status = await checkServerStatus();
			verification = { reachable: true, isConfigured: status.isConfigured, checkedAt };
			toast.success('Server verification complete.');
		} catch (error: unknown) {
			verification = { reachable: false, isConfigured: false, checkedAt };
			toast.error(errorMessage(error, 'Could not reach the server.'));
			console.error(error);
		} finally {
			isVerifying = false;
		}
	}

	async function finishSetup() {
		try {
			toast.loading('Registering clinic...', { id: 'register' });
			const res = await registerPhc({
				phcName,
				state: phcState,
				lga: phcLga,
				adminName,
				email: adminEmail,
				password: adminPassword,
				pin: adminPin
			});

			// CRITICAL FIX: Ensure the Master Server's own UI knows its routing destination!
			const serverOrigin = window.location.origin;
			localStorage.setItem('clinicflow_server_url', serverOrigin);
			if (res && res.phcId) {
				localStorage.setItem('clinicflow_phc_id', res.phcId);
			}
			if ('caches' in window) {
				const cache = await caches.open('clinicflow-config');
				await cache.put('/server-url', new Response(serverOrigin));
			}

			toast.success('Setup Complete! Welcome to ClinicFlow.', { id: 'register' });
			localStorage.setItem('clinicflow_onboarding_complete', 'true');
			goto('/login?registered=true');
		} catch (error: unknown) {
			console.error(error);
			toast.error(errorMessage(error, 'Registration failed'), { id: 'register' });
		}
	}
</script>

<svelte:head>
	<title>Welcome to ClinicFlow</title>
</svelte:head>

<div
	class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-8"
>
	<!-- Branding header -->
	<div class="flex items-center gap-3 mb-8 animate-fade-in">
		<div class="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
			<HeartPulse class="size-8 text-primary-foreground" />
		</div>
		<h1 class="text-4xl font-extrabold tracking-tight text-foreground">ClinicFlow</h1>
	</div>

	<Card class="w-full max-w-2xl shadow-xl border-border/50 overflow-hidden relative">
		<!-- Progress Bar top -->
		<div class="absolute top-0 left-0 w-full h-1.5 bg-muted">
			<div
				class="h-full bg-primary transition-all duration-500 ease-out"
				style="width: {(currentStep / totalSteps) * 100}%"
			></div>
		</div>

		<CardHeader class="pt-8">
			<CardTitle class="text-2xl flex items-center gap-2">
				{#if currentStep === 1}
					<PlayCircle class="size-6 text-primary" /> Welcome to ClinicFlow
				{:else if currentStep === 2}
					<Building2 class="size-6 text-primary" /> Register Facility
				{:else if currentStep === 3}
					<Database class="size-6 text-primary" /> Initializing Local Database
				{:else if currentStep === 4}
					<UserPlus class="size-6 text-primary" /> Admin Setup
				{:else if currentStep === 5}
					<Users class="size-6 text-primary" /> Invite Team
				{:else if currentStep === 6}
					<ShieldCheck class="size-6 text-primary" /> Setup Verification
				{:else if currentStep === 7}
					<CheckCircle2 class="size-6 text-emerald-500" /> All Set!
				{/if}
			</CardTitle>
			<CardDescription class="text-base">
				{#if currentStep === 1}
					Learn how ClinicFlow digitizes your primary healthcare center.
				{:else if currentStep === 2}
					Link this device to your PHC network.
				{:else if currentStep === 3}
					Setting up Dexie IndexedDB for offline-first capabilities.
				{:else if currentStep === 4}
					Create the primary administrator account for this facility.
				{:else if currentStep === 5}
					Add your doctors, nurses, and lab technicians.
				{:else if currentStep === 6}
					Confirm the server is reachable and review its real configuration state.
				{:else if currentStep === 7}
					ClinicFlow is ready for deployment.
				{/if}
			</CardDescription>
		</CardHeader>

		<CardContent class="min-h-[320px] p-6">
			{#if currentStep === 1}
				<div in:fade={{ duration: 200 }} class="space-y-6">
					<div
						class="aspect-video w-full bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden group border border-slate-800"
					>
						<img
							src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80"
							alt="Medical Clinic"
							class="opacity-40 object-cover w-full h-full"
						/>
						<button
							class="absolute z-10 size-16 bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
						>
							<PlayCircle class="size-8" />
						</button>
					</div>
					<div
						class="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 p-4 rounded-lg text-sm flex items-start gap-3"
					>
						<HardDrive class="size-5 shrink-0 mt-0.5" />
						<p>
							ClinicFlow runs <strong>offline-first</strong>. All data is saved securely to this
							device and syncs automatically when an internet connection is available.
						</p>
					</div>
				</div>
			{:else if currentStep === 2}
				<div in:fade={{ duration: 200 }} class="space-y-5 py-4">
					<div class="space-y-2">
						<Label>Facility Name</Label>
						<Input
							bind:value={phcName}
							placeholder="e.g., General Hospital, Benin City"
							class="h-12 text-lg"
						/>
					</div>
					<div class="space-y-2">
						<Label>State</Label>
						<Input bind:value={phcState} placeholder="e.g., Edo State" class="h-12" />
					</div>
					<div class="space-y-2">
						<Label>LGA (Local Government Area)</Label>
						<Input bind:value={phcLga} placeholder="e.g., Oredo" class="h-12" />
					</div>

					<div class="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
						<div class="flex items-start justify-between gap-3">
							<div class="space-y-1">
								<p class="text-sm font-semibold text-foreground flex items-center gap-2">
									<Building2 class="size-4 text-primary" /> Check national facility registry
								</p>
								<p class="text-xs text-muted-foreground">
									Optional advisory lookup of Nigeria's national Health Facility Registry.
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								class="shrink-0"
								onclick={checkRegistry}
								disabled={registrySearching}
							>
								{#if registrySearching}
									<Loader2 class="size-3.5 mr-1.5 animate-spin" /> Checking...
								{:else}
									<Search class="size-3.5 mr-1.5" /> Check registry
								{/if}
							</Button>
						</div>
						<p
							class="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5"
						>
							Advisory only — registry data is not authoritative. Suggestions change these fields
							only when you click "Use suggestion". Verify all details with your facility; manual
							entry remains available.
						</p>
						{#if registryLookup}
							{#if registryLookup.availability === 'unconfigured' || registryLookup.availability === 'unavailable'}
								<div
									class="rounded border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300 space-y-1"
								>
									<p class="font-medium">
										Registry check unavailable ({registryLookup.availability})
									</p>
									{#if registryLookup.reason}
										<p>{registryLookup.reason}</p>
									{/if}
									<p>Manual entry remains available and registration can continue.</p>
								</div>
							{:else if registryLookup.facilities.length === 0}
								<p class="text-xs text-muted-foreground">
									No matching registry facilities found. Continue with manual entry.
								</p>
							{:else}
								<ul class="space-y-2 max-h-48 overflow-y-auto pr-1">
									{#each registryLookup.facilities as facility (facility.registryId ?? facility.name)}
										<li
											class="flex items-start justify-between gap-3 rounded border bg-card p-2.5 text-sm"
										>
											<div class="min-w-0 space-y-0.5">
												<p class="font-medium truncate">{facility.name}</p>
												<p class="text-xs text-muted-foreground truncate">
													{[facility.level, facility.lga, facility.state]
														.filter(Boolean)
														.join(' • ') || 'Registry facility'}
												</p>
											</div>
											<Button
												variant="outline"
												size="sm"
												class="h-7 shrink-0 text-xs"
												onclick={() => applySuggestion(facility)}
											>
												Use suggestion
											</Button>
										</li>
									{/each}
								</ul>
							{/if}
						{/if}
					</div>
				</div>
			{:else if currentStep === 3}
				<div
					in:fade={{ duration: 200 }}
					class="flex flex-col items-center justify-center h-full min-h-[300px] space-y-8 text-center"
				>
					<div class="relative">
						<div
							class="size-24 rounded-full border-4 border-muted flex items-center justify-center"
						>
							<Database
								class="size-10 {dbInitFailed ? 'text-destructive' : 'text-primary'} {dbInitializing
									? 'animate-pulse'
									: ''}"
							/>
						</div>
					</div>

					<div class="w-full max-w-md space-y-3">
						<p class="text-sm font-medium">
							{dbInitFailed
								? 'Initialization Failed'
								: dbInitializing
									? 'Initializing local database...'
									: 'Local database ready'}
						</p>
						<!-- Indeterminate: the server does not report progress, so no percentage is shown. -->
						{#if dbInitializing}
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div class="h-full w-1/3 rounded-full bg-primary animate-pulse"></div>
							</div>
						{:else if dbInitFailed}
							<div class="h-2 w-full overflow-hidden rounded-full bg-destructive/20">
								<div class="h-full w-full rounded-full bg-destructive"></div>
							</div>
						{/if}
					</div>
					{#if dbInitFailed}
						<Button variant="outline" onclick={runDbInit}>Retry Initialization</Button>
					{:else}
						<p class="text-sm text-muted-foreground">
							Please do not close the app during this process.
						</p>
					{/if}
				</div>
			{:else if currentStep === 4}
				<div in:fade={{ duration: 200 }} class="space-y-5 py-4">
					<div class="space-y-2">
						<Label>Admin Full Name</Label>
						<Input bind:value={adminName} placeholder="e.g., Dr. Jane Doe" class="h-12 text-lg" />
					</div>
					<div class="space-y-2">
						<Label>Admin Email</Label>
						<Input
							type="email"
							bind:value={adminEmail}
							placeholder="admin@clinic.com"
							class="h-12 text-lg"
						/>
					</div>
					<div class="space-y-2">
						<Label>Admin Password</Label>
						<Input
							type="password"
							bind:value={adminPassword}
							placeholder="Enter a secure password (min 8 chars)"
							class="h-12 text-lg"
						/>
					</div>
					<div class="space-y-2">
						<Label>Kiosk PIN (4 digits)</Label>
						<Input
							type="text"
							inputmode="numeric"
							maxlength={4}
							bind:value={adminPin}
							placeholder="e.g. 1234"
							class="h-12 text-lg text-center tracking-[1em]"
						/>
					</div>
					<p class="text-sm text-muted-foreground mt-4">
						This account will have Superadmin access to manage the clinic and sync conflicts.
					</p>
				</div>
			{:else if currentStep === 5}
				<div in:fade={{ duration: 200 }} class="space-y-6 text-center py-6">
					<div class="p-6 bg-muted/30 border rounded-2xl max-w-sm mx-auto">
						<Users class="size-12 text-muted-foreground mx-auto mb-4" />
						<h3 class="font-bold text-lg mb-2">Team Setup</h3>
						<p class="text-sm text-muted-foreground mb-6">
							Once you complete setup and access the Admin Dashboard, you can generate secure
							Pairing Links to connect your tablets to this server.
						</p>
					</div>
					<p class="text-xs text-muted-foreground">
						You can manage staff and devices later from the Admin Dashboard.
					</p>
				</div>
			{:else if currentStep === 6}
				<div in:fade={{ duration: 200 }} class="space-y-6 py-4">
					<div class="max-w-md mx-auto space-y-4">
						<div class="p-5 border rounded-xl bg-muted/30 text-center space-y-2">
							<ShieldCheck class="size-10 text-primary mx-auto" />
							<h3 class="font-bold text-lg">Verify this server</h3>
							<p class="text-sm text-muted-foreground">
								Runs a real check against the configured server. No camera or scanner test is
								performed here.
							</p>
						</div>

						<Button
							variant="outline"
							class="w-full"
							disabled={isVerifying}
							onclick={runVerification}
						>
							{#if isVerifying}
								<Loader2 class="size-4 mr-2 animate-spin" /> Verifying...
							{:else}
								<ShieldCheck class="size-4 mr-2" /> Run verification
							{/if}
						</Button>

						{#if verification}
							<div class="rounded-lg border p-4 space-y-2 text-sm">
								<p class="font-medium flex items-center gap-2">
									{#if verification.reachable}
										<CheckCircle2 class="size-4 text-emerald-500" /> Server reachable
									{:else}
										<TriangleAlert class="size-4 text-destructive" /> Server unreachable
									{/if}
								</p>
								<p class="text-muted-foreground">
									PHC configured: {verification.isConfigured ? 'Yes' : 'No'}
								</p>
								{#if !verification.isConfigured}
									<p class="text-xs text-amber-700 dark:text-amber-400">
										The facility record is created when you complete setup on the next step.
									</p>
								{/if}
								<p class="text-xs text-muted-foreground">
									Checked {formatDateTime(verification.checkedAt)}
								</p>
							</div>
						{/if}
					</div>
				</div>
			{:else if currentStep === 7}
				<div
					in:fade={{ duration: 200 }}
					class="flex flex-col items-center justify-center text-center py-12 space-y-4"
				>
					<div
						class="size-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-2"
					>
						<CheckCircle2 class="size-10" />
					</div>
					<h2 class="text-2xl font-bold text-foreground">You're All Set!</h2>
					<p class="text-muted-foreground max-w-sm">
						{phcName || 'Your facility'} has been configured successfully. You can now start registering
						patients and managing queues offline.
					</p>
				</div>
			{/if}
		</CardContent>

		<CardFooter class="flex justify-between border-t bg-muted/20 p-6">
			<Button
				variant="ghost"
				disabled={currentStep === 1 || currentStep === 3 || currentStep === 7}
				onclick={prevStep}
			>
				<ArrowLeft class="size-4 mr-2" /> Back
			</Button>

			{#if currentStep === 3}
				<Button disabled>
					Initializing <span class="animate-pulse ml-1">...</span>
				</Button>
			{:else if currentStep === 7}
				<Button
					class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-8"
					onclick={finishSetup}
				>
					Launch ClinicFlow
				</Button>
			{:else if currentStep === 6}
				<Button class="h-11 px-8" disabled={!verification?.reachable} onclick={nextStep}>
					Continue
					<ArrowRight class="size-4 ml-2" />
				</Button>
			{:else}
				<Button class="h-11 px-8" onclick={nextStep}>
					Continue
					<ArrowRight class="size-4 ml-2" />
				</Button>
			{/if}
		</CardFooter>
	</Card>
</div>
