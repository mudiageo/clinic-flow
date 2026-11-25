<script lang="ts">
	import { labRequestStore } from '#lib/state/lab-requests.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { notificationStore } from '#lib/state/notifications.svelte.ts';
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
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '#lib/components/ui/select/index.ts';
	import { Select as SelectPrimitive } from 'bits-ui';
	import {
		Search,
		FlaskConical,
		Clock,
		CheckCircle2,
		ChevronRight,
		TestTube2
	} from '@lucide/svelte';
	import { formatDateTime } from '#lib/utils/date.ts';
	import { toast } from 'svelte-sonner';

	let searchQuery = $state('');

	const sortedLabs = $derived(
		labRequestStore.sortedItems.filter((l) => {
			if (!searchQuery.trim()) return true;
			const patient = patientStore.get(l.patientId);
			const q = searchQuery.toLowerCase();
			return (
				l.testType.toLowerCase().includes(q) || (patient && patient.name.toLowerCase().includes(q))
			);
		})
	);

	const stats = $derived({
		total: sortedLabs.length,
		pending: sortedLabs.filter((l) => l.status === 'pending').length,
		processing: sortedLabs.filter((l) => l.status === 'processing').length,
		completed: sortedLabs.filter((l) => l.status === 'completed').length
	});

	let isResultModalOpen = $state(false);
	let selectedLab = $state<any>(null);
	let resultText = $state('');
	let statusUpdate = $state<'pending' | 'processing' | 'completed'>('completed');

	function openResultModal(lab: any) {
		selectedLab = lab;
		resultText = lab.result || '';
		statusUpdate = lab.status === 'pending' ? 'processing' : lab.status;
		isResultModalOpen = true;
	}

	async function handleSaveResult() {
		if (!selectedLab) return;
		try {
			await labRequestStore.update(selectedLab.id, {
				result: resultText,
				status: statusUpdate,
				resultEnteredAt: Date.now()
			} as any);

			if (statusUpdate === 'completed') {
				const pt = patientStore.get(selectedLab.patientId);
				notificationStore.broadcast(
					'Lab Result Ready',
					`Result entered for ${pt?.name || 'Unknown'} (${selectedLab.testType})`,
					'doctor',
					`/doctor/consult/${selectedLab.encounterId}`
				);
			}

			toast.success('Lab result saved successfully!');
			isResultModalOpen = false;
		} catch (e: any) {
			toast.error(`Error saving result: ${e.message}`);
		}
	}
</script>

