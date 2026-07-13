<script lang="ts">
  import { signInAction } from '$lib/remote/auth.remote';
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  const allIssues = $derived(signInAction.fields.allIssues() ?? []);
</script>

<svelte:head>
  <title>Login — ClinicFlow</title>
</svelte:head>

<div class="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
  <!-- Glowing backdrops -->
  <div class="absolute w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[120px] -top-40 -left-40 pointer-events-none"></div>
  <div class="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] -bottom-40 -right-40 pointer-events-none"></div>

  <div class="w-full max-w-md relative z-10">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-xl shadow-teal-500/20 mb-4">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      </div>
      <h1 class="text-3xl font-extrabold text-white tracking-tight">ClinicFlow</h1>
      <p class="text-slate-400 mt-2 text-sm">Oredo Primary Health Centre · Benin City, Edo State</p>
    </div>

    <Card class="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <CardTitle class="text-white text-xl">Sign In</CardTitle>
        <CardDescription class="text-slate-400">Access the clinic management platform</CardDescription>
      </CardHeader>
      <CardContent>
        <form {...signInAction} class="space-y-5">
          <!-- Form-level validation errors -->
          {#if allIssues.length > 0}
            <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {#each allIssues as issue}
                <div>{issue.message}</div>
              {/each}
            </div>
          {/if}

          <div class="space-y-2">
            <Label for="email" class="text-slate-300">Email Address</Label>
            <Input
              {...signInAction.fields.email.as('email')}
              id="email"
              placeholder="e.g. nurse@clinicflow.org"
              class="h-12 bg-slate-950/50 border-slate-800 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
            />
            {#each signInAction.fields.email.issues() ?? [] as issue}
              <p class="text-xs text-red-400 mt-1">{issue.message}</p>
            {/each}
          </div>

          <div class="space-y-2">
            <Label for="password" class="text-slate-300">Password</Label>
            <Input
              {...signInAction.fields.password.as('password')}
              id="password"
              placeholder="••••••••"
              class="h-12 bg-slate-950/50 border-slate-800 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
            />
            {#each signInAction.fields.password.issues() ?? [] as issue}
              <p class="text-xs text-red-400 mt-1">{issue.message}</p>
            {/each}
          </div>

          <Button type="submit" class="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/10 transition-all duration-200 mt-2">
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>

    <p class="text-center text-xs text-slate-600 mt-8">
      ClinicFlow Kiosk · Authorized Personnel Only
    </p>
  </div>
</div>
