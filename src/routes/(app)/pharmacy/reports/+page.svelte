<script lang="ts">
	import { pharmacyStore } from '#lib/state/pharmacy.svelte.ts';
	import { prescriptionStore } from '#lib/state/prescriptions.svelte.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { ArrowLeft, BarChart3, TrendingUp, AlertTriangle } from '@lucide/svelte';

	const topDispensed = $derived.by(() => {
		const dispensed = prescriptionStore.items.filter((p) => p.status === 'dispensed');
		const counts = new Map<string, { name: string; count: number }>();
		for (const p of dispensed) {
			const item = counts.get(p.inventoryId) || { name: p.medicationName, count: 0 };
			item.count += p.quantity;
			counts.set(p.inventoryId, item);
		}
		return Array.from(counts.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);
	});

	const nearAlerts = $derived(pharmacyStore.lowStock.slice(0, 5));

	const maxCount = $derived(
		topDispensed.length > 0 ? Math.max(...topDispensed.map((t) => t.count)) : 100
	);
</script>

<svelte:head>
	<title>Pharmacy Reports — ClinicFlow</title>
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
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Pharmacy Reports</h1>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<section class="rounded-xl border border-border bg-card overflow-hidden">
			<div class="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
				<TrendingUp class="size-4 text-primary" />
				<div>
					<h2 class="text-base font-semibold">Top Dispensed Medications</h2>
					<p class="text-xs text-muted-foreground">Highest volume medications dispensed</p>
				</div>
			</div>
			<div class="p-5">
				{#if topDispensed.length === 0}
					<div class="py-12 flex flex-col items-center justify-center text-muted-foreground">
						<BarChart3 class="size-8 mb-2 opacity-40" />
						<p class="text-sm">No dispense data available.</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each topDispensed as item (item.name)}
							<div class="space-y-1.5">
								<div class="flex items-center justify-between text-sm">
									<span class="font-medium text-foreground">{item.name}</span>
									<span class="text-muted-foreground font-mono tabular-nums text-xs">
										{item.count} units
									</span>
								</div>
								<div class="h-2 w-full bg-muted rounded-full overflow-hidden">
									<div
										class="h-full bg-primary rounded-full transition-all duration-300"
										style="width: {(item.count / maxCount) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</section>

		<section class="rounded-xl border border-border bg-card overflow-hidden">
			<div class="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
				<AlertTriangle class="size-4 text-destructive" />
				<div>
					<h2 class="text-base font-semibold">Critical Alerts</h2>
					<p class="text-xs text-muted-foreground">Items needing immediate attention</p>
				</div>
			</div>
			<div class="p-5">
				{#if nearAlerts.length === 0}
					<div class="py-12 flex flex-col items-center justify-center text-muted-foreground">
						<AlertTriangle class="size-8 mb-2 opacity-40 text-triage-green" />
						<p class="text-sm">All stock levels are optimal.</p>
					</div>
				{:else}
					<div class="space-y-2.5">
						{#each nearAlerts as alert (alert.id)}
							<div
								class="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
							>
								<div>
									<h3 class="font-medium text-sm text-foreground">{alert.itemName}</h3>
									<p class="text-xs font-mono text-muted-foreground">
										Stock: {alert.currentStock}
										{alert.unit}
									</p>
								</div>
								<span
									class="px-2 py-1 bg-destructive/10 text-destructive text-xs font-semibold rounded-md border border-destructive/20"
								>
									Low Stock
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</section>
	</div>
</div>
