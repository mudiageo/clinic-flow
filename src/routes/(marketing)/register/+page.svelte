<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { HeartPulse, Building, MapPin, User, Mail, Lock, CheckCircle2, Download, LogIn, ChevronRight, ChevronLeft } from '@lucide/svelte';
	import { registerAction } from '$lib/remote/auth.remote';
	import * as Stepper from '$lib/components/ui/stepper';
	import { toast } from 'svelte-sonner';
	
	let currentStep = $state(1);
	let isSubmitting = $state(false);
	
	function nextStep() {
		currentStep = Math.min(currentStep + 1, 3);
	}
	
	function prevStep() {
		currentStep = Math.max(currentStep - 1, 1);
	}
</script>

<svelte:head>
	<title>Register PHC — ClinicFlow</title>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-3xl py-16 animate-fade-in flex-1">
	<div class="text-center mb-10">
		<div class="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
			<HeartPulse class="size-8" />
		</div>
		<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
			Register your PHC
		</h1>
		<p class="mt-3 text-muted-foreground">
			Join the ClinicFlow network and deploy our offline-first infrastructure.
		</p>
	</div>

	<div class="bg-card border border-border shadow-sm rounded-2xl p-6 md:p-10 relative">
		{#if currentStep < 3}
			<div class="mb-8">
				<Stepper.Root bind:value={currentStep} class="w-full">
					<Stepper.Item step={1}>
						<Stepper.Trigger step={1}>
							<Stepper.Indicator step={1}>1</Stepper.Indicator>
							<div class="flex flex-col items-start hidden sm:flex">
								<Stepper.Title>Admin Details</Stepper.Title>
								<Stepper.Description>Set up superadmin</Stepper.Description>
							</div>
						</Stepper.Trigger>
						<Stepper.Separator />
					</Stepper.Item>
					<Stepper.Item step={2}>
						<Stepper.Trigger step={2}>
							<Stepper.Indicator step={2}>2</Stepper.Indicator>
							<div class="flex flex-col items-start hidden sm:flex">
								<Stepper.Title>Clinic Details</Stepper.Title>
								<Stepper.Description>PHC info</Stepper.Description>
							</div>
						</Stepper.Trigger>
					</Stepper.Item>
				</Stepper.Root>
			</div>
		{/if}

		<form
			{...registerAction.enhance(async (form) => {
				isSubmitting = true;
				try {
					const result = await form.submit();
					if (result?.success) {
						currentStep = 3;
					} else {
					    toast.error('Registration failed.');
					}
				} finally {
					isSubmitting = false;
				}
			})}
			class="space-y-8"
			novalidate
		>
			<!-- Step 1: Admin Details -->
			<div class="space-y-4 animate-in fade-in slide-in-from-right-4" class:hidden={currentStep !== 1}>
					<div class="space-y-2">
						<Label for="adminName">Admin Full Name</Label>
						<div class="relative">
							<User class="absolute left-3 top-3 size-4 text-muted-foreground" />
							<Input {...registerAction.fields.adminName.as('text')} id="adminName" placeholder="e.g. John Doe" class="pl-10" required />
						</div>
						{#if registerAction.fields.adminName.issues()}
							<p class="text-sm text-destructive">{registerAction.fields.adminName.issues()}</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label for="email">Admin Email</Label>
						<div class="relative">
							<Mail class="absolute left-3 top-3 size-4 text-muted-foreground" />
							<Input {...registerAction.fields.email.as('email')} id="email" type="email" placeholder="admin@phc.gov.ng" class="pl-10" required />
						</div>
						{#if registerAction.fields.email.issues()}
							<p class="text-sm text-destructive">{registerAction.fields.email.issues()}</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label for="password">Password</Label>
						<div class="relative">
							<Lock class="absolute left-3 top-3 size-4 text-muted-foreground" />
							<Input {...registerAction.fields.password.as('password')} id="password" type="password" class="pl-10" required minlength={8} />
						</div>
						{#if registerAction.fields.password.issues()}
							<p class="text-sm text-destructive">{registerAction.fields.password.issues()}</p>
						{:else}
							<p class="text-xs text-muted-foreground mt-1">Must be at least 8 characters long.</p>
						{/if}
					</div>
					
					<div class="flex justify-end pt-4">
					    <Button type="button" onclick={nextStep} class="btn-press">
					        Next Step <ChevronRight class="size-4 ml-1" />
					    </Button>
					</div>
				</div>

				<!-- Step 2: Clinic Details -->
				<div class="space-y-4 animate-in fade-in slide-in-from-right-4" class:hidden={currentStep !== 2}>
					<div class="space-y-2">
						<Label for="phcName">Primary Healthcare Center Name</Label>
						<div class="relative">
							<Building class="absolute left-3 top-3 size-4 text-muted-foreground" />
							<Input {...registerAction.fields.phcName.as('text')} id="phcName" placeholder="e.g. Oredo PHC" class="pl-10" required />
						</div>
						{#if registerAction.fields.phcName.issues()}
							<p class="text-sm text-destructive">{registerAction.fields.phcName.issues()}</p>
						{/if}
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="state">State</Label>
							<div class="relative">
								<MapPin class="absolute left-3 top-3 size-4 text-muted-foreground" />
								<Input {...registerAction.fields.state.as('text')} id="state" placeholder="e.g. Edo State" class="pl-10" required />
							</div>
							{#if registerAction.fields.state.issues()}
								<p class="text-sm text-destructive">{registerAction.fields.state.issues()}</p>
							{/if}
						</div>
						<div class="space-y-2">
							<Label for="lga">LGA</Label>
							<Input {...registerAction.fields.lga.as('text')} id="lga" placeholder="e.g. Oredo" required />
							{#if registerAction.fields.lga.issues()}
								<p class="text-sm text-destructive">{registerAction.fields.lga.issues()}</p>
							{/if}
						</div>
					</div>
					
					<div class="flex justify-between pt-4">
					    <Button type="button" variant="outline" onclick={prevStep} class="btn-press">
					        <ChevronLeft class="size-4 mr-1" /> Back
					    </Button>
					    <Button type="submit" class="bg-primary text-primary-foreground btn-press" disabled={isSubmitting}>
					        {isSubmitting ? 'Registering...' : 'Complete Registration'}
					    </Button>
					</div>
				</div>

			    <!-- Step 3: Success -->
			    <div class="flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 py-8" class:hidden={currentStep !== 3}>
			        <div class="size-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
			            <CheckCircle2 class="size-10" />
			        </div>
			        
			        <div class="space-y-2">
			            <h2 class="text-2xl font-bold text-foreground">Registration Successful!</h2>
			            <p class="text-muted-foreground max-w-md mx-auto">
			                Your clinic has been provisioned. You can now download the offline-first desktop app to set up your local kiosk.
			            </p>
			        </div>
			        
			        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-6">
			            <Button href="/download" size="lg" class="w-full bg-primary text-primary-foreground h-12 text-base">
			                <Download class="size-5 mr-2" />
			                Download Desktop App
			            </Button>
			            <Button href="/login" size="lg" variant="outline" class="w-full h-12 text-base">
			                <LogIn class="size-5 mr-2" />
			                Login via Web
			            </Button>
			        </div>
			    </div>
		</form>
	</div>
</div>
