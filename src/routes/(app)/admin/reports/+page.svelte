<script lang="ts">
	import { encounterStore } from '$lib/state/encounters.svelte';
	import { prescriptionStore } from '$lib/state/prescriptions.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
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
	import { Badge } from '$lib/components/ui/badge';
	import { vitalsStore } from '$lib/state/vitals.svelte';
	import { FileText, Printer, BarChart3, Activity, Download } from '@lucide/svelte';

	let startDate = $state(
		new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
	);
	let endDate = $state(new Date().toISOString().split('T')[0]);

	// Filtered encounters
	const filteredEncounters = $derived.by(() => {
		const start = new Date(startDate).getTime();
		const end = new Date(endDate).getTime() + 86400000; // include end date
		return encounterStore.items.filter(
			(e) => new Date(e.visitDate).getTime() >= start && new Date(e.visitDate).getTime() <= end
		);
	});

	const filteredVitals = $derived.by(() => {
		const start = new Date(startDate).getTime();
		const end = new Date(endDate).getTime() + 86400000;
		return vitalsStore.items.filter(
			(v) => v.recordedAt >= start && v.recordedAt <= end
		);
	});

	// Derived metrics
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

	// Pharmacy stats
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

<div class="space-y-8 animate-fade-in max-w-7xl mx-auto print:bg-white print:m-0 print:max-w-none">
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<BarChart3 class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Clinical Reports</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Generate and analyze facility metrics
				</p>
			</div>
		</div>

		<div class="flex items-end gap-3 flex-wrap">
			<div class="space-y-1.5">
				<Label class="text-xs">Start Date</Label>
				<Input type="date" bind:value={startDate} class="h-9" />
			</div>
			<div class="space-y-1.5">
				<Label class="text-xs">End Date</Label>
				<Input type="date" bind:value={endDate} class="h-9" />
			</div>
			<Button variant="outline" class="h-9" onclick={() => window.print()}>
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

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<Card>
			<CardContent class="p-6">
				<p class="text-sm font-medium text-muted-foreground">Total Encounters</p>
				<p class="text-3xl font-bold mt-2">{filteredEncounters.length}</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-6">
				<p class="text-sm font-medium text-muted-foreground">Prescriptions Written</p>
				<p class="text-3xl font-bold mt-2">{filteredPrescriptions.length}</p>
			</CardContent>
		</Card>
	</div>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Triage Distribution -->
		<Card>
			<CardHeader>
				<CardTitle>Triage Distribution</CardTitle>
				<CardDescription>Breakdown by urgency level</CardDescription>
			</CardHeader>
			<CardContent class="flex items-center justify-center p-6">
				{#if filteredVitals.length === 0}
					<p class="text-muted-foreground text-sm py-12">No data for selected period</p>
				{:else}
					{@const total = triageCounts.red + triageCounts.amber + triageCounts.green}
					{@const redPct = (triageCounts.red / total) * 100}
					{@const amberPct = (triageCounts.amber / total) * 100}
					{@const greenPct = (triageCounts.green / total) * 100}

					<div class="flex items-center gap-12 w-full max-w-sm">
						<!-- Custom Donut Chart CSS -->
						<div
							class="relative size-32 rounded-full overflow-hidden shrink-0 print:border-4 print:border-gray-200"
							style="background: conic-gradient(
                                theme(colors.red.500) 0% {redPct}%,
                                theme(colors.amber.500) {redPct}% {redPct + amberPct}%,
                                theme(colors.green.500) {redPct + amberPct}% 100%
                            );"
						>
							<div class="absolute inset-4 bg-card rounded-full print:bg-white"></div>
							<div class="absolute inset-0 flex items-center justify-center font-bold text-xl">
								{total}
							</div>
						</div>
						<div class="space-y-3 flex-1">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-red-500 print:border border-black"></div>
									<span class="text-sm font-medium">RED</span>
								</div>
								<span class="font-bold">{triageCounts.red}</span>
							</div>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-amber-500 print:border border-black"></div>
									<span class="text-sm font-medium">AMBER</span>
								</div>
								<span class="font-bold">{triageCounts.amber}</span>
							</div>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-green-500 print:border border-black"></div>
									<span class="text-sm font-medium">GREEN</span>
								</div>
								<span class="font-bold">{triageCounts.green}</span>
							</div>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Top Complaints -->
		<Card>
			<CardHeader>
				<CardTitle>Top Chief Complaints</CardTitle>
				<CardDescription>Most common reasons for visit</CardDescription>
			</CardHeader>
			<CardContent class="p-6">
				{#if chiefComplaints.length === 0}
					<p class="text-muted-foreground text-sm py-12 text-center">No data for selected period</p>
				{:else}
					{@const maxCount = chiefComplaints[0][1]}
					<div class="space-y-4">
						{#each chiefComplaints as [complaint, count]}
							<div>
								<div class="flex justify-between text-sm mb-1">
									<span class="font-medium truncate pr-4">{complaint}</span>
									<span class="font-bold text-muted-foreground">{count}</span>
								</div>
								<div class="w-full bg-muted rounded-full h-2 overflow-hidden print:border print:border-gray-300">
									<div
										class="bg-primary h-full rounded-full print:bg-gray-800"
										style="width: {(count / maxCount) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Pharmacy Usage -->
	<Card class="print:shadow-none print:border-t-2 print:border-black print:rounded-none">
		<CardHeader class="flex flex-row items-center justify-between print:px-0">
			<div>
				<CardTitle>Pharmacy Usage Summary</CardTitle>
				<CardDescription>Most prescribed vs. dispensed medications</CardDescription>
			</div>
			<Button variant="outline" size="sm" class="print:hidden" onclick={exportPharmacyCsv}>
				<Download class="size-4 mr-2" />
				CSV
			</Button>
		</CardHeader>
		<CardContent class="print:px-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Medication Name</TableHead>
						<TableHead class="text-right">Prescribed Count</TableHead>
						<TableHead class="text-right">Dispensed Count</TableHead>
						<TableHead class="text-right">Fulfillment %</TableHead>
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
						{#each medicationStats.slice(0, 10) as stat}
							<TableRow>
								<TableCell class="font-medium">{stat.name}</TableCell>
								<TableCell class="text-right">{stat.count}</TableCell>
								<TableCell class="text-right">{stat.dispensed}</TableCell>
								<TableCell class="text-right">
									<Badge
										variant="outline"
										class={stat.dispensed === stat.count
											? 'text-emerald-600 border-emerald-200 bg-emerald-50'
											: stat.dispensed === 0
												? 'text-destructive border-destructive/20 bg-destructive/10'
												: 'text-amber-600 border-amber-200 bg-amber-50'}
									>
										{Math.round((stat.dispensed / stat.count) * 100)}%
									</Badge>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
