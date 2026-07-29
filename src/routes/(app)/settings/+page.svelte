<script lang="ts">
	import { getUserProfile, updateProfile } from '$lib/remote/auth.remote';
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
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Mail, Building2, UserCircle2, ShieldCheck, Save } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let isSaving = $state(false);

	async function handleSave(name: string) {
		isSaving = true;
		const result = await updateProfile.submit({ name });
		if (result?.success) {
			toast.success('Profile updated successfully');
		} else {
			toast.error('Failed to update profile');
		}
		isSaving = false;
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Profile</h2>
		<p class="text-muted-foreground mt-1">Manage your account identity and clinic details.</p>
	</div>

	{#await getUserProfile()}
		<Card>
			<CardHeader>
				<Skeleton class="h-6 w-1/4" />
				<Skeleton class="h-4 w-1/3 mt-2" />
			</CardHeader>
			<CardContent class="space-y-6">
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-10 w-full" />
			</CardContent>
		</Card>
	{:then profile}
		{#if profile}
			<Card>
				<CardHeader>
					<CardTitle>Personal Information</CardTitle>
					<CardDescription>Your details as they appear across the platform.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="space-y-2">
						<Label for="name">Display Name</Label>
						<div class="relative">
							<UserCircle2 class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
							<Input id="name" value={profile.name} class="pl-9 h-11" />
						</div>
						<p class="text-xs text-muted-foreground">This is how your name appears to other staff members.</p>
					</div>

					<div class="space-y-2">
						<Label for="email">Email Address</Label>
						<div class="relative">
							<Mail class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
							<Input id="email" value={profile.email} readonly disabled class="pl-9 h-11 bg-muted/50 cursor-not-allowed" />
						</div>
						<p class="text-xs text-muted-foreground">Contact your Superadmin if you need to change your email address.</p>
					</div>
					
					<Button onclick={() => handleSave(profile.name)} disabled={isSaving} class="w-full sm:w-auto h-11">
						{#if isSaving}
							<div class="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
							Saving...
						{:else}
							<Save class="size-4 mr-2" />
							Save Changes
						{/if}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Role & Affiliation</CardTitle>
					<CardDescription>Your official designation and assigned clinic.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="p-4 rounded-xl border bg-muted/20 flex gap-4 items-start">
							<div class="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
								<ShieldCheck class="size-5" />
							</div>
							<div>
								<div class="text-sm font-medium text-muted-foreground mb-1">Assigned Role</div>
								<div class="font-bold text-lg capitalize">{profile.role}</div>
							</div>
						</div>
						
						<div class="p-4 rounded-xl border bg-muted/20 flex gap-4 items-start">
							<div class="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
								<Building2 class="size-5" />
							</div>
							<div>
								<div class="text-sm font-medium text-muted-foreground mb-1">Primary Healthcare Center</div>
								<div class="font-bold text-lg">{profile.phcName}</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		{/if}
	{:catch error}
		<Card>
			<CardContent class="p-6 text-center text-destructive">
				Failed to load profile: {error.message}
			</CardContent>
		</Card>
	{/await}
</div>
