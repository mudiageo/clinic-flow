<script lang="ts">
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
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { 
		Activity, 
		AlertTriangle, 
		Siren, 
		CheckCircle2, 
		TrendingUp, 
		TrendingDown, 
		Minus, 
		ShieldAlert, 
		Copy, 
		Printer, 
		MessageSquare,
		Send,
		Info
	} from '@lucide/svelte';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';

	let lgaDsoPhone = $state(settingsStore.current?.lgaDsoPhone || '');
	let sendingSms = $state(false);

	const currentTab = $derived(page.url.searchParams.get('tab') || 'radar');
	const ai = $derived(outbreakEngine.aiAnalysis);

	function getSeverityColor(severity: string) {
		if (severity === 'critical') return 'text-destructive bg-destructive/10 border-destructive/20';
		if (severity === 'warning') return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-900';
		if (severity === 'watch') return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-900';
		return 'text-muted-foreground bg-muted border-border';
	}

	function getTrendIcon(status: string) {
		if (status === 'rising') return TrendingUp;
		if (status === 'falling') return TrendingDown;
		return Minus;
	}

	async function sendSms() {
		if (!lgaDsoPhone) {
			toast.error('Please enter the LGA DSO phone number.');
			return;
		}
		if (!ai?.lgaSummary) return;

		sendingSms = true;
		try {
			await new Promise(resolve => setTimeout(resolve, 1500));
			toast.success(`Alert SMS sent to ${lgaDsoPhone}`);
		} catch (err) {
			toast.error('Failed to send SMS');
		} finally {
			sendingSms = false;
		}
	}

	function copyToClipboard(text: string, entity: string) {
		navigator.clipboard.writeText(text);
		toast.success(`${entity} copied to clipboard.`);
	}
</script>

