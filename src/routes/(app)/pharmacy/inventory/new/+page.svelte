<script lang="ts">
	import { pharmacyStore } from '#lib/state/pharmacy.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { toast } from 'svelte-sonner';
	import { PackagePlus, ArrowLeft } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { Checkbox } from '#lib/components/ui/checkbox/index.ts';

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
				phcId: sessionStore.activePhcId,
				itemName,
				category,
				currentStock,
				lowStockThreshold,
				unit,
				isCritical,
				batchNumber: null,
				expiryDate: null
			});
			toast.success('Inventory item added successfully.');
			goto('/pharmacy');
		} catch (err) {
			toast.error('Failed to add item: ' + (err instanceof Error ? err.message : String(err)));
		}
	}
</script>

<svelte:head>
	<title>Add Inventory Item — ClinicFlow</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<div class="flex items-center gap-3 pb-2 border-b border-border">
		<Button variant="ghost" size="icon" href="/pharmacy" class="rounded-lg">
			<ArrowLeft class="size-5" />
		</Button>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground">
				Dispensary Counter
			</p>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Add Inventory Item</h1>
		</div>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
			<PackagePlus class="size-4 text-primary" />
			<div>
				<h2 class="text-base font-semibold">Item Details</h2>
				<p class="text-xs text-muted-foreground">
					Register a new medication or supply in the pharmacy
				</p>
			</div>
		</div>
		<form onsubmit={handleSubmit} class="p-5 space-y-5">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label for="itemName">Item Name</Label>
					<Input
						id="itemName"
						bind:value={itemName}
						placeholder="e.g. Paracetamol 500mg"
						class="h-11"
						required
					/>
				</div>
				<div class="space-y-1.5">
					<Label for="category">Category</Label>
					<Input
						id="category"
						bind:value={category}
						placeholder="e.g. Analgesics"
						class="h-11"
						required
					/>
				</div>
				<div class="space-y-1.5">
					<Label for="currentStock">Initial Stock Level</Label>
					<Input
						id="currentStock"
						type="number"
						bind:value={currentStock}
						min="0"
						class="h-11 font-mono tabular-nums"
						required
					/>
				</div>
				<div class="space-y-1.5">
					<Label for="lowStockThreshold">Low Stock Threshold</Label>
					<Input
						id="lowStockThreshold"
						type="number"
						bind:value={lowStockThreshold}
						min="0"
						class="h-11 font-mono tabular-nums"
						required
					/>
				</div>
				<div class="space-y-1.5">
					<Label for="unit">Unit</Label>
					<Input
						id="unit"
						bind:value={unit}
						placeholder="e.g. tablets, bottles, vials"
						class="h-11"
						required
					/>
				</div>
				<div class="flex items-center space-x-2 pt-7">
					<Checkbox id="isCritical" bind:checked={isCritical} />
					<Label for="isCritical" class="text-sm font-medium">Mark as Critical Supply</Label>
				</div>
			</div>

			<div class="flex justify-end gap-3 pt-4 border-t border-border">
				<Button type="button" variant="outline" class="min-h-11" href="/pharmacy">Cancel</Button>
				<Button type="submit" class="min-h-11 px-6 font-semibold">Save Item</Button>
			</div>
		</form>
	</section>
</div>
