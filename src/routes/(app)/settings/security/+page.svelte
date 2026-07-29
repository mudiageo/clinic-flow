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
	import { updatePassword as updatePasswordAction, getActiveSessions, revokeSessionRemote } from '$lib/remote/auth.remote';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let isSaving = $state(false);
	
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordStrength = $derived(
		newPassword.length === 0 ? 0 :
		newPassword.length < 8 ? 25 :
		newPassword.match(/[A-Z]/) && newPassword.match(/[0-9]/) ? 100 : 75
	);

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
		const result = await updatePasswordAction.submit({ newPassword, currentPassword });
		if (result?.success) {
			toast.success('Password updated successfully');
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} else {
			toast.error(updatePasswordAction.fields.allIssues()?.[0]?.message || 'Failed to update password');
		}
		isSaving = false;
	}

	async function revokeSession(id: string) {
		const result = await revokeSessionRemote.submit({ sessionToken: id });
		if (result?.success) {
			toast.success('Session revoked');
		} else {
			toast.error('Failed to revoke session');
		}
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
					{#if newPassword.length > 0}
						<div class="max-w-sm mt-2 flex gap-1 h-1.5">
							<div class="h-full flex-1 rounded-full {passwordStrength >= 25 ? (passwordStrength === 25 ? 'bg-destructive' : 'bg-primary') : 'bg-muted'}"></div>
							<div class="h-full flex-1 rounded-full {passwordStrength >= 75 ? (passwordStrength === 75 ? 'bg-amber-500' : 'bg-primary') : 'bg-muted'}"></div>
							<div class="h-full flex-1 rounded-full {passwordStrength === 100 ? 'bg-primary' : 'bg-muted'}"></div>
						</div>
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
			{#await getActiveSessions()}
				<div class="space-y-4">
					<Skeleton class="h-16 w-full rounded-xl" />
					<Skeleton class="h-16 w-full rounded-xl" />
				</div>
			{:then sessions}
				<div class="space-y-4">
					{#each sessions as session (session.id)}
						<div class="flex items-center justify-between p-4 rounded-xl border {session.id ? 'bg-muted/30' : 'border-dashed'}">
							<div class="flex items-center gap-4">
								<div class="p-2.5 rounded-full bg-primary/10 text-primary">
									<MonitorSmartphone class="size-5" />
								</div>
								<div>
									<div class="font-medium">Device Session</div>
									<div class="text-xs text-muted-foreground">Expires {new Date(session.expiresAt).toLocaleDateString()}</div>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Button variant="outline" size="sm" class="text-destructive hover:bg-destructive/10 hover:text-destructive" onclick={() => revokeSession(session.token)}>
									<LogOut class="size-3.5 mr-1.5" />
									Revoke
								</Button>
							</div>
						</div>
					{/each}
					
					{#if sessions.length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">No active sessions found.</p>
					{/if}
				</div>
			{/await}
		</CardContent>
	</Card>
</div>
