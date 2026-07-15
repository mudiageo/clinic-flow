<script lang="ts">
	import { reminderStore } from '$lib/state/reminders.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import { Bell, Plus, Clock } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import DataTable from './data-table.svelte';
	import { columns, type ReminderRow } from './columns';
	import CreateReminderDialog from './create-reminder-dialog.svelte';

	let isCreateOpen = $state(false);

	// Construct data for the table by merging reminder data with patient data
	let data = $derived(
		reminderStore.sortedItems.map((r) => {
			const patient = patientStore.get(r.patientId);
			return {
				id: r.id,
				patientId: r.patientId,
				patientName: patient?.name || 'Unknown Patient',
				recipientPhone: r.recipientPhone,
				label: r.label,
				type: r.type,
				status: r.status,
				dueDate: r.dueDate
			} as ReminderRow;
		})
	);
</script>

<svelte:head>
	<title>Reminders — ClinicFlow</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-8 animate-fade-in mt-6">
	<div
		class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6"
	>
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<Bell class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Patient Reminders</h1>
				<p class="text-muted-foreground text-sm mt-0.5">
					Manage and schedule automated SMS reminders for patients
				</p>
			</div>
		</div>

		<Button onclick={() => (isCreateOpen = true)} class="h-10 px-4 btn-press shadow-sm">
			<Plus class="size-4 mr-2" />
			New Reminder
		</Button>
	</div>

	<!-- Data Table View -->
	<DataTable {data} {columns} />

	<!-- Create Dialog -->
	<CreateReminderDialog bind:open={isCreateOpen} />
</div>
