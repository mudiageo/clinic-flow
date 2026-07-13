<script lang="ts">
  import { patientStore } from '$lib/state/patients.svelte';
  import { vitalsStore } from '$lib/state/vitals.svelte';
  import { queueStore } from '$lib/state/queue.svelte';
  import { triageRuleStore } from '$lib/state/triage-rules.svelte';
  import QrScanner from '$lib/components/QrScanner.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription
  } from '$lib/components/ui/card';
  import { toast } from 'svelte-sonner';
  import { onMount } from 'svelte';
  import { 
    Thermometer, 
    Heart, 
    Activity, 
    Weight, 
    Percent, 
    Scan, 
    User, 
    AlertCircle, 
    AlertTriangle, 
    CheckCircle2, 
    ArrowRight, 
    Clock, 
    Search,
    ShieldAlert
  } from '@lucide/svelte';

  let showScanner = $state(false);
  let searchQuery = $state('');
  let selectedPatient = $state<any>(null);

  // Vitals inputs
  let temperature = $state<number | undefined>(undefined);
  let systolicBp = $state<number | undefined>(undefined);
  let diastolicBp = $state<number | undefined>(undefined);
  let pulse = $state<number | undefined>(undefined);
  let weight = $state<number | undefined>(undefined);
  let spo2 = $state<number | undefined>(undefined);

  // Active triage rules loaded from local store
  const rules = $derived(triageRuleStore.activeRules);

  onMount(async () => {
    try {
      // Seed default rules if empty
      await triageRuleStore.seedDefaults('00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.error('Failed to initialize triage rules:', err);
    }
  });

  const searchResults = $derived(searchQuery ? patientStore.search(searchQuery) : []);

  // Compute live triage status
  const currentVitals = $derived({
    temperatureCelsius: temperature,
    systolicBp,
    diastolicBp,
    pulseBpm: pulse,
    weightKg: weight,
    spo2Percent: spo2
  });

  const triageResult = $derived(
    vitalsStore.evaluateTriage(currentVitals, rules, selectedPatient?.isPregnant ?? false)
  );

  function handleSelectPatient(patient: any) {
    selectedPatient = patient;
    searchQuery = '';

    // Clear vitals
    temperature = undefined;
    systolicBp = undefined;
    diastolicBp = undefined;
    pulse = undefined;
    weight = undefined;
    spo2 = undefined;
  }

  function handleQrResult(clinicId: string) {
    showScanner = false;
    const found = patientStore.findByClinicId(clinicId);
    if (found) {
      handleSelectPatient(found);
      toast.success(`Patient: ${found.name} selected.`);
    } else {
      toast.error(`Patient not found: ${clinicId}`);
    }
  }

  async function handleSaveVitals() {
    if (!selectedPatient) {
      toast.error('Select a patient first');
      return;
    }

    try {
      const encounterId = crypto.randomUUID();

      // Save vitals to local DB
      await vitalsStore.create({
        encounterId,
        patientId: selectedPatient.id,
        temperatureCelsius: temperature ?? null,
        systolicBp: systolicBp ?? null,
        diastolicBp: diastolicBp ?? null,
        pulseBpm: pulse ?? null,
        weightKg: weight ?? null,
        spo2Percent: spo2 ?? null,
        triageLevel: triageResult.level,
        triageReason: triageResult.reason,
        recordedAt: Date.now()
      });

      // Find if patient has an active ticket in the queue, update it
      const activeTickets = queueStore.items.filter(
        (t: any) => t.patientId === selectedPatient.id && t.status === 'waiting'
      );

      if (activeTickets.length > 0) {
        for (const ticket of activeTickets) {
          await queueStore.applyTriageFlag(ticket.id, triageResult.level, triageResult.reason);
        }
      } else {
        // Issue new ticket if none active
        await queueStore.create({
          patientId: selectedPatient.id,
          phcId: crypto.randomUUID(),
          encounterId,
          ticketNumber: 0,
          status: 'waiting',
          triageLevel: triageResult.level,
          triageReason: triageResult.reason,
          calledAt: null,
          completedAt: null,
          createdAt: Date.now()
        });
      }

      toast.success(`Vitals saved. Patient triaged as ${triageResult.level.toUpperCase()}`);

      // Reset state
      selectedPatient = null;
    } catch (e: any) {
      toast.error(`Error saving vitals: ${e.message}`);
    }
  }
</script>

<svelte:head>
  <title>Vitals &amp; Triage — ClinicFlow</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-8 animate-fade-in">
  <div class="flex items-start gap-3">
    <div class="p-2.5 rounded-xl bg-primary/10 text-primary">
      <Thermometer class="size-6" />
    </div>
    <div>
      <h1 class="text-2xl font-bold text-foreground tracking-tight">Vitals &amp; Triage</h1>
      <p class="text-muted-foreground text-sm mt-0.5 font-medium">Record vitals and automatically determine patient urgency level</p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Left Column: Patient Selector -->
    <div class="space-y-6 lg:col-span-1">
      <Card class="bg-card/60 card-hover">
        <CardHeader class="pb-3">
          <CardTitle class="text-base font-semibold">Select Patient</CardTitle>
          <CardDescription>Scan identity card or search registry</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          {#if selectedPatient}
            <div class="p-4 bg-primary/10 border border-primary/20 rounded-xl relative animate-fade-in">
              <div class="font-bold text-foreground text-base flex items-center gap-1.5">
                <User class="size-4 text-primary" />
                {selectedPatient.name}
              </div>
              <div class="text-xs text-primary font-mono mt-1">{selectedPatient.clinicId}</div>
              <div class="text-xs text-muted-foreground mt-3 flex flex-wrap gap-1.5 items-center">
                <span class="capitalize">{selectedPatient.sex}</span>
                <span>•</span>
                <span>{selectedPatient.phone ?? 'No Phone'}</span>
                {#if selectedPatient.isPregnant}
                  <span>•</span>
                  <span class="text-triage-red font-semibold">Pregnant</span>
                {/if}
              </div>
              <Button
                variant="ghost"
                size="sm"
                class="absolute top-2 right-2 text-muted-foreground hover:text-foreground h-7 px-2 btn-press"
                onclick={() => (selectedPatient = null)}
              >
                Clear
              </Button>
            </div>
          {:else}
            <div class="relative">
              <Search class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
              <Input
                bind:value={searchQuery}
                placeholder="Search name or clinic ID..."
                class="pl-9 h-11 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
              />
            </div>

            {#if showScanner}
              <div class="mt-4 border border-border rounded-xl overflow-hidden bg-background p-2">
                <QrScanner onResult={handleQrResult} />
                <Button
                  variant="ghost"
                  class="w-full text-muted-foreground hover:text-foreground mt-2 btn-press"
                  onclick={() => (showScanner = false)}
                >
                  Cancel Scan
                </Button>
              </div>
            {:else}
              <Button
                variant="outline"
                class="w-full border-border text-foreground hover:bg-muted btn-press h-10"
                onclick={() => (showScanner = true)}
              >
                <Scan class="size-4 mr-2" />
                Scan QR Code
              </Button>
            {/if}

            <!-- Search Results -->
            {#if searchResults.length > 0}
              <div class="space-y-2 mt-4 max-h-60 overflow-y-auto no-scrollbar animate-stagger">
                {#each searchResults as patient}
                  <button
                    class="w-full text-left p-3 bg-muted/40 border border-border rounded-xl hover:bg-muted transition-colors flex items-center justify-between group"
                    onclick={() => handleSelectPatient(patient)}
                  >
                    <div>
                      <div class="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{patient.name}</div>
                      <div class="text-xs text-muted-foreground font-mono mt-0.5">{patient.clinicId}</div>
                    </div>
                    <ArrowRight class="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                {/each}
              </div>
            {/if}
          {/if}
        </CardContent>
      </Card>
    </div>

    <!-- Right Column: Vitals entry & live triage -->
    <div class="lg:col-span-2 space-y-6">
      <Card class="bg-card/60 card-hover">
        <CardHeader class="pb-3 border-b border-border/60">
          <CardTitle class="text-base font-semibold">Record Vitals</CardTitle>
          <CardDescription>Enter clinical measurements to compute severity index</CardDescription>
        </CardHeader>
        <CardContent class="space-y-6 pt-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="temp" class="text-foreground">Temperature (°C)</Label>
              <div class="relative">
                <Thermometer class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  bind:value={temperature}
                  placeholder="36.5"
                  class="pl-9 h-11 bg-background/50 border-border text-foreground"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="pulse" class="text-foreground">Heart Rate (BPM)</Label>
              <div class="relative">
                <Heart class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                <Input
                  id="pulse"
                  type="number"
                  bind:value={pulse}
                  placeholder="72"
                  class="pl-9 h-11 bg-background/50 border-border text-foreground"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="systolic" class="text-foreground">Systolic Blood Pressure (mmHg)</Label>
              <div class="relative">
                <Activity class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                <Input
                  id="systolic"
                  type="number"
                  bind:value={systolicBp}
                  placeholder="120"
                  class="pl-9 h-11 bg-background/50 border-border text-foreground"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="diastolic" class="text-foreground">Diastolic Blood Pressure (mmHg)</Label>
              <div class="relative">
                <Activity class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                <Input
                  id="diastolic"
                  type="number"
                  bind:value={diastolicBp}
                  placeholder="80"
                  class="pl-9 h-11 bg-background/50 border-border text-foreground"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="spo2" class="text-foreground">Oxygen Saturation - SpO2 (%)</Label>
              <div class="relative">
                <Percent class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                <Input
                  id="spo2"
                  type="number"
                  bind:value={spo2}
                  placeholder="98"
                  class="pl-9 h-11 bg-background/50 border-border text-foreground"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="weight" class="text-foreground">Weight (kg)</Label>
              <div class="relative">
                <Weight class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  bind:value={weight}
                  placeholder="70"
                  class="pl-9 h-11 bg-background/50 border-border text-foreground"
                />
              </div>
            </div>
          </div>

          <!-- Live Triage Banner -->
          {#if triageResult}
            {@const isRed = triageResult.level === 'red'}
            {@const isAmber = triageResult.level === 'amber'}
            <div
              class="p-5 rounded-xl border flex flex-col justify-center items-center text-center transition-all duration-300 animate-fade-in
              {isRed ? 'bg-triage-red/10 border-triage-red/30 text-triage-red glow-triage-red' : ''}
              {isAmber ? 'bg-triage-amber/10 border-triage-amber/30 text-triage-amber' : ''}
              {!isRed && !isAmber ? 'bg-triage-green/10 border-triage-green/30 text-triage-green' : ''}
            "
            >
              <div class="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert class="size-3.5" />
                Triage Severity Assessment
              </div>
              <div class="text-xl font-extrabold mt-1.5">
                {#if isRed}
                  RED FLAG — IMMEDIATE PRIORITIZATION
                {:else if isAmber}
                  AMBER FLAG — ELEVATED RISK
                {:else}
                  GREEN FLAG — STABLE STATUS
                {/if}
              </div>
              <div class="text-sm mt-2 font-medium opacity-90">{triageResult.reason}</div>
            </div>
          {/if}

          <div class="flex justify-end pt-2 border-t border-border/60">
            <Button
              disabled={!selectedPatient}
              onclick={handleSaveVitals}
              class="h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 btn-press"
            >
              Save Vitals &amp; Queue Patient
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>
