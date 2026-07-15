<script lang="ts">
	import { patientStore } from '$lib/state/patients.svelte';
	import { queueStore } from '$lib/state/queue.svelte';
	import { Autocomplete, AutocompleteHighlight } from '$lib/components/ui/autocomplete/index.js';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import {
		Search,
		User,
		Phone,
		MapPin,
		Calendar,
		ArrowRight,
		Clock,
		Activity
	} from '@lucide/svelte';

	let searchQuery = $state('');
	let selectedPatient = $state<any>(null);
	let isAddingToQueue = $state(false);

	// Reactive search powered by Dexie via patientStore
	const searchResults = $derived(searchQuery.length >= 2 ? patientStore.search(searchQuery) : []);

	function handleSelect(patient: any) {
		selectedPatient = patient;
	}

	async function addToQueue() {
		if (!selectedPatient) return;
		isAddingToQueue = true;

		try {
			// Check if already in queue
			const activeTickets = queueStore.items.filter(
				(t: any) => t.patientId === selectedPatient.id && t.status === 'waiting'
			);

			if (activeTickets.length > 0) {
				toast.info(
					`${selectedPatient.name} is already waiting in the queue (Ticket #${activeTickets[0].ticketNumber}).`
				);
				isAddingToQueue = false;
				return;
			}

			await queueStore.create({
				patientId: selectedPatient.id,
				phcId: crypto.randomUUID(), // Stub or auth store
				encounterId: null,
				ticketNumber: 0,
				status: 'waiting',
				triageLevel: 'unassigned', // Will be assessed at vitals
				triageReason: null,
				calledAt: null,
				completedAt: null,
				createdAt: Date.now()
			});

			toast.success(`${selectedPatient.name} has been added to the queue!`);
		} catch (e: any) {
			toast.error(`Failed to add to queue: ${e.message}`);
		} finally {
			isAddingToQueue = false;
		}
	}
</script>

<svelte:head>
	<title>Patient Search — ClinicFlow</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8 animate-fade-in mt-6">
	<div class="flex items-start gap-3 border-b border-border pb-6">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<Search class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Patient Search</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Search the offline registry to view profiles or queue patients
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<!-- Search Column -->
		<div class="space-y-6">
			<Card class="bg-card/60 shadow-sm border">
				<CardHeader class="pb-4 border-b border-border/60">
					<CardTitle class="text-base font-semibold">Search Registry</CardTitle>
					<CardDescription>Start typing to find patients instantly</CardDescription>
				</CardHeader>
				<CardContent class="pt-6">
					<div class="space-y-4">
						<Autocomplete
							bind:value={searchQuery}
							options={searchResults}
							labelKey="name"
							placeholder="Search by name, ID, or phone..."
							class="h-12 text-base"
							onSelect={handleSelect}
						>
							{#snippet itemSnippet(patient: any, isActive: boolean)}
								<div class="flex flex-col w-full py-1">
									<div class="font-medium text-foreground text-base">
										<AutocompleteHighlight text={patient.name} query={searchQuery} />
									</div>
									<div class="text-xs text-muted-foreground mt-0.5 font-mono">
										{patient.clinicId} • {patient.phone || 'No phone'}
									</div>
								</div>
							{/snippet}

							{#snippet emptySnippet()}
								<div class="py-4 text-muted-foreground flex flex-col items-center">
									<User class="size-8 opacity-20 mb-2" />
									<p>No patients found matching "{searchQuery}"</p>
									<Button variant="link" href="/nurse/register" class="mt-2 h-auto p-0"
										>Register new patient</Button
									>
								</div>
							{/snippet}
						</Autocomplete>

						<div class="text-xs text-muted-foreground flex gap-2 items-center px-1">
							<Activity class="size-3.5" />
							Powered by local Dexie index for instant offline searches
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Profile Column -->
		<div class="space-y-6">
			{#if selectedPatient}
				<Card class="bg-card shadow-sm border animate-in slide-in-from-right-4 duration-300">
					<CardHeader class="pb-0">
						<div class="flex items-center gap-4">
							<div
								class="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase"
							>
								{selectedPatient.name.charAt(0)}
							</div>
							<div>
								<CardTitle class="text-xl">{selectedPatient.name}</CardTitle>
								<div class="font-mono text-primary text-sm font-medium mt-1">
									{selectedPatient.clinicId}
								</div>
							</div>
						</div>
					</CardHeader>

					<CardContent class="pt-6 space-y-6">
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div class="space-y-1">
								<div class="text-muted-foreground flex items-center gap-1.5">
									<User class="size-3.5" />
									Sex
								</div>
								<div class="font-medium capitalize">{selectedPatient.sex}</div>
							</div>

							<div class="space-y-1">
								<div class="text-muted-foreground flex items-center gap-1.5">
									<Calendar class="size-3.5" />
									Date of Birth
								</div>
								<div class="font-medium">{selectedPatient.dob || '—'}</div>
							</div>

							<div class="space-y-1">
								<div class="text-muted-foreground flex items-center gap-1.5">
									<Phone class="size-3.5" />
									Phone Number
								</div>
								<div class="font-medium">{selectedPatient.phone || '—'}</div>
							</div>

							<div class="space-y-1">
								<div class="text-muted-foreground flex items-center gap-1.5">
									<MapPin class="size-3.5" />
									Address
								</div>
								<div class="font-medium">{selectedPatient.address || '—'}</div>
							</div>
						</div>

						{#if selectedPatient.isPregnant}
							<div
								class="bg-triage-red/10 border border-triage-red/20 text-triage-red p-3 rounded-lg text-sm font-medium flex items-center gap-2"
							>
								<Activity class="size-4" />
								Patient is currently pregnant
							</div>
						{/if}

						<div class="pt-6 border-t border-border flex flex-col gap-3">
							<Button class="w-full h-11 btn-press" onclick={addToQueue} disabled={isAddingToQueue}>
								{#if isAddingToQueue}
									Queueing...
								{:else}
									<Clock class="size-4 mr-2" />
									Add to Waiting Queue
								{/if}
							</Button>

							<Button
								variant="outline"
								class="w-full h-11 btn-press border-border"
								href="/nurse/vitals"
							>
								Take Vitals Instead
								<ArrowRight class="size-4 ml-2" />
							</Button>
						</div>
					</CardContent>
				</Card>
			{:else}
				<div
					class="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-xl bg-muted/20 text-muted-foreground"
				>
					<User class="size-12 mb-4 opacity-20" />
					<h3 class="font-medium text-foreground mb-1">No Patient Selected</h3>
					<p class="text-sm">
						Search and select a patient to view their profile and manage their visit.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
