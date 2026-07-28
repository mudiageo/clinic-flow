<script lang="ts">
	import { page } from '$app/state';
	import { getStaffMember, getStaffPermissionAuditLog } from '$lib/remote/admin.remote';
	import { getStaffPermissions } from '$lib/remote/permissions.remote';
	import { getRoleDefaults } from '$lib/permissions';
	import PermissionEditor from '$lib/components/permission-editor.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Badge } from '$lib/components/ui/badge';
	import * as Tabs from '$lib/components/ui/tabs';
	import { User, Calendar, ShieldCheck, Activity, Key, History, ArrowLeft } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	const staffId = page.params.id;
</script>

<svelte:head>
	<title>Staff Profile & Permissions — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-4xl">
	<Button variant="ghost" href="/admin/staff" class="pl-0 hover:bg-transparent -mb-2">
		<ArrowLeft class="size-4 mr-2" />
		Back to Staff List
	</Button>

	{#await Promise.all([
		getStaffMember(staffId as string), 
		getStaffPermissions(staffId as string),
		getStaffPermissionAuditLog(staffId as string)
	])}
		<div class="space-y-6">
			<Skeleton class="h-32 w-full rounded-2xl" />
			<Skeleton class="h-64 w-full rounded-2xl" />
		</div>
	{:then [staffMember, permissions, auditLog]}
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

			<Tabs.Root value="permissions" class="w-full">
				<Tabs.List class="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 space-x-6">
					<Tabs.Trigger
						value="permissions"
						class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full gap-2 font-medium"
					>
						<Key class="size-4" />
						Permissions
					</Tabs.Trigger>
					<Tabs.Trigger
						value="audit"
						class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full gap-2 font-medium"
					>
						<History class="size-4" />
						Audit Log
					</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="permissions" class="mt-6 outline-none">
					<!-- Permission Editor -->
					<div class="bg-card border rounded-2xl p-6">
						<PermissionEditor
							staffId={staffMember.id}
							role={staffMember.role}
							roleDefaults={getRoleDefaults(staffMember.role)}
							activePermissions={permissions}
						/>
					</div>
				</Tabs.Content>

				<Tabs.Content value="audit" class="mt-6 outline-none">
					<div class="bg-card border rounded-2xl overflow-hidden">
						{#if auditLog.length === 0}
							<div class="p-8 text-center text-muted-foreground">
								No permission changes recorded yet.
							</div>
						{:else}
							<div class="divide-y divide-border">
								{#each auditLog as log}
									<div class="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
										<div>
											<div class="font-medium flex items-center gap-2">
												<Badge variant="outline" class="font-mono text-xs">{log.permission}</Badge>
												{#if log.revoked}
													<Badge variant="destructive" class="text-[10px]">Revoked</Badge>
												{:else}
													<Badge variant="secondary" class="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Granted</Badge>
												{/if}
											</div>
											<div class="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
												<User class="size-3.5" />
												By: {log.grantedByStaff?.fullName || 'System'}
											</div>
										</div>
										<div class="text-xs text-muted-foreground tabular-nums">
											{new Date(log.grantedAt).toLocaleString()}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</Tabs.Content>
			</Tabs.Root>
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
