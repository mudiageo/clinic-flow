<script lang="ts">
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
	import { PackagePlus, ArrowLeft } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { Checkbox } from '$lib/components/ui/checkbox';

	let itemName = $state('');
	let category = $state('');
	let currentStock = $state<number>(0);
	let lowStockThreshold = $state<number>(50);
	let unit = $state('tablets');
	let isCritical = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!itemName || !category) {
			toast.error('Item name and category are required.');
			return;
		}

		try {
			await pharmacyStore.create({
				phcId: 'placeholder-phc-id', // Should come from session
				itemName,
				category,
				currentStock,
				lowStockThreshold,
				unit,
				isCritical
			});
			toast.success('Inventory item added successfully.');
			goto('/pharmacy');
		} catch (err: any) {
			toast.error('Failed to add item: ' + err.message);
		}
	}
</script>

<svelte:head>
	<title>Add Inventory Item — ClinicFlow</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/pharmacy" class="rounded-full">
			<ArrowLeft class="size-5" />
		</Button>
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Add Inventory Item</h1>
			<p class="text-sm text-muted-foreground">
				Register a new medication or supply in the pharmacy.
			</p>
		</div>
	</div>

	<Card>
		<CardHeader>
			<div class="flex items-center gap-2">
				<PackagePlus class="size-5 text-primary" />
				<CardTitle>Item Details</CardTitle>
			</div>
			<CardDescription>Enter the details for the new inventory item.</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleSubmit} class="space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="itemName">Item Name</Label>
						<Input
							id="itemName"
							bind:value={itemName}
							placeholder="e.g. Paracetamol 500mg"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="category">Category</Label>
						<Input id="category" bind:value={category} placeholder="e.g. Analgesics" required />
					</div>
					<div class="space-y-2">
						<Label for="currentStock">Initial Stock Level</Label>
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
						<Input
							id="unit"
							bind:value={unit}
							placeholder="e.g. tablets, bottles, vials"
							required
						/>
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
					<Button type="submit">Save Item</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
