<script lang="ts">
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
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Account</p>
		<h1 class="text-2xl font-bold tracking-tight text-foreground">Security</h1>
		<p class="text-sm text-muted-foreground mt-0.5">
			Manage your password and active device sessions
		</p>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="px-5 py-3.5 border-b border-border bg-muted/20">
			<h2 class="text-base font-semibold">Change Password</h2>
			<p class="text-xs text-muted-foreground">
				Ensure your account is using a long, unique password to stay secure.
			</p>
		</div>
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
			<div class="p-5 sm:p-6 space-y-5">
				<div class="space-y-1.5">
					<Label for="current-password">Current Password</Label>
					<div class="relative max-w-sm">
						<KeyRound
							class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
						/>
						<Input
							{...updatePasswordAction.fields.currentPassword.as('password', currentPassword)}
							class="pl-9 h-11"
						/>
					</div>
				</div>

				<div class="space-y-4">
					<div class="space-y-1.5">
						<Label for="new-password">New Password</Label>
						<div class="relative max-w-sm">
							<ShieldAlert
								class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
							/>
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
											? 'bg-triage-amber'
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

					<div class="space-y-1.5">
						<Label for="confirm-password">Confirm Password</Label>
						<div class="relative max-w-sm">
							<ShieldAlert
								class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
							/>
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
					class="min-h-11 px-5 font-semibold"
				>
					{#if isSaving}
						Updating…
					{:else}
						Update Password
					{/if}
				</Button>
			</div>
		</form>
	</section>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="px-5 py-3.5 border-b border-border bg-muted/20">
			<h2 class="text-base font-semibold">Active Sessions</h2>
			<p class="text-xs text-muted-foreground">
				Review the devices currently logged into your account.
			</p>
		</div>
		<div class="p-5">
			{#await getActiveSessions()}
				<div class="space-y-3">
					<Skeleton class="h-16 w-full rounded-xl" />
					<Skeleton class="h-16 w-full rounded-xl" />
				</div>
			{:then sessions}
				<div class="space-y-3">
					{#each sessions as session (session.id)}
						<div
							class="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20"
						>
							<div class="flex items-center gap-3.5">
								<div
									class="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
								>
									<MonitorSmartphone class="size-5" />
								</div>
								<div>
									<div class="font-medium text-sm">Device Session</div>
									<div class="text-xs font-mono text-muted-foreground">
										Expires {new Date(session.expiresAt).toLocaleDateString()}
									</div>
								</div>
							</div>
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
									class="text-destructive hover:bg-destructive/10 hover:text-destructive min-h-9"
								>
									<LogOut class="size-3.5 mr-1.5" />
									Revoke
								</Button>
							</form>
						</div>
					{/each}

					{#if sessions.length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">No active sessions found.</p>
					{/if}
				</div>
			{/await}
		</div>
	</section>
</div>
