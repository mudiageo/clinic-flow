<script lang="ts">
  import { patientStore } from '$lib/state/patients.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import QrCode from '$lib/components/QrCode.svelte';

  let searchTerm = $state('');
  let selectedPatientForQr = $state<any>(null);

  const results = $derived(
    searchTerm ? patientStore.search(searchTerm) : patientStore.items
  );

  function handlePrintQr() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
</script>

<svelte:head>
  <title>Patients Registry — ClinicFlow</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="text-3xl font-extrabold text-white tracking-tight">Patients Registry</h1>
      <p class="text-slate-400 mt-1">Manage and view all registered patient files</p>
    </div>
    <div class="w-full md:w-80">
      <Input 
        bind:value={searchTerm}
        placeholder="Search by name, ID or phone..."
        class="bg-slate-900/50 border-slate-900 text-white placeholder-slate-500 h-11 focus:border-teal-500 focus:ring-teal-500/20"
      />
    </div>
  </div>

  <Card class="bg-slate-900/30 border-slate-900 overflow-hidden">
    <CardHeader class="border-b border-slate-900 px-6 py-4">
      <CardTitle class="text-white text-lg">Registered Patient Files</CardTitle>
      <CardDescription class="text-slate-500">Offline-first copy of clinic registration registry</CardDescription>
    </CardHeader>

    <Table>
      <TableHeader class="bg-slate-950/40 border-b border-slate-900">
        <TableRow>
          <TableHead class="text-slate-400 font-semibold px-6 py-4">Clinic ID</TableHead>
          <TableHead class="text-slate-400 font-semibold px-6 py-4">Full Name</TableHead>
          <TableHead class="text-slate-400 font-semibold px-6 py-4">Phone</TableHead>
          <TableHead class="text-slate-400 font-semibold px-6 py-4">Sex</TableHead>
          <TableHead class="text-slate-400 font-semibold px-6 py-4">DOB</TableHead>
          <TableHead class="text-slate-400 font-semibold px-6 py-4">Community</TableHead>
          <TableHead class="text-slate-400 font-semibold px-6 py-4 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#if results.length === 0}
          <TableRow>
            <TableCell colspan={7} class="text-center py-12 text-slate-500">
              No patient records found.
            </TableCell>
          </TableRow>
        {:else}
          {#each results as patient (patient.id)}
            <TableRow class="hover:bg-slate-900/40 border-b border-slate-900 transition-colors">
              <TableCell class="font-bold text-teal-400 px-6 py-4">{patient.clinicId}</TableCell>
              <TableCell class="font-semibold text-white px-6 py-4">{patient.name}</TableCell>
              <TableCell class="text-slate-300 px-6 py-4">{patient.phone ?? '—'}</TableCell>
              <TableCell class="text-slate-300 px-6 py-4 uppercase text-xs">{patient.sex}</TableCell>
              <TableCell class="text-slate-300 px-6 py-4">{patient.dob ?? '—'}</TableCell>
              <TableCell class="text-slate-300 px-6 py-4">{patient.community ?? '—'}</TableCell>
              <TableCell class="px-6 py-4 text-right">
                <Dialog>
                  <DialogTrigger class="inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 h-9 px-3 text-xs">
                    View Card
                  </DialogTrigger>
                  <DialogContent class="bg-slate-950 border-slate-900 max-w-sm text-center">
                    <DialogHeader>
                      <DialogTitle class="text-white text-xl">{patient.name}</DialogTitle>
                      <DialogDescription class="text-slate-400">{patient.clinicId}</DialogDescription>
                    </DialogHeader>

                    <div class="flex flex-col items-center justify-center p-6 space-y-4 print:p-0">
                      <QrCode value={patient.clinicId} />
                      <p class="text-xs text-slate-500">
                        Scan QR code on kiosk to load patient files.
                      </p>
                    </div>

                    <div class="flex justify-end gap-2 print:hidden">
                      <Button variant="outline" class="border-slate-900 text-slate-300 hover:bg-slate-900" onclick={handlePrintQr}>
                        Print Card
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          {/each}
        {/if}
      </TableBody>
    </Table>
  </Card>
</div>
