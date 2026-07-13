<script lang="ts">
  import { patientStore } from '$lib/state/patients.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import QrCode from '$lib/components/QrCode.svelte';
  import { Search, Printer, User, FolderOpen, Scan, FileText, ArrowRight } from '@lucide/svelte';

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

<div class="space-y-8 animate-fade-in">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div class="flex items-start gap-3">
      <div class="p-2.5 rounded-xl bg-primary/10 text-primary">
        <FolderOpen class="size-6" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-foreground tracking-tight">Patients Registry</h1>
        <p class="text-muted-foreground text-sm mt-0.5 font-medium">Manage and view all registered patient files</p>
      </div>
    </div>
    <div class="w-full md:w-80 relative">
      <Search class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
      <Input 
        bind:value={searchTerm}
        placeholder="Search by name, ID or phone..."
        class="pl-9 h-11 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
      />
    </div>
  </div>

  <Card class="overflow-hidden card-hover">
    <CardHeader class="border-b border-border bg-muted/20 px-6 py-4">
      <CardTitle class="text-base font-semibold">Registered Patient Files</CardTitle>
      <CardDescription>Offline-first copy of clinic registration registry</CardDescription>
    </CardHeader>

    <ScrollArea class="h-[500px] w-full">
      <Table>
        <TableHeader class="bg-muted/40 sticky top-0 z-10">
          <TableRow class="hover:bg-transparent">
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider">Clinic ID</TableHead>
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider">Full Name</TableHead>
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider">Phone</TableHead>
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider">Sex</TableHead>
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider">DOB</TableHead>
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider">Community</TableHead>
            <TableHead class="font-semibold text-muted-foreground px-6 py-3.5 text-right w-32 text-xs uppercase tracking-wider">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody class="animate-stagger">
          {#if results.length === 0}
            <TableRow>
              <TableCell colspan={7} class="text-center py-16 text-muted-foreground">
                <div class="flex flex-col items-center justify-center">
                  <User class="size-8 text-muted-foreground/60 mb-2" />
                  <span class="text-sm font-medium">No patient records found</span>
                </div>
              </TableCell>
            </TableRow>
          {:else}
            {#each results as patient (patient.id)}
              <TableRow class="hover:bg-muted/40 border-b border-border transition-colors group">
                <TableCell class="font-mono font-bold text-primary px-6 py-4 text-sm">{patient.clinicId}</TableCell>
                <TableCell class="font-semibold text-foreground px-6 py-4 text-sm">{patient.name}</TableCell>
                <TableCell class="text-muted-foreground px-6 py-4 text-sm">{patient.phone ?? '—'}</TableCell>
                <TableCell class="text-muted-foreground px-6 py-4 uppercase text-xs font-semibold">{patient.sex}</TableCell>
                <TableCell class="text-muted-foreground px-6 py-4 text-sm">{patient.dob ?? '—'}</TableCell>
                <TableCell class="text-muted-foreground px-6 py-4 text-sm">{patient.community ?? '—'}</TableCell>
                <TableCell class="px-6 py-4 text-right">
                  <Dialog>
                    <DialogTrigger class="inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted btn-press h-8 px-3 text-xs">
                      <Scan class="size-3.5 mr-1" />
                      View Card
                    </DialogTrigger>
                    <DialogContent class="bg-card border-border max-w-sm text-center">
                      <DialogHeader>
                        <DialogTitle class="text-foreground text-lg font-bold">{patient.name}</DialogTitle>
                        <DialogDescription class="font-mono text-xs">{patient.clinicId}</DialogDescription>
                      </DialogHeader>

                      <div class="flex flex-col items-center justify-center py-6 space-y-4 print:p-0">
                        <div class="bg-white p-4 rounded-xl border border-border">
                          <QrCode value={patient.clinicId} />
                        </div>
                        <p class="text-xs text-muted-foreground font-medium max-w-[220px]">
                          Scan QR code on kiosk to load patient files.
                        </p>
                      </div>

                      <div class="flex justify-end gap-2 print:hidden border-t border-border/60 pt-3">
                        <Button class="bg-primary text-primary-foreground hover:bg-primary/95 btn-press h-9 text-xs" onclick={handlePrintQr}>
                          <Printer class="size-3.5 mr-1.5" />
                          Print ID Card
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
    </ScrollArea>
  </Card>
</div>
