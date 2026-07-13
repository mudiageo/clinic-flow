<script lang="ts">
  import { pharmacyStore } from '$lib/state/pharmacy.svelte';
  import { prescriptionStore } from '$lib/state/prescriptions.svelte';
  import { patientStore } from '$lib/state/patients.svelte';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { toast } from 'svelte-sonner';

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

<div class="space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-extrabold text-white tracking-tight">Pharmacy Station</h1>
      <p class="text-slate-400 mt-1">Dispense queue and inventory alerts</p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    <!-- Dispense Queue -->
    <div class="lg:col-span-2 space-y-4">
      <h2 class="text-xl font-bold text-slate-200">Dispense Queue</h2>
      
      {#if dispenseQueue.length === 0}
        <Card class="bg-slate-900/40 border-slate-900">
          <CardContent class="py-12 text-center text-slate-500">
            No patients waiting for medication.
          </CardContent>
        </Card>
      {:else}
        {#each dispenseQueue as queueItem}
          {@const patient = patientStore.get(queueItem.patientId)}
          <Card class="bg-slate-900/40 border-slate-900 mb-4">
            <CardHeader class="pb-2 border-b border-slate-800">
              <CardTitle class="text-lg text-teal-400 flex items-center justify-between">
                <span>{patient?.name || 'Unknown'} <span class="text-sm font-mono text-slate-500 ml-2">{patient?.clinicId}</span></span>
                <Badge class="bg-slate-800 text-slate-300">{queueItem.items.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent class="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="text-slate-400">Medication</TableHead>
                    <TableHead class="text-slate-400">Dosage</TableHead>
                    <TableHead class="text-slate-400 text-right">Qty</TableHead>
                    <TableHead class="text-slate-400 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {#each queueItem.items as p}
                    <TableRow class="border-slate-800">
                      <TableCell class="text-white font-medium">{p.medicationName}</TableCell>
                      <TableCell class="text-slate-300">{p.dosage}</TableCell>
                      <TableCell class="text-slate-300 text-right">{p.quantity}</TableCell>
                      <TableCell class="text-right">
                        <Button 
                          size="sm" 
                          class="bg-teal-600 hover:bg-teal-500 text-white"
                          onclick={() => handleDispense(p.id, p.inventoryId, p.quantity)}
                        >
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
      <h2 class="text-xl font-bold text-rose-400 flex items-center gap-2">
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
        Low Stock Alerts
      </h2>
      
      <Card class="bg-rose-950/20 border-rose-900/50">
        <CardContent class="p-0">
          {#if lowStockItems.length === 0}
            <div class="p-6 text-center text-slate-500">
              All inventory levels are healthy.
            </div>
          {:else}
            <div class="divide-y divide-rose-900/30">
              {#each lowStockItems as item}
                <div class="p-4 flex items-center justify-between hover:bg-rose-950/40 transition-colors">
                  <div>
                    <div class="text-white font-semibold flex items-center gap-2">
                      {item.itemName}
                      {#if item.isCritical}
                        <Badge class="bg-rose-500 text-white border-none px-1.5 py-0 text-[10px]">CRITICAL</Badge>
                      {/if}
                    </div>
                    <div class="text-xs text-rose-300/70 mt-1">
                      Current: <span class="font-bold text-rose-400">{item.currentStock} {item.unit}</span> (Threshold: {item.lowStockThreshold})
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    class="border-rose-800 text-rose-300 hover:text-white hover:bg-rose-900 hover:border-rose-700 h-8"
                    onclick={() => handleRestockRequest(item)}
                  >
                    Req Restock
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
