<script lang="ts">
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

<div class="space-y-6 max-w-6xl mx-auto">
	<!-- Page Header -->
	<div
		class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Pediatrics &amp; EPI
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Immunization (EPI)</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Track infant vaccination schedules and defaulters
			</p>
			<p class="text-xs text-muted-foreground mt-1">
				Staff-entered record. Verify against the physical register and vaccine vial before clinical
				use.
			</p>
		</div>
		<div class="relative w-full md:w-72">
			<label for="immunization-search" class="sr-only">Search patients</label>
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
			<Input
				id="immunization-search"
				placeholder="Search patient name..."
				class="pl-9 h-11 w-full bg-card"
				bind:value={search}
			/>
		</div>
	</div>

	{#if !immunizationEnabled}
		<p
			class="text-sm text-foreground bg-triage-amber/12 border border-triage-amber/40 rounded-xl px-4 py-3"
		>
			Immunization recording is disabled for this PHC. Contact your administrator to enable it.
		</p>
	{/if}

	<div class="space-y-3">
		{#if rows.length === 0}
			<div
				class="p-12 text-center text-muted-foreground rounded-xl border border-dashed border-border bg-card/50"
			>
				{search.trim()
					? 'No appointments match your search.'
					: 'No scheduled immunization appointments.'}
			</div>
		{/if}

		{#each rows as row (row.appointment.id)}
			{@const age = ageFromDob(row.patient.dob)}
			{@const priorRecords = immunizationRecordsStore.forPatient(row.patient.id)}
			<article
				class="rounded-xl border border-border border-l-4 bg-card overflow-hidden {row.due ===
				'overdue'
					? 'border-l-triage-red'
					: row.due === 'today'
						? 'border-l-triage-amber'
						: 'border-l-primary'}"
			>
				<div class="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
					<div class="flex items-start sm:items-center gap-3.5 min-w-0">
						<div
							class="size-11 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0"
						>
							<Baby class="size-5" />
						</div>
						<div class="min-w-0">
							<h2 class="text-base font-bold text-foreground truncate">{row.patient.name}</h2>
							<p
								class="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5"
							>
								<span class="font-medium text-foreground">{age === '—' ? '—' : `${age} yrs`}</span>
								<span>·</span>
								<span
									class="inline-flex items-center gap-1 font-semibold {row.due === 'overdue'
										? 'text-triage-red'
										: row.due === 'today'
											? 'text-amber-700 dark:text-triage-amber'
											: 'text-primary'}"
								>
									<CalendarDays class="size-3.5" />
									{dueLabel(row.due)}
								</span>
								<span class="font-mono">· {formatDateTime(row.appointment.scheduledAt)}</span>
							</p>
							<p class="text-xs text-muted-foreground mt-1">
								{row.appointment.notes?.trim() ||
									'No vaccine details recorded in this appointment.'}
							</p>
						</div>
					</div>

					<div class="flex items-center gap-3 w-full sm:w-auto shrink-0">
						<Badge
							variant={row.due === 'overdue' ? 'destructive' : 'secondary'}
							class="font-semibold text-xs"
						>
							{dueLabel(row.due)}
						</Badge>
						<Button
							size="sm"
							class="flex-1 sm:flex-initial min-h-10 px-4 font-semibold"
							disabled={!canRecordVaccination ||
								saving ||
								recordTarget?.appointmentId === row.appointment.id}
							onclick={() => openRecordDialog(row.appointment.id, row.patient.id, row.patient.name)}
						>
							<Syringe class="size-4 mr-2" />
							Record vaccination
						</Button>
					</div>
				</div>

				<div class="border-t border-dashed border-border px-4 sm:px-5 py-3 bg-muted/20">
					<p
						class="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
					>
						<ClipboardList class="size-3.5" />
						Previously recorded
					</p>
					{#if priorRecords.length === 0}
						<p class="text-xs text-muted-foreground mt-1">No vaccination records yet</p>
					{:else}
						<ul class="mt-1.5 space-y-1">
							{#each priorRecords as record (record.id)}
								<li class="text-xs text-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
									<span class="font-semibold">{record.vaccineName}</span>
									<span class="font-mono text-muted-foreground">Dose {record.doseNumber}</span>
									<span class="font-mono text-muted-foreground"
										>· {formatDate(record.administeredAt)}</span
									>
									{#if record.batchNumber}
										<span class="font-mono text-muted-foreground">· Batch {record.batchNumber}</span
										>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</article>
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
