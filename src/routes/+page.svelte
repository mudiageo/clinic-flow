<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { HeartPulse, ArrowRight, UserCheck, Stethoscope, Settings } from '@lucide/svelte';

  const user = $derived(page.data.user);
</script>

<svelte:head>
  <title>Welcome — ClinicFlow</title>
</svelte:head>

{#if user}
  <div class="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden animate-fade-in">
    <!-- Glowing backdrops -->
    <div class="absolute w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] -top-32 -left-32 pointer-events-none"></div>
    <div class="absolute w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] -bottom-32 -right-32 pointer-events-none"></div>

    <div class="w-full max-w-sm text-center space-y-6 relative z-10">
      <div class="flex items-center justify-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
          <HeartPulse class="w-6 h-6" />
        </div>
        <h1 class="text-3xl font-extrabold text-foreground tracking-tight">ClinicFlow</h1>
      </div>
      
      <div class="space-y-1">
        <p class="text-muted-foreground text-sm font-semibold uppercase tracking-wider">Welcome back</p>
        <p class="text-xl font-bold text-foreground">{user.name}</p>
      </div>

      <div class="flex flex-col gap-3 mt-8 pt-4 border-t border-border/60">
        <Button href="/nurse" class="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl shadow-md shadow-primary/10 transition-all duration-200 btn-press flex items-center justify-between px-5">
          <span class="flex items-center gap-2 text-sm">
            <UserCheck class="size-4" />
            Nurse Station
          </span>
          <ArrowRight class="size-4" />
        </Button>

        <Button href="/doctor" class="w-full h-12 bg-secondary text-secondary-foreground hover:bg-muted font-semibold rounded-xl transition-all duration-200 btn-press flex items-center justify-between px-5">
          <span class="flex items-center gap-2 text-sm">
            <Stethoscope class="size-4" />
            Doctor Desk
          </span>
          <ArrowRight class="size-4" />
        </Button>

        <Button href="/admin" variant="outline" class="w-full h-12 border-border text-foreground hover:bg-muted font-semibold rounded-xl transition-all duration-200 btn-press flex items-center justify-between px-5">
          <span class="flex items-center gap-2 text-sm">
            <Settings class="size-4" />
            Operations Dashboard
          </span>
          <ArrowRight class="size-4" />
        </Button>
      </div>
    </div>
  </div>
{:else}
  <meta http-equiv="refresh" content="0;url=/login" />
{/if}
