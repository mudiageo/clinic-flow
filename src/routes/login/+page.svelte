<script lang="ts">
	import { signInWithPin, getStaffForLogin } from '$lib/remote/auth.remote';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { ShieldAlert, AlertCircle, ArrowLeft, Loader2, Delete, Fingerprint } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { db } from '$lib/local-db/db';
	import { fade, slide } from 'svelte/transition';

	const allIssues = $derived(signInWithPin.fields.allIssues() ?? []);

	type Staff = { id: string; fullName: string; role: string; user: { email: string } };
	let staffMembers = $state<Staff[]>([]);
	let selectedStaff = $state<Staff | null>(null);
	let pin = $state('');
	let isLoadingStaff = $state(true);

	onMount(async () => {
		try {
			// Fetch the list of allowed staff members for this device/clinic
			const phcId = localStorage.getItem('clinicflow_phc_id') || undefined;
			const res = await getStaffForLogin({ phcId });
			if (res) {
				staffMembers = res as unknown as Staff[];
			}
		} catch (e) {
			console.error('Failed to fetch staff list:', e);
		} finally {
			isLoadingStaff = false;
		}
	});

	function handlePinDigit(digit: string) {
		if (pin.length < 4) {
			pin += digit;
			
			// Auto-submit when 4 digits are entered
			if (pin.length === 4 && selectedStaff) {
				// Submit the hidden form programmatically
				const form = document.getElementById('login-form') as HTMLFormElement;
				if (form) form.requestSubmit();
			}
		}
	}

	function handlePinBackspace() {
		if (pin.length > 0) {
			pin = pin.slice(0, -1);
		}
	}

</script>

<svelte:head>
	<title>Kiosk Login — ClinicFlow</title>
</svelte:head>

<div class="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-primary/20">
	<div class="absolute w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] -top-40 -left-40 pointer-events-none"></div>
	<div class="absolute w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] -bottom-40 -right-40 pointer-events-none"></div>

	<div class="w-full max-w-xl relative z-10 space-y-6 flex flex-col items-center">
		
		<div class="text-center" in:fade={{ duration: 400 }}>
			<div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-4">
				<Fingerprint class="w-7 h-7" />
			</div>
			<h1 class="text-3xl font-extrabold text-foreground tracking-tight">ClinicFlow Login</h1>
			<p class="text-muted-foreground mt-1.5 text-sm font-medium">Select your profile to unlock this terminal</p>
		</div>

		<Card class="w-full bg-card/60 border-border/80 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[400px]">
			<CardContent class="p-0">
				
				{#if isLoadingStaff}
					<div class="h-[400px] flex flex-col items-center justify-center text-muted-foreground gap-4">
						<Loader2 class="size-8 animate-spin text-primary" />
						<p class="font-medium animate-pulse">Loading staff profiles...</p>
					</div>
				
				{:else if !selectedStaff}
					<!-- Staff Grid View -->
					<div class="p-6 h-[400px] flex flex-col" in:fade={{ duration: 200 }}>
						<div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
							<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
								{#each staffMembers as staff}
									<button 
										class="flex flex-col items-center text-center gap-3 p-4 rounded-xl border border-border/50 bg-background hover:bg-muted/50 hover:border-primary/50 transition-all active:scale-95 group"
										onclick={() => selectedStaff = staff}
									>
										<div class="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
											{staff.fullName.charAt(0)}
										</div>
										<div class="space-y-0.5">
											<p class="font-semibold text-sm text-foreground line-clamp-1">{staff.fullName}</p>
											<p class="text-xs text-muted-foreground uppercase tracking-wider">{staff.role}</p>
										</div>
									</button>
								{/each}

								{#if staffMembers.length === 0}
									<div class="col-span-full py-12 text-center text-muted-foreground">
										<p>No staff accounts found.</p>
										<p class="text-sm mt-1">Please register the PHC first.</p>
										<Button href="/onboarding" variant="link" class="mt-4">Register PHC</Button>
									</div>
								{/if}
							</div>
						</div>
					</div>
				
				{:else}
					<!-- PIN Entry View -->
					<div class="p-6 h-[400px] flex flex-col" in:slide={{ duration: 300 }}>
						<div class="flex items-center gap-4 mb-8">
							<Button variant="ghost" size="icon" class="rounded-full hover:bg-muted" onclick={() => { selectedStaff = null; pin = ''; }}>
								<ArrowLeft class="size-5" />
							</Button>
							<div class="flex items-center gap-3">
								<div class="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
									{selectedStaff.fullName.charAt(0)}
								</div>
								<div>
									<p class="font-bold text-foreground leading-none">{selectedStaff.fullName}</p>
									<p class="text-xs text-muted-foreground uppercase tracking-widest mt-1">{selectedStaff.role}</p>
								</div>
							</div>
						</div>

						<div class="flex-1 flex flex-col items-center justify-center gap-8 max-w-xs mx-auto w-full">
							<!-- PIN Dots -->
							<div class="flex gap-4">
								{#each [0, 1, 2, 3] as i}
									<div class="size-4 rounded-full transition-all duration-300 {i < pin.length ? 'bg-primary scale-110' : 'bg-muted'}"></div>
								{/each}
							</div>
							
							{#if allIssues.length > 0}
								<p class="text-sm text-destructive font-bold animate-shake">Incorrect PIN. Please try again.</p>
							{:else}
								<p class="text-sm text-muted-foreground font-medium">Enter your 4-digit PIN</p>
							{/if}

							<!-- Number Pad -->
							<div class="grid grid-cols-3 gap-3 sm:gap-4 w-full">
								{#each ['1','2','3','4','5','6','7','8','9'] as num}
									<button class="h-14 sm:h-16 text-2xl font-semibold rounded-2xl bg-muted/50 hover:bg-muted active:bg-primary/20 transition-colors" onclick={() => handlePinDigit(num)}>
										{num}
									</button>
								{/each}
								<div></div>
								<button class="h-14 sm:h-16 text-2xl font-semibold rounded-2xl bg-muted/50 hover:bg-muted active:bg-primary/20 transition-colors" onclick={() => handlePinDigit('0')}>
									0
								</button>
								<button class="h-14 sm:h-16 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-2xl bg-muted/20 hover:bg-muted/50 active:bg-destructive/20 transition-colors" onclick={handlePinBackspace}>
									<Delete class="size-6" />
								</button>
							</div>
						</div>

						<!-- Hidden Form for actual submission -->
						<form id="login-form" {...signInWithPin} class="hidden">
							<input type="hidden" name="staffId" value={selectedStaff.id} />
							<input type="hidden" name="pin" value={pin} />
						</form>
					</div>
				{/if}
			</CardContent>
		</Card>

		<div class="text-center flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
			<ShieldAlert class="size-3.5 text-primary" />
			ClinicFlow Kiosk • Authorized Personnel Only
		</div>
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent; 
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: hsl(var(--muted)); 
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--muted-foreground) / 0.5); 
	}
	
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-5px); }
		75% { transform: translateX(5px); }
	}
	.animate-shake {
		animation: shake 0.3s ease-in-out;
	}
</style>
