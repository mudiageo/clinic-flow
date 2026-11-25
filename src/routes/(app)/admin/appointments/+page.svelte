<script lang="ts">
	import { appointmentStore } from '#lib/state/appointments.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogTrigger
	} from '#lib/components/ui/dialog/index.ts';
	import { Calendar, Plus, Clock, User, ArrowRight, Activity } from '@lucide/svelte';

	let selectedDate = $state(new Date());

	const selectedDateAppointments = $derived(appointmentStore.forDate(selectedDate));

	const typeColors: Record<string, string> = {
		antenatal: 'bg-triage-red/10 text-triage-red border-triage-red/25',
		immunization: 'bg-primary/10 text-primary border-primary/25',
		'follow-up': 'bg-secondary text-secondary-foreground border-border',
		general: 'bg-triage-green/10 text-triage-green border-triage-green/25',
		'lab-follow-up': 'bg-triage-amber/15 text-foreground border-triage-amber/40'
	};

	function getPatient(id: string) {
		return patientStore.items.find((p) => p.id === id);
	}

	function handleAction(id: string, action: 'completed' | 'cancelled' | 'no-show') {
		const appt = appointmentStore.items.find((a) => a.id === id);
		if (appt) {
			appointmentStore.update(appt.id, {
				status: action
			});
		}
	}

	function changeDate(days: number) {
		const d = new Date(selectedDate);
		d.setDate(d.getDate() + days);
		selectedDate = d;
	}

	const calendarDays = $derived.by(() => {
		const d = new Date(selectedDate);
		d.setDate(1);
		const firstDay = d.getDay();
		const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

		const days = [];
		for (let i = 0; i < firstDay; i++) days.push(null);
		for (let i = 1; i <= daysInMonth; i++) days.push(new Date(d.getFullYear(), d.getMonth(), i));
		return days;
	});
</script>

