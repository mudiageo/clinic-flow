<script lang="ts">
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import { prescriptionStore } from '$lib/state/prescriptions.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import {
		Pill,
		AlertTriangle,
		Check,
		User,
		ClipboardList,
		Clock,
		PackageOpen,
		Send
	} from '@lucide/svelte';

	const pendingPrescriptions = $derived(prescriptionStore.pending);

	// Group by patient
	const dispenseQueue = $derived.by(() => {
		const map = new Map<string, typeof pendingPrescriptions>();
		for (const p of pendingPrescriptions) {
			if (!map.has(p.patientId)) map.set(p.patientId, []);
			map.get(p.patientId)!.push(p);
		}
		return Array.from(map.entries()).map(([patientId, items]) => ({
			patientId,
			items
		}));
	});

	const lowStockItems = $derived(pharmacyStore.lowStock);

	async function handleDispense(prescriptionId: string, inventoryId: string, qty: number) {
		try {
			// 1. Decrement inventory
			await pharmacyStore.deltaDecrement(inventoryId, qty);

			// 2. Mark prescription as dispensed
			await prescriptionStore.update(prescriptionId, { status: 'dispensed' } as any);

			toast.success('Medication dispensed and inventory updated.');
		} catch (err: any) {
			toast.error('Dispense failed: ' + err.message);
		}
	}

	function handleRestockRequest(item: any) {
		toast.success(`Restock request sent for ${item.itemName} (Current: ${item.currentStock})`);
	}
</script>

<svelte:head>
	<title>Pharmacy — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<Pill class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Pharmacy Station</h1>
			<p class="text-muted-foreground text-sm mt-0.5 font-medium">
				Dispense queue and inventory alerts
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Dispense Queue -->
		<div class="lg:col-span-2 space-y-4">
			<h2 class="text-base font-bold text-foreground flex items-center gap-2">
				<ClipboardList class="size-4.5 text-muted-foreground" />
				Dispense Queue
			</h2>

			{#if dispenseQueue.length === 0}
				<Card class="bg-card/60 card-hover">
					<CardContent
						class="py-16 text-center text-muted-foreground flex flex-col items-center justify-center"
					>
						<PackageOpen class="size-8 text-muted-foreground/60 mb-2" />
						<span class="text-sm font-medium">No patients waiting for medication</span>
					</CardContent>
				</Card>
			{:else}
				{#each dispenseQueue as queueItem}
					{@const patient = patientStore.get(queueItem.patientId)}
					<Card class="bg-card/60 card-hover mb-4">
						<CardHeader class="pb-3 border-b border-border/60 bg-muted/10">
							<CardTitle class="text-sm font-semibold flex items-center justify-between">
								<span class="flex items-center gap-1.5">
									<User class="size-4 text-primary" />
									<span class="text-foreground font-bold">{patient?.name || 'Unknown'}</span>
									<span class="text-xs font-mono text-muted-foreground">({patient?.clinicId})</span>
								</span>
								<Badge variant="secondary" class="font-semibold text-xs"
									>{queueItem.items.length} items</Badge
								>
							</CardTitle>
						</CardHeader>
						<CardContent class="pt-4">
							<Table>
								<TableHeader>
									<TableRow class="hover:bg-transparent">
										<TableHead
											class="font-semibold text-muted-foreground text-xs uppercase tracking-wider"
											>Medication</TableHead
										>
										<TableHead
											class="font-semibold text-muted-foreground text-xs uppercase tracking-wider"
											>Dosage</TableHead
										>
										<TableHead
											class="font-semibold text-muted-foreground text-right text-xs uppercase tracking-wider"
											>Qty</TableHead
										>
										<TableHead
											class="font-semibold text-muted-foreground text-right text-xs uppercase tracking-wider"
											>Action</TableHead
										>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each queueItem.items as p}
										<TableRow class="border-border hover:bg-muted/40 transition-colors">
											<TableCell class="text-foreground font-medium">{p.medicationName}</TableCell>
											<TableCell class="text-muted-foreground">{p.dosage}</TableCell>
											<TableCell class="text-foreground font-bold text-right tabular-nums"
												>{p.quantity}</TableCell
											>
											<TableCell class="text-right">
												<Button
													size="sm"
													class="bg-primary text-primary-foreground hover:bg-primary/95 btn-press h-8 px-3"
													onclick={() => handleDispense(p.id, p.inventoryId, p.quantity)}
												>
													<Check class="size-3.5 mr-1" />
													Dispense
												</Button>
											</TableCell>
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				{/each}
			{/if}
		</div>

		<!-- Low Stock Dashboard -->
		<div class="space-y-4">
			<h2 class="text-base font-bold text-destructive flex items-center gap-2">
				<span class="relative flex h-2 w-2">
					<span
						class="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"
					></span>
					<span class="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
				</span>
				Low Stock Alerts
			</h2>

			<Card class="bg-destructive/5 border-destructive/20 card-hover">
				<CardContent class="p-0">
					{#if lowStockItems.length === 0}
						<div
							class="p-8 text-center text-muted-foreground flex flex-col items-center justify-center"
						>
							<Check class="size-6 text-triage-green mb-2" />
							<span class="text-sm font-medium">All inventory levels are healthy</span>
						</div>
					{:else}
						<div class="divide-y divide-destructive/10">
							{#each lowStockItems as item}
								<div
									class="p-4 flex items-center justify-between hover:bg-destructive/10 transition-colors"
								>
									<div>
										<div class="text-foreground font-semibold text-sm flex items-center gap-1.5">
											{item.itemName}
											{#if item.isCritical}
												<Badge
													variant="destructive"
													class="px-1.5 py-0 text-[9px] font-bold tracking-wider uppercase"
													>CRITICAL</Badge
												>
											{/if}
										</div>
										<div class="text-xs text-muted-foreground mt-1">
											Stock: <span class="font-bold text-destructive"
												>{item.currentStock} {item.unit}</span
											>
											(Min: {item.lowStockThreshold})
										</div>
									</div>
									<Button
										size="sm"
										variant="outline"
										class="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive h-8 px-2.5 text-xs btn-press"
										onclick={() => handleRestockRequest(item)}
									>
										<Send class="size-3 mr-1" />
										Request
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>
</div>
