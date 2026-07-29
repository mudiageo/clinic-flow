<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Shield, Printer, CheckCircle2, Clock, AlertCircle } from '@lucide/svelte';
	import { appointmentStore } from '$lib/state/appointments.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	
	let { patientId }: { patientId: string } = $props();

	let patient = $derived(patientStore.findById(patientId));
	
	// Fetch all immunization appointments for this patient
	let immunizationAppts = $derived(
		appointmentStore.forPatient(patientId)
			.filter(a => a.type === 'immunization')
			.sort((a, b) => a.scheduledAt - b.scheduledAt)
	);

	function getStatus(appt: any) {
		if (appt.status === 'completed') return 'given';
		
		const now = Date.now();
		// If it's more than 3 days past the scheduled date and not completed, it's overdue
		if (now > appt.scheduledAt + (3 * 24 * 60 * 60 * 1000)) {
			return 'overdue';
		}
		
		return 'due';
	}

	async function markAsGiven(apptId: string) {
		await appointmentStore.update(apptId, { 
			status: 'completed', 
			updatedAt: Date.now() 
		});
	}

	function handlePrint() {
		window.print();
	}
</script>

<style>
	@media print {
		/* Only show the print section, hide everything else */
		:global(body > *:not(.print-section)) {
			display: none !important;
		}
		:global(.print-section) {
			display: block !important;
			position: absolute;
			left: 0;
			top: 0;
			width: 100%;
			height: 100%;
			background: white;
		}
		.no-print {
			display: none !important;
		}
	}
</style>

<!-- Only display if they have immunization records or if they are a child (age < 5) -->
{#if immunizationAppts.length > 0 || (patient?.estimatedAge && patient.estimatedAge < 5) || (patient?.dob && (Date.now() - new Date(patient.dob).getTime()) < (5 * 365 * 24 * 60 * 60 * 1000))}
<div class="print-section">
	<Card class="mt-6 overflow-hidden border-triage-green/20">
		<CardHeader class="bg-triage-green/5 pb-4">
			<div class="flex items-center justify-between">
				<div>
					<CardTitle class="text-lg flex items-center gap-2 text-triage-green">
						<Shield class="size-5" />
						Digital Immunization Card
					</CardTitle>
					<CardDescription class="mt-1">
						National Programme on Immunization (NPI) Schedule
					</CardDescription>
				</div>
				<Button variant="outline" size="sm" class="no-print" onclick={handlePrint}>
					<Printer class="size-4 mr-2" />
					Print Card
				</Button>
			</div>
		</CardHeader>
		<CardContent class="pt-6">
			
			<div class="hidden print:block mb-6 pb-6 border-b border-dashed">
				<h2 class="text-2xl font-bold text-center mb-2">IMMUNIZATION RECORD CARD</h2>
				<div class="grid grid-cols-2 gap-4 text-sm mt-4">
					<div><strong>Patient Name:</strong> {patient?.name}</div>
					<div><strong>Clinic ID:</strong> {patient?.clinicId}</div>
					<div><strong>Date of Birth:</strong> {patient?.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}</div>
					<div><strong>Sex:</strong> <span class="capitalize">{patient?.sex}</span></div>
				</div>
			</div>

			<div class="space-y-4">
				{#if immunizationAppts.length === 0}
					<div class="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
						No immunization schedule generated for this patient yet.
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each immunizationAppts as appt}
							{@const status = getStatus(appt)}
							<div class="flex flex-col justify-between p-4 rounded-xl border bg-card">
								<div class="flex justify-between items-start mb-3">
									<div class="font-semibold text-foreground">
										{appt.notes.replace('Vaccination: ', '')}
									</div>
									{#if status === 'given'}
										<Badge variant="outline" class="border-triage-green text-triage-green bg-triage-green/10">
											<CheckCircle2 class="size-3 mr-1" /> Given
										</Badge>
									{:else if status === 'overdue'}
										<Badge variant="outline" class="border-triage-red text-triage-red bg-triage-red/10">
											<AlertCircle class="size-3 mr-1" /> Overdue
										</Badge>
									{:else}
										<Badge variant="secondary" class="bg-muted text-muted-foreground">
											<Clock class="size-3 mr-1" /> Due
										</Badge>
									{/if}
								</div>
								
								<div class="flex items-center justify-between mt-auto pt-4 border-t border-border">
									<div class="text-sm text-muted-foreground">
										<span class="font-medium text-foreground">Date:</span> {new Date(appt.scheduledAt).toLocaleDateString()}
									</div>
									{#if status !== 'given'}
										<Button size="sm" class="no-print" onclick={() => markAsGiven(appt.id)}>Mark Given</Button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="mt-6 pt-4 border-t border-border text-xs text-muted-foreground flex justify-between hidden print:flex">
				<span>Powered by ClinicFlow</span>
				<span>Printed: {new Date().toLocaleDateString()}</span>
			</div>
		</CardContent>
	</Card>
</div>
{/if}
