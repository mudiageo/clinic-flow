<script lang="ts">
	import { getPlatformPermissionsAudit } from '$lib/remote/permissions.remote';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import { getCoreRowModel, type ColumnDef } from '@tanstack/table-core';
	import { Badge } from '$lib/components/ui/badge';
	import { Shield, Search } from '@lucide/svelte';
	import { Input } from '$lib/components/ui/input';

	type PermissionAuditItem = {
		id: string;
		permission: string;
		grantedAt: Date;
		expiresAt: Date | null;
		revoked: boolean;
		staff: { fullName: string; role: string };
		grantedByStaff: { fullName: string } | null;
		phc: { name: string; state: string };
	};

	let data: PermissionAuditItem[] = $state([]);
	let loading = $state(true);
	let globalFilter = $state('');

	const columns: ColumnDef<PermissionAuditItem>[] = [
		{
			accessorKey: 'staff.fullName',
			header: 'Staff Member',
			cell: ({ row }) => {
				return `${row.original.staff.fullName} (${row.original.staff.role})`;
			}
		},
		{
			accessorKey: 'phc.name',
			header: 'PHC Facility',
			cell: ({ row }) => `${row.original.phc.name}, ${row.original.phc.state}`
		},
		{
			accessorKey: 'permission',
			header: 'Permission Key',
			cell: ({ row }) => row.original.permission
		},
		{
			accessorKey: 'grantedAt',
			header: 'Granted On',
			cell: ({ row }) => new Date(row.original.grantedAt).toLocaleDateString()
		},
		{
			accessorKey: 'grantedByStaff.fullName',
			header: 'Granted By',
			cell: ({ row }) => row.original.grantedByStaff?.fullName || 'System'
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				if (row.original.revoked) return 'Revoked';
				if (row.original.expiresAt && new Date(row.original.expiresAt) < new Date())
					return 'Expired';
				return 'Active';
			}
		}
	];

	$effect(() => {
		getPlatformPermissionsAudit().then((res) => {
			data = res as unknown as PermissionAuditItem[];
			loading = false;
		});
	});

	const table = createSvelteTable({
		get data() {
			if (!globalFilter) return data;
			const lowerFilter = globalFilter.toLowerCase();
			return data.filter(
				(d) =>
					d.staff.fullName.toLowerCase().includes(lowerFilter) ||
					d.permission.toLowerCase().includes(lowerFilter) ||
					d.phc.name.toLowerCase().includes(lowerFilter)
			);
		},
		columns,
		getCoreRowModel: getCoreRowModel()
	});
</script>

<svelte:head>
	<title>Permissions Audit — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-6xl">
	<div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="p-2 rounded-xl bg-primary/10 text-primary">
				<Shield class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-foreground">
					Platform Permissions Audit
				</h1>
				<p class="text-muted-foreground text-sm">
					View all granular permission grants across all primary healthcare centers.
				</p>
			</div>
		</div>
	</div>

	<div class="bg-card border rounded-2xl shadow-sm">
		<div class="p-4 border-b flex items-center justify-between">
			<div class="relative w-full max-w-sm">
				<Search class="absolute left-3 top-3 size-4 text-muted-foreground" />
				<Input
					placeholder="Filter by staff, PHC, or permission..."
					class="pl-10"
					bind:value={globalFilter}
				/>
			</div>
		</div>

		{#if loading}
			<div class="p-8 space-y-4">
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-10 w-full" />
			</div>
		{:else}
			<div class="overflow-x-auto rounded-b-2xl">
				<Table>
					<TableHeader class="bg-muted/40">
						{#each table.getHeaderGroups() as headerGroup}
							<TableRow>
								{#each headerGroup.headers as header}
									<TableHead class="font-semibold text-muted-foreground whitespace-nowrap">
										<FlexRender
											content={header.column.columnDef.header}
											context={header.getContext()}
										/>
									</TableHead>
								{/each}
							</TableRow>
						{/each}
					</TableHeader>
					<TableBody>
						{#each table.getRowModel().rows as row}
							<TableRow class="hover:bg-muted/30">
								{#each row.getVisibleCells() as cell}
									<TableCell class="py-3">
										{#if cell.column.id === 'status'}
											{@const status = cell.getValue()}
											{#if status === 'Active'}
												<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-600"
													>Active</Badge
												>
											{:else if status === 'Revoked'}
												<Badge variant="destructive">Revoked</Badge>
											{:else}
												<Badge variant="secondary">Expired</Badge>
											{/if}
										{:else if cell.column.id === 'permission'}
											<code class="px-1.5 py-0.5 rounded bg-muted text-xs font-mono"
												>{cell.getValue()}</code
											>
										{:else}
											<FlexRender
												content={cell.column.columnDef.cell}
												context={cell.getContext()}
											/>
										{/if}
									</TableCell>
								{/each}
							</TableRow>
						{:else}
							<TableRow>
								<TableCell colspan={columns.length} class="h-24 text-center text-muted-foreground">
									No permission grants found.
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{/if}
	</div>
</div>
