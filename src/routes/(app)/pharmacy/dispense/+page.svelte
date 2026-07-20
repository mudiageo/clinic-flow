<script lang="ts">
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import { prescriptionStore } from '$lib/state/prescriptions.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
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
	import { Pill, Check, User, ClipboardList, PackageOpen } from '@lucide/svelte';

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

	async function handleDispense(prescriptionId: string, inventoryId: string, qty: number) {
		try {
			await pharmacyStore.deltaDecrement(inventoryId, qty);
			await prescriptionStore.update(prescriptionId, { status: 'dispensed' } as any);
			toast.success('Medication dispensed and inventory updated.');
		} catch (err: any) {
			toast.error('Dispense failed: ' + err.message);
		}
	}
</script>

<svelte:head>
	<title>Dispense Queue — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in max-w-5xl mx-auto">
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<Pill class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Dispense Queue</h1>
			<p class="text-muted-foreground text-sm mt-0.5 font-medium">
				Pending prescriptions to be dispensed to patients
			</p>
		</div>
	</div>

	<div class="space-y-4">
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
			{#each dispenseQueue as queueItem (queueItem.patientId)}
				{@const patient = patientStore.get(queueItem.patientId)}
				<Card class="bg-card/60 card-hover mb-4 border-l-4 border-l-primary/60">
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
								{#each queueItem.items as p (p.id)}
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
</div>
