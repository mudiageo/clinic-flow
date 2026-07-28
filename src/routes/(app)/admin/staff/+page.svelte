<script lang="ts">
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Switch } from '$lib/components/ui/switch';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { updateStaffStatus } from '$lib/remote/admin.remote';
	import { toast } from 'svelte-sonner';
	import { UserCog, Plus, ShieldCheck } from '@lucide/svelte';

	let { data } = $props<{ data: { staffList: any[] } }>();

	async function toggleStatus(staffId: string, currentStatus: boolean) {
		const result = await updateStaffStatus({ staffId, active: !currentStatus });
		if (result?.success) {
			toast.success('Staff status updated successfully');
			const staff = data.staffList.find((s: any) => s.id === staffId);
			if (staff) staff.active = !currentStatus;
		} else {
			toast.error('Failed to update status');
		}
	}
</script>

<svelte:head>
	<title>Staff Management — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<UserCog class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Staff Management</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Manage PHC staff accounts and permissions
				</p>
			</div>
		</div>
		<Button href="/admin/staff/invite" class="bg-primary text-primary-foreground">
			<Plus class="size-4 mr-2" />
			Invite Staff
		</Button>
	</div>

	<Card class="overflow-hidden card-hover">
		<CardHeader class="border-b border-border bg-muted/20 px-6 py-4">
			<CardTitle class="text-base font-semibold">Active Staff Members</CardTitle>
		</CardHeader>
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead class="font-semibold px-6">Name</TableHead>
					<TableHead class="font-semibold px-6">Role</TableHead>
					<TableHead class="font-semibold px-6">Joined</TableHead>
					<TableHead class="font-semibold px-6 text-center">Status</TableHead>
					<TableHead class="font-semibold px-6 text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if data.staffList.length === 0}
					<TableRow>
						<TableCell colspan={5} class="text-center py-16 text-muted-foreground">
							No staff members found.
						</TableCell>
					</TableRow>
				{:else}
					{#each data.staffList as staff}
						<TableRow class="hover:bg-muted/40 transition-colors">
							<TableCell class="font-semibold px-6">
								{staff.fullName}
								{#if staff.authUserId.startsWith('pending-')}
									<span class="ml-2 text-xs text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full">Invited</span>
								{/if}
							</TableCell>
							<TableCell class="px-6">
								<Badge variant="outline" class="capitalize">{staff.role}</Badge>
							</TableCell>
							<TableCell class="text-muted-foreground text-sm px-6">
								{new Date(staff.createdAt).toLocaleDateString()}
							</TableCell>
							<TableCell class="text-center px-6">
								<Switch
									checked={staff.active}
									onCheckedChange={() => toggleStatus(staff.id, staff.active)}
								/>
							</TableCell>
							<TableCell class="text-right px-6">
								<Button variant="ghost" size="sm" href={`/admin/staff/${staff.id}`}>
									View Profile
								</Button>
							</TableCell>
						</TableRow>
					{/each}
				{/if}
			</TableBody>
		</Table>
	</Card>
</div>
