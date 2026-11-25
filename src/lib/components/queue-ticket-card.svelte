<script lang="ts">
	import type { LocalQueueTicket } from '#lib/local-db/db.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { queueStore } from '#lib/state/queue.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { formatDistanceToNow } from '#lib/utils/date.ts';
	import { cn } from '#lib/utils.ts';
	import {
		Clock,
		CheckCircle2,
		UserX,
		AlertTriangle,
		Activity,
		Check,
		MoreHorizontal,
		Megaphone,
		ArrowRight,
		Zap
	} from '@lucide/svelte';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.ts';

	type Props = {
		ticket: LocalQueueTicket;
		role?: 'nurse' | 'doctor';
	};
	let { ticket, role = 'nurse' }: Props = $props();

	let isCalling = $state(false);

	const patient = $derived(patientStore.items.find((p) => p.id === ticket.patientId));
	const displayName = $derived(
		patient?.name ?? `Patient ${ticket.patientId.substring(0, 8).toUpperCase()}`
	);

	const triageMeta = {
		red: {
			label: 'RED · Critical',
			border: 'border-l-triage-red',
			badge: 'bg-triage-red/10 text-triage-red border-triage-red/30',
			dot: 'bg-triage-red',
			icon: AlertTriangle
		},
		amber: {
			label: 'AMBER · Priority',
			border: 'border-l-triage-amber',
			badge: 'bg-triage-amber/15 text-foreground border-triage-amber/40',
			dot: 'bg-triage-amber',
			icon: Activity
		},
		green: {
			label: 'GREEN · Routine',
			border: 'border-l-triage-green',
			badge: 'bg-triage-green/10 text-triage-green border-triage-green/30',
			dot: 'bg-triage-green',
			icon: CheckCircle2
		},
		unassigned: {
			label: 'UNTRIAGED',
			border: 'border-l-border',
			badge: 'bg-muted text-muted-foreground border-border',
			dot: 'bg-muted-foreground',
			icon: Clock
		}
	} as const;

	const meta = $derived(triageMeta[ticket.triageLevel]);
	const TriageIcon = $derived(meta.icon);
	const waitTime = $derived(formatDistanceToNow(ticket.createdAt));
	const waitMinutes = $derived(Math.floor((Date.now() - ticket.createdAt) / 60_000));
	const isLongWait = $derived(waitMinutes >= 30);
	const isModerateWait = $derived(waitMinutes >= 10 && waitMinutes < 30);
</script>

<!-- Signature Component: Torn-Edge Queue Ticket Stub -->
<article
	class={cn(
		'rounded-xl border border-border border-l-4 bg-card transition-colors duration-100',
		meta.border,
		ticket.status === 'called' && 'ring-2 ring-primary/30 border-primary/50'
	)}
