<script lang="ts">
	import { restockStore } from '#lib/state/restock-requests.svelte.ts';
	import { pharmacyStore } from '#lib/state/pharmacy.svelte.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { PackageSearch, ArrowLeft, Send, CheckCircle2, Clock, XCircle } from '@lucide/svelte';

	const restocks = $derived([...restockStore.items].sort((a, b) => b.createdAt - a.createdAt));

	function getStatusBadge(status: string) {
		switch (status) {
			case 'pending':
				return {
					label: 'Pending',
					icon: Clock,
					class: 'bg-triage-amber/15 text-foreground border-triage-amber/40'
				};
			case 'acknowledged':
				return {
					label: 'Acknowledged',
					icon: Clock,
					class: 'bg-primary/10 text-primary border-primary/30'
				};
			case 'fulfilled':
				return {
					label: 'Fulfilled',
					icon: CheckCircle2,
					class: 'bg-triage-green/15 text-triage-green border-triage-green/30'
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

<div class="max-w-5xl mx-auto space-y-6">
	<div class="flex items-center gap-3 pb-2 border-b border-border">
		<Button variant="ghost" size="icon" href="/pharmacy" class="rounded-lg">
			<ArrowLeft class="size-5" />
		</Button>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground">
				Dispensary Counter
			</p>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Restock Requests</h1>
		</div>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
			<Send class="size-4 text-primary" />
			<div>
				<h2 class="text-base font-semibold text-foreground">Request History</h2>
				<p class="text-xs text-muted-foreground">
					Track inventory replenishment requests sent to the LGA depot
				</p>
			</div>
		</div>

		<Table>
			<TableHeader class="bg-muted/40">
				<TableRow class="hover:bg-transparent">
					<TableHead class="font-mono text-xs uppercase tracking-wider">Date</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Item</TableHead>
					<TableHead class="text-right font-mono text-xs uppercase tracking-wider"
						>Qty Requested</TableHead
					>
					<TableHead class="text-center font-mono text-xs uppercase tracking-wider"
						>Status</TableHead
					>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if restocks.length === 0}
					<TableRow>
						<TableCell colspan={4} class="h-32 text-center">
							<div class="flex flex-col items-center justify-center text-muted-foreground">
								<PackageSearch class="size-8 mb-2 opacity-40" />
								<p class="text-sm">No restock requests found.</p>
							</div>
						</TableCell>
					</TableRow>
				{/if}
				{#each restocks as request, idx (request.id)}
					{@const item = pharmacyStore.get(request.inventoryItemId)}
					{@const statusInfo = getStatusBadge(request.status)}
					{@const StatusIcon = statusInfo.icon}
					<TableRow class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}>
						<TableCell class="text-muted-foreground font-mono text-xs">
							{new Date(request.createdAt).toLocaleDateString('en-NG', {
								month: 'short',
								day: 'numeric',
								year: 'numeric'
							})}
						</TableCell>
						<TableCell class="font-semibold text-foreground">
							{item?.itemName || 'Unknown Item'}
						</TableCell>
						<TableCell class="text-right font-mono tabular-nums font-semibold">
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
	</section>
</div>
