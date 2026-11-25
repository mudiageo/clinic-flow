<script lang="ts">
	import { reminderStore } from '#lib/state/reminders.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { Plus } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import DataTable from './data-table.svelte';
	import { columns, type ReminderRow } from './columns';
	import CreateReminderDialog from './create-reminder-dialog.svelte';

	let isCreateOpen = $state(false);

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

<div class="max-w-6xl mx-auto space-y-6">
	<div
		class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Patient Follow-Up
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Patient Reminders</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Manage and schedule automated SMS reminders for patients
			</p>
		</div>

		<Button
			onclick={() => (isCreateOpen = true)}
			class="min-h-10 px-4 font-semibold w-full sm:w-auto"
		>
			<Plus class="size-4 mr-2" />
			New Reminder
		</Button>
	</div>

	<DataTable {data} {columns} />

	<CreateReminderDialog bind:open={isCreateOpen} />
</div>
