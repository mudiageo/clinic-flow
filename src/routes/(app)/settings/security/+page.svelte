<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { KeyRound, ShieldAlert, MonitorSmartphone, LogOut } from '@lucide/svelte';
	import {
		updatePassword as updatePasswordAction,
		getActiveSessions,
		revokeSessionRemote
	} from '#lib/remote/auth.remote.ts';
	import { Skeleton } from '#lib/components/ui/skeleton/index.ts';
	import { toast } from 'svelte-sonner';

	let isSaving = $state(false);

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordStrength = $derived(
		newPassword.length === 0
			? 0
			: newPassword.length < 8
				? 25
				: newPassword.match(/[A-Z]/) && newPassword.match(/[0-9]/)
					? 100
					: 75
	);

	function validatePassword(): boolean {
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
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Security</h2>
		<p class="text-muted-foreground mt-1">Manage your password and active sessions.</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Change Password</CardTitle>
			<CardDescription
				>Ensure your account is using a long, random password to stay secure.</CardDescription
			>
		</CardHeader>
		<form
			{...updatePasswordAction.enhance(async (form) => {
				if (!validatePassword()) return;
				isSaving = true;
				try {
					if (await form.submit()) {
						if (updatePasswordAction.result?.success) {
							toast.success('Password updated successfully');
							currentPassword = '';
							newPassword = '';
							confirmPassword = '';
						}
					}
				} catch (cause) {
					toast.error(cause instanceof Error ? cause.message : 'Failed to update password');
				} finally {
					isSaving = false;
				}
			})}
		>
			<CardContent class="space-y-6">
				<div class="space-y-2">
					<Label for="current-password">Current Password</Label>
					<div class="relative max-w-sm">
						<KeyRound class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
						<Input
							{...updatePasswordAction.fields.currentPassword.as('password', currentPassword)}
							class="pl-9 h-11"
						/>
					</div>
				</div>

				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="new-password">New Password</Label>
						<div class="relative max-w-sm">
							<ShieldAlert class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
							<Input
								{...updatePasswordAction.fields.newPassword.as('password', newPassword)}
								class="pl-9 h-11"
							/>
						</div>
						{#if newPassword.length > 0}
							<div class="max-w-sm mt-2 flex gap-1 h-1.5">
								<div
									class="h-full flex-1 rounded-full {passwordStrength >= 25
										? passwordStrength === 25
											? 'bg-destructive'
											: 'bg-primary'
										: 'bg-muted'}"
								></div>
								<div
									class="h-full flex-1 rounded-full {passwordStrength >= 75
										? passwordStrength === 75
											? 'bg-amber-500'
											: 'bg-primary'
										: 'bg-muted'}"
								></div>
								<div
									class="h-full flex-1 rounded-full {passwordStrength === 100
										? 'bg-primary'
										: 'bg-muted'}"
								></div>
							</div>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="confirm-password">Confirm Password</Label>
						<div class="relative max-w-sm">
							<ShieldAlert class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
							<Input
								id="confirm-password"
								type="password"
								bind:value={confirmPassword}
								class="pl-9 h-11"
							/>
						</div>
					</div>
				</div>

				<Button
					type="submit"
					disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
					class="h-11"
				>
					{#if isSaving}
						<div
							class="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"
						></div>
						Updating...
					{:else}
						Update Password
					{/if}
				</Button>
			</CardContent>
		</form>
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
						<div
							class="flex items-center justify-between p-4 rounded-xl border {session.id
								? 'bg-muted/30'
								: 'border-dashed'}"
						>
							<div class="flex items-center gap-4">
								<div class="p-2.5 rounded-full bg-primary/10 text-primary">
									<MonitorSmartphone class="size-5" />
								</div>
								<div>
									<div class="font-medium">Device Session</div>
									<div class="text-xs text-muted-foreground">
										Expires {new Date(session.expiresAt).toLocaleDateString()}
									</div>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<form
									{...revokeSessionRemote.enhance(async (form) => {
										try {
											if (await form.submit()) {
												if (revokeSessionRemote.result?.success) {
													toast.success('Session revoked');
												}
											}
										} catch (e) {
											toast.error('Failed to revoke session');
										}
									})}
								>
									<input
										{...revokeSessionRemote
											.for(session.id)
											.fields.sessionToken.as('hidden', session.token)}
									/>
									<Button
										type="submit"
										variant="outline"
										size="sm"
										class="text-destructive hover:bg-destructive/10 hover:text-destructive"
									>
										<LogOut class="size-3.5 mr-1.5" />
										Revoke
									</Button>
								</form>
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
