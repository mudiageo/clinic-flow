<script lang="ts">
  import { patientStore } from '$lib/state/patients.svelte';
  import { queueStore } from '$lib/state/queue.svelte';
  import { pharmacyStore } from '$lib/state/pharmacy.svelte';
  import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';
  import { Badge } from '$lib/components/ui/badge';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

  const totalPatients = $derived(patientStore.items.length);
  const queueItems = $derived(queueStore.items);
  const lowStockItems = $derived(pharmacyStore.lowStock);

  const triageStats = $derived({
    red: queueItems.filter((t: any) => t.triageLevel === 'red').length,
    amber: queueItems.filter((t: any) => t.triageLevel === 'amber').length,
    green: queueItems.filter((t: any) => t.triageLevel === 'green').length,
  });

  const redPercent = $derived(queueItems.length > 0 ? (triageStats.red / queueItems.length) * 100 : 0);
  const amberPercent = $derived(queueItems.length > 0 ? (triageStats.amber / queueItems.length) * 100 : 0);
  const greenPercent = $derived(queueItems.length > 0 ? (triageStats.green / queueItems.length) * 100 : 0);
</script>

<svelte:head>
  <title>Admin Operations — ClinicFlow</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-extrabold text-white tracking-tight">Operations Dashboard</h1>
    <p class="text-slate-400 mt-1">Primary Health Centre metrics and alerts</p>
  </div>

  <!-- Key Metrics row -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
      <CardContent class="p-6 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Patients</p>
          <p class="text-3xl font-bold text-white mt-1">{totalPatients}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
          👤
        </div>
      </CardContent>
    </Card>

    <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
      <CardContent class="p-6 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Queue Today</p>
          <p class="text-3xl font-bold text-white mt-1">{queueItems.length}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          📋
        </div>
      </CardContent>
    </Card>

    <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
      <CardContent class="p-6 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Stock Alerts</p>
          <p class="text-3xl font-bold text-rose-400 mt-1">{lowStockItems.length}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
          ⚠️
        </div>
      </CardContent>
    </Card>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- Queue Triage Distribution -->
    <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
      <CardHeader>
        <CardTitle class="text-white text-lg">Triage Distribution</CardTitle>
        <CardDescription class="text-slate-400">Percentage breakdown of patients in waiting queue</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-triage-red font-semibold">🔴 RED - Immediate Priority</span>
            <span class="text-white font-bold">{triageStats.red} ({redPercent.toFixed(0)}%)</span>
          </div>
          <Progress value={redPercent} class="bg-slate-950 h-2.5 rounded-full [&>div]:bg-triage-red" />
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-triage-amber font-semibold">🟡 AMBER - Warning Priority</span>
            <span class="text-white font-bold">{triageStats.amber} ({amberPercent.toFixed(0)}%)</span>
          </div>
          <Progress value={amberPercent} class="bg-slate-950 h-2.5 rounded-full [&>div]:bg-triage-amber" />
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-triage-green font-semibold">🟢 GREEN - Stable Priority</span>
            <span class="text-white font-bold">{triageStats.green} ({greenPercent.toFixed(0)}%)</span>
          </div>
          <Progress value={greenPercent} class="bg-slate-950 h-2.5 rounded-full [&>div]:bg-triage-green" />
        </div>
      </CardContent>
    </Card>

    <!-- Low Stock Inventory Alerts -->
    <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
      <CardHeader>
        <CardTitle class="text-white text-lg">Low Stock Pharmacy Alerts</CardTitle>
        <CardDescription class="text-slate-400">Items below recommended safety thresholds</CardDescription>
      </CardHeader>
      <CardContent>
        {#if lowStockItems.length === 0}
          <p class="text-slate-500 text-center py-12 text-sm">All inventory stocks are healthy.</p>
        {:else}
          <Table>
            <TableHeader class="bg-slate-950/40">
              <TableRow>
                <TableHead class="text-slate-400 font-semibold px-4 py-2">Item Name</TableHead>
                <TableHead class="text-slate-400 font-semibold px-4 py-2">Stock</TableHead>
                <TableHead class="text-slate-400 font-semibold px-4 py-2">Threshold</TableHead>
                <TableHead class="text-slate-400 font-semibold px-4 py-2">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each lowStockItems as item}
                <TableRow class="border-b border-slate-900/60">
                  <TableCell class="text-white font-medium px-4 py-2">{item.itemName}</TableCell>
                  <TableCell class="text-rose-400 font-bold px-4 py-2">{item.currentStock}</TableCell>
                  <TableCell class="text-slate-400 px-4 py-2">{item.lowStockThreshold}</TableCell>
                  <TableCell class="px-4 py-2">
                    {#if item.isCritical}
                      <Badge class="bg-rose-500/10 text-rose-400 border border-rose-500/20">Critical</Badge>
                    {:else}
                      <Badge variant="outline" class="text-slate-400 border-slate-800">Standard</Badge>
                    {/if}
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        {/if}
      </CardContent>
    </Card>
  </div>
</div>
