<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Autocomplete, AutocompleteHighlight } from '$lib/components/ui/autocomplete/index.js';
	import { toast } from 'svelte-sonner';
	import { patientStore } from '$lib/state/patients.svelte';
	import { reminderStore } from '$lib/state/reminders.svelte';
	import { Calendar, User, Clock } from '@lucide/svelte';

	let { open = $bindable(false) } = $props();

	let searchQuery = $state('');
	let selectedPatient = $state<any>(null);
	let dueDateStr = $state('');
	let dueTimeStr = $state('09:00');
	let type = $state<'follow_up' | 'immunization' | 'antenatal'>('follow_up');
	let label = $state('');
	let isSubmitting = $state(false);

	const searchResults = $derived(searchQuery.length >= 2 ? patientStore.search(searchQuery) : []);

	function resetForm() {
		searchQuery = '';
		selectedPatient = null;
		dueDateStr = '';
		dueTimeStr = '09:00';
		type = 'follow_up';
		label = '';
	}

	function handleSelect(patient: any) {
		selectedPatient = patient;
		searchQuery = patient.name;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!selectedPatient) {
			toast.error('Please select a patient.');
			return;
		}
		if (!selectedPatient.phone) {
			toast.error('Patient has no phone number on record.');
			return;
		}

		isSubmitting = true;
		try {
			const dateStr = `${dueDateStr}T${dueTimeStr}`;
			const dueDate = new Date(dateStr).getTime();

			await reminderStore.create({
				patientId: selectedPatient.id,
				phcId: crypto.randomUUID(), // Mock or from auth
				recipientPhone: selectedPatient.phone,
				type,
				label,
				dueDate,
				status: 'scheduled',
				provider: 'none',
				createdAt: Date.now(),
				sentAt: null,
				providerMessageId: null
			});

			toast.success('Reminder scheduled successfully!');
			open = false;
			resetForm();
		} catch (err: any) {
			toast.error(`Failed to schedule reminder: ${err.message}`);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog.Root
	bind:open
	onOpenChange={(v) => {
		if (!v) resetForm();
	}}
>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Schedule Reminder</Dialog.Title>
			<Dialog.Description>Set up an automated SMS reminder for a patient.</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={handleSubmit} class="space-y-4 py-4">
			<div class="space-y-2">
				<Label>Patient</Label>
				<Autocomplete
					bind:value={searchQuery}
					options={searchResults}
					labelKey="name"
					placeholder="Search patient..."
					onSelect={handleSelect}
				>
					{#snippet itemSnippet(patient: any, isActive: boolean)}
						<div class="flex flex-col w-full py-1">
							<div class="font-medium text-foreground text-sm">
								<AutocompleteHighlight text={patient.name} query={searchQuery} />
							</div>
							<div class="text-xs text-muted-foreground font-mono">
								{patient.phone || 'No phone'}
							</div>
						</div>
					{/snippet}
					{#snippet emptySnippet()}
						<div class="py-2 text-center text-xs text-muted-foreground">No patients found</div>
					{/snippet}
				</Autocomplete>
			</div>

			<div class="space-y-2">
				<Label>Reminder Type</Label>
				<select
					bind:value={type}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<option value="follow_up">Follow Up</option>
					<option value="appointment">Appointment</option>
					<option value="medication">Medication Refill</option>
					<option value="vaccination">Vaccination</option>
				</select>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label>Date</Label>
					<Input
						type="date"
						bind:value={dueDateStr}
						required
						min={new Date().toISOString().split('T')[0]}
					/>
				</div>
				<div class="space-y-2">
					<Label>Time</Label>
					<Input type="time" bind:value={dueTimeStr} required />
				</div>
			</div>

			<div class="space-y-2">
				<Label>Message</Label>
				<Textarea
					bind:value={label}
					placeholder="e.g. Please remember your follow-up appointment tomorrow."
					required
					class="resize-none h-20"
				/>
			</div>

			<Dialog.Footer class="pt-4">
				<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						Scheduling...
					{:else}
						Schedule
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
