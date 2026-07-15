<script lang="ts">
	import type { LocalQueueTicket } from '$lib/local-db/db';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { queueStore } from '$lib/state/queue.svelte';
	import { formatDistanceToNow } from '$lib/utils/date';
	import { Clock, CheckCircle2, UserX, AlertTriangle, Activity, Check } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	type Props = {
		ticket: LocalQueueTicket;
	};
	let { ticket }: Props = $props();

	let isCalling = $state(false);

	const triageColors = {
		red: 'bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20',
		amber: 'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20',
		green: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20',
		unassigned: 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
	};

	const triageIcons = {
		red: AlertTriangle,
		amber: Activity,
		green: CheckCircle2,
		unassigned: Clock
	};

	const TriageIcon = $derived(triageIcons[ticket.triageLevel]);
	const waitTime = $derived(formatDistanceToNow(ticket.createdAt));

	// We don't have patient name directly in ticket (unless denormalized),
	// for now we'll just display patientId. We can join it in the UI if needed.
</script>

<div
	class="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 rounded-xl border bg-card shadow-sm transition-all hover:shadow-md {ticket.status ===
	'called'
		? 'ring-2 ring-primary/20 border-primary/50'
		: ''}"
>
	<div class="flex gap-4 items-center w-full sm:w-auto">
		<!-- Ticket Number -->
		<div
			class="flex flex-col items-center justify-center size-14 shrink-0 rounded-lg bg-primary/5 text-primary border border-primary/10"
		>
			<span class="text-xs font-medium opacity-60">NO.</span>
			<span class="text-lg font-bold">#{ticket.ticketNumber.toString().padStart(3, '0')}</span>
		</div>

		<!-- Details -->
		<div class="flex-1 space-y-1">
			<div class="flex items-center gap-2">
				<h3 class="font-semibold text-lg line-clamp-1">
					Patient ID: {ticket.patientId.substring(0, 8)}
				</h3>
				<Badge variant="outline" class={triageColors[ticket.triageLevel]}>
					<TriageIcon class="size-3 mr-1" />
					<span class="capitalize">{ticket.triageLevel}</span>
				</Badge>
			</div>

			<div class="flex items-center gap-3 text-sm text-muted-foreground">
				<span class="flex items-center gap-1">
					<Clock class="size-3" />
					Waiting {waitTime}
				</span>

				{#if ticket.status === 'called'}
					<span class="flex items-center gap-1 text-primary font-medium animate-pulse">
						— Currently Called
					</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
		{#if ticket.status === 'waiting'}
			<Button
				variant="default"
				onclick={async () => {
					isCalling = true;
					await queueStore.update(ticket.id, { status: 'called', calledAt: Date.now() });
					isCalling = false;
				}}
				disabled={isCalling}
				class="w-full sm:w-auto shadow-sm"
			>
				Call Next
			</Button>
		{:else if ticket.status === 'called' || ticket.status === 'in_progress'}
			<Button
				variant="outline"
				class="w-full sm:w-auto border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
				onclick={() => queueStore.markDone(ticket.id)}
			>
				<Check class="size-4 mr-2" />
				Done
			</Button>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button variant="ghost" size="icon" {...props} class="text-muted-foreground">
							<span class="sr-only">More options</span>
							<Clock class="size-4" />
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
