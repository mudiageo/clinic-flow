<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '#lib/components/ui/tabs/index.ts';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { toast } from 'svelte-sonner';
	import { Settings, User, Shield, Save, KeyRound, Globe } from '@lucide/svelte';
	import { updateProfile, updatePassword } from '#lib/remote/auth.remote.ts';
	import { updateAppSettings } from '#lib/remote/settings.remote.ts';

	let { data } = $props();

	let fullName = $state(data.profile?.name ?? '');
	let emailAddress = $state(data.profile?.email ?? '');
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	let betaUpdates = $state(data.appSettings.betaUpdates);
	let telemetryEnabled = $state(data.appSettings.telemetryEnabled);
	let strictAuditMode = $state(data.appSettings.strictAuditMode);
	let emailAlerts = $state(data.appSettings.emailAlerts);
	let autoBackup = $state(data.appSettings.autoBackup);

	let isSavingProfile = $state(false);
	let isSavingSecurity = $state(false);
	let isSavingPrefs = $state(false);

	async function handleUpdatePassword() {
		if (newPassword !== confirmPassword) {
			toast.error('New passwords do not match');
			return false;
		}
		if (newPassword.length < 8) {
			toast.error('Password must be at least 8 characters');
			return false;
		}
		return true;
	}

	async function handleSavePreferences() {
		const form = document.getElementById('preferences-form') as HTMLFormElement;
		if (form) form.requestSubmit();
	}
</script>

