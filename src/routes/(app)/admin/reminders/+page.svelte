<script lang="ts">
	import { reminderStore } from '$lib/state/reminders.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import { dispatchReminders } from '../../../sms/sms.remote';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { toast } from 'svelte-sonner';
	import { Bell, Send, Calendar, User, Check, Clock, Loader2 } from '@lucide/svelte';

	const reminders = $derived(reminderStore.sortedItems);
	let isDispatching = $state(false);

	async function handleDispatchPending() {
		const pending = reminderStore.pendingReminders;
		if (pending.length === 0) {
			toast.info('No pending reminders to dispatch.');
			return;
		}

		isDispatching = true;
		try {
			const batch = pending.map((r) => ({
				id: r.id,
				phone: r.recipientPhone,
				message: `ClinicFlow Reminder: ${r.label}`
			}));

			toast.info(`Dispatching ${batch.length} reminders via SMS...`);
			const results = await dispatchReminders(batch);

			let successCount = 0;
			for (const res of results) {
				if (res.success) {
					await reminderStore.update(res.id, {
						status: 'sent',
						sentAt: Date.now(),
						provider: 'termii_sandbox',
						providerMessageId: res.providerMessageId
					} as any);
					successCount++;
				}
			}

			toast.success(`Successfully dispatched ${successCount} reminders.`);
		} catch (err: any) {
			toast.error(`SMS dispatch failed: ${err.message}`);
		} finally {
			isDispatching = false;
		}
	}

	function formatDate(ts: number) {
		return new Date(ts).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>SMS Reminders — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<Bell class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">SMS Reminders</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Manage automated SMS notifications to patients
				</p>
			</div>
		</div>
		<Button
			onclick={handleDispatchPending}
			disabled={isDispatching}
			class="bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 h-10 px-5 btn-press font-semibold"
		>
			{#if isDispatching}
				<Loader2 class="size-4 animate-spin mr-2" />
				Sending...
			{:else}
				<Send class="size-4 mr-2" />
				Dispatch Pending SMS Now
			{/if}
		</Button>
	</div>

	<Card class="overflow-hidden card-hover bg-card/60">
		<CardHeader class="border-b border-border/60 bg-muted/20 px-6 py-4">
			<CardTitle class="text-base font-semibold">Reminder Log</CardTitle>
			<CardDescription>Scheduled, pending, and sent patient messages</CardDescription>
		</CardHeader>
		<ScrollArea class="h-[500px] w-full">
			<Table>
				<TableHeader class="bg-muted/40 sticky top-0 z-10">
					<TableRow class="hover:bg-transparent">
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider"
							>Patient</TableHead
						>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider"
							>Type</TableHead
						>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider"
							>Message</TableHead
						>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider"
							>Due Date</TableHead
						>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider"
							>Status</TableHead
						>
					</TableRow>
				</TableHeader>
				<TableBody class="animate-stagger">
					{#if reminders.length === 0}
						<TableRow>
							<TableCell colspan={5} class="text-center text-muted-foreground py-16">
								<div class="flex flex-col items-center justify-center">
									<Clock class="size-8 text-muted-foreground/60 mb-2" />
									<span class="text-sm font-medium">No reminders scheduled</span>
								</div>
							</TableCell>
						</TableRow>
					{:else}
						{#each reminders as r}
							{@const p = patientStore.get(r.patientId)}
							<TableRow class="border-border hover:bg-muted/40 transition-colors">
								<TableCell class="px-6 py-4">
									<div class="flex items-center gap-2">
										<User class="size-3.5 text-primary" />
										<span class="font-semibold text-foreground text-sm">{p?.name || 'Unknown'}</span
										>
									</div>
									<div class="text-muted-foreground text-xs font-mono mt-1">{r.recipientPhone}</div>
								</TableCell>
								<TableCell class="px-6 py-4">
									<Badge
										variant="outline"
										class="border-border text-muted-foreground capitalize text-[10px] tracking-wide font-bold"
										>{r.type.replace('_', ' ')}</Badge
									>
								</TableCell>
								<TableCell class="text-foreground px-6 py-4 text-sm font-medium"
									>{r.label}</TableCell
								>
								<TableCell
									class="text-muted-foreground px-6 py-4 text-sm font-mono whitespace-nowrap"
									>{formatDate(r.dueDate)}</TableCell
								>
								<TableCell class="px-6 py-4">
									{#if r.status === 'scheduled'}
										<Badge
											class="bg-triage-amber/15 text-triage-amber border-triage-amber/25 hover:bg-triage-amber/15 font-semibold text-[10px] tracking-wider uppercase"
											>Pending</Badge
										>
									{:else if r.status === 'sent'}
										<Badge
											class="bg-triage-green/15 text-triage-green border-triage-green/25 hover:bg-triage-green/15 font-semibold text-[10px] tracking-wider uppercase"
											>Sent</Badge
										>
									{:else}
										<Badge
											variant="secondary"
											class="font-semibold text-[10px] tracking-wider uppercase">{r.status}</Badge
										>
									{/if}
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</ScrollArea>
	</Card>
</div>