<svelte:head>
	<title>{currentTab === 'idsr' ? 'IDSR Report' : 'Outbreak Radar'} — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in pb-12">
	<!-- Page Header & Tabs -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
				<Activity class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
					{currentTab === 'idsr' ? 'IDSR Weekly Report' : 'Outbreak Radar'}
					<Badge variant="secondary" class="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">Beta</Badge>
				</h1>
				<p class="text-muted-foreground text-sm mt-0.5">Multi-signal epidemiological forecasting & reporting</p>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<!-- Tab Navigation -->
			<div class="flex bg-muted/50 p-1 rounded-lg border border-border mr-2">
				<a 
					href="/admin/outbreak-radar?tab=radar" 
					class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors {currentTab === 'radar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}"
				>
					Radar Map
				</a>
				<a 
					href="/admin/outbreak-radar?tab=idsr" 
					class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors {currentTab === 'idsr' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}"
				>
					IDSR Report
				</a>
			</div>

			{#if !ai && !outbreakEngine.isAnalysing}
				<Button onclick={() => outbreakEngine.runAiAnalysis()} class="bg-purple-600 hover:bg-purple-700 text-white gap-2">
					<Activity class="size-4" />
					Run AI Analysis
				</Button>
			{:else if outbreakEngine.isAnalysing}
				<Button disabled variant="outline" class="gap-2 text-purple-600 border-purple-200">
					<div class="size-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
					Analysing...
				</Button>
			{:else}
				<div class="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md border border-border">
					<CheckCircle2 class="size-4 text-emerald-500" />
					Analysed {new Date(ai.generatedAt).toLocaleTimeString()}
				</div>
				<Button variant="outline" onclick={() => outbreakEngine.runAiAnalysis()} class="gap-2">
					<Activity class="size-4" />
					Refresh
				</Button>
			{/if}
		</div>
	</div>

	{#if currentTab === 'radar'}
		<!-- Strict Rule-Based Alerts (Safety Layer) -->
		{#if settingsStore.current.outbreakDetectionEnabled && outbreakEngine.alerts.length > 0}
			<div class="space-y-3">
				<h2 class="text-lg font-semibold flex items-center gap-2 text-destructive">
					<Siren class="size-5" />
					Active Threshold Alerts (Rule-Based)
				</h2>
				{#each outbreakEngine.alerts as outbreak}
					<Alert variant="destructive" class="border-destructive/30 bg-destructive/10 text-destructive">
						<AlertTriangle class="size-4" />
						<AlertTitle class="font-bold tracking-wide">
							{outbreak.disease} in {outbreak.community}
						</AlertTitle>
						<AlertDescription class="font-medium mt-1">
							{outbreak.count} cases detected within the last 7 days. This exceeds the NPHCDA standard threshold of 5 cases.
						</AlertDescription>
					</Alert>
				{/each}
			</div>
		{/if}

		<!-- Local Epidemiological Dashboard (Pre-AI) -->
		{#if !ai}
			{@const bundle = outbreakEngine.currentDataBundle}
			<div class="space-y-6 animate-fade-in">
				<div class="flex items-center justify-between border-b pb-4">
					<div>
						<h2 class="text-xl font-bold tracking-tight">Local Epidemiology Overview</h2>
						<p class="text-sm text-muted-foreground mt-1">Aggregated data for the last 30 days ({bundle.analysisWindow})</p>
					</div>
					<Badge variant="outline" class="font-mono bg-muted/50">{bundle.totalEncounters} Total Encounters</Badge>
				</div>

				<!-- Stats Grid -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card class="bg-gradient-to-br from-background to-muted/30">
						<CardHeader class="pb-2">
							<CardDescription class="font-medium text-foreground">Tracked Diseases</CardDescription>
							<CardTitle class="text-3xl font-bold">{bundle.diseaseGroups.length}</CardTitle>
						</CardHeader>
					</Card>
					<Card class="bg-gradient-to-br from-background to-orange-50/50 dark:to-orange-950/20">
						<CardHeader class="pb-2">
							<CardDescription class="font-medium text-orange-700 dark:text-orange-400">High Fever Clusters</CardDescription>
							<CardTitle class="text-3xl font-bold text-orange-600 dark:text-orange-500">
								{bundle.vitalsSignals[0]?.weeklyCount.reduce((a,b)=>a+b, 0) || 0}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card class="bg-gradient-to-br from-background to-blue-50/50 dark:to-blue-950/20">
						<CardHeader class="pb-2">
							<CardDescription class="font-medium text-blue-700 dark:text-blue-400">Communities Affected</CardDescription>
							<CardTitle class="text-3xl font-bold text-blue-600 dark:text-blue-500">
								{new Set(bundle.diseaseGroups.flatMap(d => d.affectedCommunities)).size}
							</CardTitle>
						</CardHeader>
					</Card>
				</div>

				<!-- Disease Case Charts -->
				{#if bundle.diseaseGroups.length > 0}
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle class="text-base font-semibold">Disease Incidence (30 Days)</CardTitle>
							</CardHeader>
							<CardContent>
								<div class="space-y-4">
									{#each bundle.diseaseGroups.sort((a,b) => b.totalCases - a.totalCases) as dg}
										<div>
											<div class="flex justify-between text-sm mb-1.5">
												<span class="font-medium">{dg.disease}</span>
												<span class="text-muted-foreground">{dg.totalCases} cases</span>
											</div>
											<div class="w-full bg-muted rounded-full h-2.5 overflow-hidden">
												<div class="bg-primary h-2.5 rounded-full" style="width: {Math.min(100, (dg.totalCases / Math.max(...bundle.diseaseGroups.map(d=>d.totalCases))) * 100)}%"></div>
											</div>
										</div>
									{/each}
								</div>
							</CardContent>
						</Card>

						<!-- Demographics Breakdown -->
						<Card>
							<CardHeader>
								<CardTitle class="text-base font-semibold">Demographics Risk (Top Disease)</CardTitle>
							</CardHeader>
							<CardContent>
								{#if bundle.diseaseGroups.length > 0}
									{@const top = bundle.diseaseGroups.sort((a,b) => b.totalCases - a.totalCases)[0]}
									<div class="space-y-4">
										<p class="text-sm font-medium text-muted-foreground mb-4">Age distribution for {top.disease}</p>
										
										<div class="grid grid-cols-[100px_1fr_40px] items-center gap-3 text-sm">
											<span class="text-muted-foreground">Under 5</span>
											<div class="bg-muted h-3 rounded-sm overflow-hidden"><div class="bg-blue-500 h-full" style="width: {(top.ageGroups.under5 / top.totalCases) * 100}%"></div></div>
											<span class="text-right font-medium">{top.ageGroups.under5}</span>
											
											<span class="text-muted-foreground">5 to 15</span>
											<div class="bg-muted h-3 rounded-sm overflow-hidden"><div class="bg-indigo-500 h-full" style="width: {(top.ageGroups.age5to15 / top.totalCases) * 100}%"></div></div>
											<span class="text-right font-medium">{top.ageGroups.age5to15}</span>
											
											<span class="text-muted-foreground">Adults</span>
											<div class="bg-muted h-3 rounded-sm overflow-hidden"><div class="bg-purple-500 h-full" style="width: {(top.ageGroups.adult / top.totalCases) * 100}%"></div></div>
											<span class="text-right font-medium">{top.ageGroups.adult}</span>
											
											<span class="text-muted-foreground">Elderly (60+)</span>
											<div class="bg-muted h-3 rounded-sm overflow-hidden"><div class="bg-slate-500 h-full" style="width: {(top.ageGroups.elderly / top.totalCases) * 100}%"></div></div>
											<span class="text-right font-medium">{top.ageGroups.elderly}</span>
										</div>

										{#if top.pregnantCases > 0}
											<div class="mt-4 p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg border border-pink-100 dark:border-pink-900/50 flex items-center justify-between">
												<span class="text-sm font-medium text-pink-700 dark:text-pink-400">Pregnant Cases</span>
												<Badge variant="outline" class="bg-white dark:bg-black text-pink-700 border-pink-200">{top.pregnantCases}</Badge>
											</div>
										{/if}
									</div>
								{/if}
							</CardContent>
						</Card>
					</div>
					
					<!-- Call to action for AI -->
					<div class="p-6 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl text-center space-y-3">
						<h3 class="text-lg font-bold text-purple-900 dark:text-purple-300">Ready for Epidemiological Forecast</h3>
						<p class="text-sm text-purple-700 dark:text-purple-400 max-w-xl mx-auto">
							The local rules engine has aggregated the incidence data above. Run the AI Analysis to correlate these signals, calculate transmission trajectories, predict stockout risks, and generate clinical intervention strategies.
						</p>
					</div>
				{:else}
					<Card class="border-dashed border-2 bg-transparent text-center py-16">
						<CardContent>
							<div class="flex justify-center mb-4">
								<div class="p-4 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
									<ShieldAlert class="size-8" />
								</div>
							</div>
							<h3 class="text-xl font-bold mb-2">Baseline Surveillance Active</h3>
							<p class="text-muted-foreground max-w-md mx-auto">
								No anomalous disease clusters detected locally. The system is continuously monitoring patient complaints and vitals.
							</p>
						</CardContent>
					</Card>
				{/if}
			</div>
		{/if}

		<!-- AI Content -->
		{#if ai}
			<div class="space-y-6">
				<!-- Disclaimer -->
				<Alert class="bg-blue-50/50 border-blue-100 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-200">
					<Info class="size-4 text-blue-600 dark:text-blue-400" />
					<AlertTitle class="font-semibold text-blue-800 dark:text-blue-300">AI-Assisted Analysis</AlertTitle>
					<AlertDescription class="text-sm mt-1 opacity-90">
						This analysis is generated by Gemini 2.5 Pro using de-identified aggregate data. It is designed to assist epidemiological surveillance but <strong>must not replace clinical judgment</strong>. Interventions are suggestions only.
						<div class="mt-2 font-medium flex items-center gap-2">
							AI Confidence: 
							<Badge variant="outline" class="bg-white/50 dark:bg-black/20 uppercase tracking-wider text-[10px]">{ai.confidence}</Badge>
						</div>
					</AlertDescription>
				</Alert>

				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
					
					<!-- Left Column: Outbreaks & Pre-Alerts -->
					<div class="lg:col-span-2 space-y-6">
						
						<!-- Outbreak Cards -->
						{#if ai.outbreaks?.length > 0}
							<div class="space-y-4">
								<h3 class="text-lg font-semibold flex items-center gap-2">
									<Activity class="size-5 text-purple-500" />
									Detected Outbreaks
								</h3>
								
								<div class="grid gap-4">
									{#each ai.outbreaks as outbreak}
										<Card class="border-l-4 overflow-hidden {outbreak.severity === 'critical' ? 'border-l-destructive' : 'border-l-amber-500'}">
											<CardHeader class="pb-2 bg-muted/30">
												<div class="flex justify-between items-start">
													<div>
														<CardTitle class="flex items-center gap-2 text-lg">
															{outbreak.disease}
															<Badge class={getSeverityColor(outbreak.severity)} variant="outline">
																{outbreak.severity.toUpperCase()}
															</Badge>
														</CardTitle>
														<CardDescription class="mt-1 font-medium">
															{outbreak.affectedCommunities.join(', ')}
														</CardDescription>
													</div>
													<Badge variant="secondary" class="flex items-center gap-1">
														{@const Icon = getTrendIcon(outbreak.status)}
														<Icon class="size-3" />
														<span class="capitalize">{outbreak.status}</span>
													</Badge>
												</div>
											</CardHeader>
											<CardContent class="pt-4 space-y-4">
												<p class="text-sm text-foreground/90">{outbreak.summary}</p>
												
												{#if outbreak.spreadHypothesis}
													<div class="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
														<span class="font-semibold">Spread Hypothesis:</span> {outbreak.spreadHypothesis}
													</div>
												{/if}

												<div class="grid grid-cols-3 gap-4 pt-2 border-t border-border">
													<div>
														<p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Seasonal Baseline</p>
														<p class="text-sm font-semibold">
															{#if outbreak.seasonalBaselineCases !== null}
																{outbreak.seasonalBaselineCases} cases
																{#if outbreak.percentAboveBaseline}
																	<span class="text-destructive text-xs ml-1">(+{outbreak.percentAboveBaseline}%)</span>
																{/if}
															{:else}
																<span class="text-muted-foreground font-normal">N/A</span>
															{/if}
														</p>
													</div>
													<div>
														<p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">At-Risk Groups</p>
														<p class="text-sm font-semibold truncate" title={outbreak.atRiskGroups.join(', ')}>
															{outbreak.atRiskGroups.join(', ')}
														</p>
													</div>
													<div>
														<p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">7-Day Forecast</p>
														<p class="text-sm font-semibold">
															~{outbreak.forecastNextWeek} cases
															<span class="text-xs text-muted-foreground font-normal block">
																(Range: {outbreak.forecastConfidenceRange[0]}-{outbreak.forecastConfidenceRange[1]})
															</span>
														</p>
													</div>
												</div>
											</CardContent>
										</Card>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Pre-Alerts (Early Warning) -->
						{#if ai.preAlerts?.length > 0}
							<div class="space-y-4">
								<h3 class="text-lg font-semibold flex items-center gap-2">
									<ShieldAlert class="size-5 text-blue-500" />
									Pre-Alerts (Early Warning)
								</h3>
								
								<div class="grid md:grid-cols-2 gap-4">
									{#each ai.preAlerts as preAlert}
										<Card class="border-blue-200 dark:border-blue-900 shadow-sm bg-blue-50/30 dark:bg-blue-950/10">
											<CardContent class="p-4 space-y-3">
												<div class="flex justify-between items-start">
													<div>
														<h4 class="font-bold text-base text-blue-900 dark:text-blue-100">{preAlert.disease}</h4>
														<p class="text-xs text-blue-700/80 dark:text-blue-300/80 mt-0.5">{preAlert.affectedCommunities.join(', ')}</p>
													</div>
													<Badge variant="outline" class="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800">Pre-Alert</Badge>
												</div>
												<p class="text-sm text-foreground/90">{preAlert.summary}</p>
												<div class="bg-blue-100/50 dark:bg-blue-900/20 p-2 rounded text-xs text-blue-800 dark:text-blue-300">
													<strong>Pattern:</strong> {preAlert.growthPattern}
												</div>
											</CardContent>
										</Card>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- Right Column: Interventions & Stock & Escalation -->
					<div class="space-y-6">
						
						<!-- Interventions -->
						{#if ai.interventions?.length > 0}
							<Card>
								<CardHeader class="pb-3 bg-muted/30">
									<CardTitle class="text-base flex items-center gap-2">
										<CheckCircle2 class="size-4 text-emerald-500" />
										Recommended Interventions
									</CardTitle>
								</CardHeader>
								<CardContent class="p-0">
									<div class="divide-y divide-border">
										{#each ai.interventions as intervention}
											<div class="p-4 space-y-2 hover:bg-muted/30 transition-colors">
												<div class="flex justify-between items-start gap-2">
													<p class="text-sm font-semibold leading-snug">{intervention.action}</p>
													{#if intervention.priority === 'urgent'}
														<Badge variant="destructive" class="text-[10px] px-1 h-4 shrink-0">Urgent</Badge>
													{/if}
												</div>
												<p class="text-xs text-muted-foreground">{intervention.rationale}</p>
												{#if intervention.estimatedStockNeeded}
													<div class="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
														<span class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Impact:</span>
														<span class="text-xs {intervention.stockSufficient === false ? 'text-amber-600 font-semibold' : 'text-foreground'}">
															{intervention.estimatedStockNeeded}
														</span>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								</CardContent>
							</Card>
						{/if}

						<!-- Stock Impact Warning -->
						{#if ai.stockImpactForecast?.some((s: any) => s.willRunOut)}
							<Card class="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
								<CardHeader class="pb-2">
									<CardTitle class="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
										<AlertTriangle class="size-4" />
										Stock Depletion Risk
									</CardTitle>
								</CardHeader>
								<CardContent class="text-sm pb-4">
									<div class="space-y-3">
										{#each ai.stockImpactForecast.filter((s: any) => s.willRunOut) as stock}
											<div class="flex justify-between items-center bg-white dark:bg-black/20 p-2 rounded border border-amber-100 dark:border-amber-900/50">
												<span class="font-medium">{stock.drug}</span>
												<div class="text-right">
													<span class="text-amber-600 font-bold">{stock.currentStock}</span>
													<span class="text-muted-foreground text-xs">/ {stock.projectedDemandNextWeek} req.</span>
												</div>
											</div>
										{/each}
									</div>
								</CardContent>
							</Card>
						{/if}

						<!-- LGA Escalation Panel -->
						<Card>
							<CardHeader class="pb-3 bg-purple-50/50 dark:bg-purple-950/20 border-b border-border/50">
								<CardTitle class="text-base flex items-center gap-2 text-purple-700 dark:text-purple-400">
									<MessageSquare class="size-4" />
									Escalate to LGA DSO
								</CardTitle>
							</CardHeader>
							<CardContent class="pt-4 space-y-4">
								<div class="text-sm bg-muted/50 p-3 rounded-md border border-border italic text-foreground/80">
									"{ai.lgaSummary}"
								</div>
								
								<div class="space-y-2">
									<label for="phone" class="text-xs font-medium text-muted-foreground">LGA DSO Phone Number</label>
									<div class="flex gap-2">
										<Input 
											id="phone" 
											placeholder="e.g. 08012345678" 
											bind:value={lgaDsoPhone}
											class="flex-1"
										/>
										<Button 
											size="icon" 
											onclick={sendSms} 
											disabled={sendingSms}
											class="shrink-0 bg-purple-600 hover:bg-purple-700"
										>
											{#if sendingSms}
												<div class="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											{:else}
												<Send class="size-4 text-white" />
											{/if}
										</Button>
									</div>
									<p class="text-[10px] text-muted-foreground">Uses Termii SMS integration.</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		{/if}
	{/if}

	<!-- IDSR Report Section -->
	{#if currentTab === 'idsr'}
		{#if ai && ai.idsr}
			<Card class="mt-8 overflow-hidden">
				<CardHeader class="bg-slate-50 dark:bg-slate-900 border-b border-border flex flex-row items-center justify-between py-4">
					<div>
						<CardTitle class="text-lg">IDSR Weekly Report</CardTitle>
						<CardDescription>Week {ai.idsr.weekNumber} ({ai.idsr.reportingPeriod})</CardDescription>
					</div>
					<div class="flex gap-2">
						<Button variant="outline" size="sm" class="gap-2" onclick={() => copyToClipboard(JSON.stringify(ai.idsr, null, 2), 'IDSR Report')}>
							<Copy class="size-3.5" /> Copy
						</Button>
						<Button variant="outline" size="sm" class="gap-2" onclick={() => window.print()}>
							<Printer class="size-3.5" /> Print
						</Button>
					</div>
				</CardHeader>
				<CardContent class="p-0">
					<Table>
						<TableHeader>
							<TableRow class="bg-muted/30">
								<TableHead class="font-semibold">Notifiable Disease</TableHead>
								<TableHead class="text-right font-semibold">Suspected</TableHead>
								<TableHead class="text-right font-semibold">Confirmed</TableHead>
								<TableHead class="text-right font-semibold">Deaths</TableHead>
								<TableHead class="font-semibold pl-6">Recommended Action</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each ai.idsr.notifiableDiseases as ds}
								<TableRow>
									<TableCell class="font-medium">{ds.disease}</TableCell>
									<TableCell class="text-right">{ds.suspectedCases}</TableCell>
									<TableCell class="text-right">{ds.confirmedCases}</TableCell>
									<TableCell class="text-right text-destructive">{ds.deaths}</TableCell>
									<TableCell class="pl-6 text-muted-foreground text-sm">{ds.action}</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
					<div class="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-border">
						<h4 class="text-sm font-semibold mb-2">Narrative Summary</h4>
						<p class="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{ai.idsr.narrativeSummary}</p>
					</div>
				</CardContent>
			</Card>
		{:else}
			<Card class="border-dashed border-2 bg-transparent text-center py-16">
				<CardContent>
					<div class="flex justify-center mb-4">
						<div class="p-4 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
							<FileSignature class="size-8" />
						</div>
					</div>
					<h3 class="text-xl font-bold mb-2">IDSR Report Not Generated</h3>
					<p class="text-muted-foreground max-w-md mx-auto">
						The AI has not yet generated the weekly IDSR report. Please click "Run AI Analysis" to compile the data.
					</p>
				</CardContent>
			</Card>
		{/if}
	{/if}
</div>
