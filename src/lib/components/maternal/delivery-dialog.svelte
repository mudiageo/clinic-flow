<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { Baby, Calendar, CheckCircle2 } from '@lucide/svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import { appointmentStore } from '$lib/state/appointments.svelte';
	import { reminderStore } from '$lib/state/reminders.svelte';
	import { pregnancyStore } from '$lib/state/pregnancy.svelte';

	let { open = $bindable(false), patientId, pregnancyRecordId, onComplete } = $props();

	let babyName = $state('');
	let babySex = $state<'male' | 'female' | 'other' | ''>('');
	let babyWeight = $state<number | ''>('');
	let deliveryDateStr = $state(new Date().toISOString().split('T')[0]);

	let isProcessing = $state(false);

	// Nigerian standard NPI schedule
	const NPI_SCHEDULE = [
		{ label: 'BCG & OPV 0', daysOffset: 0 },
		{ label: 'Penta 1, OPV 1, PCV 1, Rota 1', daysOffset: 42 }, // 6 weeks
		{ label: 'Penta 2, OPV 2, PCV 2, Rota 2', daysOffset: 70 }, // 10 weeks
		{ label: 'Penta 3, OPV 3, PCV 3, Rota 3, IPV', daysOffset: 98 }, // 14 weeks
		{ label: 'Vitamin A, Measles 1, Yellow Fever', daysOffset: 270 } // 9 months
	];

	// Standard Postnatal Care (PNC) schedule
	const PNC_SCHEDULE = [
		{ label: 'PNC 1 (24-48 Hours)', daysOffset: 1 },
		{ label: 'PNC 2 (7 Days)', daysOffset: 7 },
		{ label: 'PNC 3 (6 Weeks)', daysOffset: 42 }
	];

	async function handleFinalizeDelivery() {
		if (!babyName || !babySex || !deliveryDateStr) return;
		isProcessing = true;
		
		try {
			const mother = patientStore.findById(patientId);
			const phcId = typeof localStorage !== 'undefined' ? localStorage.getItem('phcId') || 'demo-phc-1' : 'demo-phc-1';
			const deliveryDate = new Date(deliveryDateStr).getTime();

			// 1. Mark pregnancy as delivered
			await pregnancyStore.updateRecordStatus(pregnancyRecordId, 'delivered');
			await patientStore.update(patientId, { isPregnant: false, updatedAt: Date.now() });

			// 2. Generate Mother's Postnatal Care (PNC) Schedule
			for (const visit of PNC_SCHEDULE) {
				const scheduleDate = deliveryDate + (visit.daysOffset * 24 * 60 * 60 * 1000);
				
				// Create Appointment
				await appointmentStore.insert({
					id: crypto.randomUUID(),
					patientId: patientId,
					phcId,
					assignedStaffId: null,
					type: 'antenatal', // Reusing antenatal for PNC
					scheduledAt: scheduleDate,
					durationMinutes: 30,
					notes: visit.label,
					status: 'scheduled',
					smsReminderSent: false,
					createdAt: Date.now(),
					updatedAt: Date.now(),
					syncStatus: 'pending'
				});

				// Create SMS Reminder
				if (mother?.phone) {
					await reminderStore.insert({
						id: crypto.randomUUID(),
						patientId: patientId,
						phcId,
						type: 'antenatal',
						label: `Mother Postnatal Checkup: ${visit.label}`,
						dueDate: scheduleDate - (24 * 60 * 60 * 1000), // 1 day before
						recipientPhone: mother.phone,
						status: 'scheduled',
						sentAt: null,
						provider: null,
						providerMessageId: null,
						createdAt: Date.now(),
						updatedAt: Date.now(),
						syncStatus: 'pending'
					});
				}
			}

			// 3. Register Baby
			const babyId = crypto.randomUUID();
			const clinicIdBase = Math.floor(100000 + Math.random() * 900000).toString();
			const babyClinicId = `CF-BB-${clinicIdBase}`;
			
			await patientStore.insert({
				id: babyId,
				clinicId: babyClinicId,
				phcId,
				familyId: mother?.familyId || null,
				guardianId: mother?.id || null,
				name: babyName,
				phone: mother?.phone || null,
				dob: deliveryDateStr,
				sex: babySex as any,
				address: mother?.address || null,
				community: mother?.community || null,
				nextOfKinName: mother?.name || null,
				nextOfKinPhone: mother?.phone || null,
				isPregnant: false,
				syncStatus: 'pending',
				updatedAt: Date.now(),
				serverUpdatedAt: null,
				deleted: false
			});

			// 4. Generate Baby's Immunization Schedule (NPI)
			for (const vax of NPI_SCHEDULE) {
				const scheduleDate = deliveryDate + (vax.daysOffset * 24 * 60 * 60 * 1000);
				
				// Appointment
				await appointmentStore.insert({
					id: crypto.randomUUID(),
					patientId: babyId,
					phcId,
					assignedStaffId: null,
					type: 'immunization',
					scheduledAt: scheduleDate,
					durationMinutes: 15,
					notes: `Vaccination: ${vax.label}`,
					status: 'scheduled',
					smsReminderSent: false,
					createdAt: Date.now(),
					updatedAt: Date.now(),
					syncStatus: 'pending'
				});

				// SMS Reminder (Send to mother's phone)
				if (mother?.phone) {
					await reminderStore.insert({
						id: crypto.randomUUID(),
						patientId: babyId,
						phcId,
						type: 'immunization',
						label: `Baby Immunization: ${vax.label}`,
						dueDate: scheduleDate - (24 * 60 * 60 * 1000),
						recipientPhone: mother.phone,
						status: 'scheduled',
						sentAt: null,
						provider: null,
						providerMessageId: null,
						createdAt: Date.now(),
						updatedAt: Date.now(),
						syncStatus: 'pending'
					});
				}
			}

			open = false;
			if (onComplete) onComplete();

		} catch(e) {
			console.error("Failed delivery", e);
		} finally {
			isProcessing = false;
		}
	}

