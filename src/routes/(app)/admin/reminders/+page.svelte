<script lang="ts">
	import { reminderStore } from '#lib/state/reminders.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { syncStore } from '#lib/state/sync.svelte.ts';
	import { formatDate } from '#lib/utils/date.ts';
	import { dispatchReminders } from '../../../sms/sms.remote';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.ts';
	import { toast } from 'svelte-sonner';
	import { Send, User, Clock, Loader2 } from '@lucide/svelte';

	const reminders = $derived(reminderStore.sortedItems);
	let isDispatching = $state(false);

	async function handleDispatchPending() {
		const pendingRows = reminderStore.pendingReminders;
		if (pendingRows.length === 0) {
			toast.info('No pending reminders to dispatch.');
			return;
		}

		isDispatching = true;
		try {
			toast.info(`Dispatching ${pendingRows.length} reminders via SMS...`);
			const results = await dispatchReminders(pendingRows.map((r) => ({ id: r.id })));

			let liveSent = 0;
			let consoleSent = 0;
			let failed = 0;
			for (const result of results) {
				if (!result.success) failed++;
				else if (result.mode === 'live') liveSent++;
				else consoleSent++;
			}

			await syncStore.flush();
			const remaining = reminderStore.pendingReminders.length;

			const report = `${liveSent} sent live, ${consoleSent} console-mode (manual delivery required), ${failed} failed. ${remaining} still pending.`;
			if (failed > 0 || consoleSent > 0) toast.warning(`Reminders dispatched: ${report}`);
			else toast.success(`Reminders dispatched: ${report}`);
		} catch (err) {
			toast.error(`SMS dispatch failed: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			isDispatching = false;
		}
	}
</script>

<svelte:head>
	<title>SMS Reminders — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<div
		class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Patient Outreach
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">SMS Reminders</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Manage automated SMS notifications to patients
			</p>
		</div>
		<Button
			onclick={handleDispatchPending}
			disabled={isDispatching}
			class="min-h-11 px-5 font-semibold w-full sm:w-auto"
		>
			{#if isDispatching}
				<Loader2 class="size-4 animate-spin mr-2" />
				Sending…
			{:else}
				<Send class="size-4 mr-2" />
				Dispatch Pending SMS Now
			{/if}
		</Button>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center justify-between">
			<div>
				<h2 class="text-base font-semibold">Reminder Log</h2>
				<p class="text-xs text-muted-foreground">Scheduled, pending, and sent patient messages</p>
			</div>
			<span class="text-xs font-mono tabular-nums text-muted-foreground">
				{reminders.length} total
			</span>
		</div>
		<ScrollArea class="h-[520px] w-full">
			<Table>
				<TableHeader class="bg-muted/40 sticky top-0 z-10">
					<TableRow class="hover:bg-transparent">
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 py-3"
							>Patient</TableHead
						>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 py-3">Type</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 py-3"
							>Message</TableHead
						>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 py-3"
							>Due Date</TableHead
						>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 py-3"
							>Status</TableHead
						>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if reminders.length === 0}
						<TableRow>
							<TableCell colspan={5} class="text-center text-muted-foreground py-16">
								<div class="flex flex-col items-center justify-center">
									<Clock class="size-8 opacity-40 mb-2" />
									<span class="text-sm font-medium">No reminders scheduled</span>
								</div>
							</TableCell>
						</TableRow>
					{:else}
						{#each reminders as r, idx (r.id)}
							{@const p = patientStore.get(r.patientId)}
							<TableRow
								class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}
							>
								<TableCell class="px-5 py-3.5">
									<div class="flex items-center gap-2">
										<User class="size-3.5 text-primary shrink-0" />
										<span class="font-semibold text-foreground text-sm">{p?.name || 'Unknown'}</span
										>
									</div>
									<div class="text-muted-foreground text-xs font-mono mt-0.5">
										{r.recipientPhone}
									</div>
								</TableCell>
								<TableCell class="px-5 py-3.5">
									<Badge variant="outline" class="capitalize font-mono text-[10px]">
										{r.type.replace('_', ' ')}
									</Badge>
								</TableCell>
								<TableCell class="text-foreground px-5 py-3.5 text-sm font-medium"
									>{r.label}</TableCell
								>
								<TableCell
									class="text-muted-foreground px-5 py-3.5 text-xs font-mono whitespace-nowrap"
								>
									{formatDate(r.dueDate)}
								</TableCell>
								<TableCell class="px-5 py-3.5">
									{#if r.status === 'scheduled'}
										<Badge
											class="bg-triage-amber/15 text-foreground border-triage-amber/40 font-mono text-[10px] uppercase"
										>
											Pending
										</Badge>
									{:else if r.status === 'sent'}
										<Badge
											class="bg-triage-green/15 text-triage-green border-triage-green/30 font-mono text-[10px] uppercase"
										>
											Sent
										</Badge>
									{:else}
										<Badge variant="secondary" class="font-mono text-[10px] uppercase">
											{r.status}
										</Badge>
									{/if}
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</ScrollArea>
	</section>
</div>