>
	<!-- Top Stub: Identity, Triage Tab & Wait Time -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
		<div class="flex items-start sm:items-center gap-3.5 min-w-0">
			<!-- Numbered Dispenser Block -->
			<div
				class="flex flex-col items-center justify-center min-w-14 h-14 px-2 shrink-0 rounded-lg bg-secondary/70 border border-border text-foreground"
			>
				<span
					class="text-[9px] font-mono font-semibold uppercase tracking-widest text-muted-foreground"
				>
					NO.
				</span>
				<span class="text-lg font-mono font-bold tabular-nums leading-tight">
					#{ticket.ticketNumber.toString().padStart(3, '0')}
				</span>
			</div>

			<!-- Patient & Triage Info -->
			<div class="min-w-0 flex-1 space-y-1.5">
				<div class="flex flex-wrap items-center gap-2">
					<h3 class="font-semibold text-base text-foreground truncate">
						{displayName}
					</h3>
					{#if patient?.clinicId}
						<span class="text-xs font-mono tabular-nums text-muted-foreground">
							{patient.clinicId}
						</span>
					{/if}
					<!-- Triage indicator: dot + icon + label (never colour alone) -->
					<Badge variant="outline" class={cn('text-[11px] font-semibold gap-1.5', meta.badge)}>
						<span class={cn('size-1.5 rounded-full shrink-0', meta.dot)}></span>
						<TriageIcon class="size-3 shrink-0" />
						<span>{meta.label}</span>
					</Badge>

					{#if ticket.aiRiskScore !== undefined && ticket.aiRiskScore !== null}
						<div class="relative group">
							<Badge
								variant="secondary"
								class="text-[11px] font-mono tabular-nums cursor-help gap-1 border border-primary/20 bg-primary/8 text-primary"
							>
								<Zap class="size-3" />
								AI Risk {ticket.aiRiskScore}/100
							</Badge>
							<div
								class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none"
							>
								<span class="font-semibold block mb-1 text-primary">AI Triage Advisory:</span>
								<p class="leading-relaxed m-0 text-muted-foreground">
									{ticket.aiRiskRationale || 'No rationale provided.'}
								</p>
							</div>
						</div>
					{/if}
				</div>

				<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
					<span
						class={cn(
							'inline-flex items-center gap-1 font-medium tabular-nums',
							isLongWait
								? 'text-triage-red font-semibold'
								: isModerateWait
									? 'text-amber-700 dark:text-triage-amber font-semibold'
									: 'text-muted-foreground'
						)}
					>
						<Clock class="size-3.5 shrink-0" />
						Waiting {waitTime}
						{#if isLongWait}
							<span>(Long wait)</span>
						{/if}
					</span>

					{#if ticket.status === 'called'}
						<span class="inline-flex items-center gap-1.5 text-primary font-semibold">
							<span class="size-1.5 rounded-full bg-primary animate-pulse"></span>
							Currently Called
						</span>
					{:else if ticket.status === 'in_progress'}
						<span class="inline-flex items-center gap-1.5 text-primary font-semibold">
							In Progress
						</span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Perforated Torn-Edge Divider + Action Strip -->
	<div
		class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-dashed border-border bg-muted/25 rounded-b-xl"
	>
		<span class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
			{ticket.department ?? 'General'} · {ticket.status.replace('_', ' ')}
		</span>

		<div class="flex items-center gap-2 ml-auto">
			{#if role === 'doctor'}
				<Button
					variant="default"
					href={`/doctor/consult/${ticket.id}`}
					class="min-h-10 px-4 text-sm font-semibold gap-1.5"
				>
					<span>Start Consultation</span>
					<ArrowRight class="size-4" />
				</Button>
			{:else if ticket.status === 'waiting'}
				<Button
					variant="default"
					onclick={async () => {
						isCalling = true;
						try {
							await queueStore.update(ticket.id, { status: 'called', calledAt: Date.now() });
						} finally {
							isCalling = false;
						}
					}}
					disabled={isCalling}
					class="min-h-10 px-4 text-sm font-semibold gap-1.5"
				>
					<Megaphone class="size-4" />
					<span>{isCalling ? 'Calling…' : 'Call Patient'}</span>
				</Button>
			{:else if ticket.status === 'called' || ticket.status === 'in_progress'}
				<Button
					variant="outline"
					class="min-h-10 px-4 text-sm font-semibold border-triage-green/40 text-triage-green hover:bg-triage-green/10"
					onclick={() => queueStore.markDone(ticket.id)}
				>
					<Check class="size-4 mr-1.5" />
					Done
				</Button>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button
								variant="ghost"
								size="icon"
								{...props}
								class="min-h-10 min-w-10 text-muted-foreground"
							>
								<span class="sr-only">More options</span>
								<MoreHorizontal class="size-4" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item
							class="text-destructive focus:bg-destructive/10 focus:text-destructive"
							onclick={() => queueStore.markNoShow(ticket.id)}
						>
							<UserX class="size-4 mr-2" />
							Mark No-Show
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
		</div>
	</div>
</article>
