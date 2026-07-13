<script lang="ts">
  import { queueStore } from '$lib/state/queue.svelte';
  import { patientStore } from '$lib/state/patients.svelte';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Select as SelectPrimitive } from 'bits-ui';
  import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { onMount } from 'svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { HeartPulse, Volume2, Play, Users, Clock, AlertTriangle, MonitorPlay } from '@lucide/svelte';

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
        if (Date.now() - newlyCalled.calledAt < 60000) {
          announcePatient(newlyCalled);
          lastAnnouncedTicketId = newlyCalled.id;
        } else {
          lastAnnouncedTicketId = newlyCalled.id;
        }
      }
    }
  });

  function announcePatient(ticket: any) {
    const patient = patientStore.get(ticket.patientId);
    if (!patient) return;

    playChime();

    const voice = voices.find(v => v.voiceURI === selectedVoiceURI) || null;
    
    setTimeout(() => {
      const msg = new SpeechSynthesisUtterance();
      msg.text = `Patient ${patient.name}, please proceed to the doctor's desk.`;
      msg.rate = 0.9;
      msg.pitch = 1;
      if (voice) msg.voice = voice;
      
      window.speechSynthesis.speak(msg);
      
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
<div class="min-h-screen w-full flex flex-col bg-background p-4 md:p-8 overflow-hidden animate-fade-in">
  
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
    <div class="flex items-center gap-3">
      <div class="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
        <HeartPulse class="size-6" />
      </div>
      <div>
        <h1 class="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight">ClinicFlow Waiting Room</h1>
        <p class="text-sm md:text-lg text-muted-foreground mt-0.5 font-medium">Please watch this screen and wait for your name to be announced</p>
      </div>
    </div>
    
    <div class="flex flex-wrap items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border">
      <div class="space-y-1">
        <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Volume2 class="size-3" />
          Announcement Voice
        </span>
        <Select type="single" bind:value={selectedVoiceURI}>
          <SelectTrigger class="bg-background border-border text-foreground w-48 md:w-60 h-9 text-xs" aria-label="Select Voice">
            <SelectPrimitive.Value placeholder="Select Voice" />
          </SelectTrigger>
          <SelectContent class="bg-card border-border max-h-48 overflow-y-auto text-xs">
            {#each voices as voice}
              <SelectItem value={voice.voiceURI} class="hover:bg-muted">{voice.name} ({voice.lang})</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" class="h-9 text-xs border-border text-foreground btn-press self-end" onclick={testAnnouncement}>
        <Play class="size-3.5 mr-1" />
        Test Audio
      </Button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
    
    <!-- Currently Called List -->
    <Card class="bg-primary/5 border-primary/20 flex flex-col h-[400px] lg:h-full overflow-hidden card-hover">
      <CardHeader class="bg-primary/10 border-b border-primary/20 py-4 md:py-6">
        <CardTitle class="text-primary text-xl md:text-3xl font-extrabold text-center flex items-center justify-center gap-2">
          <MonitorPlay class="size-6 animate-pulse" />
          NOW CALLING
        </CardTitle>
      </CardHeader>
      <CardContent class="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 no-scrollbar">
        {#if calledTickets.length === 0}
          <div class="h-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground/40">
            <Clock class="size-12 mb-3" />
            <p class="text-xl md:text-2xl font-bold uppercase tracking-widest">No Active Calls</p>
          </div>
        {:else}
          {#each calledTickets as ticket}
            {@const p = patientStore.get(ticket.patientId)}
            <div class="bg-primary/10 border border-primary/20 p-5 md:p-6 rounded-2xl flex items-center justify-between animate-fade-in shadow-md shadow-primary/5">
              <div>
                <div class="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight">{p?.name || 'Unknown Patient'}</div>
                <div class="text-sm md:text-lg text-primary mt-1 font-mono font-bold">{p?.clinicId}</div>
              </div>
              <div class="text-right">
                <div class="text-xs md:text-sm font-bold text-primary uppercase tracking-wider">Proceed To</div>
                <div class="text-xl md:text-3xl font-black text-foreground mt-0.5 tracking-tight">DOCTOR DESK</div>
              </div>
            </div>
          {/each}
        {/if}
      </CardContent>
    </Card>

    <!-- Up Next List -->
    <Card class="overflow-hidden bg-card/60 flex flex-col h-[400px] lg:h-full card-hover">
      <CardHeader class="bg-muted/20 border-b border-border/60 py-4 md:py-6">
        <CardTitle class="text-foreground text-lg md:text-2xl font-extrabold text-center flex items-center justify-center gap-2">
          <Users class="size-5 text-muted-foreground" />
          UP NEXT / WAITING
        </CardTitle>
      </CardHeader>
      <CardContent class="p-4 md:p-6 overflow-hidden flex-1 flex flex-col">
        <ScrollArea class="h-full w-full pr-1">
          <div class="grid grid-cols-1 gap-3">
            {#if waitingTickets.length === 0}
               <div class="py-16 text-center text-muted-foreground/60 flex flex-col items-center justify-center">
                 <Clock class="size-8 mb-2" />
                 <p class="text-sm font-medium">Queue is currently empty</p>
               </div>
            {:else}
              {#each waitingTickets.slice(0, 10) as ticket, i}
                {@const p = patientStore.get(ticket.patientId)}
                <div class="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <div class="text-base md:text-lg font-bold text-foreground tracking-tight">{p?.name || 'Unknown Patient'}</div>
                      <div class="text-xs text-muted-foreground font-mono mt-0.5">{p?.clinicId}</div>
                    </div>
                  </div>
                  <div>
                    {#if ticket.triageLevel === 'red'}
                      <Badge class="bg-triage-red/15 text-triage-red border-triage-red/25 hover:bg-triage-red/15 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase animate-pulse">Priority</Badge>
                    {/if}
                  </div>
                </div>
              {/each}
              
              {#if waitingTickets.length > 10}
                <div class="text-center pt-4 pb-2 text-xs font-bold text-muted-foreground tracking-wider uppercase">
                  + {waitingTickets.length - 10} more patients waiting
                </div>
              {/if}
            {/if}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>

  </div>
</div>
