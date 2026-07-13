<script lang="ts">
  import { queueStore } from '$lib/state/queue.svelte';
  import { patientStore } from '$lib/state/patients.svelte';
  import { vitalsStore } from '$lib/state/vitals.svelte';
  import { pharmacyStore } from '$lib/state/pharmacy.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Select as SelectPrimitive } from 'bits-ui';
  import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Separator } from '$lib/components/ui/separator';
  import { toast } from 'svelte-sonner';

  let selectedTicket = $state<any>(null);
  let chiefComplaint = $state('');
  let doctorNotes = $state('');

  // Prescription builder state
  let selectedMedId = $state('');
  let quantity = $state<number>(1);
  let dosage = $state('');
  let prescriptions = $state<Array<{ id: string; name: string; quantity: number; dosage: string }>>([]);

  const activeTickets = $derived(
    queueStore.sortedQueue.filter((t: any) => t.status === 'called' || t.status === 'waiting')
  );

  const patient = $derived(selectedTicket ? patientStore.get(selectedTicket.patientId) : null);
  const vitals = $derived(selectedTicket ? vitalsStore.forPatient(selectedTicket.patientId)[0] : null);

  function handleSelectTicket(ticket: any) {
    selectedTicket = ticket;
    chiefComplaint = '';
    doctorNotes = '';
    prescriptions = [];
    selectedMedId = '';
    quantity = 1;
    dosage = '';
  }

  function handleAddMed() {
    if (!selectedMedId) {
      toast.error('Select a medication first');
      return;
    }
    const med = pharmacyStore.get(selectedMedId);
    if (!med) return;

    if (quantity <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    prescriptions = [
      ...prescriptions,
      {
        id: selectedMedId,
        name: med.itemName,
        quantity,
        dosage
      }
    ];

    selectedMedId = '';
    quantity = 1;
    dosage = '';
  }

  function handleRemoveMed(index: number) {
    prescriptions = prescriptions.filter((_, i) => i !== index);
  }

  async function handleCompleteEncounter() {
    if (!selectedTicket) return;

    try {
      // 1. Delta-decrement pharmacy inventory for each prescription (offline-first)
      for (const p of prescriptions) {
        await pharmacyStore.deltaDecrement(p.id, p.quantity);
      }

      // 2. Mark queue ticket as completed/done
      await queueStore.update(selectedTicket.id, {
        status: 'done',
        completedAt: Date.now()
      } as any);

      toast.success('Consultation completed successfully! Inventory stock decremented.');
      
      // Clear workspace
      selectedTicket = null;
    } catch (e: any) {
      toast.error(`Failed to complete: ${e.message}`);
    }
  }
</script>

<svelte:head>
  <title>Doctor Desk — ClinicFlow</title>
</svelte:head>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <!-- Left Side: Consultation Queue -->
  <div class="space-y-6 lg:col-span-1">
    <div>
      <h1 class="text-3xl font-extrabold text-white tracking-tight">Doctor Desk</h1>
      <p class="text-slate-400 mt-1">Consultation Waiting Room List</p>
    </div>

    <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
      <CardHeader>
        <CardTitle class="text-white text-lg">Active Consultations</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <div class="divide-y divide-slate-900">
          {#if activeTickets.length === 0}
            <p class="text-slate-500 text-center py-12 text-sm">No active patients waiting.</p>
          {:else}
            {#each activeTickets as ticket (ticket.id)}
              {@const p = patientStore.get(ticket.patientId)}
              <button 
                class="w-full text-left p-4 hover:bg-slate-900/30 flex items-center justify-between transition-colors
                  {selectedTicket?.id === ticket.id ? 'bg-slate-900/50' : ''}"
                onclick={() => handleSelectTicket(ticket)}
              >
                <div>
                  {#if p}
                    <div class="font-semibold text-white">{p.name}</div>
                    <div class="text-xs text-slate-500 mt-0.5">{p.clinicId}</div>
                  {:else}
                    <div class="text-slate-500">Unknown Patient</div>
                  {/if}
                </div>
                <div class="flex items-center gap-2">
                  {#if ticket.triageLevel === 'red'}
                    <Badge class="bg-triage-red text-triage-red-foreground font-semibold">🔴 RED</Badge>
                  {:else}
                    {#if ticket.triageLevel === 'amber'}
                      <Badge class="bg-triage-amber text-triage-amber-foreground font-semibold">🟡 AMBER</Badge>
                    {:else}
                      <Badge class="bg-triage-green text-triage-green-foreground font-semibold">🟢 GREEN</Badge>
                    {/if}
                  {/if}
                </div>
              </button>
            {/each}
          {/if}
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- Right Side: Consultation Form Workspace -->
  <div class="lg:col-span-2 space-y-6">
    {#if selectedTicket}
      <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
        <CardHeader class="border-b border-slate-900 flex flex-row items-center justify-between">
          <div>
            <CardTitle class="text-white text-xl">{patient?.name}</CardTitle>
            <CardDescription class="text-slate-400 mt-1">{patient?.clinicId} · Sex: {patient?.sex.toUpperCase()}</CardDescription>
          </div>
          <div>
            {#if selectedTicket.triageLevel === 'red'}
              <Badge class="bg-triage-red text-triage-red-foreground">RED - IMMEDIATE</Badge>
            {:else if selectedTicket.triageLevel === 'amber'}
              <Badge class="bg-triage-amber text-triage-amber-foreground">AMBER - STABLE ALERT</Badge>
            {:else}
              <Badge class="bg-triage-green text-triage-green-foreground">GREEN - STABLE</Badge>
            {/if}
          </div>
        </CardHeader>
        <CardContent class="pt-6 space-y-6">
          <!-- Vitals Summary Card -->
          {#if vitals}
            <div class="p-4 bg-slate-950/50 border border-slate-900 rounded-2xl grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
              <div>
                <p class="text-xs text-slate-500 font-semibold uppercase">Temp</p>
                <p class="text-lg font-bold text-white mt-1">{vitals.temperatureCelsius ?? '—'}°C</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 font-semibold uppercase">BP</p>
                <p class="text-lg font-bold text-white mt-1">{vitals.systolicBp ?? '—'}/{vitals.diastolicBp ?? '—'}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 font-semibold uppercase">Pulse</p>
                <p class="text-lg font-bold text-white mt-1">{vitals.pulseBpm ?? '—'} BPM</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 font-semibold uppercase">SpO2</p>
                <p class="text-lg font-bold text-white mt-1">{vitals.spo2Percent ?? '—'}%</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 font-semibold uppercase">Weight</p>
                <p class="text-lg font-bold text-white mt-1">{vitals.weightKg ?? '—'} kg</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 font-semibold uppercase">Triage Rule</p>
                <p class="text-xs font-semibold text-teal-400 mt-1 truncate px-1">{vitals.triageReason ?? 'Normal'}</p>
              </div>
            </div>
          {/if}

          <!-- Encounter Form -->
          <div class="space-y-4">
            <div class="space-y-2">
              <Label class="text-slate-300">Chief Complaint</Label>
              <Textarea bind:value={chiefComplaint} placeholder="Type or use voice dictation..." class="bg-slate-950/50 border-slate-800 text-white min-h-[80px]" />
            </div>

            <div class="space-y-2">
              <Label class="text-slate-300">Clinical Consultation Notes</Label>
              <Textarea bind:value={doctorNotes} placeholder="Observations, diagnosis plans..." class="bg-slate-950/50 border-slate-800 text-white min-h-[120px]" />
            </div>
          </div>

          <!-- Prescription Builder Section -->
          <Separator class="bg-slate-900" />
          <div class="space-y-4">
            <h3 class="text-white font-bold text-md">Prescription Builder</h3>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div class="md:col-span-2 space-y-2">
                <Label class="text-slate-300">Medication Item</Label>
                <Select type="single" bind:value={selectedMedId}>
                  <SelectTrigger class="bg-slate-950/50 border-slate-800 text-white h-11">
                    <SelectPrimitive.Value placeholder="Select Medication" />
                  </SelectTrigger>
                  <SelectContent class="bg-slate-950 border-slate-800 max-h-60 overflow-y-auto">
                    {#each pharmacyStore.items as med}
                      <SelectItem value={med.id} class="text-white hover:bg-slate-900">{med.itemName} ({med.currentStock} left)</SelectItem>
                    {/each}
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label class="text-slate-300">Qty</Label>
                <Input type="number" bind:value={quantity} min={1} class="bg-slate-950/50 border-slate-800 text-white h-11" />
              </div>

              <Button onclick={handleAddMed} class="bg-teal-600 hover:bg-teal-500 text-white h-11 rounded-xl">
                Add Med
              </Button>
            </div>

            <!-- Prescription List Table -->
            {#if prescriptions.length > 0}
              <Table class="border border-slate-900 rounded-xl overflow-hidden mt-4">
                <TableHeader class="bg-slate-950/50">
                  <TableRow>
                    <TableHead class="text-slate-400 font-semibold px-4 py-2">Item</TableHead>
                    <TableHead class="text-slate-400 font-semibold px-4 py-2 w-20">Qty</TableHead>
                    <TableHead class="text-slate-400 font-semibold px-4 py-2 text-right w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {#each prescriptions as item, idx}
                    <TableRow class="border-b border-slate-900">
                      <TableCell class="text-white px-4 py-2">{item.name}</TableCell>
                      <TableCell class="text-white px-4 py-2 font-bold">{item.quantity}</TableCell>
                      <TableCell class="text-right px-4 py-2">
                        <Button variant="ghost" size="sm" class="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onclick={() => handleRemoveMed(idx)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  {/each}
                </TableBody>
              </Table>
            {/if}
          </div>

          <!-- Footer Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-slate-900">
            <Button onclick={() => selectedTicket = null} variant="outline" class="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 h-12 px-6">
              Discard
            </Button>
            <Button onclick={handleCompleteEncounter} class="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/10 h-12 px-8">
              Complete Consultation
            </Button>
          </div>
        </CardContent>
      </Card>
    {:else}
      <div class="min-h-[400px] flex items-center justify-center border border-dashed border-slate-900 rounded-2xl p-8 text-slate-500">
        Select a patient from the waiting room queue to begin consultation.
      </div>
    {/if}
  </div>
</div>
