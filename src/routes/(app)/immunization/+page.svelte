<script lang="ts">
	import { Card, CardContent } from '#lib/components/ui/card/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Syringe, Search, Baby, CheckCircle2, CalendarDays } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { SvelteDate } from 'svelte/reactivity';
	import { appointmentStore } from '#lib/state/appointments.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { formatDate, formatDateTime } from '#lib/utils/date.ts';

	let search = $state('');
	let completingId = $state<string | null>(null);

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

	async function markComplete(appointmentId: string) {
		completingId = appointmentId;
		try {
			await appointmentStore.update(appointmentId, { status: 'completed' });
			toast.success('Immunization appointment marked complete');
		} catch {
			toast.error('Unable to mark this appointment complete.');
		} finally {
			completingId = null;
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
			<Card
				class="card-hover border-l-4 {row.due === 'today'
					? 'border-l-amber-500'
					: row.due === 'overdue'
						? 'border-l-red-500'
						: 'border-l-sky-500'}"
			>
				<CardContent
					class="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
				>
					<div class="flex items-start sm:items-center gap-4">
						<div class="p-3 rounded-full bg-muted/30 text-muted-foreground shrink-0">
							<Baby class="size-6" />
						</div>
						<div>
							<h3 class="text-lg font-bold">{row.patient.name}</h3>
							<p class="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
								<span class="font-medium text-foreground">{age === '—' ? '—' : `${age} yrs`}</span>
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

					<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
						<Badge
							variant="secondary"
							class="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200"
						>
							{dueLabel(row.due)}
						</Badge>
						<Button
							size="sm"
							class="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
							disabled={completingId === row.appointment.id}
							onclick={() => markComplete(row.appointment.id)}
						>
							<CheckCircle2 class="size-4 mr-2" />
							Mark Complete
						</Button>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>
</div>
