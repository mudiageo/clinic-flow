<script lang="ts">
	import { patientStore } from '$lib/state/patients.svelte';
	import { appointmentStore } from '$lib/state/appointments.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { ArrowLeft, CalendarPlus, Search } from '@lucide/svelte';

	let { data } = $props<{ data: { staffList: any[] } }>();

	let isSaving = $state(false);
	let patientSearch = $state('');
	let patientId = $state('');
	let type = $state<'antenatal' | 'immunization' | 'follow-up' | 'general' | 'lab-follow-up'>('general');
	let assignedStaffId = $state('');
	let dateStr = $state('');
	let timeStr = $state('');
	let durationMinutes = $state(30);
	let notes = $state('');
	let smsReminderSent = $state(true);

	const patientResults = $derived(patientSearch.length > 1 ? patientStore.search(patientSearch).slice(0, 5) : []);
	
	function selectPatient(patient: any) {
		patientId = patient.id;
		patientSearch = patient.name;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!patientId) {
			toast.error('Please select a valid patient');
			return;
		}

		const scheduledAt = new Date(`${dateStr}T${timeStr}`).getTime();
		
		isSaving = true;
		try {
			await appointmentStore.create({
				patientId,
				phcId: 'demo-phc-1',
				assignedStaffId: assignedStaffId || null,
				type,
				scheduledAt,
				durationMinutes,
				notes,
				status: 'scheduled',
				smsReminderSent,
				createdAt: Date.now()
			});
			
			toast.success('Appointment created successfully');
			goto('/admin/appointments');
		} catch (error) {
			toast.error('Failed to create appointment');
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>New Appointment — ClinicFlow</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
	<Button variant="ghost" href="/admin/appointments" class="pl-0 hover:bg-transparent">
		<ArrowLeft class="size-4 mr-2" />
		Back to Appointments
	</Button>

	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<CalendarPlus class="size-5 text-primary" />
				Schedule New Appointment
			</CardTitle>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleSubmit} class="space-y-6">
				<!-- Patient Search -->
				<div class="space-y-2 relative">
					<Label for="patientSearch">Patient</Label>
					<div class="relative">
						<Search class="absolute left-3 top-3 size-4 text-muted-foreground" />
						<Input
							id="patientSearch"
							bind:value={patientSearch}
							oninput={() => {
								if(patientId && !patientSearch.includes(patientStore.items.find(p => p.id === patientId)?.name || '')) {
									patientId = '';
								}
							}}
							placeholder="Search by name, ID, or phone..."
							class="pl-9"
							autocomplete="off"
							required
						/>
					</div>
					{#if !patientId && patientSearch.length > 1}
						<div class="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-48 overflow-y-auto">
							{#if patientResults.length === 0}
								<div class="p-3 text-sm text-muted-foreground">No patients found.</div>
							{:else}
								{#each patientResults as p}
									<button
										type="button"
										class="w-full text-left p-3 hover:bg-muted text-sm border-b last:border-b-0 flex items-center justify-between"
										onclick={() => selectPatient(p)}
									>
										<span class="font-medium">{p.name}</span>
										<span class="text-xs text-muted-foreground font-mono">{p.clinicId}</span>
									</button>
								{/each}
							{/if}
						</div>
					{/if}
					{#if patientId}
						<p class="text-xs text-green-600 font-medium">✓ Patient selected</p>
					{/if}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Type -->
					<div class="space-y-2">
						<Label for="type">Appointment Type</Label>
						<select
							id="type"
							bind:value={type}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							required
						>
							<option value="general">General Consultation</option>
							<option value="antenatal">Antenatal Care</option>
							<option value="immunization">Immunization</option>
							<option value="follow-up">Follow-up</option>
							<option value="lab-follow-up">Lab Result Follow-up</option>
						</select>
					</div>

					<!-- Staff -->
					<div class="space-y-2">
						<Label for="staff">Assigned Provider (Optional)</Label>
						<select
							id="staff"
							bind:value={assignedStaffId}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="">Any available</option>
							{#each data.staffList as staff}
								<option value={staff.id}>{staff.fullName} ({staff.role})</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div class="space-y-2">
						<Label for="date">Date</Label>
						<Input type="date" id="date" bind:value={dateStr} required />
					</div>
					<div class="space-y-2">
						<Label for="time">Time</Label>
						<Input type="time" id="time" bind:value={timeStr} required />
					</div>
					<div class="space-y-2">
						<Label for="duration">Duration (mins)</Label>
						<Input type="number" id="duration" bind:value={durationMinutes} min="5" step="5" required />
					</div>
				</div>

				<div class="space-y-2">
					<Label for="notes">Notes / Reason for Visit</Label>
					<Textarea id="notes" bind:value={notes} placeholder="Optional details..." />
				</div>

				<div class="flex items-center space-x-2 bg-muted/30 p-4 rounded-lg border">
					<Switch id="sms" bind:checked={smsReminderSent} />
					<div class="grid gap-1.5 leading-none">
						<Label for="sms" class="font-medium cursor-pointer">Send SMS Reminder</Label>
						<p class="text-xs text-muted-foreground">Patient will receive a reminder 24h before</p>
					</div>
				</div>

				<Button type="submit" class="w-full">
					Schedule Appointment
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
