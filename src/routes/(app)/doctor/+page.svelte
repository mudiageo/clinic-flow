<script lang="ts">
	import { queueStore } from '#lib/state/queue.svelte.ts';
	import QueueTicketCard from '#lib/components/queue-ticket-card.svelte';
	import { AlertCircle, AlertTriangle, CheckCircle2, Clock, UserCheck } from '@lucide/svelte';

	const activeQueue = $derived(
		queueStore.sortedQueue.filter(
			(t) => t.status === 'called' || t.status === 'waiting' || t.status === 'in_progress'
		)
	);

	const stats = $derived({
		total: activeQueue.length,
		red: activeQueue.filter((t) => t.triageLevel === 'red').length,
		amber: activeQueue.filter((t) => t.triageLevel === 'amber').length,
		green: activeQueue.filter((t) => t.triageLevel === 'green').length
	});
</script>

<svelte:head>
	<title>Doctor Desk — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<!-- Page Header -->
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Clinical Consultation
		</p>
		<h1 class="text-2xl font-bold text-foreground tracking-tight">Doctor Desk</h1>
	</div>

	<!-- Compact Ruled Triage Ledger Strip -->
	<div
		class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border rounded-xl border border-border bg-card"
	>
		<div class="px-4 py-3 flex items-center justify-between gap-3">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">To See</p>
				<p class="text-2xl font-bold font-mono tabular-nums text-foreground mt-0.5">
					{stats.total}
				</p>
			</div>
			<Clock class="size-4 text-muted-foreground shrink-0" />
		</div>

		<div class="px-4 py-3 flex items-center justify-between gap-3">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-triage-red">Red · Critical</p>
				<p class="text-2xl font-bold font-mono tabular-nums text-triage-red mt-0.5">
					{stats.red}
				</p>
			</div>
			<AlertCircle class="size-4 text-triage-red shrink-0" />
		</div>

		<div class="px-4 py-3 flex items-center justify-between gap-3">
			<div>
				<p
					class="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-triage-amber"
				>
					Amber · Priority
				</p>
				<p
					class="text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-triage-amber mt-0.5"
				>
					{stats.amber}
				</p>
			</div>
			<AlertTriangle class="size-4 text-triage-amber shrink-0" />
		</div>

		<div class="px-4 py-3 flex items-center justify-between gap-3">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-triage-green">
					Green · Stable
				</p>
				<p class="text-2xl font-bold font-mono tabular-nums text-triage-green mt-0.5">
					{stats.green}
				</p>
			</div>
			<CheckCircle2 class="size-4 text-triage-green shrink-0" />
		</div>
	</div>

	<!-- Consultation Queue -->
	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-semibold text-foreground">Patients to See</h2>
			<span class="text-xs font-mono text-muted-foreground tabular-nums">
				{activeQueue.length} active
			</span>
		</div>

		{#if activeQueue.length === 0}
			<div
				class="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-border rounded-xl bg-card/50"
			>
				<UserCheck class="size-9 text-muted-foreground/40 mb-2" />
				<p class="text-base font-medium text-foreground">No patients waiting</p>
				<p class="text-xs mt-0.5">Triaged patients will appear here automatically.</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each activeQueue as ticket (ticket.id)}
					<QueueTicketCard {ticket} role="doctor" />
				{/each}
			</div>
		{/if}
	</section>
</div>
