<script lang="ts">
	import { Card, CardContent } from '#lib/components/ui/card/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import { Syringe, Search, Baby, ClipboardList, CalendarDays } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { SvelteDate } from 'svelte/reactivity';
	import { appointmentStore } from '#lib/state/appointments.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { immunizationRecordsStore } from '#lib/state/immunization-records.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import { settingsStore } from '#lib/state/settings.svelte.ts';
	import { formatDate, formatDateTime } from '#lib/utils/date.ts';

	const EPI_VACCINES = ['BCG', 'OPV', 'DTP', 'measles', 'yellow fever', 'PCV', 'rotavirus'];

	let search = $state('');
	let dialogOpen = $state(false);
	let saving = $state(false);

	type RecordTarget = { appointmentId: string; patientId: string; patientName: string };
	let recordTarget = $state<RecordTarget | null>(null);

	let vaccineName = $state('');
	let doseNumber = $state<number | ''>(1);
	let administeredAtLocal = $state('');
	let batchNumber = $state('');
	let expiryDate = $state('');
	let route = $state('');
	let notes = $state('');

	const immunizationEnabled = $derived(settingsStore.current.immunizationEnabled !== false);
	const canManageImmunization = $derived(
		sessionStore.role === 'superadmin' ||
			!sessionStore.permissions ||
			sessionStore.permissions.includes('manage:immunization')
	);
	const canRecordVaccination = $derived(immunizationEnabled && canManageImmunization);

	const startOfToday = new SvelteDate();
	startOfToday.setHours(0, 0, 0, 0);
	const dayStart = startOfToday.getTime();
	const dayEnd = dayStart + 86_400_000 - 1;

	type Due = 'overdue' | 'today' | 'upcoming';

	const rows = $derived.by(() => {
		const term = search.trim().toLowerCase();
		return appointmentStore.items
			.filter(
				(appointment) => appointment.type === 'immunization' && appointment.status === 'scheduled'
			)
			.flatMap((appointment) => {
				const patient = patientStore.get(appointment.patientId);
				if (!patient || !patient.name.toLowerCase().includes(term)) return [];

				const due: Due =
					appointment.scheduledAt < dayStart
						? 'overdue'
						: appointment.scheduledAt <= dayEnd
							? 'today'
							: 'upcoming';
				return [{ appointment, patient, due }];
			});
	});

	function ageFromDob(dob: string | null): string {
		if (!dob) return '—';
		const birth = new Date(dob);
		if (Number.isNaN(birth.getTime())) return '—';

		const now = new Date();
		let years = now.getFullYear() - birth.getFullYear();
		const monthDiff = now.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years -= 1;
		return years >= 0 ? String(years) : '—';
	}

	function dueLabel(due: Due): string {
		if (due === 'overdue') return 'Overdue';
		if (due === 'today') return 'Due today';
		return 'Upcoming';
	}

	function localDatetimeNow(): string {
		const now = new Date();
		return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
	}

	function openRecordDialog(appointmentId: string, patientId: string, patientName: string) {
		if (!canRecordVaccination) return;
		recordTarget = { appointmentId, patientId, patientName };
		vaccineName = '';
		doseNumber = 1;
		administeredAtLocal = localDatetimeNow();
		batchNumber = '';
		expiryDate = '';
		route = '';
		notes = '';
		dialogOpen = true;
	}

	async function saveVaccination() {
		if (!recordTarget || saving) return;

		const name = vaccineName.trim();
		const dose = doseNumber === '' ? Number.NaN : doseNumber;
		if (!name) {
			toast.error('Enter the vaccine name.');
			return;
		}
		if (!Number.isInteger(dose) || dose < 1 || dose > 4) {
			toast.error('Dose number must be between 1 and 4.');
			return;
		}

		const administeredAt = administeredAtLocal ? new Date(administeredAtLocal).getTime() : NaN;
		if (Number.isNaN(administeredAt)) {
			toast.error('Enter a valid date administered.');
			return;
		}

		const expiry = expiryDate ? new Date(expiryDate).getTime() : null;
		if (expiry !== null && Number.isNaN(expiry)) {
			toast.error('Enter a valid expiry date.');
			return;
		}

		saving = true;
		try {
			await immunizationRecordsStore.record({
				patientId: recordTarget.patientId,
				appointmentId: recordTarget.appointmentId,
				vaccineName: name,
				doseNumber: dose,
				administeredAt,
				batchNumber,
				expiryDate: expiry,
				route,
				notes
			});
			await appointmentStore.update(recordTarget.appointmentId, { status: 'completed' });
			toast.success('Vaccination recorded');
			dialogOpen = false;
			recordTarget = null;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Unable to record this vaccination.');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Immunization (EPI) — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-teal-100 text-teal-600">
				<Syringe class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Immunization (EPI)</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Track infant vaccination schedules and defaulters
				</p>
				<p class="text-xs text-muted-foreground mt-1">
					Staff-entered record. Verify against the physical register and vaccine vial before
					clinical use.
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2 w-full md:w-auto">
			<div class="relative w-full md:w-64">
				<label for="immunization-search" class="sr-only">Search patients</label>
				<Search class="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
				<Input
					id="immunization-search"
					placeholder="Search patient name..."
					class="pl-9 h-10 w-full"
					bind:value={search}
				/>
			</div>
		</div>
	</div>

	{#if !immunizationEnabled}
		<p class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
			Immunization recording is disabled for this PHC. Contact your administrator to enable it.
		</p>
	{/if}

	<div class="grid grid-cols-1 gap-3">
		{#if rows.length === 0}
			<Card>
				<CardContent class="p-8 text-center text-muted-foreground">
					{search.trim()
						? 'No appointments match your search.'
						: 'No scheduled immunization appointments.'}
				</CardContent>
			</Card>
		{/if}

		{#each rows as row (row.appointment.id)}
			{@const age = ageFromDob(row.patient.dob)}
			{@const priorRecords = immunizationRecordsStore.forPatient(row.patient.id)}
			<Card
				class="card-hover border-l-4 {row.due === 'today'
					? 'border-l-amber-500'
					: row.due === 'overdue'
						? 'border-l-red-500'
						: 'border-l-sky-500'}"
			>
				<CardContent class="p-4 sm:p-6 space-y-4">
					<div class="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
						<div class="flex items-start sm:items-center gap-4">
							<div class="p-3 rounded-full bg-muted/30 text-muted-foreground shrink-0">
								<Baby class="size-6" />
							</div>
							<div>
								<h3 class="text-lg font-bold">{row.patient.name}</h3>
								<p class="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
									<span class="font-medium text-foreground">{age === '—' ? '—' : `${age} yrs`}</span
									>
									<span>·</span>
									<span
										class="flex items-center gap-1 {row.due === 'overdue'
											? 'text-red-600 font-semibold'
											: row.due === 'today'
												? 'text-amber-600 font-semibold'
												: ''}"
									>
										<CalendarDays class="size-3.5" />
										{dueLabel(row.due)}
									</span>
									<span class="text-muted-foreground"
										>· {formatDateTime(row.appointment.scheduledAt)}</span
									>
								</p>
								<p class="text-xs text-muted-foreground mt-1">
									{formatDate(row.appointment.scheduledAt)}
								</p>
								<p class="text-xs text-muted-foreground mt-1">
									{row.appointment.notes?.trim() ||
										'No vaccine details recorded in this appointment.'}
								</p>
							</div>
						</div>

						<div
							class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto"
						>
							<Badge
								variant="secondary"
								class="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200"
							>
								{dueLabel(row.due)}
							</Badge>
							<Button
								size="sm"
								class="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
								disabled={!canRecordVaccination ||
									saving ||
									recordTarget?.appointmentId === row.appointment.id}
								onclick={() =>
									openRecordDialog(row.appointment.id, row.patient.id, row.patient.name)}
							>
								<Syringe class="size-4 mr-2" />
								Record vaccination
							</Button>
						</div>
					</div>

					<div class="border-t pt-3">
						<p
							class="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"
						>
							<ClipboardList class="size-3.5" />
							Previously recorded
						</p>
						{#if priorRecords.length === 0}
							<p class="text-xs text-muted-foreground mt-1.5">No vaccination records yet</p>
						{:else}
							<ul class="mt-1.5 space-y-1">
								{#each priorRecords as record (record.id)}
									<li class="text-xs text-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
										<span class="font-medium">{record.vaccineName}</span>
										<span class="text-muted-foreground">Dose {record.doseNumber}</span>
										<span class="text-muted-foreground">· {formatDate(record.administeredAt)}</span>
										{#if record.batchNumber}
											<span class="text-muted-foreground">· Batch {record.batchNumber}</span>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>
</div>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Record vaccination</Dialog.Title>
			<Dialog.Description>
				All fields are staff-entered. Verify the vaccine and patient before saving; the record is
				saved locally first and synchronized when a connection is available.
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4 py-4 sm:grid-cols-2">
			<div class="space-y-2 sm:col-span-2">
				<Label for="record-patient">Patient</Label>
				<Input id="record-patient" value={recordTarget?.patientName ?? ''} readonly />
			</div>
			<div class="space-y-2">
				<Label for="record-vaccine">Vaccine name</Label>
				<Input
					id="record-vaccine"
					bind:value={vaccineName}
					list="epi-vaccine-names"
					placeholder="e.g. BCG"
					maxlength={120}
				/>
				<datalist id="epi-vaccine-names">
					{#each EPI_VACCINES as vaccine (vaccine)}
						<option value={vaccine}></option>
					{/each}
				</datalist>
			</div>
			<div class="space-y-2">
				<Label for="record-dose">Dose number</Label>
				<Input id="record-dose" type="number" min={1} max={4} bind:value={doseNumber} />
			</div>
			<div class="space-y-2">
				<Label for="record-administered">Date administered</Label>
				<Input id="record-administered" type="datetime-local" bind:value={administeredAtLocal} />
			</div>
			<div class="space-y-2">
				<Label for="record-batch">Batch number (optional)</Label>
				<Input id="record-batch" bind:value={batchNumber} maxlength={80} />
			</div>
			<div class="space-y-2">
				<Label for="record-expiry">Expiry date (optional)</Label>
				<Input id="record-expiry" type="date" bind:value={expiryDate} />
			</div>
			<div class="space-y-2">
				<Label for="record-route">Route (optional)</Label>
				<Input id="record-route" bind:value={route} maxlength={80} placeholder="e.g. oral" />
			</div>
			<div class="space-y-2 sm:col-span-2">
				<Label for="record-notes">Notes (optional)</Label>
				<Textarea id="record-notes" bind:value={notes} maxlength={500} rows={3} />
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (dialogOpen = false)} disabled={saving}>
				Cancel
			</Button>
			<Button onclick={saveVaccination} disabled={saving || !recordTarget}>
				{saving ? 'Saving...' : 'Save vaccination'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
