<script lang="ts">
	import { queueStore } from '$lib/state/queue.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import QueueTicketCard from '$lib/components/queue-ticket-card.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { ShinyButton } from '$lib/components/ui/shiny-button';
	import {
		Users,
		AlertCircle,
		AlertTriangle,
		CheckCircle2,
		Megaphone,
		ClipboardList,
		Clock,
		UserCheck,
		Check
	} from '@lucide/svelte';

	// Get reactive queue items
	const sortedQueue = $derived(queueStore.sortedQueue);
	const nextTicket = $derived(queueStore.nextTicket);

	const stats = $derived({
		total: sortedQueue.length,
		red: sortedQueue.filter((t: any) => t.triageLevel === 'red').length,
		amber: sortedQueue.filter((t: any) => t.triageLevel === 'amber').length,
		green: sortedQueue.filter((t: any) => t.triageLevel === 'green').length
	});

	async function handleCallNext() {
		await queueStore.callNext();
	}

	async function handleMarkCalled(id: string) {
		await queueStore.update(id, { status: 'called', calledAt: Date.now() });
	}

	async function handleComplete(id: string) {
		await queueStore.update(id, { status: 'done' });
	}
</script>

<svelte:head>
	<title>Nurse Board — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<!-- Top Bar -->
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<ClipboardList class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Nurse Station</h1>
				<p class="text-muted-foreground text-sm mt-0.5">Live triage queue board</p>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<ShinyButton
				onclick={handleCallNext}
				disabled={!nextTicket}
				class="bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 h-11 px-5 btn-press"
			>
				<Megaphone class="size-4 mr-2" />
				Call Next Patient
			</ShinyButton>
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
			<CardTitle class="text-base font-semibold text-foreground">Active Queue</CardTitle>
			<CardDescription>Real-time patient flow and triaging</CardDescription>
		</CardHeader>
		<div class="space-y-4 animate-stagger">
			{#if sortedQueue.length === 0}
				<div
					class="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-xl bg-card border-dashed"
				>
					<UserCheck class="size-10 text-muted-foreground/40 mb-3" />
					<span class="text-lg font-medium text-foreground">No patients in the queue</span>
					<p class="text-sm">Enjoy the calm!</p>
				</div>
			{:else}
				{#each sortedQueue as ticket (ticket.id)}
					<QueueTicketCard {ticket} />
				{/each}
			{/if}
		</div>
	</Card>
</div>
