<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { HeartPulse, Building, MapPin, User, Mail, Lock } from '@lucide/svelte';
  import { registerAction } from '$lib/remote/auth.remote';
  import { getContext } from 'svelte';
  
  let isSubmitting = $state(false);
</script>

<svelte:head>
  <title>Register PHC — ClinicFlow</title>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-2xl py-16 animate-fade-in flex-1">
  <div class="text-center mb-10">
    <div class="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
      <HeartPulse class="size-8" />
    </div>
    <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Register your PHC</h1>
    <p class="mt-3 text-muted-foreground">Join the ClinicFlow network and deploy our offline-first infrastructure.</p>
  </div>

  <div class="bg-card border border-border shadow-sm rounded-2xl p-6 md:p-10">
    <!-- Action forms return their results as props on the action. But wait, sveltekit forms give us form prop? -->
    <!-- The remote function form binds via use action or similar, let's just use the form component pattern or native remote form. -->
    <form {...registerAction} class="space-y-8" onsubmit={() => isSubmitting = true}>
      
      <!-- Clinic Details -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold border-b border-border/60 pb-2">Clinic Details</h3>
        
        <div class="space-y-2">
          <Label for="phcName">Primary Healthcare Center Name</Label>
          <div class="relative">
            <Building class="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input id="phcName" name="phcName" placeholder="e.g. Oredo PHC" required class="pl-10" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="state">State</Label>
            <div class="relative">
              <MapPin class="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input id="state" name="state" placeholder="e.g. Edo State" required class="pl-10" />
            </div>
          </div>
          <div class="space-y-2">
            <Label for="lga">LGA</Label>
            <Input id="lga" name="lga" placeholder="e.g. Oredo" required />
          </div>
        </div>
      </div>

      <!-- Admin Details -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold border-b border-border/60 pb-2">Admin Account</h3>
        
        <div class="space-y-2">
          <Label for="adminName">Admin Full Name</Label>
          <div class="relative">
            <User class="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input id="adminName" name="adminName" placeholder="e.g. John Doe" required class="pl-10" />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="email">Admin Email</Label>
          <div class="relative">
            <Mail class="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input id="email" name="email" type="email" placeholder="admin@phc.gov.ng" required class="pl-10" />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="password">Password</Label>
          <div class="relative">
            <Lock class="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input id="password" name="password" type="password" required minlength={8} class="pl-10" />
          </div>
        </div>
      </div>

      <Button type="submit" class="w-full h-12 text-lg font-bold btn-press" disabled={isSubmitting}>
        {isSubmitting ? 'Registering...' : 'Register PHC'}
      </Button>
    </form>
  </div>
</div>
