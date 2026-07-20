<script lang="ts">
	import { labRequestStore } from '$lib/state/lab-requests.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Select as SelectPrimitive } from 'bits-ui';
	import {
		Search,
		FlaskConical,
		Clock,
		CheckCircle2,
		ChevronRight,
		TestTube2
	} from '@lucide/svelte';
	import { formatDateTime } from '$lib/utils/date';
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

<div class="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
				<FlaskConical class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-foreground">Laboratory Hub</h1>
				<p class="text-muted-foreground text-sm mt-0.5">
					Manage and process clinical test requests.
				</p>
			</div>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
		<Card class="card-hover bg-card/60 cursor-default">
			<CardContent class="p-5 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-muted-foreground uppercase">Total Requests</p>
					<p class="text-2xl font-bold mt-1">{stats.total}</p>
				</div>
				<div
					class="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"
				>
					<TestTube2 class="size-4" />
				</div>
			</CardContent>
		</Card>
		<Card class="card-hover bg-card/60 border-triage-red/20 cursor-default">
			<CardContent class="p-5 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-triage-red uppercase">Pending</p>
					<p class="text-2xl font-bold text-triage-red mt-1">{stats.pending}</p>
				</div>
				<div
					class="size-10 rounded-lg bg-triage-red/10 flex items-center justify-center text-triage-red"
				>
					<Clock class="size-4" />
				</div>
			</CardContent>
		</Card>
		<Card class="card-hover bg-card/60 border-triage-amber/20 cursor-default">
			<CardContent class="p-5 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-triage-amber uppercase">Processing</p>
					<p class="text-2xl font-bold text-triage-amber mt-1">{stats.processing}</p>
				</div>
				<div
					class="size-10 rounded-lg bg-triage-amber/10 flex items-center justify-center text-triage-amber"
				>
					<TestTube2 class="size-4 animate-pulse" />
				</div>
			</CardContent>
		</Card>
		<Card class="card-hover bg-card/60 border-triage-green/20 cursor-default">
			<CardContent class="p-5 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-triage-green uppercase">Completed</p>
					<p class="text-2xl font-bold text-triage-green mt-1">{stats.completed}</p>
				</div>
				<div
					class="size-10 rounded-lg bg-triage-green/10 flex items-center justify-center text-triage-green"
				>
					<CheckCircle2 class="size-4" />
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Main Table Card -->
	<Card class="border shadow-sm overflow-hidden bg-card">
		<div
			class="p-4 border-b bg-muted/10 flex flex-col sm:flex-row gap-4 justify-between sm:items-center"
		>
			<div class="relative max-w-sm w-full">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					bind:value={searchQuery}
					placeholder="Search by patient or test type..."
					class="pl-9 bg-background"
				/>
			</div>
		</div>

		{#if sortedLabs.length === 0}
			<div
				class="py-16 flex flex-col items-center justify-center text-muted-foreground text-center"
			>
				<FlaskConical class="size-12 opacity-20 mb-3" />
				<p class="font-medium text-lg text-foreground">No lab requests found.</p>
				<p class="text-sm">You're all caught up!</p>
			</div>
		{:else}
			<Table>
				<TableHeader class="bg-muted/30 hover:bg-muted/30">
					<TableRow>
						<TableHead class="w-[120px]">Date/Time</TableHead>
						<TableHead>Patient</TableHead>
						<TableHead>Test Requested</TableHead>
						<TableHead>Urgency</TableHead>
						<TableHead>Status</TableHead>
						<TableHead class="text-right">Action</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each sortedLabs as lab (lab.id)}
						{@const p = patientStore.get(lab.patientId)}
						<TableRow class="hover:bg-muted/20 transition-colors">
							<TableCell class="text-xs text-muted-foreground whitespace-nowrap"
								>{formatDateTime(lab.createdAt)}</TableCell
							>
							<TableCell>
								<div class="font-medium text-foreground">{p?.name || 'Unknown Patient'}</div>
								<div class="text-[10px] text-muted-foreground uppercase tracking-wider">
									{p?.clinicId || '---'}
								</div>
							</TableCell>
							<TableCell class="font-medium">{lab.testType}</TableCell>
							<TableCell>
								{#if lab.urgency === 'stat'}
									<Badge
										class="bg-triage-red hover:bg-triage-red/90 uppercase text-[10px] px-2 py-0"
										>STAT</Badge
									>
								{:else if lab.urgency === 'urgent'}
									<Badge
										class="bg-triage-amber hover:bg-triage-amber/90 text-triage-amber-foreground uppercase text-[10px] px-2 py-0"
										>Urgent</Badge
									>
								{:else}
									<Badge variant="outline" class="uppercase text-[10px] px-2 py-0">Routine</Badge>
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
										? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/20'
										: ''}
								>
									{lab.status}
								</Badge>
							</TableCell>
							<TableCell class="text-right">
								<Button
									variant="ghost"
									size="sm"
									class="h-8 hover:bg-primary/10 hover:text-primary font-medium"
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
	</Card>
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
					<SelectTrigger class="w-full"
						><SelectPrimitive.Value placeholder="Select Status" /></SelectTrigger
					>
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
			<Button onclick={handleSaveResult} class="bg-primary hover:bg-primary/90">Save Result</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
