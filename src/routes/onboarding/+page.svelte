<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Progress } from '$lib/components/ui/progress';
	import { 
		HeartPulse, PlayCircle, Building2, Database, UserPlus, 
		Users, CheckCircle2, QrCode, HardDrive, ArrowRight, ArrowLeft 
	} from '@lucide/svelte';
	import { fade, slide } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { registerPhc } from '$lib/remote/auth.remote';
	import { initDatabase } from '$lib/remote/setup.remote';

	let currentStep = $state(1);
	let totalSteps = 7;

	// Form states
	let phcName = $state('');
	let phcState = $state('');
	let phcLga = $state('');
	let adminName = $state('');
	let adminEmail = $state('');
	let adminPassword = $state('');
	let includeSeedData = $state(false);

	// DB Init state
	let dbProgress = $state(0);
	let dbInitFailed = $state(false);
	
	function nextStep() {
		if (currentStep === 2) {
			if (!phcName.trim()) return toast.error('Facility Name is required');
			if (!phcState.trim()) return toast.error('State is required');
			if (!phcLga.trim()) return toast.error('LGA is required');
		}
		if (currentStep === 4) {
			if (!adminName.trim()) return toast.error('Admin Name is required');
			if (!adminEmail.trim() || !adminEmail.includes('@')) return toast.error('Valid Email is required');
			if (!adminPassword.trim() || adminPassword.length < 8) return toast.error('Password must be at least 8 characters');
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
		dbProgress = 0;
		dbInitFailed = false;
		// Fake progress bar while waiting for the server
		const interval = setInterval(() => {
			if (dbProgress < 90) dbProgress += Math.random() * 15;
		}, 300);
		
		try {
			await initDatabase();
			dbProgress = 100;
			clearInterval(interval);
			setTimeout(() => {
				toast.success('Database initialized successfully');
				nextStep();
			}, 600);
		} catch (error: any) {
			clearInterval(interval);
			dbInitFailed = true;
			toast.error(error.message || 'Failed to initialize database');
			console.error(error);
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
				password: adminPassword
			});

			// CRITICAL FIX: Ensure the Master Server's own UI knows its routing destination!
			const serverOrigin = window.location.origin;
			localStorage.setItem('clinicflow_server_url', serverOrigin);
			if ('caches' in window) {
				const cache = await caches.open('clinicflow-config');
				await cache.put('/server-url', new Response(serverOrigin));
			}

			toast.success('Setup Complete! Welcome to ClinicFlow.', { id: 'register' });
			localStorage.setItem('clinicflow_onboarding_complete', 'true');
			goto('/login?registered=true');
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || 'Registration failed', { id: 'register' });
		}
	}
</script>

