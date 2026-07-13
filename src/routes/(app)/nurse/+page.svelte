<script lang="ts">
  import { queueStore } from '$lib/state/queue.svelte';
  import { patientStore } from '$lib/state/patients.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { ShinyButton } from '$lib/components/ui/shiny-button';
  import { 
    Users, 
    AlertCircle, 
    AlertTriangle, 
    CheckCircle2, 
    Megaphone, 
    ClipboardList,
    Clock,
    UserCheck,
    Check
  } from '@lucide/svelte';

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

<div class="space-y-8 animate-fade-in">
  <!-- Top Bar -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div class="flex items-start gap-3">
      <div class="p-2.5 rounded-xl bg-primary/10 text-primary">
        <ClipboardList class="size-6" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-foreground tracking-tight">Nurse Station</h1>
        <p class="text-muted-foreground text-sm mt-0.5">Live triage queue board</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <ShinyButton 
        onclick={handleCallNext} 
        disabled={!nextTicket}
        class="bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 h-11 px-5 btn-press"
      >
        <Megaphone class="size-4 mr-2" />
        Call Next Patient
      </ShinyButton>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
    <Card class="card-hover cursor-default bg-card/60">
      <CardContent class="p-5 flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waiting</p>
          <p class="text-2xl font-bold text-foreground mt-1 tabular-nums">{stats.total}</p>
        </div>
        <div class="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
          <Clock class="size-4" />
        </div>
      </CardContent>
    </Card>

    <Card class="card-hover cursor-default bg-card/60 border-triage-red/20">
      <CardContent class="p-5 flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-triage-red uppercase tracking-wider">Red Alert</p>
          <p class="text-2xl font-bold text-triage-red mt-1 tabular-nums">{stats.red}</p>
        </div>
        <div class="size-10 rounded-lg bg-triage-red/10 flex items-center justify-center text-triage-red ring-1 ring-triage-red/20">
          <AlertCircle class="size-4" />
        </div>
      </CardContent>
    </Card>

    <Card class="card-hover cursor-default bg-card/60 border-triage-amber/20">
      <CardContent class="p-5 flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-triage-amber uppercase tracking-wider">Amber Warning</p>
          <p class="text-2xl font-bold text-triage-amber mt-1 tabular-nums">{stats.amber}</p>
        </div>
        <div class="size-10 rounded-lg bg-triage-amber/10 flex items-center justify-center text-triage-amber ring-1 ring-triage-amber/20">
          <AlertTriangle class="size-4" />
        </div>
      </CardContent>
    </Card>

    <Card class="card-hover cursor-default bg-card/60 border-triage-green/20">
      <CardContent class="p-5 flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-triage-green uppercase tracking-wider">Green Stable</p>
          <p class="text-2xl font-bold text-triage-green mt-1 tabular-nums">{stats.green}</p>
        </div>
        <div class="size-10 rounded-lg bg-triage-green/10 flex items-center justify-center text-triage-green ring-1 ring-triage-green/20">
          <CheckCircle2 class="size-4" />
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- Queue Table -->
  <Card class="overflow-hidden card-hover">
    <CardHeader class="border-b border-border bg-muted/30 px-6 py-4">
      <CardTitle class="text-base font-semibold">Active Queue</CardTitle>
      <CardDescription>Real-time patient flow and triaging</CardDescription>
    </CardHeader>
    <ScrollArea class="h-[450px] w-full">
      <Table>
        <TableHeader class="bg-muted/40 sticky top-0 z-10">
          <TableRow class="hover:bg-transparent">
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 w-20 text-xs uppercase tracking-wider">#</TableHead>
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider">Patient Name</TableHead>
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider">Triage Priority</TableHead>
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider">Reason</TableHead>
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider">Status</TableHead>
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 text-right w-44 text-xs uppercase tracking-wider">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody class="animate-stagger">
          {#if sortedQueue.length === 0}
            <TableRow>
              <TableCell colspan={6} class="text-center py-16 text-muted-foreground">
                <div class="flex flex-col items-center justify-center">
                  <UserCheck class="size-8 text-muted-foreground/60 mb-2" />
                  <span class="text-sm font-medium">No patients in the queue</span>
                </div>
              </TableCell>
            </TableRow>
          {:else}
            {#each sortedQueue as ticket (ticket.id)}
              {@const patient = patientStore.get(ticket.patientId)}
              <TableRow class="hover:bg-muted/40 border-b border-border transition-colors group">
                <TableCell class="font-semibold text-foreground px-6 py-4 tabular-nums">{ticket.ticketNumber}</TableCell>
                <TableCell class="px-6 py-4">
                  {#if patient}
                    <div class="font-medium text-foreground">{patient.name}</div>
                    <div class="text-xs text-muted-foreground mt-0.5 font-mono">{patient.clinicId}</div>
                  {:else}
                    <span class="text-muted-foreground italic">Unknown Patient</span>
                  {/if}
                </TableCell>
                <TableCell class="px-6 py-4">
                  {#if ticket.triageLevel === 'red'}
                    <Badge class="bg-triage-red text-triage-red-foreground font-semibold px-2 py-0.5 hover:bg-triage-red animate-pulse glow-triage-red">RED</Badge>
                  {:else if ticket.triageLevel === 'amber'}
                    <Badge class="bg-triage-amber text-triage-amber-foreground font-semibold px-2 py-0.5 hover:bg-triage-amber">AMBER</Badge>
                  {:else}
                    <Badge class="bg-triage-green text-triage-green-foreground font-semibold px-2 py-0.5 hover:bg-triage-green">GREEN</Badge>
                  {/if}
                </TableCell>
                <TableCell class="text-muted-foreground px-6 py-4 max-w-[200px] truncate">{ticket.triageReason ?? 'Normal triage'}</TableCell>
                <TableCell class="px-6 py-4">
                  {#if ticket.status === 'called'}
                    <Badge variant="secondary" class="bg-primary/10 text-primary font-semibold border-primary/20 animate-pulse text-xs">Called</Badge>
                  {:else}
                    <Badge variant="outline" class="text-muted-foreground font-semibold text-xs capitalize">{ticket.status}</Badge>
                  {/if}
                </TableCell>
                <TableCell class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                    {#if ticket.status !== 'called'}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        class="border-border text-muted-foreground hover:text-foreground hover:bg-muted btn-press h-8 px-3"
                        onclick={() => handleMarkCalled(ticket.id)}
                      >
                        <Megaphone class="size-3.5 mr-1" />
                        Call
                      </Button>
                    {/if}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      class="text-destructive hover:text-destructive hover:bg-destructive/10 btn-press h-8 px-3"
                      onclick={() => handleComplete(ticket.id)}
                    >
                      <Check class="size-3.5 mr-1" />
                      Done
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </ScrollArea>
  </Card>
</div>
