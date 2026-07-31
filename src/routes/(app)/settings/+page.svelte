<script lang="ts">
	import { authStore } from '$lib/state/auth.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Mail, Building2, UserCircle2, ShieldCheck, Save } from '@lucide/svelte';

	let isSaving = $state(false);
	
	let tempName = $state('');
	let initDone = $state(false);
	
	$effect(() => {
		if (authStore.profile && !initDone) {
			tempName = authStore.profile.name;
			initDone = true;
		}
	});

	async function handleSave() {
		isSaving = true;
		await authStore.updateProfile(tempName);
		isSaving = false;
	}
</script>

<div class="space-y-6">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">Profile Settings</h1>
		<p class="text-muted-foreground mt-2">Manage your personal information and how it's displayed.</p>
	</div>

	{#if !authStore.profile}
		<div class="space-y-4">
			<div class="h-64 rounded-xl bg-muted animate-pulse"></div>
		</div>
	{:else}
		<!-- Basic Info Card -->
		<Card class="border-none shadow-md overflow-hidden">
			<div class="h-2 bg-primary"></div>
			<CardHeader>
				<CardTitle>Basic Information</CardTitle>
				<CardDescription>Update your display name.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="display-name">Display Name</Label>
						<div class="relative max-w-sm">
							<UserCircle2 class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
							<Input id="display-name" bind:value={tempName} class="pl-9 h-11" />
						</div>
					</div>
				</div>
				
				<div class="pt-4 flex items-center justify-between border-t border-border/50">
					<div>
						<p class="text-sm font-medium">Email Address</p>
						<p class="text-xs text-muted-foreground">Contact your Superadmin if you need to change your email address.</p>
					</div>
					
					<Button onclick={handleSave} disabled={isSaving || tempName === authStore.profile.name} class="w-full sm:w-auto h-11">
						{#if isSaving}
							<div class="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
							Saving...
						{:else}
							<Save class="size-4 mr-2" />
							Save Changes
						{/if}
					</Button>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
