<script lang="ts">
	import { Card, CardContent } from '#lib/components/ui/card/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Thermometer, ThermometerSnowflake, AlertTriangle, Activity } from '@lucide/svelte';
	import { pharmacyStore } from '#lib/state/pharmacy.svelte.ts';

	const vaccineStock = $derived(
		pharmacyStore.items.filter((item) => item.category?.toLowerCase() === 'vaccine')
	);

	function isLowStock(item: (typeof vaccineStock)[number]): boolean {
		return item.currentStock <= item.lowStockThreshold || item.isCritical;
	}
</script>

<svelte:head>
	<title>Cold Chain — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-sky-100 text-sky-600">
				<ThermometerSnowflake class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Cold Chain Tracker</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Monitor vaccine temperatures and sensitive stock
				</p>
			</div>
		</div>
		<Button variant="outline" disabled title="Not available — no temperature log data source yet">
			<Activity class="size-4 mr-2" />
			Log Temperature
		</Button>
	</div>

	<!-- Fridge Status -->
	<Card class="overflow-hidden border-sky-100 bg-sky-50/30">
		<CardContent class="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
			<div class="flex items-center gap-6">
				<div class="relative">
					<div
						class="size-20 rounded-full border-4 border-muted flex items-center justify-center text-muted-foreground"
					>
						<span class="text-2xl font-bold">—</span>
					</div>
					<div
						class="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-white shadow-sm text-muted-foreground"
					>
						<Thermometer class="size-5" />
					</div>
				</div>
				<div>
					<h3 class="text-lg font-bold">Solar Direct Drive Refrigerator</h3>
					<p class="text-sm text-muted-foreground flex items-center gap-2 mt-1">
						Status:
						<Badge variant="outline" class="border-muted text-muted-foreground bg-white">
							No temperature data
						</Badge>
					</p>
					<p class="text-sm text-muted-foreground mt-1">
						No temperature logs recorded. Temperature monitoring is not yet connected.
					</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Vaccine Inventory -->
	<div class="space-y-4">
		<h2 class="text-lg font-bold tracking-tight">Sensitive Stock</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#if vaccineStock.length === 0}
				<Card class="md:col-span-2 lg:col-span-4">
					<CardContent class="p-8 text-center text-muted-foreground">
						No vaccine stock recorded in pharmacy inventory.
					</CardContent>
				</Card>
			{/if}

			{#each vaccineStock as item (item.id)}
				{@const lowStock = isLowStock(item)}
				<Card class="card-hover {lowStock ? 'border-amber-200 bg-amber-50/30' : ''}">
					<CardContent class="p-5 flex flex-col h-full">
						<div class="flex justify-between items-start mb-4">
							<Badge
								variant="outline"
								class="text-[10px] uppercase font-bold tracking-wider text-sky-600 border-sky-200 bg-sky-50"
							>
								Vaccine
							</Badge>
							{#if lowStock}
								<Badge variant="outline" class="text-amber-600 border-amber-200 bg-amber-50 gap-1">
									<AlertTriangle class="size-3" />
									Low stock
								</Badge>
							{/if}
						</div>

						<h3 class="text-xl font-bold mb-1">{item.itemName}</h3>

						<div class="mt-auto pt-4 space-y-2">
							<div class="flex justify-between items-end">
								<span class="text-xs text-muted-foreground">Stock</span>
								<span class="font-bold {lowStock ? 'text-red-600' : ''}">
									{item.currentStock}
									{item.unit}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
		<p class="text-xs text-muted-foreground">
			Temperature and expiry tracking are not yet connected. Stock figures come from pharmacy
			inventory.
		</p>
	</div>
</div>
