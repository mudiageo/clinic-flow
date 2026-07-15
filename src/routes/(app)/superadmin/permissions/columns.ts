import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import { renderSnippet } from '$lib/components/ui/data-table/index.js';
import Badge from '$lib/components/ui/badge/badge.svelte';

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

export const columns: ColumnDef<PermissionAuditItem>[] = [
	{
		accessorKey: 'staff.fullName',
		header: 'Staff Member',
		cell: ({ row }) => `${row.original.staff.fullName} (${row.original.staff.role})`
	},
	{
		accessorKey: 'phc.name',
		header: 'PHC Facility',
		cell: ({ row }) => `${row.original.phc.name}, ${row.original.phc.state}`
	},
	{
		accessorKey: 'permission',
		header: 'Permission Key',
		cell: ({ row }) => {
			const permSnippet = createRawSnippet<[{ permission: string }]>((getPerm) => {
				const { permission } = getPerm();
				return {
					render: () =>
						`<code class="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">${permission}</code>`
				};
			});
			return renderSnippet(permSnippet, { permission: row.original.permission });
		}
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
			let status = 'Active';
			if (row.original.revoked) status = 'Revoked';
			else if (row.original.expiresAt && new Date(row.original.expiresAt) < new Date())
				status = 'Expired';

			const badgeSnippet = createRawSnippet<[{ status: string }]>((getStatus) => {
				const { status } = getStatus();
				let classes = 'bg-secondary text-secondary-foreground';
				if (status === 'Active') classes = 'bg-emerald-500 hover:bg-emerald-600 text-white';
				else if (status === 'Revoked')
					classes = 'bg-destructive hover:bg-destructive text-destructive-foreground';

				return {
					render: () =>
						`<div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${classes}">${status}</div>`
				};
			});

			return renderSnippet(badgeSnippet, { status });
		}
	}
];
