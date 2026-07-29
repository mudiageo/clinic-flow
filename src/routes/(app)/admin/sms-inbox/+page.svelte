<script lang="ts">
	import { getSmsInbox } from '$lib/remote/admin.remote';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { MessageSquare, MessageSquareText, Search } from '@lucide/svelte';
	import { Input } from '$lib/components/ui/input';

	let searchQuery = $state('');

</script>

<svelte:head>
	<title>SMS Inbox — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-5xl mx-auto py-8">
	<div class="flex items-start justify-between">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<MessageSquare class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Two-Way SMS Inbox</h1>
				<p class="text-muted-foreground text-sm mt-0.5">
					Incoming SMS replies from patients for appointment confirmation or cancellations.
				</p>
			</div>
		</div>
	</div>

	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Recent Messages</CardTitle>
					<CardDescription>Messages processed via Termii Webhook</CardDescription>
				</div>
				<div class="relative w-72">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input placeholder="Search phone or message..." bind:value={searchQuery} class="pl-9 bg-muted/50" />
				</div>
			</div>
		</CardHeader>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Time</TableHead>
						<TableHead>From</TableHead>
						<TableHead>Message</TableHead>
						<TableHead class="text-right">Action Matched</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#await getSmsInbox()}
						<TableRow>
							<TableCell colspan={4} class="text-center py-8 text-muted-foreground animate-pulse">
								Loading messages...
							</TableCell>
						</TableRow>
					{:then messages}
						{@const filtered = messages.filter(m => 
							m.fromPhone.includes(searchQuery) || 
							m.message.toLowerCase().includes(searchQuery.toLowerCase())
						)}
						{#each filtered as msg}
							{@const msgLower = msg.message.toLowerCase()}
							<TableRow>
								<TableCell class="text-muted-foreground whitespace-nowrap text-sm">
									{new Date(msg.createdAt).toLocaleString()}
								</TableCell>
								<TableCell class="font-medium font-mono">{msg.fromPhone}</TableCell>
								<TableCell>
									<div class="flex items-center gap-2">
										<MessageSquareText class="size-4 text-muted-foreground" />
										<span class="max-w-[400px] truncate">{msg.message}</span>
									</div>
								</TableCell>
								<TableCell class="text-right">
									{#if msgLower.includes('confirm')}
										<Badge variant="outline" class="bg-green-500/10 text-green-600 border-green-500/20">Appointment Confirmed</Badge>
									{:else if msgLower.includes('stop')}
										<Badge variant="outline" class="bg-destructive/10 text-destructive border-destructive/20">Unsubscribed</Badge>
									{:else}
										<Badge variant="outline" class="text-muted-foreground">Unrecognized</Badge>
									{/if}
								</TableCell>
							</TableRow>
						{:else}
							<TableRow>
								<TableCell colspan={4} class="text-center py-8 text-muted-foreground">
									{searchQuery ? 'No matching messages found.' : 'Inbox is empty.'}
								</TableCell>
							</TableRow>
						{/each}
					{/await}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
