<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { ArrowRight, WifiOff, LayoutDashboard, Stethoscope, Download, Building2 } from '@lucide/svelte';
</script>

<svelte:head>
  <title>ClinicFlow — Offline-First Hospital Management for Rural Clinics</title>
  <meta name="description" content="ClinicFlow brings fast, resilient, offline-first digital infrastructure to Primary Healthcare Centers in Nigeria." />
</svelte:head>

<!-- Hero Section -->
<section class="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
  <div class="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] dark:bg-bottom"></div>
  <div class="absolute w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] -top-64 -right-32 pointer-events-none"></div>
  <div class="absolute w-[600px] h-[600px] rounded-full bg-accent/10 blur-[120px] -bottom-64 -left-32 pointer-events-none"></div>

  <div class="container mx-auto px-4 md:px-8 max-w-7xl relative z-10 text-center">
    <div class="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8 animate-fade-in">
      <span class="flex size-2 rounded-full bg-primary mr-2 animate-pulse"></span>
      Now available for Windows & Android Kiosks
    </div>
    
    <h1 class="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1] animate-slide-up" style="animation-delay: 100ms;">
      Offline-First Hospital Management for <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Rural Clinics</span>
    </h1>
    
    <p class="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium animate-slide-up" style="animation-delay: 200ms;">
      Digitize patient records, manage triage queues, and dispense medications without relying on internet connectivity. Built specifically for Primary Healthcare Centers.
    </p>
    
    <div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style="animation-delay: 300ms;">
      <Button href="/register" size="lg" class="h-14 px-8 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-xl shadow-primary/20 rounded-full btn-press w-full sm:w-auto">
        Register Your PHC
        <Building2 class="ml-2 size-5" />
      </Button>
      <Button href="/download" size="lg" variant="outline" class="h-14 px-8 text-lg font-bold border-border/80 bg-background/50 hover:bg-muted rounded-full btn-press w-full sm:w-auto">
        Download the App
        <Download class="ml-2 size-5" />
      </Button>
    </div>
  </div>
</section>

<!-- Features Section -->
<section id="features" class="py-24 bg-muted/30 border-y border-border/40 relative">
  <div class="container mx-auto px-4 md:px-8 max-w-7xl">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Built for the realities of rural healthcare</h2>
      <p class="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">ClinicFlow is designed to work exactly where traditional cloud-based EMRs fail.</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="bg-background rounded-2xl p-8 border border-border shadow-sm card-hover">
        <div class="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
          <WifiOff class="size-6" />
        </div>
        <h3 class="text-xl font-bold text-foreground mb-3">100% Offline Resilience</h3>
        <p class="text-muted-foreground leading-relaxed">
          The entire application runs entirely local-first. Register patients, conduct encounters, and dispense medication with zero internet. Syncs to the cloud automatically when connectivity returns.
        </p>
      </div>
      
      <div class="bg-background rounded-2xl p-8 border border-border shadow-sm card-hover">
        <div class="size-12 rounded-xl bg-accent/20 text-accent-foreground flex items-center justify-center mb-6">
          <LayoutDashboard class="size-6" />
        </div>
        <h3 class="text-xl font-bold text-foreground mb-3">POS-Style Kiosk Design</h3>
        <p class="text-muted-foreground leading-relaxed">
          Large touch targets, vibrant color-coded UI, and minimal typing required. Built so staff with any level of technical literacy can pick it up instantly.
        </p>
      </div>
      
      <div class="bg-background rounded-2xl p-8 border border-border shadow-sm card-hover">
        <div class="size-12 rounded-xl bg-triage-amber/20 text-triage-amber flex items-center justify-center mb-6">
          <Stethoscope class="size-6" />
        </div>
        <h3 class="text-xl font-bold text-foreground mb-3">Smart Triage & AI Voice</h3>
        <p class="text-muted-foreground leading-relaxed">
          Automatically evaluate vitals to flag urgent patients to the top of the queue. Doctors can dictate intake notes using state-of-the-art AI structuring.
        </p>
      </div>
    </div>
  </div>
</section>
