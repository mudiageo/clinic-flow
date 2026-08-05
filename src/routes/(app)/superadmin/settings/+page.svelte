<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription,
		CardFooter
	} from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Switch } from '$lib/components/ui/switch';
	import { toast } from 'svelte-sonner';
	import { 
		Settings, 
		User, 
		Shield, 
		Save, 
		KeyRound,
		Globe
	} from '@lucide/svelte';

	// Profile State
	let fullName = $state('Super Admin');
	let emailAddress = $state('admin@clinicflow.org');
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	// Preferences State
	let betaUpdates = $state(false);
	let telemetryEnabled = $state(true);
	let strictAuditMode = $state(true);
	let emailAlerts = $state(true);
	let autoBackup = $state(true);

	let isSavingProfile = $state(false);
	let isSavingSecurity = $state(false);
	let isSavingPrefs = $state(false);

	async function handleSaveProfile(e: Event) {
		e.preventDefault();
		isSavingProfile = true;
		setTimeout(() => {
			toast.success('Profile updated successfully');
			isSavingProfile = false;
		}, 1000);
	}

	async function handleUpdatePassword(e: Event) {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			toast.error('New passwords do not match');
			return;
		}
		if (newPassword.length < 8) {
			toast.error('Password must be at least 8 characters');
			return;
		}
		isSavingSecurity = true;
		setTimeout(() => {
			toast.success('Password updated successfully');
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			isSavingSecurity = false;
		}, 1000);
	}

	async function handleSavePreferences() {
		isSavingPrefs = true;
		setTimeout(() => {
			toast.success('Platform preferences saved');
			isSavingPrefs = false;
		}, 800);
	}
</script>

<svelte:head>
	<title>Platform Settings — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in max-w-5xl mx-auto">
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<Settings class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Platform Settings</h1>
			<p class="text-muted-foreground text-sm mt-0.5 font-medium">
				Manage your maker profile and global application preferences.
			</p>
		</div>
	</div>

	<Tabs value="profile" class="w-full">
		<TabsList class="grid w-full max-w-md grid-cols-3 mb-6">
			<TabsTrigger value="profile">Profile</TabsTrigger>
			<TabsTrigger value="security">Security</TabsTrigger>
			<TabsTrigger value="preferences">Preferences</TabsTrigger>
		</TabsList>

		<!-- Profile Tab -->
		<TabsContent value="profile" class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<User class="size-4" />
						Personal Information
					</CardTitle>
					<CardDescription>Update your personal details and contact information.</CardDescription>
				</CardHeader>
				<form onsubmit={handleSaveProfile}>
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<Label for="fullName">Full Name</Label>
							<Input id="fullName" bind:value={fullName} placeholder="Jane Doe" required />
						</div>
						<div class="space-y-2">
							<Label for="email">Email Address</Label>
							<Input id="email" type="email" bind:value={emailAddress} placeholder="jane@example.com" required />
						</div>
					</CardContent>
					<CardFooter class="bg-muted/10 border-t flex justify-end p-4">
						<Button type="submit" disabled={isSavingProfile}>
							{#if isSavingProfile}
								<Settings class="size-4 mr-2 animate-spin" />
								Saving...
							{:else}
								<Save class="size-4 mr-2" />
								Save Changes
							{/if}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</TabsContent>

		<!-- Security Tab -->
		<TabsContent value="security" class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<KeyRound class="size-4" />
						Change Password
					</CardTitle>
					<CardDescription>Ensure your master account is using a long, random password to stay secure.</CardDescription>
				</CardHeader>
				<form onsubmit={handleUpdatePassword}>
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<Label for="currentPassword">Current Password</Label>
							<Input id="currentPassword" type="password" bind:value={currentPassword} required />
						</div>
						<div class="space-y-2">
							<Label for="newPassword">New Password</Label>
							<Input id="newPassword" type="password" bind:value={newPassword} required />
						</div>
						<div class="space-y-2">
							<Label for="confirmPassword">Confirm New Password</Label>
							<Input id="confirmPassword" type="password" bind:value={confirmPassword} required />
						</div>
					</CardContent>
					<CardFooter class="bg-muted/10 border-t flex justify-end p-4">
						<Button type="submit" disabled={isSavingSecurity} variant="default">
							{#if isSavingSecurity}
								<Settings class="size-4 mr-2 animate-spin" />
								Updating...
							{:else}
								<Shield class="size-4 mr-2" />
								Update Password
							{/if}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</TabsContent>

		<!-- Preferences Tab -->
		<TabsContent value="preferences" class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Globe class="size-4" />
						Global App Preferences
					</CardTitle>
					<CardDescription>Configure how the master instance behaves and updates.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label class="text-base">Beta Release Channel</Label>
							<p class="text-sm text-muted-foreground">Receive early access to ClinicFlow updates before they are stable.</p>
						</div>
						<Switch bind:checked={betaUpdates} onCheckedChange={handleSavePreferences} />
					</div>
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label class="text-base">Strict Audit Mode</Label>
							<p class="text-sm text-muted-foreground">Enforce strict logging for every administrative action. (Requires restart)</p>
						</div>
						<Switch bind:checked={strictAuditMode} onCheckedChange={handleSavePreferences} />
					</div>
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label class="text-base">Anonymous Telemetry</Label>
							<p class="text-sm text-muted-foreground">Help improve ClinicFlow by sending crash reports and usage statistics.</p>
						</div>
						<Switch bind:checked={telemetryEnabled} onCheckedChange={handleSavePreferences} />
					</div>
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label class="text-base">Critical System Alerts</Label>
							<p class="text-sm text-muted-foreground">Receive emails when connected PHCs go offline or experience critical errors.</p>
						</div>
						<Switch bind:checked={emailAlerts} onCheckedChange={handleSavePreferences} />
					</div>
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label class="text-base">Automated Cloud Backups</Label>
							<p class="text-sm text-muted-foreground">Silently backup database snapshots to securely encrypted cloud storage.</p>
						</div>
						<Switch bind:checked={autoBackup} onCheckedChange={handleSavePreferences} />
					</div>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
