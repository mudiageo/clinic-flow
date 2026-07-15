<script lang="ts">
	import { page } from '$app/state';
	import { getStaffMember } from '$lib/remote/admin.remote';
	import { getStaffPermissions } from '$lib/remote/permissions.remote';
	import { getRoleDefaults } from '$lib/permissions';
	import PermissionEditor from '$lib/components/permission-editor.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Badge } from '$lib/components/ui/badge';
	import { User, Calendar, ShieldCheck, Activity } from '@lucide/svelte';

	const staffId = page.params.id;
</script>

<svelte:head>
	<title>Staff Profile & Permissions — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in max-w-4xl">
	{#await Promise.all([getStaffMember(staffId as string), getStaffPermissions(staffId as string)])}
		<div class="space-y-6">
			<Skeleton class="h-32 w-full rounded-2xl" />
			<Skeleton class="h-64 w-full rounded-2xl" />
		</div>
	{:then [staffMember, permissions]}
		{#if staffMember}
			<!-- Header / Profile Info -->
			<div
				class="bg-card border rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
			>
				<div class="flex items-center gap-4">
					<div
						class="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary"
					>
						<User class="size-8" />
					</div>
					<div>
						<h1 class="text-2xl font-bold text-foreground">{staffMember.fullName}</h1>
						<div class="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
							<Badge variant="outline" class="capitalize">{staffMember.role}</Badge>
							<span>•</span>
							{#if staffMember.active}
								<span class="text-emerald-500 font-medium flex items-center gap-1">
									<Activity class="size-3" /> Active
								</span>
							{:else}
								<span class="text-destructive font-medium flex items-center gap-1">
									<ShieldCheck class="size-3" /> Inactive
								</span>
							{/if}
						</div>
					</div>
				</div>
				<div class="text-sm text-muted-foreground flex flex-col items-end">
					<span class="flex items-center gap-1.5"
						><Calendar class="size-4" /> Joined: {new Date(
							staffMember.createdAt
						).toLocaleDateString()}</span
					>
				</div>
			</div>

			<!-- Permission Editor -->
			<div class="bg-card border rounded-2xl p-6">
				<PermissionEditor
					staffId={staffMember.id}
					role={staffMember.role}
					roleDefaults={getRoleDefaults(staffMember.role)}
					activePermissions={permissions}
				/>
			</div>
		{:else}
			<div class="p-8 text-center bg-card border rounded-2xl">
				<h2 class="text-xl font-semibold text-foreground">Staff Member Not Found</h2>
				<p class="text-muted-foreground mt-2">
					The staff member you are looking for does not exist or belongs to another PHC.
				</p>
			</div>
		{/if}
	{:catch error}
		<div class="p-6 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl">
			<h3 class="font-bold">Error loading staff member</h3>
			<p>{error.message}</p>
		</div>
	{/await}
</div>
