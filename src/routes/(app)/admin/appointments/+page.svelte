<script lang="ts">
	import { appointmentStore } from '$lib/state/appointments.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { Calendar, Plus, Clock, User, CalendarDays, ArrowRight, Activity, MapPin } from '@lucide/svelte';

	let selectedDate = $state(new Date());
	
	const selectedDateAppointments = $derived(appointmentStore.forDate(selectedDate));
	
	const typeColors: Record<string, string> = {
		'antenatal': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
		'immunization': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
		'follow-up': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
		'general': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
		'lab-follow-up': 'bg-purple-500/10 text-purple-600 border-purple-500/20'
	};

	function getPatient(id: string) {
		return patientStore.items.find(p => p.id === id);
	}

	function handleAction(id: string, action: 'completed' | 'cancelled' | 'no-show') {
		const appt = appointmentStore.items.find(a => a.id === id);
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
	
	// A simple calendar grid generator
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

<div class="space-y-8 animate-fade-in max-w-7xl mx-auto">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<CalendarDays class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Appointments</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Manage clinic schedule and patient bookings
				</p>
			</div>
		</div>
		<Button href="/admin/appointments/new" class="bg-primary text-primary-foreground">
			<Plus class="size-4 mr-2" />
			New Appointment
		</Button>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Mini Calendar -->
		<Card class="h-fit">
			<CardHeader class="pb-4 border-b">
				<div class="flex items-center justify-between">
					<CardTitle class="text-lg font-bold">
						{selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
					</CardTitle>
					<div class="flex gap-1">
						<Button variant="ghost" size="icon" onclick={() => changeDate(-30)} class="size-8"><ArrowRight class="size-4 rotate-180" /></Button>
						<Button variant="ghost" size="icon" onclick={() => changeDate(30)} class="size-8"><ArrowRight class="size-4" /></Button>
					</div>
				</div>
			</CardHeader>
			<CardContent class="p-4">
				<div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
					<div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
				</div>
				<div class="grid grid-cols-7 gap-1">
					{#each calendarDays as day}
						{#if day}
							<button 
								class="aspect-square flex items-center justify-center rounded-md text-sm transition-colors
								{day.toDateString() === selectedDate.toDateString() ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted font-medium'}
								{day.toDateString() === new Date().toDateString() && day.toDateString() !== selectedDate.toDateString() ? 'text-primary' : ''}"
								onclick={() => selectedDate = day}
							>
								{day.getDate()}
							</button>
						{:else}
							<div class="aspect-square"></div>
						{/if}
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Agenda View -->
		<Card class="lg:col-span-2">
			<CardHeader class="border-b bg-muted/20">
				<div class="flex items-center justify-between">
					<div>
						<CardTitle class="text-lg font-bold">
							Agenda for {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
						</CardTitle>
						<CardDescription>{selectedDateAppointments.length} appointments scheduled</CardDescription>
					</div>
					<Button variant="outline" size="sm" onclick={() => selectedDate = new Date()}>Today</Button>
				</div>
			</CardHeader>
			<CardContent class="p-0">
				{#if selectedDateAppointments.length === 0}
					<div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
						<Calendar class="size-12 opacity-20 mb-3" />
						<p class="font-medium">No appointments for this date.</p>
					</div>
				{:else}
					<div class="divide-y divide-border">
						{#each selectedDateAppointments as appt}
							{@const patient = getPatient(appt.patientId)}
							<div class="p-5 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-muted/30 transition-colors">
								<div class="min-w-24 text-sm font-bold flex flex-col gap-1">
									<div class="flex items-center gap-1.5">
										<Clock class="size-4 text-primary" />
										{new Date(appt.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
									</div>
									<span class="text-xs text-muted-foreground font-medium">{appt.durationMinutes} min</span>
								</div>
								
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<h4 class="font-bold text-foreground">{patient?.name || 'Unknown Patient'}</h4>
										<Badge variant="outline" class="{typeColors[appt.type]} capitalize text-[10px] h-5 px-1.5">{appt.type.replace('-', ' ')}</Badge>
										{#if appt.status !== 'scheduled'}
											<Badge variant="secondary" class="capitalize text-[10px] h-5">{appt.status.replace('-', ' ')}</Badge>
										{/if}
									</div>
									<div class="text-sm text-muted-foreground flex items-center gap-3">
										<span class="flex items-center gap-1"><User class="size-3.5" /> ID: {patient?.clinicId}</span>
										{#if patient?.phone}<span class="flex items-center gap-1"><Activity class="size-3.5" /> {patient.phone}</span>{/if}
									</div>
									{#if appt.notes}
										<p class="text-sm mt-2 text-foreground/80 border-l-2 border-primary/30 pl-2 italic">"{appt.notes}"</p>
									{/if}
								</div>
								
								<div>
									<Dialog>
										<DialogTrigger class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
											Manage
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Manage Appointment</DialogTitle>
												<DialogDescription>Update the status of this appointment.</DialogDescription>
											</DialogHeader>
											<div class="py-4 space-y-4">
												<div class="flex flex-col gap-2">
													<p class="text-sm"><strong>Patient:</strong> {patient?.name}</p>
													<p class="text-sm"><strong>Time:</strong> {new Date(appt.scheduledAt).toLocaleString()}</p>
													<p class="text-sm"><strong>Type:</strong> <span class="capitalize">{appt.type.replace('-', ' ')}</span></p>
												</div>
												<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
													<DialogTrigger class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:text-accent-foreground h-9 px-4 py-2 text-green-600 border-green-200 hover:bg-green-50" onclick={() => handleAction(appt.id, 'completed')}>
														Mark Completed
													</DialogTrigger>
													<DialogTrigger class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:text-accent-foreground h-9 px-4 py-2 text-orange-600 border-orange-200 hover:bg-orange-50" onclick={() => handleAction(appt.id, 'no-show')}>
														No-Show
													</DialogTrigger>
													<DialogTrigger class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:text-accent-foreground h-9 px-4 py-2 text-destructive border-destructive/30 hover:bg-destructive/10" onclick={() => handleAction(appt.id, 'cancelled')}>
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
			</CardContent>
		</Card>
	</div>
</div>
