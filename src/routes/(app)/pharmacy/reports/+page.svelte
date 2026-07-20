<script lang="ts">
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import { prescriptionStore } from '$lib/state/prescriptions.svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, BarChart3, TrendingUp, AlertTriangle } from '@lucide/svelte';

	// Compute Top dispensed medications based on dispensed prescriptions
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

	// Find near-expiry or critical low stock items as proxy for alerts
	const nearAlerts = $derived(pharmacyStore.lowStock.slice(0, 5));

	// Max value for the bar chart scaling
	const maxCount = $derived(
		topDispensed.length > 0 ? Math.max(...topDispensed.map((t) => t.count)) : 100
	);
</script>

<svelte:head>
	<title>Pharmacy Reports — ClinicFlow</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6 animate-fade-in">
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/pharmacy" class="rounded-full">
			<ArrowLeft class="size-5" />
		</Button>
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Pharmacy Reports</h1>
			<p class="text-sm text-muted-foreground">Analytics and insights for pharmacy operations.</p>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<Card class="bg-card/60 card-hover">
			<CardHeader>
				<div class="flex items-center gap-2">
					<TrendingUp class="size-5 text-primary" />
					<CardTitle>Top Dispensed Medications</CardTitle>
				</div>
				<CardDescription>Highest volume medications dispensed.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if topDispensed.length === 0}
					<div class="py-12 flex flex-col items-center justify-center text-muted-foreground">
						<BarChart3 class="size-8 mb-2 opacity-50" />
						<p>No dispense data available.</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each topDispensed as item (item.name)}
							<div class="space-y-1.5">
								<div class="flex items-center justify-between text-sm">
									<span class="font-medium text-foreground">{item.name}</span>
									<span class="text-muted-foreground tabular-nums">{item.count} units</span>
								</div>
								<div class="h-2.5 w-full bg-muted rounded-full overflow-hidden">
									<div
										class="h-full bg-primary/80 rounded-full transition-all duration-1000"
										style="width: {(item.count / maxCount) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>

		<Card class="bg-card/60 card-hover">
			<CardHeader>
				<div class="flex items-center gap-2">
					<AlertTriangle class="size-5 text-destructive" />
					<CardTitle>Critical Alerts</CardTitle>
				</div>
				<CardDescription>Items needing immediate attention.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if nearAlerts.length === 0}
					<div class="py-12 flex flex-col items-center justify-center text-muted-foreground">
						<AlertTriangle class="size-8 mb-2 opacity-50 text-green-500/50" />
						<p>All stock levels are optimal.</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each nearAlerts as alert (alert.id)}
							<div
								class="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20"
							>
								<div>
									<h4 class="font-medium text-sm text-foreground">{alert.itemName}</h4>
									<p class="text-xs text-muted-foreground">
										Stock: {alert.currentStock}
										{alert.unit}
									</p>
								</div>
								<div
									class="px-2 py-1 bg-destructive/10 text-destructive text-xs font-semibold rounded-md border border-destructive/20"
								>
									Low Stock
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
