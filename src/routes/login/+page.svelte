<script lang="ts">
	import { signInAction } from '$lib/remote/auth.remote';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { HeartPulse, KeyRound, Mail, AlertCircle, ShieldAlert } from '@lucide/svelte';

	const allIssues = $derived(signInAction.fields.allIssues() ?? []);
</script>

<svelte:head>
	<title>Login — ClinicFlow</title>
</svelte:head>

<div
	class="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden animate-fade-in"
>
	<!-- Glowing backdrops (using primary/accent vars instead of hardcoded colors) -->
	<div
		class="absolute w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] -top-40 -left-40 pointer-events-none"
	></div>
	<div
		class="absolute w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] -bottom-40 -right-40 pointer-events-none"
	></div>

	<div class="w-full max-w-md relative z-10 space-y-6">
		<div class="text-center">
			<div
				class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-4 animate-bounce"
			>
				<HeartPulse class="w-7 h-7" />
			</div>
			<h1 class="text-3xl font-extrabold text-foreground tracking-tight">ClinicFlow</h1>
			<p class="text-muted-foreground mt-1.5 text-sm font-medium">
				Oredo Primary Health Centre · Benin City, Nigeria
			</p>
		</div>

		<Card class="bg-card/60 border-border/80 backdrop-blur-xl shadow-2xl">
			<CardHeader class="pb-4">
				<CardTitle class="text-foreground text-xl">Sign In</CardTitle>
				<CardDescription class="text-muted-foreground"
					>Access the clinic management platform</CardDescription
				>
			</CardHeader>
			<CardContent>
				<form {...signInAction} class="space-y-4">
					<!-- Form-level validation errors using shadcn Alert -->
					{#if allIssues.length > 0}
						<Alert
							variant="destructive"
							class="py-3 bg-destructive/10 border-destructive/20 text-destructive rounded-xl"
						>
							<AlertCircle class="size-4" />
							<AlertTitle class="text-xs font-bold uppercase tracking-wider"
								>Validation Error</AlertTitle
							>
							<AlertDescription class="text-xs font-medium">
								{#each allIssues as issue}
									<div>{issue.message}</div>
								{/each}
							</AlertDescription>
						</Alert>
					{/if}

					<div class="space-y-2">
						<Label for="email" class="text-foreground">Email Address</Label>
						<div class="relative">
							<Mail class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
							<Input
								{...signInAction.fields.email.as('email')}
								id="email"
								placeholder="nurse@clinicflow.org"
								class="pl-9 h-11 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
							/>
						</div>
						{#each signInAction.fields.email.issues() ?? [] as issue}
							<p class="text-xs text-destructive mt-1 font-medium">{issue.message}</p>
						{/each}
					</div>

					<div class="space-y-2">
						<Label for="password" class="text-foreground">Password</Label>
						<div class="relative">
							<KeyRound class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
							<Input
								{...signInAction.fields.password.as('password')}
								id="password"
								type="password"
								placeholder="••••••••"
								class="pl-9 h-11 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
							/>
						</div>
						{#each signInAction.fields.password.issues() ?? [] as issue}
							<p class="text-xs text-destructive mt-1 font-medium">{issue.message}</p>
						{/each}
					</div>

					<Button
						type="submit"
						class="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl shadow-lg shadow-primary/15 transition-all duration-200 mt-2 btn-press"
					>
						Sign In
					</Button>
				</form>
			</CardContent>
		</Card>

		<div
			class="text-center flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider"
		>
			<ShieldAlert class="size-3.5 text-primary" />
			ClinicFlow Kiosk • Authorized Personnel Only
		</div>
	</div>
</div>
