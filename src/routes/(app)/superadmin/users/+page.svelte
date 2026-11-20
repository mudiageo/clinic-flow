<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { deactivateUser, getAllUsers, resetUserPassword } from '#lib/remote/superadmin.remote.ts';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '#lib/components/ui/card/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.ts';
	import { KeyRound, Loader2, MoreHorizontal, PowerOff, Search, Users } from '@lucide/svelte';

	let searchTerm = $state('');

	type DirectoryUser = {
		id: string;
		name: string;
		email: string | null;
		role: string;
		active: boolean;
		phcName?: string | null;
	};

	let resetDialogOpen = $state(false);
	let deactivateDialogOpen = $state(false);
	let resetTarget = $state<DirectoryUser | null>(null);
	let deactivateTarget = $state<DirectoryUser | null>(null);
	let newPassword = $state('');
	let confirmPassword = $state('');
	let submitting = $state(false);

	function filterUsers(users: DirectoryUser[]) {
		if (!searchTerm) return users;
		const lower = searchTerm.toLowerCase();
		return users.filter(
			(u) =>
				u.name.toLowerCase().includes(lower) ||
				(u.email ?? '').toLowerCase().includes(lower) ||
				(u.phcName ?? '').toLowerCase().includes(lower) ||
				u.role.toLowerCase().includes(lower)
		);
	}

	function openResetDialog(user: DirectoryUser): void {
		resetTarget = user;
		newPassword = '';
		confirmPassword = '';
		resetDialogOpen = true;
	}

	function openActiveDialog(user: DirectoryUser): void {
		deactivateTarget = user;
		deactivateDialogOpen = true;
	}

	async function handleResetPassword(): Promise<void> {
		if (!resetTarget || submitting) return;
		if (newPassword.length < 12) {
			toast.error('The new password must be at least 12 characters.');
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error('The new password and confirmation do not match.');
			return;
		}

		const target = resetTarget;
		submitting = true;
		try {
			await resetUserPassword({ userId: target.id, newPassword });
			toast.success(
				`Password reset for ${target.name}. All of their sessions have been signed out.`
			);
			resetDialogOpen = false;
			resetTarget = null;
			newPassword = '';
			confirmPassword = '';
			await refreshAll();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Unable to reset the password.');
		} finally {
			submitting = false;
		}
	}

	async function handleSetActive(): Promise<void> {
		if (!deactivateTarget || submitting) return;

		const target = deactivateTarget;
		const nextActive = !target.active;
		submitting = true;
		try {
			await deactivateUser({ userId: target.id, active: nextActive });
			toast.success(
				nextActive
					? `${target.name} has been reactivated.`
					: `${target.name} has been deactivated and all sessions revoked.`
			);
			deactivateDialogOpen = false;
			deactivateTarget = null;
			await refreshAll();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Unable to update the user status.');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>All Users — Superadmin</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-7xl mx-auto">
	<div class="flex items-start justify-between">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<Users class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Platform Users</h1>
				<p class="text-muted-foreground text-sm mt-0.5">
					Manage all staff and users across all clinics.
				</p>
			</div>
		</div>
	</div>

	<Card>
		<CardHeader class="pb-3 border-b">
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>User Directory</CardTitle>
					<CardDescription>Comprehensive list of registered staff.</CardDescription>
				</div>
				<div class="relative w-72">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input bind:value={searchTerm} placeholder="Search users or PHC..." class="pl-9 h-9" />
				</div>
			</div>
		</CardHeader>
		<CardContent class="p-0">
			{#await getAllUsers()}
				<div class="py-12 text-center text-muted-foreground animate-pulse">Loading users...</div>
			{:then allUsers}
				{@const filtered = filterUsers(allUsers)}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>PHC</TableHead>
							<TableHead>Status</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each filtered as user (user.id)}
							<TableRow>
								<TableCell class="font-medium">{user.name}</TableCell>
								<TableCell class="text-muted-foreground">{user.email ?? '—'}</TableCell>
								<TableCell>
									<Badge
										variant={user.role === 'admin' ? 'default' : 'secondary'}
										class="capitalize">{user.role}</Badge
									>
								</TableCell>
								<TableCell>{user.phcName || '—'}</TableCell>
								<TableCell>
									<Badge
										variant={user.active ? 'outline' : 'destructive'}
										class={user.active ? 'text-green-600 border-green-200 bg-green-50' : ''}
									>
										{user.active ? 'Active' : 'Inactive'}
									</Badge>
								</TableCell>
								<TableCell class="text-right">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger
											class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
										>
											<span class="sr-only">Open menu</span>
											<MoreHorizontal class="h-4 w-4" />
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Label>Actions</DropdownMenu.Label>
											<DropdownMenu.Item onSelect={() => openResetDialog(user)}>
												<KeyRound class="size-4 mr-2" />
												Reset Password
											</DropdownMenu.Item>
											<DropdownMenu.Item
												class="text-destructive cursor-pointer focus:text-destructive"
												onSelect={() => openActiveDialog(user)}
											>
												<PowerOff class="size-4 mr-2" />
												{user.active ? 'Deactivate User' : 'Reactivate User'}
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</TableCell>
							</TableRow>
						{:else}
							<TableRow>
								<TableCell colspan={6} class="text-center py-8 text-muted-foreground"
									>No users found.</TableCell
								>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/await}
		</CardContent>
	</Card>
</div>

<Dialog.Root bind:open={resetDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-destructive">
				<KeyRound class="size-5" />
				Reset password for {resetTarget?.name ?? 'user'}
			</Dialog.Title>
			<Dialog.Description>
				Choose a new password of at least 12 characters. This action immediately signs the user out
				of every active session; they must sign in again with the new password.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-2">
			<div class="space-y-2">
				<Label for="superadmin-new-password">New password</Label>
				<Input
					id="superadmin-new-password"
					type="password"
					autocomplete="new-password"
					minlength={12}
					bind:value={newPassword}
				/>
				<p class="text-xs text-muted-foreground">Minimum 12 characters.</p>
			</div>
			<div class="space-y-2">
				<Label for="superadmin-confirm-password">Confirm new password</Label>
				<Input
					id="superadmin-confirm-password"
					type="password"
					autocomplete="new-password"
					bind:value={confirmPassword}
				/>
				{#if confirmPassword && newPassword !== confirmPassword}
					<p class="text-xs text-destructive">Passwords do not match.</p>
				{/if}
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" disabled={submitting} onclick={() => (resetDialogOpen = false)}>
				Cancel
			</Button>
			<Button
				variant="destructive"
				disabled={submitting || newPassword.length < 12 || newPassword !== confirmPassword}
				onclick={handleResetPassword}
			>
				{#if submitting}
					<Loader2 class="size-4 mr-2 animate-spin" />
					Resetting…
				{:else}
					Reset password
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={deactivateDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-destructive">
				<PowerOff class="size-5" />
				{deactivateTarget?.active ? 'Deactivate' : 'Reactivate'}
				{deactivateTarget?.name ?? 'user'}
			</Dialog.Title>
			<Dialog.Description>
				{#if deactivateTarget?.active}
					This immediately revokes all active sessions for this user and blocks sign-in until an
					authorised admin reactivates the account. Continue only if this access should be stopped
					now.
				{:else}
					This restores the user's access. They will need to sign in again before they can use the
					system.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button
				variant="outline"
				disabled={submitting}
				onclick={() => (deactivateDialogOpen = false)}
			>
				Cancel
			</Button>
			<Button
				variant={deactivateTarget?.active ? 'destructive' : 'default'}
				disabled={submitting}
				onclick={handleSetActive}
			>
				{#if submitting}
					<Loader2 class="size-4 mr-2 animate-spin" />
					Working…
				{:else}
					{deactivateTarget?.active ? 'Deactivate user' : 'Reactivate user'}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
