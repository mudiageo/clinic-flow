<script lang="ts">
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
	import { Input } from '$lib/components/ui/input';
	import {
		Pill,
		AlertTriangle,
		Search,
		Plus,
		ArrowRight,
		PackageOpen,
		Send,
		AlertCircle
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { restockStore } from '$lib/state/restock-requests.svelte';
	import type { LocalPharmacyInventory } from '$lib/local-db/db';

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
				phcId: item.phcId,
				requestedByStaffId: null, // Typically comes from session
				quantityRequested: Math.max(100, item.lowStockThreshold * 2), // Default bulk request
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

<div class="space-y-8 animate-fade-in max-w-6xl mx-auto">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<PackageOpen class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Pharmacy Inventory</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Manage medications, stock levels, and expirations
				</p>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<Button variant="outline" href="/pharmacy/restock" class="gap-2">
				<Send class="size-4" />
				Restock Requests
			</Button>
			<Button href="/pharmacy/dispense" class="gap-2">
				<Pill class="size-4" />
				Dispense Queue
			</Button>
			<Button
				href="/pharmacy/inventory/new"
				class="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
			>
				<Plus class="size-4" />
				Add Item
			</Button>
		</div>
	</div>

	{#if lowStockItems.length > 0}
		<div
			class="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3"
		>
			<AlertTriangle class="size-5 text-destructive mt-0.5" />
			<div class="flex-1">
				<h3 class="text-sm font-semibold text-destructive">Critical Low Stock Alerts</h3>
				<p class="text-sm text-destructive/80 mt-1">
					{lowStockItems.length} items are running low or out of stock. Please request a restock from
					the LGA depot.
				</p>
			</div>
		</div>
	{/if}

	<Card class="bg-card/60 card-hover">
		<CardHeader class="pb-4">
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<CardTitle>Inventory Overview</CardTitle>
					<CardDescription>All items currently tracked in the pharmacy.</CardDescription>
				</div>
				<div class="relative w-full sm:w-72">
					<Search class="absolute left-3 top-2.5 size-4 text-muted-foreground" />
					<Input
						bind:value={searchQuery}
						placeholder="Search inventory..."
						class="pl-9 h-9 bg-background/50"
					/>
				</div>
			</div>
		</CardHeader>
		<CardContent>
			<div class="rounded-md border border-border/50">
				<Table>
					<TableHeader class="bg-muted/30">
						<TableRow class="hover:bg-transparent">
							<TableHead class="w-[300px]">Item Name</TableHead>
							<TableHead>Category</TableHead>
							<TableHead class="text-right">Stock Level</TableHead>
							<TableHead class="text-center">Status</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#if inventory.length === 0}
							<TableRow>
								<TableCell colspan={5} class="h-24 text-center text-muted-foreground">
									No items found.
								</TableCell>
							</TableRow>
						{/if}
						{#each inventory as item (item.id)}
							{@const status = getStatusBadge(item)}
							<TableRow class="hover:bg-muted/40 transition-colors">
								<TableCell class="font-medium text-foreground">
									<div class="flex items-center gap-2">
										{#if item.isCritical}
											<AlertCircle class="size-4 text-destructive" />
										{/if}
										{item.itemName}
									</div>
								</TableCell>
								<TableCell class="text-muted-foreground text-sm">
									{item.category || 'Uncategorized'}
								</TableCell>
								<TableCell class="text-right tabular-nums">
									<div class="flex flex-col items-end gap-1">
										<span
											class="font-semibold"
											class:text-destructive={status.label !== 'In Stock'}
										>
											{item.currentStock}
											{item.unit}
										</span>
										<div class="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
											<div
												class="h-full rounded-full {status.label === 'In Stock'
													? 'bg-primary/70'
													: 'bg-destructive/80'}"
												style="width: {Math.min(
													100,
													(item.currentStock / (item.lowStockThreshold * 3)) * 100
												)}%"
											></div>
										</div>
									</div>
								</TableCell>
								<TableCell class="text-center">
									<Badge
										variant={status.variant === 'warning' ? 'outline' : status.variant}
										class={status.variant === 'warning'
											? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-500/30 font-semibold'
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
												class="h-8 px-2.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
												onclick={() => requestRestock(item)}
											>
												<Send class="size-3.5 mr-1" />
												Restock
											</Button>
										{/if}
										<Button
											size="icon"
											variant="ghost"
											class="h-8 w-8 text-muted-foreground hover:text-foreground"
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
			</div>
		</CardContent>
	</Card>
</div>
