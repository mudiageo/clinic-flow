<script lang="ts">
	import { getSmsInbox } from '#lib/remote/admin.remote.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { MessageSquareText, Search } from '@lucide/svelte';
	import { Input } from '#lib/components/ui/input/index.ts';

	let searchQuery = $state('');
</script>

<svelte:head>
	<title>SMS Inbox — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Patient Messaging
		</p>
		<h1 class="text-2xl font-bold text-foreground tracking-tight">Two-Way SMS Inbox</h1>
		<p class="text-muted-foreground text-sm mt-0.5">
			Incoming SMS replies from patients for appointment confirmation or cancellations
		</p>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div
			class="px-5 py-3.5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
		>
			<div>
				<h2 class="text-base font-semibold">Recent Messages</h2>
				<p class="text-xs text-muted-foreground">Messages processed via Termii Webhook</p>
			</div>
			<div class="relative w-full sm:w-72">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					placeholder="Search phone or message..."
					bind:value={searchQuery}
					class="pl-9 h-10 bg-background"
				/>
			</div>
		</div>

		<Table>
			<TableHeader class="bg-muted/40">
				<TableRow class="hover:bg-transparent">
					<TableHead class="font-mono text-xs uppercase tracking-wider px-5">Time</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">From</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Message</TableHead>
					<TableHead class="text-right font-mono text-xs uppercase tracking-wider px-5">
						Action Matched
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#await getSmsInbox()}
					<TableRow>
						<TableCell colspan={4} class="text-center py-10 text-muted-foreground animate-pulse">
							Loading messages...
						</TableCell>
					</TableRow>
				{:then messages}
					{@const filtered = messages.filter(
						(m) =>
							m.fromPhone.includes(searchQuery) ||
							m.message.toLowerCase().includes(searchQuery.toLowerCase())
					)}
					{#each filtered as msg, idx}
						{@const msgLower = msg.message.toLowerCase()}
						<TableRow class={idx % 2 === 1 ? 'bg-muted/20' : ''}>
							<TableCell class="text-muted-foreground whitespace-nowrap font-mono text-xs px-5">
								{new Date(msg.createdAt).toLocaleString()}
							</TableCell>
							<TableCell class="font-medium font-mono text-sm">{msg.fromPhone}</TableCell>
							<TableCell>
								<div class="flex items-center gap-2">
									<MessageSquareText class="size-4 text-muted-foreground shrink-0" />
									<span class="max-w-[400px] truncate text-sm">{msg.message}</span>
								</div>
							</TableCell>
							<TableCell class="text-right px-5">
								{#if msgLower.includes('confirm')}
									<Badge
										variant="outline"
										class="bg-triage-green/15 text-triage-green border-triage-green/30"
									>
										Appointment Confirmed
									</Badge>
								{:else if msgLower.includes('stop')}
									<Badge
										variant="outline"
										class="bg-destructive/10 text-destructive border-destructive/30"
									>
										Unsubscribed
									</Badge>
								{:else}
									<Badge variant="outline" class="text-muted-foreground">Unrecognized</Badge>
								{/if}
							</TableCell>
						</TableRow>
					{:else}
						<TableRow>
							<TableCell colspan={4} class="text-center py-10 text-muted-foreground">
								{searchQuery ? 'No matching messages found.' : 'Inbox is empty.'}
							</TableCell>
						</TableRow>
					{/each}
				{/await}
			</TableBody>
		</Table>
	</section>
</div>
