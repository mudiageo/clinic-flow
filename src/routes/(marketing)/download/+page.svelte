<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
  import { Monitor, Smartphone, Download, HardDrive, Cpu, ShieldCheck } from '@lucide/svelte';
</script>

<svelte:head>
  <title>Download ClinicFlow</title>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-16 animate-fade-in flex-1">
  <div class="text-center mb-16">
    <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">Download ClinicFlow</h1>
    <p class="mt-4 text-xl text-muted-foreground">Get the standalone kiosk app for your clinic hardware.</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <!-- Windows -->
    <Card class="bg-card/60 card-hover overflow-hidden border-border/80">
      <div class="h-2 w-full bg-blue-500"></div>
      <CardHeader>
        <div class="size-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
          <Monitor class="size-6" />
        </div>
        <CardTitle class="text-2xl">Windows (64-bit)</CardTitle>
        <CardDescription>Recommended for Reception and Doctor Desks.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <ul class="space-y-2 text-sm text-muted-foreground">
          <li class="flex items-center gap-2"><Cpu class="size-4" /> Windows 10 or 11 (64-bit)</li>
          <li class="flex items-center gap-2"><HardDrive class="size-4" /> 4GB RAM minimum</li>
          <li class="flex items-center gap-2"><ShieldCheck class="size-4" /> Auto-updates enabled</li>
        </ul>
        <Button href="/api/download?os=windows" class="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white btn-press">
          <Download class="mr-2 size-5" />
          Download .msi Installer
        </Button>
      </CardContent>
    </Card>

    <!-- Android -->
    <Card class="bg-card/60 card-hover overflow-hidden border-border/80">
      <div class="h-2 w-full bg-emerald-500"></div>
      <CardHeader>
        <div class="size-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
          <Smartphone class="size-6" />
        </div>
        <CardTitle class="text-2xl">Android Tablet</CardTitle>
        <CardDescription>Recommended for Nurse Triage Stations.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <ul class="space-y-2 text-sm text-muted-foreground">
          <li class="flex items-center gap-2"><Cpu class="size-4" /> Android 10.0 or higher</li>
          <li class="flex items-center gap-2"><HardDrive class="size-4" /> 3GB RAM minimum</li>
          <li class="flex items-center gap-2"><ShieldCheck class="size-4" /> Sideloading must be enabled</li>
        </ul>
        <Button href="/api/download?os=android" class="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white btn-press">
          <Download class="mr-2 size-5" />
          Download .apk File
        </Button>
      </CardContent>
    </Card>
  </div>
</div>