<svelte:head>
	<title>Platform Settings — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-5xl mx-auto">
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Configuration
		</p>
		<h1 class="text-2xl font-bold text-foreground tracking-tight">Platform Settings</h1>
		<p class="text-muted-foreground text-sm mt-0.5">
			Manage your maker profile and global application preferences
		</p>
	</div>

	<Tabs value="profile" class="w-full">
		<TabsList class="grid w-full max-w-md grid-cols-3 mb-6">
			<TabsTrigger value="profile">Profile</TabsTrigger>
			<TabsTrigger value="security">Security</TabsTrigger>
			<TabsTrigger value="preferences">Preferences</TabsTrigger>
		</TabsList>

		<!-- Profile Tab -->
		<TabsContent value="profile">
			<section class="rounded-xl border border-border bg-card overflow-hidden">
				<div class="px-5 py-3.5 border-b border-border bg-muted/20">
					<h2 class="text-base font-semibold flex items-center gap-2">
						<User class="size-4 text-primary" />
						Personal Information
					</h2>
					<p class="text-xs text-muted-foreground">
						Update your personal details and contact information
					</p>
				</div>
				<form
					{...updateProfile.enhance(async (form) => {
						isSavingProfile = true;
						try {
							if (await form.submit()) {
								if (updateProfile.result?.success) {
									toast.success('Profile updated successfully');
								}
							}
						} catch (e) {
							toast.error(e instanceof Error ? e.message : 'Failed to update profile');
						} finally {
							isSavingProfile = false;
						}
					})}
				>
					<div class="p-5 space-y-4">
						{#if !data.profile}
							<p class="text-sm text-muted-foreground rounded-lg bg-muted/40 p-3">
								Profile unavailable. Sign in with a superadmin account to manage your details.
							</p>
						{/if}
						<div class="space-y-1.5">
							<Label for="fullName">Full Name</Label>
							<Input {...updateProfile.fields.name.as('text', fullName)} class="h-11" required />
						</div>
						<div class="space-y-1.5">
							<Label for="email">Email Address</Label>
							<Input id="email" type="email" bind:value={emailAddress} class="h-11" disabled required />
						</div>
					</div>
					<div class="bg-muted/15 border-t border-border flex justify-end p-4">
						<Button type="submit" disabled={isSavingProfile || !data.profile} class="min-h-10 px-5">
							{#if isSavingProfile}
								<Settings class="size-4 mr-2 animate-spin" />
								Saving…
							{:else}
								<Save class="size-4 mr-2" />
								Save Changes
							{/if}
						</Button>
					</div>
				</form>
			</section>
		</TabsContent>

		<!-- Security Tab -->
		<TabsContent value="security">
			<section class="rounded-xl border border-border bg-card overflow-hidden">
				<div class="px-5 py-3.5 border-b border-border bg-muted/20">
					<h2 class="text-base font-semibold flex items-center gap-2">
						<KeyRound class="size-4 text-primary" />
						Change Password
					</h2>
					<p class="text-xs text-muted-foreground">
						Ensure your master account is using a long, random password to stay secure
					</p>
				</div>
				<form
					{...updatePassword.enhance(async (form) => {
						if (!(await handleUpdatePassword())) return;
						isSavingSecurity = true;
						try {
							if (await form.submit()) {
								if (updatePassword.result?.success) {
									toast.success('Password updated successfully');
									currentPassword = '';
									newPassword = '';
									confirmPassword = '';
								}
							}
						} catch (e) {
							toast.error(e instanceof Error ? e.message : 'Failed to update password');
						} finally {
							isSavingSecurity = false;
						}
					})}
				>
					<div class="p-5 space-y-4">
						<div class="space-y-1.5">
							<Label for="currentPassword">Current Password</Label>
							<Input
								{...updatePassword.fields.currentPassword.as('password', currentPassword)}
								class="h-11"
								required
							/>
						</div>
						<div class="space-y-1.5">
							<Label for="newPassword">New Password</Label>
							<Input
								{...updatePassword.fields.newPassword.as('password', newPassword)}
								class="h-11"
								required
							/>
						</div>
						<div class="space-y-1.5">
							<Label for="confirmPassword">Confirm New Password</Label>
							<Input
								id="confirmPassword"
								type="password"
								bind:value={confirmPassword}
								class="h-11"
								required
							/>
						</div>
					</div>
					<div class="bg-muted/15 border-t border-border flex justify-end p-4">
						<Button type="submit" disabled={isSavingSecurity} class="min-h-10 px-5">
							{#if isSavingSecurity}
								<Settings class="size-4 mr-2 animate-spin" />
								Updating…
							{:else}
								<Shield class="size-4 mr-2" />
								Update Password
							{/if}
						</Button>
					</div>
				</form>
			</section>
		</TabsContent>

		<!-- Preferences Tab -->
		<TabsContent value="preferences">
			<section class="rounded-xl border border-border bg-card overflow-hidden">
				<div class="px-5 py-3.5 border-b border-border bg-muted/20">
					<h2 class="text-base font-semibold flex items-center gap-2">
						<Globe class="size-4 text-primary" />
						Global App Preferences
					</h2>
					<p class="text-xs text-muted-foreground">
						Configure how the master instance behaves and updates
					</p>
				</div>
				<div class="divide-y divide-border">
					<div class="flex items-center justify-between p-5 gap-4">
						<div class="space-y-0.5">
							<Label class="text-sm font-semibold">Beta Release Channel</Label>
							<p class="text-xs text-muted-foreground">
								Receive early access to ClinicFlow updates before they are stable.
							</p>
						</div>
						<Switch bind:checked={betaUpdates} onCheckedChange={handleSavePreferences} />
					</div>
					<div class="flex items-center justify-between p-5 gap-4">
						<div class="space-y-0.5">
							<Label class="text-sm font-semibold">Strict Audit Mode</Label>
							<p class="text-xs text-muted-foreground">
								Enforce strict logging for every administrative action. (Requires restart)
							</p>
						</div>
						<Switch bind:checked={strictAuditMode} onCheckedChange={handleSavePreferences} />
					</div>
					<div class="flex items-center justify-between p-5 gap-4">
						<div class="space-y-0.5">
							<Label class="text-sm font-semibold">Anonymous Telemetry</Label>
							<p class="text-xs text-muted-foreground">
								Help improve ClinicFlow by sending crash reports and usage statistics.
							</p>
						</div>
						<Switch bind:checked={telemetryEnabled} onCheckedChange={handleSavePreferences} />
					</div>
					<div class="flex items-center justify-between p-5 gap-4">
						<div class="space-y-0.5">
							<Label class="text-sm font-semibold">Critical System Alerts</Label>
							<p class="text-xs text-muted-foreground">
								Receive emails when connected PHCs go offline or experience critical errors.
							</p>
						</div>
						<Switch bind:checked={emailAlerts} onCheckedChange={handleSavePreferences} />
					</div>
					<div class="flex items-center justify-between p-5 gap-4">
						<div class="space-y-0.5">
							<Label class="text-sm font-semibold">Automated Cloud Backups</Label>
							<p class="text-xs text-muted-foreground">
								Silently backup database snapshots to securely encrypted cloud storage.
							</p>
						</div>
						<Switch bind:checked={autoBackup} onCheckedChange={handleSavePreferences} />
					</div>
				</div>

				<form
					id="preferences-form"
					class="hidden"
					{...updateAppSettings.enhance(async (form) => {
						isSavingPrefs = true;
						try {
							if (await form.submit()) {
								if (updateAppSettings.result) {
									toast.success('Platform preferences saved');
								}
							}
						} catch (e) {
							toast.error(e instanceof Error ? e.message : 'Failed to save preferences');
						} finally {
							isSavingPrefs = false;
						}
					})}
				>
					<input {...updateAppSettings.fields.betaUpdates.as('checkbox', betaUpdates)} />
					<input {...updateAppSettings.fields.telemetryEnabled.as('checkbox', telemetryEnabled)} />
					<input {...updateAppSettings.fields.strictAuditMode.as('checkbox', strictAuditMode)} />
					<input {...updateAppSettings.fields.emailAlerts.as('checkbox', emailAlerts)} />
					<input {...updateAppSettings.fields.autoBackup.as('checkbox', autoBackup)} />
				</form>
			</section>
		</TabsContent>
	</Tabs>
</div>
