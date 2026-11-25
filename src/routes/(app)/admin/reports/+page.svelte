<script lang="ts">
	import { encounterStore } from '#lib/state/encounters.svelte.ts';
	import { prescriptionStore } from '#lib/state/prescriptions.svelte.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { vitalsStore } from '#lib/state/vitals.svelte.ts';
	import { Printer, Download } from '@lucide/svelte';

	let startDate = $state(
		new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
	);
	let endDate = $state(new Date().toISOString().split('T')[0]);

	const filteredEncounters = $derived.by(() => {
		const start = new Date(startDate).getTime();
		const end = new Date(endDate).getTime() + 86400000;
		return encounterStore.items.filter(
			(e) => new Date(e.visitDate).getTime() >= start && new Date(e.visitDate).getTime() <= end
		);
	});

	const filteredVitals = $derived.by(() => {
		const start = new Date(startDate).getTime();
		const end = new Date(endDate).getTime() + 86400000;
		return vitalsStore.items.filter((v) => v.recordedAt >= start && v.recordedAt <= end);
	});

	const triageCounts = $derived.by(() => {
		let red = 0,
			amber = 0,
			green = 0;
		filteredVitals.forEach((v) => {
			if (v.triageLevel === 'red') red++;
			else if (v.triageLevel === 'amber') amber++;
			else if (v.triageLevel === 'green') green++;
		});
		return { red, amber, green };
	});

	const chiefComplaints = $derived.by(() => {
		const counts: Record<string, number> = {};
		filteredEncounters.forEach((e) => {
			if (e.chiefComplaint) {
				const key = e.chiefComplaint.substring(0, 20) + '...';
				counts[key] = (counts[key] || 0) + 1;
			}
		});
		return Object.entries(counts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
	});

	const filteredPrescriptions = $derived.by(() => {
		const start = new Date(startDate).getTime();
		const end = new Date(endDate).getTime() + 86400000;
		return prescriptionStore.items.filter((p) => {
			return p.createdAt >= start && p.createdAt <= end;
		});
	});

	const medicationStats = $derived.by(() => {
		const counts: Record<string, { count: number; dispensed: number }> = {};
		filteredPrescriptions.forEach((p) => {
			if (!counts[p.medicationName]) {
				counts[p.medicationName] = { count: 0, dispensed: 0 };
			}
			counts[p.medicationName].count += 1;
			if (p.status === 'dispensed') {
				counts[p.medicationName].dispensed += 1;
			}
		});
		return Object.entries(counts)
			.map(([name, stats]) => ({ name, ...stats }))
			.sort((a, b) => b.count - a.count);
	});

	function exportPharmacyCsv() {
		const headers = ['Medication', 'Prescribed Times', 'Dispensed Times'];
		const rows = medicationStats.map((s) => [s.name, s.count, s.dispensed]);

		const csvContent = [
			headers.join(','),
			...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', `pharmacy_report_${startDate}_to_${endDate}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<svelte:head>
	<title>Clinical Reports — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto print:bg-white print:m-0 print:max-w-none">
	<div
		class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border print:hidden"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Analytics &amp; Reporting
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Clinical Reports</h1>
			<p class="text-muted-foreground text-sm mt-0.5">Generate and analyze facility metrics</p>
		</div>

		<div class="flex items-end gap-3 flex-wrap">
			<div class="space-y-1">
				<Label class="text-xs">Start Date</Label>
				<Input type="date" bind:value={startDate} class="h-10 font-mono" />
			</div>
			<div class="space-y-1">
				<Label class="text-xs">End Date</Label>
				<Input type="date" bind:value={endDate} class="h-10 font-mono" />
			</div>
			<Button variant="outline" class="h-10" onclick={() => window.print()}>
				<Printer class="size-4 mr-2" />
				Print Report
			</Button>
		</div>
	</div>

	<!-- Print Header -->
	<div class="hidden print:block mb-8 pb-4 border-b">
		<h1 class="text-3xl font-bold">ClinicFlow Activity Report</h1>
		<p class="text-lg text-gray-500 mt-2">
			Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
		</p>
		<p class="text-sm text-gray-400 mt-1">Generated: {new Date().toLocaleString()}</p>
	</div>

	<!-- Ruled Summary Strip -->
	<div class="grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-card">
		<div class="px-5 py-4">
			<p class="text-xs font-mono uppercase tracking-wider text-muted-foreground">
				Total Encounters
			</p>
			<p class="text-3xl font-bold font-mono tabular-nums mt-1">{filteredEncounters.length}</p>
		</div>
		<div class="px-5 py-4">
			<p class="text-xs font-mono uppercase tracking-wider text-muted-foreground">
				Prescriptions Written
			</p>
			<p class="text-3xl font-bold font-mono tabular-nums mt-1">{filteredPrescriptions.length}</p>
		</div>
	</div>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Triage Distribution -->
		<section class="rounded-xl border border-border bg-card overflow-hidden">
			<div class="px-5 py-3.5 border-b border-border bg-muted/20">
				<h2 class="text-base font-semibold">Triage Distribution</h2>
				<p class="text-xs text-muted-foreground">Breakdown by urgency level</p>
			</div>
			<div class="flex items-center justify-center p-6">
				{#if filteredVitals.length === 0}
					<p class="text-muted-foreground text-sm py-12">No data for selected period</p>
				{:else}
					{@const total = triageCounts.red + triageCounts.amber + triageCounts.green}
					{@const redPct = (triageCounts.red / total) * 100}
					{@const amberPct = (triageCounts.amber / total) * 100}

					<div class="flex items-center gap-10 w-full max-w-sm">
						<div
							class="relative size-32 rounded-full overflow-hidden shrink-0 print:border-4 print:border-gray-200"
							style="background: conic-gradient(
                                theme(colors.red.500) 0% {redPct}%,
                                theme(colors.amber.500) {redPct}% {redPct + amberPct}%,
                                theme(colors.green.500) {redPct + amberPct}% 100%
                            );"
						>
							<div class="absolute inset-4 bg-card rounded-full print:bg-white"></div>
							<div
								class="absolute inset-0 flex items-center justify-center font-bold font-mono text-xl"
							>
								{total}
							</div>
						</div>
						<div class="space-y-3 flex-1">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-red-500 print:border border-black"></div>
									<span class="text-sm font-medium">RED</span>
								</div>
								<span class="font-bold font-mono tabular-nums">{triageCounts.red}</span>
							</div>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-amber-500 print:border border-black"></div>
									<span class="text-sm font-medium">AMBER</span>
								</div>
								<span class="font-bold font-mono tabular-nums">{triageCounts.amber}</span>
							</div>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-green-500 print:border border-black"></div>
									<span class="text-sm font-medium">GREEN</span>
								</div>
								<span class="font-bold font-mono tabular-nums">{triageCounts.green}</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</section>

		<!-- Top Complaints -->
		<section class="rounded-xl border border-border bg-card overflow-hidden">
			<div class="px-5 py-3.5 border-b border-border bg-muted/20">
				<h2 class="text-base font-semibold">Top Chief Complaints</h2>
				<p class="text-xs text-muted-foreground">Most common reasons for visit</p>
			</div>
			<div class="p-6">
				{#if chiefComplaints.length === 0}
					<p class="text-muted-foreground text-sm py-12 text-center">No data for selected period</p>
				{:else}
					{@const maxCount = chiefComplaints[0][1]}
					<div class="space-y-4">
						{#each chiefComplaints as [complaint, count]}
							<div>
								<div class="flex justify-between text-sm mb-1">
									<span class="font-medium truncate pr-4">{complaint}</span>
									<span class="font-bold font-mono tabular-nums text-muted-foreground">{count}</span
									>
								</div>
								<div
									class="w-full bg-muted rounded-full h-2 overflow-hidden print:border print:border-gray-300"
								>
									<div
										class="bg-primary h-full rounded-full print:bg-gray-800"
										style="width: {(count / maxCount) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</section>
	</div>

	<!-- Pharmacy Usage Ledger -->
	<section
		class="rounded-xl border border-border bg-card overflow-hidden print:border-t-2 print:border-black print:rounded-none"
	>
		<div
			class="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between print:px-0"
		>
			<div>
				<h2 class="text-base font-semibold">Pharmacy Usage Summary</h2>
				<p class="text-xs text-muted-foreground">Most prescribed vs. dispensed medications</p>
			</div>
			<Button variant="outline" size="sm" class="print:hidden" onclick={exportPharmacyCsv}>
				<Download class="size-4 mr-2" />
				CSV
			</Button>
		</div>
		<div class="print:px-0">
			<Table>
				<TableHeader class="bg-muted/40">
					<TableRow class="hover:bg-transparent">
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5"
							>Medication Name</TableHead
						>
						<TableHead class="text-right font-mono text-xs uppercase tracking-wider"
							>Prescribed</TableHead
						>
						<TableHead class="text-right font-mono text-xs uppercase tracking-wider"
							>Dispensed</TableHead
						>
						<TableHead class="text-right font-mono text-xs uppercase tracking-wider px-5"
							>Fulfillment %</TableHead
						>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if medicationStats.length === 0}
						<TableRow>
							<TableCell colspan={4} class="text-center py-8 text-muted-foreground">
								No pharmacy data for selected period
							</TableCell>
						</TableRow>
					{:else}
						{#each medicationStats.slice(0, 10) as stat, idx}
							<TableRow class={idx % 2 === 1 ? 'bg-muted/20' : ''}>
								<TableCell class="font-medium px-5">{stat.name}</TableCell>
								<TableCell class="text-right font-mono tabular-nums">{stat.count}</TableCell>
								<TableCell class="text-right font-mono tabular-nums">{stat.dispensed}</TableCell>
								<TableCell class="text-right px-5">
									<Badge
										variant="outline"
										class={stat.dispensed === stat.count
											? 'text-triage-green border-triage-green/30 bg-triage-green/10'
											: stat.dispensed === 0
												? 'text-destructive border-destructive/20 bg-destructive/10'
												: 'text-amber-700 dark:text-triage-amber border-triage-amber/40 bg-triage-amber/12'}
									>
										{Math.round((stat.dispensed / stat.count) * 100)}%
									</Badge>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</div>
	</section>
</div>
