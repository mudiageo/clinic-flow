<script lang="ts">
	import { queueStore } from '$lib/state/queue.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import QueueTicketCard from '$lib/components/queue-ticket-card.svelte';
	import {
		Stethoscope,
		AlertCircle,
		AlertTriangle,
		CheckCircle2,
		Clock,
		UserCheck
	} from '@lucide/svelte';

	// Get reactive queue items. Filter for 'called' or 'waiting' or 'in_progress' to show on doctor's queue.
	// We sort it by urgency, then by time.
	const activeQueue = $derived(
		queueStore.sortedQueue.filter(
			(t: any) => t.status === 'called' || t.status === 'waiting' || t.status === 'in_progress'
		)
	);

	const stats = $derived({
		total: activeQueue.length,
		red: activeQueue.filter((t: any) => t.triageLevel === 'red').length,
		amber: activeQueue.filter((t: any) => t.triageLevel === 'amber').length,
		green: activeQueue.filter((t: any) => t.triageLevel === 'green').length
	});
</script>

<svelte:head>
	<title>Doctor Desk — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<!-- Top Bar -->
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<Stethoscope class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Doctor Desk</h1>
				<p class="text-muted-foreground text-sm mt-0.5">Active Consultation Queue</p>
			</div>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
		<Card class="card-hover cursor-default bg-card/60">
			<CardContent class="p-5 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Waiting
					</p>
					<p class="text-2xl font-bold text-foreground mt-1 tabular-nums">{stats.total}</p>
				</div>
				<div
					class="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"
				>
					<Clock class="size-4" />
				</div>
			</CardContent>
		</Card>

		<Card class="card-hover cursor-default bg-card/60 border-triage-red/20">
			<CardContent class="p-5 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-triage-red uppercase tracking-wider">Red Alert</p>
					<p class="text-2xl font-bold text-triage-red mt-1 tabular-nums">{stats.red}</p>
				</div>
				<div
					class="size-10 rounded-lg bg-triage-red/10 flex items-center justify-center text-triage-red ring-1 ring-triage-red/20"
				>
					<AlertCircle class="size-4" />
				</div>
			</CardContent>
		</Card>

		<Card class="card-hover cursor-default bg-card/60 border-triage-amber/20">
			<CardContent class="p-5 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-triage-amber uppercase tracking-wider">
						Amber Warning
					</p>
					<p class="text-2xl font-bold text-triage-amber mt-1 tabular-nums">{stats.amber}</p>
				</div>
				<div
					class="size-10 rounded-lg bg-triage-amber/10 flex items-center justify-center text-triage-amber ring-1 ring-triage-amber/20"
				>
					<AlertTriangle class="size-4" />
				</div>
			</CardContent>
		</Card>

		<Card class="card-hover cursor-default bg-card/60 border-triage-green/20">
			<CardContent class="p-5 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-triage-green uppercase tracking-wider">
						Green Stable
					</p>
					<p class="text-2xl font-bold text-triage-green mt-1 tabular-nums">{stats.green}</p>
				</div>
				<div
					class="size-10 rounded-lg bg-triage-green/10 flex items-center justify-center text-triage-green ring-1 ring-triage-green/20"
				>
					<CheckCircle2 class="size-4" />
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Queue List -->
	<Card class="overflow-hidden card-hover border-0 shadow-none bg-transparent">
		<CardHeader class="px-0 pt-0 pb-4">
			<CardTitle class="text-base font-semibold text-foreground">Patients to See</CardTitle>
			<CardDescription>Select a patient to begin consultation</CardDescription>
		</CardHeader>
		<div class="space-y-4 animate-stagger">
			{#if activeQueue.length === 0}
				<div
					class="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-xl bg-card border-dashed"
				>
					<UserCheck class="size-10 text-muted-foreground/40 mb-3" />
					<span class="text-lg font-medium text-foreground">No patients waiting</span>
					<p class="text-sm">Enjoy the calm!</p>
				</div>
			{:else}
				{#each activeQueue as ticket (ticket.id)}
					<QueueTicketCard {ticket} role="doctor" />
				{/each}
			{/if}
		</div>
	</Card>
</div>
