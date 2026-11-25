<script lang="ts">
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
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Pill, AlertTriangle, Search, Plus, ArrowRight, Send, AlertCircle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { restockStore } from '#lib/state/restock-requests.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import type { LocalPharmacyInventory } from '#lib/local-db/db.ts';

	let searchQuery = $state('');

	const inventory = $derived(
		pharmacyStore.items.filter((item) =>
			item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const lowStockItems = $derived(pharmacyStore.lowStock);

	async function requestRestock(item: LocalPharmacyInventory) {
		try {
			await restockStore.create({
				inventoryItemId: item.id,
				phcId: sessionStore.activePhcId,
				requestedByStaffId: sessionStore.staffId,
				quantityRequested: Math.max(1, item.lowStockThreshold * 3),
				status: 'pending',
				createdAt: Date.now()
			});
			toast.success(`Restock request sent for ${item.itemName}.`);
		} catch (error) {
			toast.error('Failed to request restock.');
		}
	}

	function getStatusBadge(item: LocalPharmacyInventory) {
		if (item.currentStock === 0) {
			return { label: 'Out of Stock', variant: 'destructive' as const };
		}
		if (item.currentStock <= item.lowStockThreshold) {
			return { label: 'Low Stock', variant: 'warning' as const };
		}
		return { label: 'In Stock', variant: 'secondary' as const };
	}
</script>

<svelte:head>
	<title>Pharmacy Inventory — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<!-- Page Header -->
	<div
		class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Dispensary Counter
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Pharmacy Inventory</h1>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<Button variant="outline" href="/pharmacy/restock" class="min-h-10 gap-2">
				<Send class="size-4" />
				<span>Restock Requests</span>
			</Button>
			<Button variant="outline" href="/pharmacy/dispense" class="min-h-10 gap-2">
				<Pill class="size-4" />
				<span>Dispense Queue</span>
			</Button>
			<Button href="/pharmacy/inventory/new" class="min-h-10 gap-2 font-semibold">
				<Plus class="size-4" />
				<span>Add Item</span>
			</Button>
		</div>
	</div>

	<!-- Low Stock Alert Strip -->
	{#if lowStockItems.length > 0}
		<div
			class="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3.5 flex items-start gap-3"
		>
			<AlertTriangle class="size-5 text-destructive mt-0.5 shrink-0" />
			<div class="flex-1 text-sm">
				<span class="font-semibold text-destructive">Low stock alert:</span>
				<span class="text-foreground/80 ml-1">
					{lowStockItems.length} item{lowStockItems.length === 1 ? '' : 's'} running low or out of stock.
					Request a restock from the LGA depot.
				</span>
			</div>
		</div>
	{/if}

	<!-- Ruled Inventory Ledger -->
	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div
			class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-b border-border"
		>
			<div>
				<h2 class="text-base font-semibold text-foreground">Inventory Ledger</h2>
				<p class="text-xs text-muted-foreground">
					{inventory.length} medication{inventory.length === 1 ? '' : 's'} tracked locally
				</p>
			</div>
			<div class="relative w-full sm:w-72">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					bind:value={searchQuery}
					placeholder="Filter medications..."
					class="pl-9 h-10 bg-background"
				/>
			</div>
		</div>

		<Table>
			<TableHeader class="bg-muted/40">
				<TableRow class="hover:bg-transparent">
					<TableHead class="w-[300px] font-mono text-xs uppercase tracking-wider"
						>Item Name</TableHead
					>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Category</TableHead>
					<TableHead class="text-right font-mono text-xs uppercase tracking-wider"
						>Stock Level</TableHead
					>
					<TableHead class="text-center font-mono text-xs uppercase tracking-wider"
						>Status</TableHead
					>
					<TableHead class="text-right font-mono text-xs uppercase tracking-wider"
						>Actions</TableHead
					>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if inventory.length === 0}
					<TableRow>
						<TableCell colspan={5} class="h-28 text-center text-muted-foreground">
							No items found matching your filter.
						</TableCell>
					</TableRow>
				{/if}
				{#each inventory as item, idx (item.id)}
					{@const status = getStatusBadge(item)}
					<TableRow class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}>
						<TableCell class="font-medium text-foreground">
							<div class="flex items-center gap-2">
								{#if item.isCritical}
									<AlertCircle class="size-4 text-destructive shrink-0" />
								{/if}
								<span>{item.itemName}</span>
							</div>
						</TableCell>
						<TableCell class="text-muted-foreground text-sm">
							{item.category || 'Uncategorized'}
						</TableCell>
						<TableCell class="text-right tabular-nums font-mono">
							<div class="flex flex-col items-end gap-1">
								<span
									class="font-semibold text-sm"
									class:text-destructive={status.label !== 'In Stock'}
								>
									{item.currentStock}
									{item.unit}
								</span>
								<div class="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
									<div
										class="h-full rounded-full {status.label === 'In Stock'
											? 'bg-primary'
											: 'bg-destructive'}"
										style="width: {Math.min(
											100,
											(item.currentStock / Math.max(1, item.lowStockThreshold * 3)) * 100
										)}%"
									></div>
								</div>
							</div>
						</TableCell>
						<TableCell class="text-center">
							<Badge
								variant={status.variant === 'warning' ? 'outline' : status.variant}
								class={status.variant === 'warning'
									? 'bg-triage-amber/15 text-foreground border-triage-amber/40 font-semibold'
									: 'font-semibold'}
							>
								{status.label}
							</Badge>
						</TableCell>
						<TableCell class="text-right">
							<div class="flex items-center justify-end gap-2">
								{#if status.label !== 'In Stock'}
									<Button
										size="sm"
										variant="outline"
										class="h-9 px-3 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
										onclick={() => requestRestock(item)}
									>
										<Send class="size-3.5 mr-1.5" />
										Restock
									</Button>
								{/if}
								<Button
									size="icon"
									variant="ghost"
									class="h-9 w-9 text-muted-foreground hover:text-foreground"
									href={`/pharmacy/inventory/${item.id}`}
								>
									<ArrowRight class="size-4" />
								</Button>
							</div>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</section>
</div>
