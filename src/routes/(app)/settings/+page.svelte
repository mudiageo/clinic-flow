<script lang="ts">
	import { authStore } from '#lib/state/auth.svelte.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { UserCircle2, Save } from '@lucide/svelte';

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
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Account</p>
		<h1 class="text-2xl font-bold tracking-tight text-foreground">Profile Settings</h1>
		<p class="text-sm text-muted-foreground mt-0.5">
			Manage your personal information and how it appears across the clinic
		</p>
	</div>

	{#if !authStore.profile}
		<div class="h-56 rounded-xl bg-muted animate-pulse"></div>
	{:else}
		<section class="rounded-xl border border-border bg-card overflow-hidden">
			<div class="h-1.5 bg-primary"></div>
			<div class="p-5 sm:p-6 space-y-5">
				<div>
					<h2 class="text-base font-semibold text-foreground">Basic Information</h2>
					<p class="text-xs text-muted-foreground">Update your display name.</p>
				</div>

				<div class="space-y-1.5 max-w-sm">
					<Label for="display-name">Display Name</Label>
					<div class="relative">
						<UserCircle2
							class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
						/>
						<Input id="display-name" bind:value={tempName} class="pl-9 h-11" />
					</div>
				</div>

				<div
					class="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border"
				>
					<div>
						<p class="text-sm font-medium text-foreground">Email Address</p>
						<p class="text-xs text-muted-foreground">
							Contact your Superadmin if you need to change your email address.
						</p>
					</div>

					<Button
						onclick={handleSave}
						disabled={isSaving || tempName === authStore.profile.name}
						class="w-full sm:w-auto min-h-11 px-5 font-semibold"
					>
						{#if isSaving}
							Saving…
						{:else}
							<Save class="size-4 mr-2" />
							Save Changes
						{/if}
					</Button>
				</div>
			</div>
		</section>
	{/if}
</div>
