import type { ColumnDef } from '@tanstack/table-core';
import { Badge } from '$lib/components/ui/badge';
import { createRawSnippet } from 'svelte';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table/index.js';

export type ReminderRow = {
	id: string;
	patientId: string;
	patientName: string;
	recipientPhone: string;
	label: string;
	type: string;
	status: string;
	dueDate: number;
};

const badgeSnippet = createRawSnippet(
	(text: () => string, variant: () => any, customClass: () => string) => {
		return {
			render: () =>
				`<div class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant() === 'outline' ? 'text-foreground' : ''} ${customClass()}">${text()}</div>`,
			setup: () => {}
		};
	}
);

function formatDate(ts: number) {
	return new Date(ts).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

export const columns: ColumnDef<ReminderRow>[] = [
	{
		accessorKey: 'patientName',
		header: 'Patient',
		cell: ({ row }) => {
			const name = row.getValue('patientName') as string;
			const phone = row.original.recipientPhone;

			const snippet = createRawSnippet(() => {
				return {
					render: () =>
						`<div class="flex flex-col"><span class="font-semibold text-foreground text-sm">${name}</span><span class="text-muted-foreground text-xs font-mono mt-0.5">${phone}</span></div>`,
					setup: () => {}
				};
			});
			return renderSnippet(snippet, '');
		}
	},
	{
		accessorKey: 'type',
		header: 'Type',
		cell: ({ row }) => {
			const typeStr = (row.getValue('type') as string).replace('_', ' ');
			const snippet = createRawSnippet(() => {
				return {
					render: () =>
						`<div class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">${typeStr}</div>`,
					setup: () => {}
				};
			});
			return renderSnippet(snippet, '');
		}
	},
	{
		accessorKey: 'label',
		header: 'Message',
		cell: ({ row }) => {
			return row.getValue('label');
		}
	},
	{
		accessorKey: 'dueDate',
		header: 'Due Date',
		cell: ({ row }) => {
			const date = row.getValue('dueDate') as number;
			return formatDate(date);
		}
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => {
			const status = row.getValue('status') as string;
			let className = 'bg-secondary text-secondary-foreground';

			if (status === 'scheduled') {
				className =
					'bg-triage-amber/15 text-triage-amber border border-triage-amber/25 uppercase tracking-wider text-[10px]';
			} else if (status === 'sent') {
				className =
					'bg-triage-green/15 text-triage-green border border-triage-green/25 uppercase tracking-wider text-[10px]';
			}

			const snippet = createRawSnippet(() => {
				return {
					render: () =>
						`<div class="inline-flex items-center rounded-md px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}">${status === 'scheduled' ? 'Pending' : status}</div>`,
					setup: () => {}
				};
			});
			return renderSnippet(snippet, '');
		}
	}
];
