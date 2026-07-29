<script lang="ts">
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
	import { KeyRound, ShieldAlert, MonitorSmartphone, LogOut } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let isSaving = $state(false);
	
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	async function updatePassword() {
		if (newPassword !== confirmPassword) {
			toast.error('New passwords do not match');
			return;
		}
		if (newPassword.length < 8) {
			toast.error('Password must be at least 8 characters');
			return;
		}
		isSaving = true;
		// Simulated remote function call (Better Auth update)
		await new Promise(r => setTimeout(r, 800));
		toast.success('Password updated successfully');
		currentPassword = '';
		newPassword = '';
		confirmPassword = '';
		isSaving = false;
	}

	async function revokeSession(id: string) {
		toast.success('Session revoked');
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Security</h2>
		<p class="text-muted-foreground mt-1">Manage your password and active sessions.</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Change Password</CardTitle>
			<CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<div class="space-y-2">
				<Label for="current-password">Current Password</Label>
				<div class="relative max-w-sm">
					<KeyRound class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
					<Input id="current-password" type="password" bind:value={currentPassword} class="pl-9 h-11" />
				</div>
			</div>

			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="new-password">New Password</Label>
					<div class="relative max-w-sm">
						<ShieldAlert class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
						<Input id="new-password" type="password" bind:value={newPassword} class="pl-9 h-11" />
					</div>
					{#if newPassword.length > 0 && newPassword.length < 8}
						<p class="text-xs text-destructive">Password is too short (min 8 chars).</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="confirm-password">Confirm Password</Label>
					<div class="relative max-w-sm">
						<ShieldAlert class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
						<Input id="confirm-password" type="password" bind:value={confirmPassword} class="pl-9 h-11" />
					</div>
				</div>
			</div>
			
			<Button onclick={updatePassword} disabled={isSaving || !currentPassword || !newPassword || !confirmPassword} class="h-11">
				{#if isSaving}
					<div class="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
					Updating...
				{:else}
					Update Password
				{/if}
			</Button>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Active Sessions</CardTitle>
			<CardDescription>Review the devices currently logged into your account.</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				<!-- Current Session -->
				<div class="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
					<div class="flex items-center gap-4">
						<div class="p-2.5 rounded-full bg-primary/10 text-primary">
							<MonitorSmartphone class="size-5" />
						</div>
						<div>
							<div class="font-medium">This Device</div>
							<div class="text-xs text-muted-foreground">Benin City, Nigeria • Just now</div>
						</div>
					</div>
					<div class="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded">Active</div>
				</div>

				<!-- Other Simulated Session -->
				<div class="flex items-center justify-between p-4 rounded-xl border border-dashed">
					<div class="flex items-center gap-4 opacity-70">
						<div class="p-2.5 rounded-full bg-muted text-muted-foreground">
							<MonitorSmartphone class="size-5" />
						</div>
						<div>
							<div class="font-medium">Clinic Kiosk (Tauri App)</div>
							<div class="text-xs text-muted-foreground">Oredo PHC • Last active 2 hours ago</div>
						</div>
					</div>
					<Button variant="outline" size="sm" class="text-destructive hover:bg-destructive/10 hover:text-destructive" onclick={() => revokeSession('123')}>
						<LogOut class="size-3.5 mr-1.5" />
						Revoke
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>
</div>
