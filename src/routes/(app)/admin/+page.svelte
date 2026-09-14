<script lang="ts">
	import { patientStore } from '$lib/state/patients.svelte';
	import { queueStore } from '$lib/state/queue.svelte';
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import { encounterStore } from '$lib/state/encounters.svelte';
	import { syncStore } from '$lib/state/sync.svelte';
	import { outbreakEngine } from '$lib/state/outbreaks.svelte';
	import { settingsStore } from '$lib/state/settings.svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
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
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import { Users, ClipboardList, AlertTriangle, Activity, ShieldAlert, CheckCircle2, CloudSync, Wifi, WifiOff, Siren } from '@lucide/svelte';

	import { onMount } from 'svelte';
	import { getPhcStaffList } from '$lib/remote/admin.remote';
	import { toast } from 'svelte-sonner';

	let staffList = $state<any[]>([]);

	onMount(async () => {
		try {
			staffList = await getPhcStaffList();
		} catch (e) {
			console.error('Failed to fetch staff list', e);
		}
	});
	const totalPatients = $derived(patientStore.items.length);
	const queueItems = $derived(queueStore.items);
	const lowStockItems = $derived(pharmacyStore.lowStock);
	const encounters = $derived(encounterStore.items);

	const completedConsultations = $derived(
		queueItems.filter((t: any) => t.status === 'done' && 
			new Date(t.createdAt).toDateString() === new Date().toDateString()).length
	);

	const syncStatus = $derived({
		isOnline: syncStore.online,
		pending: syncStore.pendingCount,
		lastSync: syncStore.lastSyncedAt
	});

	const visitsPerDay = $derived.by(() => {
		const days = [];
		const now = new Date();
		for (let i = 6; i >= 0; i--) {
			const d = new Date(now);
			d.setDate(d.getDate() - i);
			const dateStr = d.toDateString();
			const count = encounters.filter((e: any) => new Date(e.visitDate).toDateString() === dateStr).length;
			days.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), count });
		}
		const max = Math.max(...days.map(d => d.count), 1);
		return { days, max };
	});

	const activeStaff = $derived(staffList.filter((s: any) => s.active).slice(0, 5));

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

	<!-- AI Outbreak Radar Widget -->
	{#if settingsStore.current.outbreakDetectionEnabled}
		<Card class="border-purple-200/40 shadow-sm overflow-hidden bg-gradient-to-br from-card to-purple-50/30 dark:to-purple-950/10">
			<div class="h-1.5 w-full bg-gradient-to-r from-purple-500 to-indigo-500"></div>
			<CardHeader class="pb-3 border-b border-border/40 bg-card/50">
				<div class="flex items-start justify-between">
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
							<Activity class="size-5" />
						</div>
						<div>
							<CardTitle class="flex items-center gap-2 text-lg">
								Outbreak Radar
								<Badge variant="secondary" class="bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300">Beta</Badge>
							</CardTitle>
							<CardDescription>Multi-signal epidemiological forecasting & early warning</CardDescription>
						</div>
					</div>
					<div class="flex items-center gap-2">
						{#if !outbreakEngine.aiAnalysis && !outbreakEngine.isAnalysing}
							<button 
								class="text-xs font-semibold px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
								onclick={() => outbreakEngine.runAiAnalysis()}
							>
								<Activity class="size-3.5" />
								Run AI Analysis
							</button>
						{/if}
						<a href="/admin/outbreak-radar" class="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded hover:bg-muted">
							Full Report &rarr;
						</a>
					</div>
				</div>
			</CardHeader>

			<CardContent class="p-0">
				<!-- Rule-based strict alerts ALWAYS shown -->
				{#if outbreakEngine.alerts.length > 0}
					<div class="p-4 bg-destructive/5 border-b border-destructive/10">
						<div class="flex items-center gap-2 text-destructive mb-2">
							<AlertTriangle class="size-4" />
							<span class="text-sm font-bold uppercase tracking-wider">Threshold Alerts (Rule-based)</span>
						</div>
						<div class="grid gap-2">
							{#each outbreakEngine.alerts as alert}
								<div class="text-sm font-medium text-destructive/90 flex items-center justify-between bg-destructive/10 px-3 py-2 rounded-md">
									<span>{alert.disease} in {alert.community} ({alert.count} cases in 7 days)</span>
									<span class="text-xs opacity-70 flex items-center gap-1">
										<Siren class="size-3" /> Exceeds NPHCDA threshold
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- AI Analysis State -->
				<div class="p-5">
					{#if outbreakEngine.isAnalysing}
						<div class="flex flex-col items-center justify-center py-6 space-y-3 text-muted-foreground">
							<div class="size-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
							<p class="text-sm font-medium animate-pulse">Aggregating vitals, labs, and encounters for Gemini 2.5 Pro...</p>
						</div>
					{:else if outbreakEngine.aiAnalysis}
						{@const ai = outbreakEngine.aiAnalysis}
						
						<div class="space-y-4">
							<div class="flex items-start justify-between">
								<div class="flex items-center gap-2">
									<Badge variant="outline" class="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300 gap-1 text-xs">
										<CheckCircle2 class="size-3" />
										AI Confidence: {ai.confidence}
									</Badge>
									<span class="text-xs text-muted-foreground">Analysed {new Date(ai.generatedAt).toLocaleTimeString()}</span>
								</div>
								
								<button 
									class="text-xs text-purple-600 hover:text-purple-700 font-medium underline-offset-4 hover:underline"
									onclick={() => {
										navigator.clipboard.writeText(ai.lgaSummary);
										toast.success('LGA summary copied to clipboard');
									}}
								>
									Copy LGA SMS Summary
								</button>
							</div>

							<!-- Pre-alerts / Outbreaks -->
							{#if ai.outbreaks?.length > 0 || ai.preAlerts?.length > 0}
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									{#each ai.outbreaks || [] as outbreak}
										<div class="rounded-lg border bg-card p-3 space-y-2 shadow-sm border-l-4 {outbreak.severity === 'critical' ? 'border-l-destructive' : 'border-l-amber-500'}">
											<div class="flex justify-between items-start">
												<div>
													<h4 class="font-bold text-sm flex items-center gap-1.5">
														{outbreak.disease}
														{#if outbreak.severity === 'critical'}
															<Badge variant="destructive" class="h-4 text-[10px] px-1">Critical</Badge>
														{/if}
													</h4>
													<p class="text-[11px] text-muted-foreground">{outbreak.affectedCommunities.join(', ')}</p>
												</div>
												<Badge variant="outline" class="text-[10px] capitalize bg-muted/50">{outbreak.status}</Badge>
											</div>
											<p class="text-xs text-muted-foreground leading-snug">{outbreak.summary}</p>
											
											<div class="flex items-center justify-between pt-1 border-t border-border/50">
												<span class="text-[10px] text-muted-foreground">Forecast next week:</span>
												<span class="text-xs font-bold">{outbreak.forecastNextWeek} cases</span>
											</div>
										</div>
									{/each}

									{#each ai.preAlerts || [] as preAlert}
										<div class="rounded-lg border bg-card p-3 space-y-2 shadow-sm border-l-4 border-l-blue-400">
											<div class="flex justify-between items-start">
												<div>
													<h4 class="font-bold text-sm flex items-center gap-1.5">{preAlert.disease}</h4>
													<p class="text-[11px] text-muted-foreground">{preAlert.affectedCommunities.join(', ')}</p>
												</div>
												<Badge variant="secondary" class="h-4 text-[10px] px-1 bg-blue-100 text-blue-700">Pre-Alert</Badge>
											</div>
											<p class="text-xs text-muted-foreground leading-snug">{preAlert.summary}</p>
										</div>
									{/each}
								</div>
							{:else}
								<div class="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
									<CheckCircle2 class="size-4" />
									<span>No active outbreaks or rising pre-alerts detected in the last 30 days.</span>
								</div>
							{/if}
							
							{#if ai.stockImpactForecast?.some(s => s.willRunOut)}
								<div class="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-100">
									<AlertTriangle class="size-3.5 shrink-0" />
									<span><strong>Stock Warning:</strong> Projected demand exceeds current stock for {ai.stockImpactForecast.filter(s => s.willRunOut).map(s => s.drug).join(', ')}.</span>
								</div>
							{/if}
						</div>
					{:else}
						<div class="text-center py-4 space-y-1">
							<p class="text-sm font-medium text-foreground">AI Intelligence is idle</p>
							<p class="text-xs text-muted-foreground">Run analysis to cross-reference vitals, lab results, and seasonal baselines.</p>
						</div>
					{/if}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Key Metrics row -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-stagger">
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

		<SpotlightCard class="card-hover cursor-default">
			<CardContent class="p-6 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Completed Today
					</p>
					<p class="text-3xl font-bold text-foreground mt-1">
						<NumberTicker value={completedConsultations} />
					</p>
				</div>
				<div
					class="size-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 ring-1 ring-green-500/20"
				>
					<CheckCircle2 class="size-5" />
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

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="space-y-6 lg:col-span-2">
			<!-- Visits per day -->
			<Card class="card-hover">
				<CardHeader class="pb-3">
					<div class="flex items-center gap-2">
						<Activity class="size-4 text-muted-foreground" />
						<CardTitle class="text-base font-semibold">Consultations (Last 7 Days)</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<div class="flex items-end gap-2 h-48 mt-4">
						{#each visitsPerDay.days as { day, count }}
							<div class="flex-1 flex flex-col justify-end items-center gap-2 group">
								<div class="w-full bg-primary/20 hover:bg-primary transition-colors rounded-t-md relative flex justify-center" style="height: {(count / visitsPerDay.max) * 100}%">
									<div class="absolute -top-6 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background px-2 py-0.5 rounded shadow-sm">
										{count}
									</div>
								</div>
								<span class="text-xs text-muted-foreground">{day}</span>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>

			<!-- Low Stock Inventory Alerts -->
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
		</div>

		<div class="space-y-6">
			<!-- Queue Triage Distribution -->
			<Card class="card-hover">
				<CardHeader class="pb-3">
					<div class="flex items-center gap-2">
						<ShieldAlert class="size-4 text-muted-foreground" />
						<CardTitle class="text-base font-semibold">Triage Distribution</CardTitle>
					</div>
					<CardDescription>Queue breakdown</CardDescription>
				</CardHeader>
				<CardContent class="space-y-5">
					<!-- RED -->
					<div class="space-y-2">
						<div class="flex items-center justify-between text-sm">
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded-full bg-triage-red inline-block"></span>
								<span class="text-triage-red font-semibold">RED</span>
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
								<span class="text-triage-amber font-semibold">AMBER</span>
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
								<span class="text-triage-green font-semibold">GREEN</span>
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

			<!-- Active Staff Indicator -->
			<Card class="card-hover">
				<CardHeader class="pb-3">
					<CardTitle class="text-base font-semibold">Online Staff</CardTitle>
				</CardHeader>
				<CardContent>
					{#if activeStaff.length === 0}
						<p class="text-sm text-muted-foreground">No staff active today.</p>
					{:else}
						<div class="flex -space-x-3 overflow-hidden p-1">
							{#each activeStaff as staff}
								<Avatar class="border-2 border-background ring-2 ring-transparent">
									<AvatarFallback class="bg-primary/10 text-primary font-medium text-xs">
										{staff.fullName.substring(0,2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Sync Health -->
			<Card class="card-hover">
				<CardHeader class="pb-3">
					<CardTitle class="text-base font-semibold">System Sync Health</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Status</span>
						{#if syncStatus.isOnline}
							<Badge variant="outline" class="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 px-2">
								<Wifi class="size-3" /> Online
							</Badge>
						{:else}
							<Badge variant="outline" class="bg-destructive/10 text-destructive border-destructive/20 gap-1.5 px-2">
								<WifiOff class="size-3" /> Offline
							</Badge>
						{/if}
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Pending Syncs</span>
						<span class="font-medium">{syncStatus.pending}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Last Sync</span>
						<span class="text-sm">{syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleTimeString() : 'Never'}</span>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