<svelte:head>
	<title>Lab Management — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto pb-12">
	<!-- Header -->
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Diagnostics
		</p>
		<h1 class="text-2xl font-bold tracking-tight text-foreground">Laboratory Hub</h1>
		<p class="text-muted-foreground text-sm mt-0.5">Manage and process clinical test requests</p>
	</div>

	<!-- Compact Ruled Lab Ledger Strip -->
	<div
		class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border rounded-xl border border-border bg-card"
	>
		<div class="px-4 py-3 flex items-center justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Total</p>
				<p class="text-2xl font-bold font-mono tabular-nums mt-0.5">{stats.total}</p>
			</div>
			<TestTube2 class="size-4 text-muted-foreground shrink-0" />
		</div>
		<div class="px-4 py-3 flex items-center justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-triage-red">Pending</p>
				<p class="text-2xl font-bold font-mono tabular-nums text-triage-red mt-0.5">
					{stats.pending}
				</p>
			</div>
			<Clock class="size-4 text-triage-red shrink-0" />
		</div>
		<div class="px-4 py-3 flex items-center justify-between gap-2">
			<div>
				<p
					class="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-triage-amber"
				>
					Processing
				</p>
				<p
					class="text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-triage-amber mt-0.5"
				>
					{stats.processing}
				</p>
			</div>
			<TestTube2 class="size-4 text-triage-amber shrink-0" />
		</div>
		<div class="px-4 py-3 flex items-center justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-triage-green">Completed</p>
				<p class="text-2xl font-bold font-mono tabular-nums text-triage-green mt-0.5">
					{stats.completed}
				</p>
			</div>
			<CheckCircle2 class="size-4 text-triage-green shrink-0" />
		</div>
	</div>

	<!-- Main Table -->
	<section class="border border-border rounded-xl overflow-hidden bg-card">
		<div
			class="p-4 border-b border-border flex flex-col sm:flex-row gap-3 justify-between sm:items-center"
		>
			<h2 class="text-base font-semibold text-foreground">Test Requests</h2>
			<div class="relative max-w-sm w-full">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					bind:value={searchQuery}
					placeholder="Search by patient or test type..."
					class="pl-9 h-10 bg-background"
				/>
			</div>
		</div>

		{#if sortedLabs.length === 0}
			<div
				class="py-16 flex flex-col items-center justify-center text-muted-foreground text-center"
			>
				<FlaskConical class="size-10 opacity-25 mb-2" />
				<p class="font-medium text-base text-foreground">No lab requests found</p>
				<p class="text-xs mt-0.5">Pending diagnostic orders will appear here.</p>
			</div>
		{:else}
			<Table>
				<TableHeader class="bg-muted/40">
					<TableRow class="hover:bg-transparent">
						<TableHead class="w-[140px] font-mono text-xs uppercase tracking-wider"
							>Date/Time</TableHead
						>
						<TableHead class="font-mono text-xs uppercase tracking-wider">Patient</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider">Test Requested</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider">Urgency</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider">Status</TableHead>
						<TableHead class="text-right font-mono text-xs uppercase tracking-wider"
							>Action</TableHead
						>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each sortedLabs as lab, idx (lab.id)}
						{@const p = patientStore.get(lab.patientId)}
						<TableRow class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}>
							<TableCell class="text-xs font-mono text-muted-foreground whitespace-nowrap">
								{formatDateTime(lab.createdAt)}
							</TableCell>
							<TableCell>
								<div class="font-medium text-foreground">{p?.name || 'Unknown Patient'}</div>
								<div class="text-[11px] font-mono text-muted-foreground">
									{p?.clinicId || '---'}
								</div>
							</TableCell>
							<TableCell class="font-medium">{lab.testType}</TableCell>
							<TableCell>
								{#if lab.urgency === 'stat'}
									<Badge class="bg-triage-red text-triage-red-foreground uppercase text-[10px]">
										STAT
									</Badge>
								{:else if lab.urgency === 'urgent'}
									<Badge class="bg-triage-amber text-triage-amber-foreground uppercase text-[10px]">
										Urgent
									</Badge>
								{:else}
									<Badge variant="outline" class="uppercase text-[10px]">Routine</Badge>
								{/if}
							</TableCell>
							<TableCell>
								<Badge
									variant={lab.status === 'completed'
										? 'default'
										: lab.status === 'processing'
											? 'secondary'
											: 'outline'}
									class={lab.status === 'completed'
										? 'bg-triage-green/15 text-triage-green border-triage-green/30'
										: ''}
								>
									{lab.status}
								</Badge>
							</TableCell>
							<TableCell class="text-right">
								<Button
									variant="ghost"
									size="sm"
									class="h-9 hover:bg-primary/10 hover:text-primary font-medium"
									onclick={() => openResultModal(lab)}
								>
									{lab.status === 'completed' ? 'View Result' : 'Enter Result'}
									<ChevronRight class="size-4 ml-1" />
								</Button>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		{/if}
	</section>
</div>

<Dialog.Root bind:open={isResultModalOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Laboratory Result</Dialog.Title>
			<Dialog.Description>
				{selectedLab?.testType} for {patientStore.get(selectedLab?.patientId)?.name}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label>Status</Label>
				<Select type="single" bind:value={statusUpdate}>
					<SelectTrigger class="w-full">
						<SelectPrimitive.Value placeholder="Select Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="processing">Processing</SelectItem>
						<SelectItem value="completed">Completed</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div class="space-y-2">
				<Label>Result / Findings</Label>
				<Textarea
					bind:value={resultText}
					placeholder="Enter lab findings and values..."
					class="min-h-[150px] font-mono text-sm resize-y"
				/>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isResultModalOpen = false)}>Cancel</Button>
			<Button onclick={handleSaveResult}>Save Result</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