</script>

<Dialog bind:open>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2 text-primary">
				<CheckCircle2 class="size-5" />
				Record Delivery & Generate Schedules
			</DialogTitle>
			<DialogDescription>
				This will automatically generate the mother's postnatal (PNC) schedule and register the baby with a full NPI Immunization schedule.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label>Date of Delivery</Label>
				<Input type="date" bind:value={deliveryDateStr} />
			</div>
			
			<div class="space-y-2">
				<Label>Baby's Name</Label>
				<Input type="text" placeholder="e.g., Baby of Amina" bind:value={babyName} />
			</div>
			
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label>Sex</Label>
					<Select bind:value={babySex}>
						<SelectTrigger>
							<SelectValue placeholder="Select Sex" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="male">Male</SelectItem>
							<SelectItem value="female">Female</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-2">
					<Label>Birth Weight (kg)</Label>
					<Input type="number" step="0.1" bind:value={babyWeight} />
				</div>
			</div>

			<div class="bg-muted p-4 rounded-md mt-4 text-sm text-muted-foreground border">
				<h4 class="font-medium text-foreground mb-2 flex items-center gap-1"><Calendar class="size-4" /> Automations to run:</h4>
				<ul class="list-disc pl-5 space-y-1">
					<li>Register <b>{babyName || 'Baby'}</b> as a new patient profile</li>
					<li>Schedule <b>3 Postnatal Visits</b> for the mother</li>
					<li>Schedule <b>5 Immunization Visits</b> (BCG to Measles) for the baby</li>
					<li>Queue automated SMS reminders for all visits</li>
				</ul>
			</div>
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={() => open = false} disabled={isProcessing}>Cancel</Button>
			<Button onclick={handleFinalizeDelivery} disabled={isProcessing || !babyName || !babySex}>
				{isProcessing ? 'Processing...' : 'Complete Delivery'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