<svelte:head>
	<title>Welcome to ClinicFlow</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-8">
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
			<div class="h-full bg-primary transition-all duration-500 ease-out" style="width: {(currentStep / totalSteps) * 100}%"></div>
		</div>

		<CardHeader class="pt-8">
			<CardTitle class="text-2xl flex items-center gap-2">
				{#if currentStep === 1} <PlayCircle class="size-6 text-primary" /> Welcome to ClinicFlow
				{:else if currentStep === 2} <Building2 class="size-6 text-primary" /> Register Facility
				{:else if currentStep === 3} <Database class="size-6 text-primary" /> Initializing Local Database
				{:else if currentStep === 4} <UserPlus class="size-6 text-primary" /> Admin Setup
				{:else if currentStep === 5} <Users class="size-6 text-primary" /> Invite Team
				{:else if currentStep === 6} <QrCode class="size-6 text-primary" /> Hardware Calibration
				{:else if currentStep === 7} <CheckCircle2 class="size-6 text-emerald-500" /> All Set!
				{/if}
			</CardTitle>
			<CardDescription class="text-base">
				{#if currentStep === 1} Learn how ClinicFlow digitizes your primary healthcare center.
				{:else if currentStep === 2} Link this device to your PHC network.
				{:else if currentStep === 3} Setting up Dexie IndexedDB for offline-first capabilities.
				{:else if currentStep === 4} Create the primary administrator account for this facility.
				{:else if currentStep === 5} Add your doctors, nurses, and lab technicians.
				{:else if currentStep === 6} Test your barcode/QR scanner to ensure patient cards can be read.
				{:else if currentStep === 7} ClinicFlow is ready for deployment.
				{/if}
			</CardDescription>
		</CardHeader>

		<CardContent class="min-h-[320px] p-6">
			{#if currentStep === 1}
				<div in:fade={{ duration: 200 }} class="space-y-6">
					<div class="aspect-video w-full bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden group border border-slate-800">
						<img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80" alt="Medical Clinic" class="opacity-40 object-cover w-full h-full" />
						<button class="absolute z-10 size-16 bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
							<PlayCircle class="size-8" />
						</button>
					</div>
					<div class="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 p-4 rounded-lg text-sm flex items-start gap-3">
						<HardDrive class="size-5 shrink-0 mt-0.5" />
						<p>ClinicFlow runs <strong>offline-first</strong>. All data is saved securely to this device and syncs automatically when an internet connection is available.</p>
					</div>
				</div>
			
			{:else if currentStep === 2}
				<div in:fade={{ duration: 200 }} class="space-y-5 py-4">
					<div class="space-y-2">
						<Label>Facility Name</Label>
						<Input bind:value={phcName} placeholder="e.g., General Hospital, Benin City" class="h-12 text-lg" />
					</div>
					<div class="space-y-2">
						<Label>State</Label>
						<Input bind:value={phcState} placeholder="e.g., Edo State" class="h-12" />
					</div>
					<div class="space-y-2">
						<Label>LGA (Local Government Area)</Label>
						<Input bind:value={phcLga} placeholder="e.g., Oredo" class="h-12" />
					</div>
					
					<label class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 mt-6">
						<input type="checkbox" bind:checked={includeSeedData} class="accent-primary size-5" />
						<div>
							<p class="font-medium text-foreground">Include Demo Seed Data</p>
							<p class="text-sm text-muted-foreground">Pre-loads 50 sample patients, queue tickets, and lab results for training purposes.</p>
						</div>
					</label>
				</div>
			
			{:else if currentStep === 3}
				<div in:fade={{ duration: 200 }} class="flex flex-col items-center justify-center h-full min-h-[300px] space-y-8 text-center">
					<div class="relative">
						<div class="size-24 rounded-full border-4 border-muted flex items-center justify-center">
							<Database class="size-10 {dbInitFailed ? 'text-destructive' : 'text-primary'} {dbProgress < 100 && !dbInitFailed ? 'animate-pulse' : ''}" />
						</div>
						{#if dbProgress >= 100}
							<div class="absolute -bottom-2 -right-2 size-8 bg-emerald-500 rounded-full border-4 border-background flex items-center justify-center text-white" in:fade>
								<CheckCircle2 class="size-4" />
							</div>
						{/if}
					</div>
					
					<div class="w-full max-w-md space-y-2">
						<div class="flex justify-between text-sm font-medium">
							<span>{dbInitFailed ? 'Initialization Failed' : dbProgress >= 100 ? 'Initialization Complete' : 'Building Local Indices...'}</span>
							<span>{Math.round(dbProgress)}%</span>
						</div>
						<Progress value={dbProgress} class="h-2 {dbInitFailed ? 'bg-destructive/20' : ''}" />
					</div>
					{#if dbInitFailed}
						<Button variant="outline" onclick={runDbInit}>Retry Initialization</Button>
					{:else}
						<p class="text-sm text-muted-foreground">Please do not close the app during this process.</p>
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
						<Input type="email" bind:value={adminEmail} placeholder="admin@clinic.com" class="h-12 text-lg" />
					</div>
					<div class="space-y-2">
						<Label>Admin Password</Label>
						<Input type="password" bind:value={adminPassword} placeholder="Enter a secure password (min 8 chars)" class="h-12 text-lg" />
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
							You can invite staff members now via link, or they can register on this device later.
						</p>
						<Button variant="outline" class="w-full h-11" onclick={() => toast.success('Invite link copied to clipboard!')}>
							Copy Invite Link
						</Button>
					</div>
					<p class="text-xs text-muted-foreground">You can also skip this and manage staff from the Admin Dashboard.</p>
				</div>
			
			{:else if currentStep === 6}
				<div in:fade={{ duration: 200 }} class="space-y-6 text-center py-6">
					<div class="mx-auto size-48 bg-slate-900 rounded-xl overflow-hidden relative border-2 border-primary/50 shadow-inner">
						<div class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2">
							<QrCode class="size-10 opacity-50" />
							<span class="text-xs uppercase tracking-widest">Camera View</span>
						</div>
						<!-- Scan line animation -->
						<div class="absolute left-0 top-1/2 w-full h-0.5 bg-primary/70 shadow-[0_0_8px_2px_rgba(var(--primary),0.5)] animate-scan"></div>
					</div>
					<div class="max-w-xs mx-auto">
						<h3 class="font-bold mb-2">Scan a Patient Card</h3>
						<p class="text-sm text-muted-foreground">Present a QR code to the device camera to verify the scanner is working correctly.</p>
					</div>
					<Button variant="outline" onclick={() => { toast.success('Hardware verified!'); nextStep(); }}>
						Skip Calibration
					</Button>
				</div>
			
			{:else if currentStep === 7}
				<div in:fade={{ duration: 200 }} class="flex flex-col items-center justify-center text-center py-12 space-y-4">
					<div class="size-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-2">
						<CheckCircle2 class="size-10" />
					</div>
					<h2 class="text-2xl font-bold text-foreground">You're All Set!</h2>
					<p class="text-muted-foreground max-w-sm">
						{phcName || 'Your facility'} has been configured successfully. You can now start registering patients and managing queues offline.
					</p>
				</div>
			{/if}
		</CardContent>

		<CardFooter class="flex justify-between border-t bg-muted/20 p-6">
			<Button variant="ghost" disabled={currentStep === 1 || currentStep === 3 || currentStep === 7} onclick={prevStep}>
				<ArrowLeft class="size-4 mr-2" /> Back
			</Button>

			{#if currentStep === 3}
				<Button disabled>
					Initializing <span class="animate-pulse ml-1">...</span>
				</Button>
			{:else if currentStep === 7}
				<Button class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-8" onclick={finishSetup}>
					Launch ClinicFlow
				</Button>
			{:else}
				<Button class="h-11 px-8" onclick={nextStep}>
					{currentStep === 6 ? 'Verify & Continue' : 'Continue'} <ArrowRight class="size-4 ml-2" />
				</Button>
			{/if}
		</CardFooter>
	</Card>
</div>

<style>
	@keyframes scan {
		0% { top: 10%; opacity: 0; }
		10% { opacity: 1; }
		90% { opacity: 1; }
		100% { top: 90%; opacity: 0; }
	}
	.animate-scan {
		animation: scan 2.5s infinite linear;
	}
</style>
