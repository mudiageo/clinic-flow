<script lang="ts">
  import { queueStore } from '$lib/state/queue.svelte';
  import { patientStore } from '$lib/state/patients.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

  // Get reactive queue items
  const sortedQueue = $derived(queueStore.sortedQueue);
  const nextTicket = $derived(queueStore.nextTicket);

  const stats = $derived({
    total: sortedQueue.length,
    red: sortedQueue.filter((t: any) => t.triageLevel === 'red').length,
    amber: sortedQueue.filter((t: any) => t.triageLevel === 'amber').length,
    green: sortedQueue.filter((t: any) => t.triageLevel === 'green').length,
  });

  async function handleCallNext() {
    await queueStore.callNext();
  }

  async function handleMarkCalled(id: string) {
    await queueStore.update(id, { status: 'called', calledAt: Date.now() });
  }

  async function handleComplete(id: string) {
    await queueStore.update(id, { status: 'done' });
  }
</script>

<svelte:head>
  <title>Nurse Board — ClinicFlow</title>
</svelte:head>

<div class="space-y-8">
  <!-- Top Bar -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="text-3xl font-extrabold text-white tracking-tight">Nurse Station</h1>
      <p class="text-slate-400 mt-1">Live triage queue board</p>
    </div>
    <div class="flex items-center gap-3">
      <Button 
        onclick={handleCallNext} 
        disabled={!nextTicket}
        class="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/10 h-12 px-6"
      >
        📢 Call Next Patient
      </Button>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
      <CardContent class="p-6">
        <p class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Waiting Patients</p>
        <p class="text-3xl font-bold text-white mt-1">{stats.total}</p>
      </CardContent>
    </Card>
    <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
      <CardContent class="p-6">
        <p class="text-sm font-semibold text-slate-500 uppercase tracking-wider">🔴 Red Alert</p>
        <p class="text-3xl font-bold text-triage-red mt-1">{stats.red}</p>
      </CardContent>
    </Card>
    <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
      <CardContent class="p-6">
        <p class="text-sm font-semibold text-slate-500 uppercase tracking-wider">🟡 Amber Warning</p>
        <p class="text-3xl font-bold text-triage-amber mt-1">{stats.amber}</p>
      </CardContent>
    </Card>
    <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
      <CardContent class="p-6">
        <p class="text-sm font-semibold text-slate-500 uppercase tracking-wider">🟢 Green Stable</p>
        <p class="text-3xl font-bold text-triage-green mt-1">{stats.green}</p>
      </CardContent>
    </Card>
  </div>

  <!-- Queue Table -->
  <Card class="bg-slate-900/30 border-slate-900 overflow-hidden">
    <CardHeader class="border-b border-slate-900 px-6 py-4">
      <CardTitle class="text-white text-lg">Active Queue</CardTitle>
    </CardHeader>
    <Table>
      <TableHeader class="bg-slate-950/40 border-b border-slate-900">
        <TableRow>
          <TableHead class="text-slate-400 font-semibold px-6 py-4 w-20">#</TableHead>
          <TableHead class="text-slate-400 font-semibold px-6 py-4">Patient Name</TableHead>
          <TableHead class="text-slate-400 font-semibold px-6 py-4">Triage Priority</TableHead>
          <TableHead class="text-slate-400 font-semibold px-6 py-4">Reason</TableHead>
          <TableHead class="text-slate-400 font-semibold px-6 py-4">Status</TableHead>
          <TableHead class="text-slate-400 font-semibold px-6 py-4 text-right w-44">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#if sortedQueue.length === 0}
          <TableRow>
            <TableCell colspan={6} class="text-center py-12 text-slate-500">
              No patients in the queue.
            </TableCell>
          </TableRow>
        {:else}
          {#each sortedQueue as ticket (ticket.id)}
            {@const patient = patientStore.get(ticket.patientId)}
            <TableRow class="hover:bg-slate-900/40 border-b border-slate-900 transition-colors">
              <TableCell class="font-bold text-white px-6 py-4">{ticket.ticketNumber}</TableCell>
              <TableCell class="px-6 py-4">
                {#if patient}
                  <div class="font-medium text-white">{patient.name}</div>
                  <div class="text-xs text-slate-500 mt-0.5">{patient.clinicId}</div>
                {:else}
                  <span class="text-slate-500">Unknown Patient</span>
                {/if}
              </TableCell>
              <TableCell class="px-6 py-4">
                {#if ticket.triageLevel === 'red'}
                  <Badge class="bg-triage-red text-triage-red-foreground font-semibold">🔴 RED</Badge>
                {:else}
                  {#if ticket.triageLevel === 'amber'}
                    <Badge class="bg-triage-amber text-triage-amber-foreground font-semibold">🟡 AMBER</Badge>
                  {:else}
                    <Badge class="bg-triage-green text-triage-green-foreground font-semibold">🟢 GREEN</Badge>
                  {/if}
                {/if}
              </TableCell>
              <TableCell class="text-slate-300 px-6 py-4">{ticket.triageReason ?? 'Normal triage'}</TableCell>
              <TableCell class="px-6 py-4">
                {#if ticket.status === 'called'}
                  <span class="text-teal-400 font-semibold animate-pulse uppercase text-xs">Called</span>
                {:else}
                  <span class="text-slate-400 font-semibold uppercase text-xs">{ticket.status}</span>
                {/if}
              </TableCell>
              <TableCell class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  {#if ticket.status !== 'called'}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      class="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 h-9"
                      onclick={() => handleMarkCalled(ticket.id)}
                    >
                      Call
                    </Button>
                  {/if}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    class="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-9"
                    onclick={() => handleComplete(ticket.id)}
                  >
                    Done
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          {/each}
        {/if}
      </TableBody>
    </Table>
  </Card>
</div>
