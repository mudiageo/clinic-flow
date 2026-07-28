<script lang="ts">
	import { getAllUsers } from '$lib/remote/superadmin.remote';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Users, Search, MoreHorizontal } from '@lucide/svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	let searchTerm = $state('');

	function filterUsers(users: any[]) {
		if (!searchTerm) return users;
		const lower = searchTerm.toLowerCase();
		return users.filter((u) => 
			u.name.toLowerCase().includes(lower) || 
			u.email.toLowerCase().includes(lower) || 
			u.phcName?.toLowerCase().includes(lower) ||
			u.role.toLowerCase().includes(lower)
		);
	}
</script>

<svelte:head>
	<title>All Users — Superadmin</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-7xl mx-auto py-8">
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
						{#each filtered as user}
							<TableRow>
								<TableCell class="font-medium">{user.name}</TableCell>
								<TableCell class="text-muted-foreground">{user.email}</TableCell>
								<TableCell>
									<Badge variant={user.role === 'admin' ? 'default' : 'secondary'} class="capitalize">{user.role}</Badge>
								</TableCell>
								<TableCell>{user.phcName || '—'}</TableCell>
								<TableCell>
									<Badge variant={user.active ? 'outline' : 'destructive'} class={user.active ? 'text-green-600 border-green-200 bg-green-50' : ''}>
										{user.active ? 'Active' : 'Inactive'}
									</Badge>
								</TableCell>
								<TableCell class="text-right">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
											<span class="sr-only">Open menu</span>
											<MoreHorizontal class="h-4 w-4" />
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Label>Actions</DropdownMenu.Label>
											<DropdownMenu.Item>Reset Password</DropdownMenu.Item>
											<DropdownMenu.Item class="text-destructive">Deactivate User</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</TableCell>
							</TableRow>
						{:else}
							<TableRow>
								<TableCell colspan={6} class="text-center py-8 text-muted-foreground">No users found.</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/await}
		</CardContent>
	</Card>
</div>
