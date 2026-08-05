<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Search, Clock, LogIn, User, Phone, CheckCircle2, Loader2, ArrowLeft } from '@lucide/svelte';
	import { searchPatients, selfCheckIn } from '$lib/remote/kiosk.remote';
	import { slide, fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	let searchQuery = $state('');
	let isSearching = $state(false);
	let searchResults = $state<any[]>([]);
	
	let selectedPatient = $state<any>(null);
	let isCheckingIn = $state(false);
	let checkedInTicket = $state<number | null>(null);

	let currentTime = $state(new Date());

	onMount(() => {
		const timer = setInterval(() => {
			currentTime = new Date();
		}, 1000);
		return () => clearInterval(timer);
	});

	let searchTimeout: ReturnType<typeof setTimeout>;
	
	function handleSearch() {
		clearTimeout(searchTimeout);
		if (searchQuery.length < 2) {
			searchResults = [];
			return;
		}
		
		isSearching = true;
		searchTimeout = setTimeout(async () => {
			try {
				searchResults = await searchPatients({ query: searchQuery });
			} catch (e) {
				console.error(e);
			} finally {
				isSearching = false;
			}
		}, 500);
	}

	function resetKiosk() {
		searchQuery = '';
		searchResults = [];
		selectedPatient = null;
		checkedInTicket = null;
	}
</script>

<svelte:head>
	<title>Self Check-In Kiosk</title>
</svelte:head>

<!-- Premium Full-Screen Kiosk UI -->
<div class="fixed inset-0 bg-slate-900 text-slate-50 flex flex-col overflow-hidden font-sans select-none">
	
	<!-- Header -->
	<header class="h-24 px-8 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">
		<div class="flex items-center gap-4">
			<div class="size-12 rounded-2xl bg-primary flex items-center justify-center">
				<span class="text-2xl font-bold text-primary-foreground">CF</span>
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">ClinicFlow Check-In</h1>
				<p class="text-slate-400 font-medium">Welcome to our clinic</p>
			</div>
		</div>
		
		<div class="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10">
			<Clock class="size-6 text-primary" />
			<span class="text-3xl font-light tabular-nums tracking-tight">
				{new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(currentTime)}
			</span>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="flex-1 flex flex-col items-center justify-center p-8 relative">
		
		{#if checkedInTicket !== null}
			<!-- Success State -->
			<div class="flex flex-col items-center justify-center text-center max-w-2xl w-full" in:slide={{ duration: 500 }}>
				<div class="size-40 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-8 animate-pulse">
					<CheckCircle2 class="size-24" />
				</div>
				<h2 class="text-5xl font-bold mb-4">You're Checked In!</h2>
				<p class="text-2xl text-slate-300 mb-12">Please take a seat. Your ticket number is:</p>
				
				<div class="bg-white/10 border border-white/20 rounded-3xl p-12 mb-12 shadow-2xl backdrop-blur-xl">
					<span class="text-9xl font-black tabular-nums tracking-tighter text-primary">
						#{checkedInTicket}
					</span>
				</div>
				
				<p class="text-xl text-slate-400">This screen will reset automatically in a moment.</p>
				<Button size="lg" variant="outline" class="mt-8 text-lg h-16 px-8 rounded-full border-white/20 hover:bg-white/10" onclick={resetKiosk}>
					Done
				</Button>
			</div>
			
		{:else if selectedPatient}
			<!-- Confirmation State -->
			<div class="flex flex-col items-center justify-center text-center max-w-xl w-full" in:slide={{ duration: 400 }}>
				<Button variant="ghost" class="absolute top-8 left-8 text-xl h-16 px-6 text-slate-300 hover:text-white" onclick={() => selectedPatient = null}>
					<ArrowLeft class="size-6 mr-3" /> Back
				</Button>
				
				<div class="size-32 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-8">
					<User class="size-16" />
				</div>
				<h2 class="text-4xl font-bold mb-4">Are you this patient?</h2>
				
				<Card class="w-full bg-white/5 border-white/10 p-8 my-8 backdrop-blur-xl rounded-3xl">
					<h3 class="text-4xl font-bold text-white mb-4">{selectedPatient.fullName}</h3>
					<div class="flex items-center justify-center gap-3 text-2xl text-slate-300">
						<Phone class="size-6" />
						<span>•••• ••• {selectedPatient.phone ? selectedPatient.phone.slice(-4) : 'N/A'}</span>
					</div>
				</Card>
				
				<form
					class="w-full"
					{...selfCheckIn.enhance(async (form) => {
						isCheckingIn = true;
						try {
							if (await form.submit()) {
								if (selfCheckIn.result?.success) {
									checkedInTicket = selfCheckIn.result.ticketNumber;
									setTimeout(() => {
										resetKiosk();
									}, 10000);
								}
							}
						} catch (e) {
							console.error(e);
						} finally {
							isCheckingIn = false;
						}
					})}
				>
					<input {...selfCheckIn.fields.patientId.as('hidden', selectedPatient.id)} />
					<Button 
						type="submit"
						size="lg" 
						class="w-full h-24 text-3xl font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20"
						disabled={isCheckingIn}
					>
						{#if isCheckingIn}
							<Loader2 class="size-8 mr-4 animate-spin" /> Checking in...
						{:else}
							Yes, Check Me In
						{/if}
					</Button>
				</form>
			</div>
			
		{:else}
			<!-- Search State -->
			<div class="w-full max-w-3xl flex flex-col items-center" in:fade>
				<h2 class="text-5xl font-bold mb-12 text-center leading-tight">Tap to search your name <br/> or phone number</h2>
				
				<div class="relative w-full mb-12 group">
					<Search class="absolute left-8 top-1/2 -translate-y-1/2 size-10 text-slate-400 group-focus-within:text-primary transition-colors" />
					<Input 
						type="text" 
						bind:value={searchQuery}
						oninput={handleSearch}
						placeholder="Search here..." 
						class="w-full h-28 pl-24 pr-8 text-4xl rounded-[2.5rem] bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-primary focus-visible:ring-4 shadow-2xl backdrop-blur-xl"
					/>
					{#if isSearching}
						<Loader2 class="absolute right-8 top-1/2 -translate-y-1/2 size-8 text-primary animate-spin" />
					{/if}
				</div>
				
				{#if searchResults.length > 0}
					<div class="w-full grid grid-cols-1 md:grid-cols-2 gap-4" in:slide>
						{#each searchResults as patient}
							<button 
								class="text-left bg-white/5 hover:bg-white/15 border border-white/10 p-6 rounded-3xl transition-all active:scale-95"
								onclick={() => selectedPatient = patient}
							>
								<h3 class="text-2xl font-bold text-white mb-2">{patient.fullName}</h3>
								<p class="text-lg text-slate-400 flex items-center gap-2">
									<Phone class="size-5" /> •••• {patient.phone ? patient.phone.slice(-4) : 'XXXX'}
								</p>
							</button>
						{/each}
					</div>
				{:else if searchQuery.length >= 2 && !isSearching}
					<div class="text-center p-12 text-slate-400 text-2xl" in:fade>
						No patients found. Please ask the receptionist for help.
					</div>
				{/if}
			</div>
		{/if}
		
	</main>

	<!-- Footer -->
	<footer class="p-6 flex justify-end">
		<Button href="/login" variant="ghost" class="text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-full px-6 py-6 h-auto text-lg">
			<LogIn class="size-5 mr-3" />
			Staff Login
		</Button>
	</footer>
</div>