<svelte:head>
	<title>Appointments — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto">
	<div
		class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Scheduling
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Appointments</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Manage clinic schedule and patient bookings
			</p>
		</div>
		<Button href="/admin/appointments/new" class="min-h-11 px-5 font-semibold w-full md:w-auto">
			<Plus class="size-4 mr-2" />
			New Appointment
		</Button>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Mini Calendar -->
		<section class="rounded-xl border border-border bg-card h-fit overflow-hidden">
			<div class="px-4 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
				<h2 class="text-base font-bold">
					{selectedDate.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
				</h2>
				<div class="flex gap-1">
					<Button variant="ghost" size="icon" onclick={() => changeDate(-30)} class="size-8">
						<ArrowRight class="size-4 rotate-180" />
					</Button>
					<Button variant="ghost" size="icon" onclick={() => changeDate(30)} class="size-8">
						<ArrowRight class="size-4" />
					</Button>
				</div>
			</div>
			<div class="p-4">
				<div
					class="grid grid-cols-7 gap-1 text-center text-[11px] font-mono text-muted-foreground mb-2"
				>
					<div>Su</div>
					<div>Mo</div>
					<div>Tu</div>
					<div>We</div>
					<div>Th</div>
					<div>Fr</div>
					<div>Sa</div>
				</div>
				<div class="grid grid-cols-7 gap-1">
					{#each calendarDays as day}
						{#if day}
							<button
								class="aspect-square flex items-center justify-center rounded-lg text-sm font-mono tabular-nums transition-colors
								{day.toDateString() === selectedDate.toDateString()
									? 'bg-primary text-primary-foreground font-bold'
									: 'hover:bg-muted font-medium'}
								{day.toDateString() === new Date().toDateString() &&
								day.toDateString() !== selectedDate.toDateString()
									? 'text-primary ring-1 ring-primary/30'
									: ''}"
								onclick={() => (selectedDate = day)}
							>
								{day.getDate()}
							</button>
						{:else}
							<div class="aspect-square"></div>
						{/if}
					{/each}
				</div>
			</div>
		</section>

		<!-- Agenda View -->
		<section class="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
			<div class="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
				<div>
					<h2 class="text-base font-bold">
						Agenda for {selectedDate.toLocaleDateString('en-NG', {
							weekday: 'short',
							month: 'short',
							day: 'numeric'
						})}
					</h2>
					<p class="text-xs font-mono text-muted-foreground">
						{selectedDateAppointments.length} appointment{selectedDateAppointments.length === 1
							? ''
							: 's'} scheduled
					</p>
				</div>
				<Button variant="outline" size="sm" onclick={() => (selectedDate = new Date())}>
					Today
				</Button>
			</div>

			{#if selectedDateAppointments.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
					<Calendar class="size-10 opacity-25 mb-2" />
					<p class="text-sm font-medium">No appointments for this date.</p>
				</div>
			{:else}
				<div class="divide-y divide-border">
					{#each selectedDateAppointments as appt}
						{@const patient = getPatient(appt.patientId)}
						<div
							class="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-muted/25 transition-colors"
						>
							<div class="min-w-24 text-sm font-mono font-bold flex flex-col gap-0.5">
								<div class="flex items-center gap-1.5">
									<Clock class="size-3.5 text-primary" />
									{new Date(appt.scheduledAt).toLocaleTimeString([], {
										hour: '2-digit',
										minute: '2-digit'
									})}
								</div>
								<span class="text-xs text-muted-foreground font-normal">
									{appt.durationMinutes} min
								</span>
							</div>

							<div class="flex-1 min-w-0">
								<div class="flex flex-wrap items-center gap-2 mb-1">
									<h3 class="font-semibold text-foreground">
										{patient?.name || 'Unknown Patient'}
									</h3>
									<Badge
										variant="outline"
										class="{typeColors[appt.type] ?? ''} capitalize text-[10px] h-5 px-1.5"
									>
										{appt.type.replace('-', ' ')}
									</Badge>
									{#if appt.status !== 'scheduled'}
										<Badge variant="secondary" class="capitalize text-[10px] h-5">
											{appt.status.replace('-', ' ')}
										</Badge>
									{/if}
								</div>
								<div
									class="text-xs text-muted-foreground flex flex-wrap items-center gap-3 font-mono"
								>
									<span class="flex items-center gap-1">
										<User class="size-3.5" />
										{patient?.clinicId ?? '—'}
									</span>
									{#if patient?.phone}
										<span class="flex items-center gap-1">
											<Activity class="size-3.5" />
											{patient.phone}
										</span>
									{/if}
								</div>
								{#if appt.notes}
									<p class="text-xs mt-2 text-foreground/80 border-l-2 border-primary/40 pl-2.5">
										"{appt.notes}"
									</p>
								{/if}
							</div>

							<div>
								<Dialog>
									<DialogTrigger
										class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground min-h-10 px-4"
									>
										Manage
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Manage Appointment</DialogTitle>
											<DialogDescription>Update the status of this appointment.</DialogDescription>
										</DialogHeader>
										<div class="py-4 space-y-4">
											<div class="flex flex-col gap-1.5 text-sm">
												<p><strong>Patient:</strong> {patient?.name}</p>
												<p><strong>Time:</strong> {new Date(appt.scheduledAt).toLocaleString()}</p>
												<p>
													<strong>Type:</strong>
													<span class="capitalize">{appt.type.replace('-', ' ')}</span>
												</p>
											</div>
											<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
												<DialogTrigger
													class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-triage-green/40 bg-background min-h-10 px-4 text-triage-green hover:bg-triage-green/10"
													onclick={() => handleAction(appt.id, 'completed')}
												>
													Mark Completed
												</DialogTrigger>
												<DialogTrigger
													class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-triage-amber/50 bg-background min-h-10 px-4 text-amber-700 dark:text-triage-amber hover:bg-triage-amber/10"
													onclick={() => handleAction(appt.id, 'no-show')}
												>
													No-Show
												</DialogTrigger>
												<DialogTrigger
													class="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-destructive/30 bg-background min-h-10 px-4 text-destructive hover:bg-destructive/10"
													onclick={() => handleAction(appt.id, 'cancelled')}
												>
													Cancel
												</DialogTrigger>
											</div>
										</div>
									</DialogContent>
								</Dialog>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>
