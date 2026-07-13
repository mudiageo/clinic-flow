<script lang="ts">
  import { queueStore } from '$lib/state/queue.svelte';
  import { patientStore } from '$lib/state/patients.svelte';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Select as SelectPrimitive } from 'bits-ui';
  import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { onMount } from 'svelte';
  import { Badge } from '$lib/components/ui/badge';

  const waitingTickets = $derived(
    queueStore.sortedQueue.filter((t: any) => t.status === 'waiting')
  );
  
  const calledTickets = $derived(
    queueStore.sortedQueue.filter((t: any) => t.status === 'called')
  );

  let voices = $state<SpeechSynthesisVoice[]>([]);
  let selectedVoiceURI = $state<string>('');

  onMount(() => {
    const loadVoices = () => {
      voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 && !selectedVoiceURI) {
        selectedVoiceURI = voices[0].voiceURI;
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  });

  let lastAnnouncedTicketId = $state<string | null>(null);

  $effect(() => {
    // Find the most recently called ticket
    if (calledTickets.length > 0) {
      const newlyCalled = [...calledTickets].sort((a, b) => (b.calledAt || 0) - (a.calledAt || 0))[0];
      
      if (newlyCalled && newlyCalled.id !== lastAnnouncedTicketId && newlyCalled.calledAt) {
        // Prevent announcing old tickets on page load
        if (Date.now() - newlyCalled.calledAt < 60000) {
          announcePatient(newlyCalled);
          lastAnnouncedTicketId = newlyCalled.id;
        } else {
          // It's old, just mark it so we don't announce it
          lastAnnouncedTicketId = newlyCalled.id;
        }
      }
    }
  });

  function announcePatient(ticket: any) {
    const patient = patientStore.get(ticket.patientId);
    if (!patient) return;

    // Play a chime
    playChime();

    const voice = voices.find(v => v.voiceURI === selectedVoiceURI) || null;
    
    setTimeout(() => {
      const msg = new SpeechSynthesisUtterance();
      msg.text = `Patient ${patient.name}, please proceed to the doctor's desk.`;
      msg.rate = 0.9;
      msg.pitch = 1;
      if (voice) msg.voice = voice;
      
      window.speechSynthesis.speak(msg);
      
      // Repeat once after a delay
      setTimeout(() => {
        const msg2 = new SpeechSynthesisUtterance();
        msg2.text = `I repeat. Patient ${patient.name}, please proceed to the doctor's desk.`;
        msg2.rate = 0.9;
        if (voice) msg2.voice = voice;
        window.speechSynthesis.speak(msg2);
      }, 5000);
    }, 1000);
  }

  function playChime() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch(e) {
      console.warn("Audio chime not supported");
    }
  }

  function testAnnouncement() {
    if (waitingTickets.length > 0) {
      announcePatient(waitingTickets[0]);
    } else {
      playChime();
      const msg = new SpeechSynthesisUtterance("This is a test announcement for the waiting room.");
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) msg.voice = voice;
      window.speechSynthesis.speak(msg);
    }
  }
</script>

<svelte:head>
  <title>Waiting Room TV — ClinicFlow</title>
</svelte:head>

<!-- Fullscreen TV UI -->
<div class="h-screen w-full flex flex-col bg-slate-950 p-8 overflow-hidden">
  
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-5xl font-extrabold text-white tracking-tight">ClinicFlow Waiting Room</h1>
      <p class="text-2xl text-slate-400 mt-2">Please wait for your name to be called</p>
    </div>
    
    <div class="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
      <div class="space-y-1">
        <label class="text-xs font-bold text-slate-500 uppercase">Announcement Voice</label>
        <Select type="single" bind:value={selectedVoiceURI}>
          <SelectTrigger class="bg-slate-950/50 border-slate-700 text-white w-64 h-10">
            <SelectPrimitive.Value placeholder="Select Voice" />
          </SelectTrigger>
          <SelectContent class="bg-slate-950 border-slate-800 max-h-60 overflow-y-auto">
            {#each voices as voice}
              <SelectItem value={voice.voiceURI} class="text-white hover:bg-slate-900">{voice.name} ({voice.lang})</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" class="h-10 border-slate-700 text-slate-300 hover:text-white" onclick={testAnnouncement}>
        Test Audio
      </Button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
    
    <!-- Currently Called List -->
    <Card class="bg-teal-950/20 border-teal-900/50 flex flex-col h-full overflow-hidden">
      <CardHeader class="bg-teal-950/50 border-b border-teal-900/50 py-6">
        <CardTitle class="text-teal-400 text-3xl font-bold text-center">NOW CALLING</CardTitle>
      </CardHeader>
      <CardContent class="p-6 overflow-y-auto flex-1 space-y-4">
        {#if calledTickets.length === 0}
          <div class="h-full flex items-center justify-center">
            <p class="text-2xl text-teal-900/50 font-bold uppercase tracking-widest">No Active Calls</p>
          </div>
        {:else}
          {#each calledTickets as ticket}
            {@const p = patientStore.get(ticket.patientId)}
            <div class="bg-teal-900/30 border border-teal-500/30 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <div class="text-4xl font-bold text-white">{p?.name || 'Unknown Patient'}</div>
                <div class="text-xl text-teal-400 mt-2 font-mono">{p?.clinicId}</div>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold text-teal-500 uppercase tracking-widest">Proceed To</div>
                <div class="text-3xl font-black text-white mt-1">DOCTOR</div>
              </div>
            </div>
          {/each}
        {/if}
      </CardContent>
    </Card>

    <!-- Up Next List -->
    <Card class="bg-slate-900/40 border-slate-900 flex flex-col h-full overflow-hidden">
      <CardHeader class="bg-slate-900/60 border-b border-slate-800 py-6">
        <CardTitle class="text-slate-300 text-2xl font-bold text-center">PLEASE WAIT</CardTitle>
      </CardHeader>
      <CardContent class="p-6 overflow-y-auto flex-1">
        <div class="grid grid-cols-1 gap-4 mt-4">
          {#if waitingTickets.length === 0}
             <div class="py-12 text-center">
               <p class="text-xl text-slate-600 font-medium">Queue is currently empty</p>
             </div>
          {:else}
            {#each waitingTickets.slice(0, 10) as ticket, i}
              {@const p = patientStore.get(ticket.patientId)}
              <div class="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-lg">
                    {i + 1}
                  </div>
                  <div>
                    <div class="text-xl font-bold text-slate-200">{p?.name || 'Unknown Patient'}</div>
                    <div class="text-sm text-slate-500 font-mono">{p?.clinicId}</div>
                  </div>
                </div>
                <div>
                  {#if ticket.triageLevel === 'red'}
                    <Badge class="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 text-sm">Priority</Badge>
                  {/if}
                </div>
              </div>
            {/each}
            
            {#if waitingTickets.length > 10}
              <div class="text-center pt-4 pb-2 text-slate-500 font-semibold">
                + {waitingTickets.length - 10} more patients waiting
              </div>
            {/if}
          {/if}
        </div>
      </CardContent>
    </Card>

  </div>
</div>
