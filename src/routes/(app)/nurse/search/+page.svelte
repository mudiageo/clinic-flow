<script lang="ts">
	import { resolve } from '$app/paths';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { queueStore } from '#lib/state/queue.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import type { LocalPatient } from '#lib/local-db/db.ts';
	import { Autocomplete, AutocompleteHighlight } from '#lib/components/ui/autocomplete/index.js';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { toast } from 'svelte-sonner';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { User, Phone, MapPin, Calendar, ArrowRight, Clock, Activity } from '@lucide/svelte';

	let searchQuery = $state('');
	let selectedPatient = $state<LocalPatient | null>(null);
	let isAddingToQueue = $state(false);
	let selectedDepartment = $state('general');

	const searchResults = $derived(searchQuery.length >= 2 ? patientStore.search(searchQuery) : []);

	function handleSelect(patient: LocalPatient) {
		selectedPatient = patient;
	}

	async function addToQueue() {
		if (!selectedPatient) return;
		isAddingToQueue = true;

		try {
			const activeTickets = queueStore.items.filter(
				(t) => t.patientId === selectedPatient?.id && t.status === 'waiting'
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
				phcId: sessionStore.activePhcId,
				encounterId: null,
				ticketNumber: queueStore.allocateTicketNumber(sessionStore.activePhcId),
				status: 'waiting',
				triageLevel: 'unassigned',
				triageReason: null,
				department: selectedDepartment,
				calledAt: null,
				completedAt: null,
				createdAt: Date.now()
			});

			toast.success(`${selectedPatient.name} has been added to the queue.`);
		} catch (e) {
			toast.error(`Failed to add to queue: ${e instanceof Error ? e.message : String(e)}`);
		} finally {
			isAddingToQueue = false;
		}
	}
</script>

<svelte:head>
	<title>Patient Search — ClinicFlow</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
	<!-- Page Header -->
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Offline Registry
		</p>
		<h1 class="text-2xl font-bold text-foreground tracking-tight">Patient Search</h1>
		<p class="text-sm text-muted-foreground mt-0.5">
			Look up local folders to view profiles or route patients to a clinic queue
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Search Column -->
		<section class="rounded-xl border border-border bg-card p-5 space-y-4 h-fit">
			<div>
				<h2 class="text-base font-semibold text-foreground">Search Registry</h2>
				<p class="text-xs text-muted-foreground mt-0.5">
					Type at least 2 characters (name, clinic ID, or phone)
				</p>
			</div>

			<Autocomplete
				bind:value={searchQuery}
				options={searchResults}
				labelKey="name"
				placeholder="Search by name, ID, or phone..."
				class="h-12 text-base"
				onSelect={handleSelect}
			>
				{#snippet itemSnippet(patient: LocalPatient, isActive: boolean)}
					<div class="flex flex-col w-full py-1">
						<div class="font-medium text-foreground text-base">
							<AutocompleteHighlight text={patient.name} query={searchQuery} />
						</div>
						<div class="text-xs text-muted-foreground mt-0.5 font-mono">
							{patient.clinicId} · {patient.phone || 'No phone'}
						</div>
					</div>
				{/snippet}

				{#snippet emptySnippet()}
					<div class="py-4 text-muted-foreground flex flex-col items-center">
						<User class="size-8 opacity-20 mb-2" />
						<p class="text-sm">No patients found matching "{searchQuery}"</p>
						<Button variant="link" href="/nurse/register" class="mt-2 h-auto p-0">
							Register new patient
						</Button>
					</div>
				{/snippet}
			</Autocomplete>

			<div class="text-xs text-muted-foreground flex gap-2 items-center pt-1">
				<Activity class="size-3.5 shrink-0" />
				<span>Instant offline lookup via local device index</span>
			</div>
		</section>

		<!-- Profile Column -->
		<section>
			{#if selectedPatient}
				<div class="rounded-xl border border-border bg-card overflow-hidden">
					<!-- Folder Header Band -->
					<div class="bg-primary/8 border-b border-border p-5 flex items-center gap-4">
						<div
							class="size-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl uppercase shrink-0"
						>
							{selectedPatient.name.charAt(0)}
						</div>
						<div class="min-w-0">
							<h2 class="text-xl font-bold text-foreground truncate">{selectedPatient.name}</h2>
							<p class="font-mono text-primary text-sm font-medium mt-0.5">
								{selectedPatient.clinicId}
							</p>
						</div>
					</div>

					<div class="p-5 space-y-5">
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div class="space-y-1">
								<div class="text-xs text-muted-foreground flex items-center gap-1.5">
									<User class="size-3.5" /> Sex
								</div>
								<div class="font-medium capitalize">{selectedPatient.sex}</div>
							</div>

							<div class="space-y-1">
								<div class="text-xs text-muted-foreground flex items-center gap-1.5">
									<Calendar class="size-3.5" /> Date of Birth
								</div>
								<div class="font-medium font-mono">{selectedPatient.dob || '—'}</div>
							</div>

							<div class="space-y-1">
								<div class="text-xs text-muted-foreground flex items-center gap-1.5">
									<Phone class="size-3.5" /> Phone Number
								</div>
								<div class="font-medium font-mono">{selectedPatient.phone || '—'}</div>
							</div>

							<div class="space-y-1">
								<div class="text-xs text-muted-foreground flex items-center gap-1.5">
									<MapPin class="size-3.5" /> Address
								</div>
								<div class="font-medium">{selectedPatient.address || '—'}</div>
							</div>
						</div>

						{#if selectedPatient.isPregnant}
							<div
								class="bg-triage-red/10 border border-triage-red/30 text-triage-red px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
							>
								<Activity class="size-4 shrink-0" />
								Patient is currently pregnant
							</div>
						{/if}

						<div class="pt-4 border-t border-border flex flex-col gap-3">
							<div class="space-y-1.5">
								<Label for="department">Select Clinic / Queue</Label>
								<select
									id="department"
									bind:value={selectedDepartment}
									class="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<option value="general">General Outpatient</option>
									<option value="anc">Antenatal Care (ANC)</option>
									<option value="epi">Immunization (EPI)</option>
								</select>
							</div>

							<Button
								class="w-full min-h-11 font-semibold"
								onclick={addToQueue}
								disabled={isAddingToQueue}
							>
								{#if isAddingToQueue}
									Queueing…
								{:else}
									<Clock class="size-4 mr-2" />
									Route Patient to Queue
								{/if}
							</Button>

							<Button
								variant="outline"
								class="w-full min-h-11 border-border"
								href={`${resolve('/(app)/nurse/vitals')}?patient=${encodeURIComponent(selectedPatient.id)}`}
							>
								Take Vitals Instead
								<ArrowRight class="size-4 ml-2" />
							</Button>
						</div>
					</div>
				</div>
			{:else}
				<div
					class="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl bg-card/50 text-muted-foreground"
				>
					<User class="size-10 mb-3 opacity-25" />
					<h3 class="font-semibold text-foreground text-sm mb-1">No Patient Selected</h3>
					<p class="text-xs max-w-xs">
						Search and select a patient to view their folder details and route them to a clinic.
					</p>
				</div>
			{/if}
		</section>
	</div>
</div>
