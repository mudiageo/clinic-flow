<script lang="ts">
	import { patientStore } from '$lib/state/patients.svelte';
	import { queueStore } from '$lib/state/queue.svelte';
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { SpotlightCard } from '$lib/components/ui/spotlight-card';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import { Users, ClipboardList, AlertTriangle, Activity, ShieldAlert } from '@lucide/svelte';

	const totalPatients = $derived(patientStore.items.length);
	const queueItems = $derived(queueStore.items);
	const lowStockItems = $derived(pharmacyStore.lowStock);

	const triageStats = $derived({
		red: queueItems.filter((t: any) => t.triageLevel === 'red').length,
		amber: queueItems.filter((t: any) => t.triageLevel === 'amber').length,
		green: queueItems.filter((t: any) => t.triageLevel === 'green').length
	});

	const redPercent = $derived(
		queueItems.length > 0 ? (triageStats.red / queueItems.length) * 100 : 0
	);
	const amberPercent = $derived(
		queueItems.length > 0 ? (triageStats.amber / queueItems.length) * 100 : 0
	);
	const greenPercent = $derived(
		queueItems.length > 0 ? (triageStats.green / queueItems.length) * 100 : 0
	);
</script>

<svelte:head>
	<title>Admin Operations — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<!-- Page Header -->
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<Activity class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Operations Dashboard</h1>
			<p class="text-muted-foreground text-sm mt-0.5">Primary Health Centre metrics and alerts</p>
		</div>
	</div>

	<!-- Key Metrics row -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-5 animate-stagger">
		<SpotlightCard class="card-hover cursor-default">
			<CardContent class="p-6 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Total Patients
					</p>
					<p class="text-3xl font-bold text-foreground mt-1">
						<NumberTicker value={totalPatients} />
					</p>
				</div>
				<div
					class="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20"
				>
					<Users class="size-5" />
				</div>
			</CardContent>
		</SpotlightCard>

		<SpotlightCard class="card-hover cursor-default">
			<CardContent class="p-6 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Queue Today
					</p>
					<p class="text-3xl font-bold text-foreground mt-1">
						<NumberTicker value={queueItems.length} />
					</p>
				</div>
				<div
					class="size-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent-foreground ring-1 ring-accent/30"
				>
					<ClipboardList class="size-5" />
				</div>
			</CardContent>
		</SpotlightCard>

		<SpotlightCard
			class="card-hover cursor-default"
			color="oklch(from var(--destructive) l c h / 8%)"
		>
			<CardContent class="p-6 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Stock Alerts
					</p>
					<p class="text-3xl font-bold text-destructive mt-1">
						<NumberTicker value={lowStockItems.length} />
					</p>
				</div>
				<div
					class="size-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive ring-1 ring-destructive/20"
				>
					<AlertTriangle class="size-5" />
				</div>
			</CardContent>
		</SpotlightCard>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Queue Triage Distribution -->
		<Card class="card-hover">
			<CardHeader class="pb-3">
				<div class="flex items-center gap-2">
					<ShieldAlert class="size-4 text-muted-foreground" />
					<CardTitle class="text-base font-semibold">Triage Distribution</CardTitle>
				</div>
				<CardDescription>Percentage breakdown of patients in waiting queue</CardDescription>
			</CardHeader>
			<CardContent class="space-y-5">
				<!-- RED -->
				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center gap-2">
							<span class="size-2.5 rounded-full bg-triage-red inline-block"></span>
							<span class="text-triage-red font-semibold">RED — Immediate Priority</span>
						</div>
						<span class="text-foreground font-bold tabular-nums"
							>{triageStats.red} ({redPercent.toFixed(0)}%)</span
						>
					</div>
					<div class="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-triage-red transition-all duration-700 ease-out"
							style="width: {redPercent}%"
						></div>
					</div>
				</div>

				<!-- AMBER -->
				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center gap-2">
							<span class="size-2.5 rounded-full bg-triage-amber inline-block"></span>
							<span class="text-triage-amber font-semibold">AMBER — Warning Priority</span>
						</div>
						<span class="text-foreground font-bold tabular-nums"
							>{triageStats.amber} ({amberPercent.toFixed(0)}%)</span
						>
					</div>
					<div class="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-triage-amber transition-all duration-700 ease-out"
							style="width: {amberPercent}%"
						></div>
					</div>
				</div>

				<!-- GREEN -->
				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center gap-2">
							<span class="size-2.5 rounded-full bg-triage-green inline-block"></span>
							<span class="text-triage-green font-semibold">GREEN — Stable Priority</span>
						</div>
						<span class="text-foreground font-bold tabular-nums"
							>{triageStats.green} ({greenPercent.toFixed(0)}%)</span
						>
					</div>
					<div class="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-triage-green transition-all duration-700 ease-out"
							style="width: {greenPercent}%"
						></div>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Low Stock Inventory Alerts -->
		<Card class="card-hover">
			<CardHeader class="pb-3">
				<div class="flex items-center gap-2">
					<AlertTriangle class="size-4 text-muted-foreground" />
					<CardTitle class="text-base font-semibold">Low Stock Pharmacy Alerts</CardTitle>
				</div>
				<CardDescription>Items below recommended safety thresholds</CardDescription>
			</CardHeader>
			<CardContent class="p-0">
				{#if lowStockItems.length === 0}
					<div class="flex flex-col items-center justify-center py-12 text-center px-6">
						<div class="size-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
							<Activity class="size-5 text-primary" />
						</div>
						<p class="text-sm text-muted-foreground font-medium">
							All inventory stocks are healthy
						</p>
					</div>
				{:else}
					<Table>
						<TableHeader>
							<TableRow class="border-border hover:bg-transparent">
								<TableHead
									class="text-muted-foreground font-semibold px-5 py-3 text-xs uppercase tracking-wider"
									>Item Name</TableHead
								>
								<TableHead
									class="text-muted-foreground font-semibold px-5 py-3 text-xs uppercase tracking-wider"
									>Stock</TableHead
								>
								<TableHead
									class="text-muted-foreground font-semibold px-5 py-3 text-xs uppercase tracking-wider"
									>Threshold</TableHead
								>
								<TableHead
									class="text-muted-foreground font-semibold px-5 py-3 text-xs uppercase tracking-wider"
									>Status</TableHead
								>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each lowStockItems as item}
								<TableRow class="border-border hover:bg-muted/40 transition-colors">
									<TableCell class="text-foreground font-medium px-5 py-3"
										>{item.itemName}</TableCell
									>
									<TableCell class="text-destructive font-bold px-5 py-3 tabular-nums"
										>{item.currentStock}</TableCell
									>
									<TableCell class="text-muted-foreground px-5 py-3 tabular-nums"
										>{item.lowStockThreshold}</TableCell
									>
									<TableCell class="px-5 py-3">
										{#if item.isCritical}
											<Badge variant="destructive" class="text-xs">Critical</Badge>
										{:else}
											<Badge variant="secondary" class="text-xs">Low</Badge>
										{/if}
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
