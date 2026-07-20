<script lang="ts">
	import { page } from '$app/stores';
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { PackageSearch, ArrowLeft, Trash2, Save } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { Checkbox } from '$lib/components/ui/checkbox';

	let id = $derived($page.params.id as string);

	let item = $derived(pharmacyStore.get(id));

	let itemName = $state('');
	let category = $state('');
	let currentStock = $state<number>(0);
	let lowStockThreshold = $state<number>(50);
	let unit = $state('tablets');
	let isCritical = $state(false);

	let initialized = false;
	$effect(() => {
		if (item && !initialized) {
			itemName = item.itemName;
			category = item.category || '';
			currentStock = item.currentStock;
			lowStockThreshold = item.lowStockThreshold;
			unit = item.unit;
			isCritical = !!item.isCritical;
			initialized = true;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!item) return;
		if (!itemName || !category) {
			toast.error('Item name and category are required.');
			return;
		}

		try {
			await pharmacyStore.update(id, {
				itemName,
				category,
				currentStock,
				lowStockThreshold,
				unit,
				isCritical
			});
			toast.success('Inventory item updated successfully.');
			goto('/pharmacy');
		} catch (err: any) {
			toast.error('Failed to update item: ' + err.message);
		}
	}

	async function handleDelete() {
		if (!item) return;
		if (!confirm('Are you sure you want to delete this item? This action cannot be undone.'))
			return;

		try {
			await pharmacyStore.delete(id);
			toast.success('Item deleted.');
			goto('/pharmacy');
		} catch (err: any) {
			toast.error('Failed to delete item: ' + err.message);
		}
	}
</script>

<svelte:head>
	<title>{item?.itemName || 'Edit Item'} — ClinicFlow</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/pharmacy" class="rounded-full">
			<ArrowLeft class="size-5" />
		</Button>
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Edit Inventory Item</h1>
			<p class="text-sm text-muted-foreground">Modify details or update stock levels manually.</p>
		</div>
	</div>

	{#if item}
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<PackageSearch class="size-5 text-primary" />
						<CardTitle>{item.itemName}</CardTitle>
					</div>
					<Button
						variant="destructive"
						size="icon"
						class="size-8 rounded-full"
						onclick={handleDelete}
					>
						<Trash2 class="size-4" />
					</Button>
				</div>
				<CardDescription>Make changes below and save to update the inventory.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onsubmit={handleSubmit} class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="itemName">Item Name</Label>
							<Input id="itemName" bind:value={itemName} required />
						</div>
						<div class="space-y-2">
							<Label for="category">Category</Label>
							<Input id="category" bind:value={category} required />
						</div>
						<div class="space-y-2">
							<Label for="currentStock">Current Stock Level</Label>
							<Input id="currentStock" type="number" bind:value={currentStock} min="0" required />
						</div>
						<div class="space-y-2">
							<Label for="lowStockThreshold">Low Stock Threshold</Label>
							<Input
								id="lowStockThreshold"
								type="number"
								bind:value={lowStockThreshold}
								min="0"
								required
							/>
						</div>
						<div class="space-y-2">
							<Label for="unit">Unit</Label>
							<Input id="unit" bind:value={unit} required />
						</div>
						<div class="flex items-center space-x-2 pt-8">
							<Checkbox id="isCritical" bind:checked={isCritical} />
							<Label
								for="isCritical"
								class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Mark as Critical Supply
							</Label>
						</div>
					</div>

					<div class="flex justify-end gap-3 pt-4 border-t border-border/50">
						<Button type="button" variant="outline" href="/pharmacy">Cancel</Button>
						<Button type="submit" class="gap-2">
							<Save class="size-4" />
							Save Changes
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	{:else}
		<div class="py-12 text-center text-muted-foreground">
			<PackageSearch class="size-8 mx-auto mb-3 opacity-50" />
			<p>Item not found or loading...</p>
		</div>
	{/if}
</div>
