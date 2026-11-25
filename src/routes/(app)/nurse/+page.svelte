<script lang="ts">
	import { page } from '$app/state';
	import { queueStore } from '#lib/state/queue.svelte.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import QueueTicketCard from '#lib/components/queue-ticket-card.svelte';
	import { Walkthrough } from '#lib/components/ui/walkthrough/index.ts';
	import {
		AlertCircle,
		AlertTriangle,
		CheckCircle2,
		Megaphone,
		Clock,
		UserCheck
	} from '@lucide/svelte';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '#lib/components/ui/tabs/index.ts';
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';

	type QueueTab = 'general' | 'anc' | 'epi';
	const queueTabs: QueueTab[] = ['general', 'anc', 'epi'];
	const activeTab = $derived.by<QueueTab>(() => {
		const requestedTab = page.url.searchParams.get('tab');
		return queueTabs.includes(requestedTab as QueueTab) ? (requestedTab as QueueTab) : 'general';
	});

	const sortedQueue = $derived(queueStore.sortedQueue);
	const nextTicket = $derived(queueStore.nextTicket);

	const stats = $derived({
		total: sortedQueue.length,
		red: sortedQueue.filter((ticket) => ticket.triageLevel === 'red').length,
		amber: sortedQueue.filter((ticket) => ticket.triageLevel === 'amber').length,
		green: sortedQueue.filter((ticket) => ticket.triageLevel === 'green').length
	});

	async function handleCallNext() {
		await queueStore.callNext();
	}
</script>

<svelte:head>
	<title>Nurse Board — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<!-- Page Header -->
	<div
		class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Triage & Intake
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Nurse Station</h1>
		</div>

		<Button
			id="call-next-btn"
			onclick={handleCallNext}
			disabled={!nextTicket}
			class="min-h-11 px-5 font-semibold gap-2 w-full sm:w-auto"
		>
			<Megaphone class="size-4" />
			<span>Call Next Patient</span>
		</Button>
	</div>

	<!-- Compact Ruled Triage Ledger Strip -->
	<div
		id="stats-grid"
		class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border rounded-xl border border-border bg-card"
	>
		<div class="px-4 py-3 flex items-center justify-between gap-3">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Waiting</p>
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
					Green · Routine
				</p>
				<p class="text-2xl font-bold font-mono tabular-nums text-triage-green mt-0.5">
					{stats.green}
				</p>
			</div>
			<CheckCircle2 class="size-4 text-triage-green shrink-0" />
		</div>
	</div>

	<!-- Active Queue Board -->
	<section id="queue-list" class="space-y-4">
		<Tabs value={activeTab} class="w-full">
			<TabsList
				class="w-full justify-start overflow-x-auto bg-transparent h-auto p-0 gap-1 border-b border-border rounded-none"
			>
				<TabsTrigger
					value="general"
					class="rounded-t-lg rounded-b-none min-h-11 px-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none"
				>
					General Outpatient
					<span class="ml-2 font-mono text-xs tabular-nums text-muted-foreground">
						({queueStore.generalQueue.length})
					</span>
				</TabsTrigger>
				<TabsTrigger
					value="anc"
					class="rounded-t-lg rounded-b-none min-h-11 px-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none"
				>
					Antenatal Care (ANC)
					<span class="ml-2 font-mono text-xs tabular-nums text-muted-foreground">
						({queueStore.ancQueue.length})
					</span>
				</TabsTrigger>
				<TabsTrigger
					value="epi"
					class="rounded-t-lg rounded-b-none min-h-11 px-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none"
				>
					Immunization (EPI)
					<span class="ml-2 font-mono text-xs tabular-nums text-muted-foreground">
						({queueStore.epiQueue.length})
					</span>
				</TabsTrigger>
			</TabsList>

			{#each queueTabs as dept (dept)}
				<TabsContent value={dept} class="pt-4">
					{@const queueItems =
						dept === 'general'
							? queueStore.generalQueue
							: dept === 'anc'
								? queueStore.ancQueue
								: queueStore.epiQueue}
					<div class="space-y-3">
						{#if queueItems.length === 0}
							<div
								class="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-border rounded-xl bg-card/50"
							>
								<UserCheck class="size-9 text-muted-foreground/40 mb-2" />
								<p class="text-base font-medium text-foreground">No patients in this queue</p>
								<p class="text-xs mt-0.5">Queue updates automatically when patients check in.</p>
							</div>
						{:else}
							{#each queueItems as ticket (ticket.id)}
								<div animate:flip={{ duration: 220 }} transition:slide|local>
									<QueueTicketCard {ticket} />
								</div>
							{/each}
						{/if}
					</div>
				</TabsContent>
			{/each}
		</Tabs>
	</section>
</div>

<Walkthrough
	open={true}
	padding={8}
	steps={[
		{
			target: 'call-next-btn',
			title: 'Call Next Patient',
			description:
				'Click here to automatically call the highest priority patient from the queue to your station.',
			position: 'bottom'
		},
		{
			target: 'stats-grid',
			title: 'Triage Overview',
			description:
				'Monitor the live queue categorized by urgency. Red Alert patients need immediate attention.',
			position: 'bottom'
		},
		{
			target: 'queue-list',
			title: 'Active Queue',
			description:
				'This is the real-time queue. Click on any patient ticket stub to manually manage their status.',
			position: 'top'
		}
	]}
/>
