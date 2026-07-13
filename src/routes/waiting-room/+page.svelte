<script lang="ts">
  import { queueStore } from '$lib/state/queue.svelte';
  import { patientStore } from '$lib/state/patients.svelte';
  import { onMount } from 'svelte';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';

  let lastAnnouncedId = $state<string | null>(null);

  const waitingTickets = $derived(
    queueStore.sortedQueue.filter((t: any) => t.status === 'waiting')
  );

  const calledTickets = $derived(
    queueStore.sortedQueue.filter((t: any) => t.status === 'called')
  );

  // Announcement trigger logic on called state updates
  $effect(() => {
    const nextCall = calledTickets[0]; // Get the most recently called ticket
    if (nextCall && nextCall.id !== lastAnnouncedId) {
      announceTicket(nextCall.ticketNumber);
      lastAnnouncedId = nextCall.id;
    }
  });

  function announceTicket(num: number) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Ticket number ${num}, please proceed to the consultation room.`);
      utterance.lang = 'en-NG'; // Nigerian English standard
      speechSynthesis.speak(utterance);
    }
  }
</script>

<svelte:head>
  <title>Waiting Room Queue — ClinicFlow</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 p-6 lg:p-12 flex flex-col justify-between space-y-12">
  <!-- Header Title -->
  <div class="text-center">
    <h1 class="text-4xl lg:text-5xl font-extrabold text-white tracking-tight uppercase">Oredo Primary Health Centre</h1>
    <p class="text-teal-400 text-lg mt-2 font-medium tracking-wide">WAITING ROOM QUEUE DISPLAY</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1">
    <!-- Big Left Box: NOW CALLED -->
    <Card class="bg-gradient-to-br from-teal-500/10 to-emerald-600/10 border-teal-500/20 backdrop-blur lg:col-span-1 flex flex-col justify-between p-8 text-center rounded-3xl min-h-[400px]">
      <div>
        <p class="text-teal-400 text-md font-bold uppercase tracking-widest animate-pulse">Now Called</p>
        <p class="text-slate-400 text-sm mt-1">Please proceed to consultation room</p>
      </div>

      <div class="py-12">
        {#if calledTickets.length === 0}
          <div class="text-slate-600 text-lg italic">Waiting for next call...</div>
        {:else}
          {@const active = calledTickets[0]}
          {@const p = patientStore.get(active.patientId)}
          <div class="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_35px_rgba(20,184,166,0.3)]">
            #{active.ticketNumber}
          </div>
          {#if p}
            <div class="text-2xl font-bold text-teal-400 mt-6 uppercase tracking-wider">{p.name}</div>
          {/if}
        {/if}
      </div>

      <div class="text-xs text-slate-500">
        🏥 ClinicFlow Voice Assist Active
      </div>
    </Card>

    <!-- Right Box: NEXT IN LINE -->
    <Card class="bg-slate-900/30 border-slate-900 backdrop-blur lg:col-span-2 flex flex-col p-8 rounded-3xl">
      <CardHeader class="p-0 pb-6 border-b border-slate-900 flex flex-row items-center justify-between">
        <div>
          <CardTitle class="text-white text-xl uppercase tracking-wider">Queue List</CardTitle>
          <p class="text-slate-500 text-xs mt-1">Order based on triage level and registration time</p>
        </div>
      </CardHeader>

      <CardContent class="p-0 pt-6 flex-1 overflow-y-auto max-h-[500px]">
        {#if waitingTickets.length === 0}
          <p class="text-slate-600 text-center py-24 italic">Queue is currently empty.</p>
        {:else}
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {#each waitingTickets as ticket (ticket.id)}
              <div class="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 flex flex-col items-center justify-between gap-3 text-center transition-all hover:scale-105">
                <div class="text-3xl font-extrabold text-white">#{ticket.ticketNumber}</div>
                {#if ticket.triageLevel === 'red'}
                  <Badge class="bg-triage-red text-triage-red-foreground font-semibold text-[10px]">🔴 RED</Badge>
                {:else if ticket.triageLevel === 'amber'}
                  <Badge class="bg-triage-amber text-triage-amber-foreground font-semibold text-[10px]">🟡 AMBER</Badge>
                {:else}
                  <Badge class="bg-triage-green text-triage-green-foreground font-semibold text-[10px]">🟢 GREEN</Badge>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  </div>

  <div class="text-center text-slate-600 text-xs">
    ClinicFlow Display System · Powered by local offline-first synchronisation
  </div>
</div>
