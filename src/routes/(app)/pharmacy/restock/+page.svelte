<script lang="ts">
	import { restockStore } from '$lib/state/restock-requests.svelte';
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { PackageSearch, ArrowLeft, Send, CheckCircle2, Clock, XCircle } from '@lucide/svelte';

	// The store stores all restock requests. We will sort them by latest first.
	const restocks = $derived([...restockStore.items].sort((a, b) => b.createdAt - a.createdAt));

	function getStatusBadge(status: string) {
		switch (status) {
			case 'pending':
				return {
					label: 'Pending',
					icon: Clock,
					class: 'bg-amber-500/15 text-amber-600 border-amber-500/30'
				};
			case 'acknowledged':
				return {
					label: 'Acknowledged',
					icon: Clock,
					class: 'bg-blue-500/15 text-blue-600 border-blue-500/30'
				};
			case 'fulfilled':
				return {
					label: 'Fulfilled',
					icon: CheckCircle2,
					class: 'bg-green-500/15 text-green-600 border-green-500/30'
				};
			case 'rejected':
				return {
					label: 'Rejected',
					icon: XCircle,
					class: 'bg-destructive/15 text-destructive border-destructive/30'
				};
			default:
				return { label: status, icon: Clock, class: 'bg-muted text-muted-foreground' };
		}
	}
</script>

<svelte:head>
	<title>Restock Requests — ClinicFlow</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6 animate-fade-in">
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" href="/pharmacy" class="rounded-full">
				<ArrowLeft class="size-5" />
			</Button>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Restock Requests</h1>
				<p class="text-sm text-muted-foreground">Monitor and manage requests sent to LGA depot.</p>
			</div>
		</div>
	</div>

	<Card>
		<CardHeader>
			<div class="flex items-center gap-2">
				<Send class="size-5 text-primary" />
				<CardTitle>Request History</CardTitle>
			</div>
			<CardDescription>Track the status of all inventory replenishment requests.</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="rounded-md border border-border/50">
				<Table>
					<TableHeader class="bg-muted/30">
						<TableRow class="hover:bg-transparent">
							<TableHead>Date</TableHead>
							<TableHead>Item</TableHead>
							<TableHead class="text-right">Qty Requested</TableHead>
							<TableHead class="text-center">Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#if restocks.length === 0}
							<TableRow>
								<TableCell colspan={5} class="h-32 text-center">
									<div class="flex flex-col items-center justify-center text-muted-foreground">
										<PackageSearch class="size-8 mb-2 opacity-50" />
										<p>No restock requests found.</p>
									</div>
								</TableCell>
							</TableRow>
						{/if}
						{#each restocks as request (request.id)}
							{@const item = pharmacyStore.get(request.inventoryItemId)}
							{@const statusInfo = getStatusBadge(request.status)}
							{@const StatusIcon = statusInfo.icon}
							<TableRow class="hover:bg-muted/40 transition-colors">
								<TableCell class="text-muted-foreground font-medium text-sm">
									{new Date(request.createdAt).toLocaleDateString(undefined, {
										month: 'short',
										day: 'numeric',
										year: 'numeric'
									})}
								</TableCell>
								<TableCell class="font-semibold text-foreground">
									{item?.itemName || 'Unknown Item'}
								</TableCell>
								<TableCell class="text-right tabular-nums">
									{request.quantityRequested}
								</TableCell>
								<TableCell class="text-center">
									<Badge variant="outline" class="font-semibold {statusInfo.class}">
										<StatusIcon class="size-3.5 mr-1" />
										{statusInfo.label}
									</Badge>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		</CardContent>
	</Card>
</div>
