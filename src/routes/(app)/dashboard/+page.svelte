<script lang="ts">
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import { queueStore } from '#lib/state/queue.svelte.ts';
	import { reminderStore } from '#lib/state/reminders.svelte.ts';
	import { pharmacyStore } from '#lib/state/pharmacy.svelte.ts';
	import { settingsStore } from '#lib/state/settings.svelte.ts';
	import { syncStore } from '#lib/state/sync.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { DASHBOARD_MODULES } from '#lib/config/dashboard-modules.ts';
	import type { Component } from 'svelte';
	import { calculateCapacityUsed } from '#lib/dashboard/metrics.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Progress } from '#lib/components/ui/progress/index.ts';
	import {
		UserPlus,
		Search,
		FolderOpen,
		Home,
		ClipboardList,
		Baby,
		Activity,
		Stethoscope,
		FlaskConical,
		Microscope,
		HeartHandshake,
		Heart,
		Waves,
		Syringe,
		Pill,
		Package,
		Thermometer,
		PackagePlus,
		CalendarDays,
		Bell,
		MapPin,
		Users,
		BarChart3,
		Download,
		FileText,
		ShieldCheck,
		Settings,
		Monitor,
		Sliders,
		CreditCard,
		MessageSquare,
		Wifi,
		FileSearch,
		Radar,
		ArrowRight,
		HeartPulse,
		Building2,
		Globe2,
		Megaphone,
		Rocket,
		Server,
		AlertTriangle,
		AlertCircle,
		Clock,
		CheckCircle2,
		RefreshCw,
		Zap,
		TrendingUp,
		Package2
	} from '@lucide/svelte';

	const ICONS: Record<string, Component> = {
		UserPlus,
		Search,
		FolderOpen,
		Home,
		ClipboardList,
		Baby,
		Activity,
		Stethoscope,
		FlaskConical,
		Microscope,
		HeartHandshake,
		Heart,
		Waves,
		Syringe,
		Pill,
		Package,
		Thermometer,
		PackagePlus,
		CalendarDays,
		Bell,
		MapPin,
		Users,
		BarChart3,
		Download,
		FileText,
		ShieldCheck,
		Settings,
		Monitor,
		Sliders,
		CreditCard,
		MessageSquare,
		Wifi,
		FileSearch,
		Radar,
		Building2,
		Globe2,
		Megaphone,
		Rocket,
		Server
	};

	const visibleModules = $derived(DASHBOARD_MODULES.filter((m) => sessionStore.can(m.permission)));

	const CATEGORY_ORDER = [
		'Queue & Triage',
		'Patient Care',
		'Clinical',
		'Maternal Health',
		'Pharmacy',
		'Field & Community',
		'Appointments',
		'Analytics & Reporting',
		'Administration',
		'Platform Management'
	];

	const groupedModules = $derived.by(() => {
		const groups: Record<string, typeof DASHBOARD_MODULES> = {};
		for (const mod of visibleModules) {
			if (!groups[mod.category]) groups[mod.category] = [];
			groups[mod.category].push(mod);
		}
		return groups;
	});

	const orderedCategories = $derived(CATEGORY_ORDER.filter((cat) => groupedModules[cat]?.length));

	let activeCategory = $state<string>('all');
	let searchQuery = $state<string>('');

	const filteredCategories = $derived(
		activeCategory === 'all'
			? orderedCategories
			: orderedCategories.filter((cat) => cat === activeCategory)
	);

	function filterModules(mods: typeof DASHBOARD_MODULES) {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return mods;
		return mods.filter(
			(m) =>
				m.label.toLowerCase().includes(q) ||
				m.category.toLowerCase().includes(q) ||
				m.id.toLowerCase().includes(q)
		);
	}

	// Live Metrics
	const waitingGeneral = $derived(queueStore.generalQueue.length);
	const waitingAnc = $derived(queueStore.ancQueue.length);
	const waitingEpi = $derived(queueStore.epiQueue.length);
	const totalWaiting = $derived(waitingGeneral + waitingAnc + waitingEpi);
	const overdueReminders = $derived(reminderStore.overdueReminders.length);
	const lowStockItems = $derived(pharmacyStore.lowStock);
	const redPatients = $derived(queueStore.sortedQueue.filter((t) => t.triageLevel === 'red'));
	const amberPatients = $derived(queueStore.sortedQueue.filter((t) => t.triageLevel === 'amber'));
	const dailyPatientCapacity = $derived(Math.max(1, settingsStore.current.dailyPatientCapacity));
	const capacityUsed = $derived(
		calculateCapacityUsed(queueStore.todayVolume, dailyPatientCapacity)
	);

	// Any critical alerts to show?
	const hasAlerts = $derived(
		redPatients.length > 0 || overdueReminders > 0 || lowStockItems.length > 0
	);

	function getLiveStat(moduleId: string): string | null {
		switch (moduleId) {
			case 'triage-board':
				return waitingGeneral > 0 ? `${waitingGeneral} waiting` : null;
			case 'anc-queue':
				return waitingAnc > 0 ? `${waitingAnc} waiting` : null;
			case 'epi-queue':
				return waitingEpi > 0 ? `${waitingEpi} waiting` : null;
			case 'doctor-queue':
				return waitingGeneral + waitingAnc > 0 ? `${waitingGeneral + waitingAnc} to see` : null;
			case 'reminders':
				return overdueReminders > 0 ? `${overdueReminders} overdue` : null;
			case 'inventory':
				return lowStockItems.length > 0 ? `${lowStockItems.length} low` : null;
			default:
				return null;
		}
	}

	function getStatVariant(moduleId: string): 'default' | 'destructive' | 'secondary' {
		if (moduleId === 'inventory' && lowStockItems.length > 0) return 'destructive';
		if (moduleId === 'reminders' && overdueReminders > 0) return 'destructive';
		if (['triage-board', 'anc-queue', 'epi-queue', 'doctor-queue'].includes(moduleId))
			return 'default';
		return 'secondary';
	}

	// Quick action labels
	function getQuickAction(moduleId: string): string {
		switch (moduleId) {
			case 'register-patient':
				return 'Register';
			case 'appointments':
				return 'Book';
			case 'reminders':
				return 'Send SMS';
			case 'triage-board':
				return 'Triage';
			case 'inventory':
				return 'Restock';
			case 'dispense':
				return 'Dispense';
			default:
				return 'Open';
		}
	}

	// Date/time display
	const now = new Date();
	const greeting = $derived(() => {
		const h = new Date().getHours();
		if (h < 12) return 'Good morning';
		if (h < 17) return 'Good afternoon';
		return 'Good evening';
	});
	const dateStr = now.toLocaleDateString('en-NG', {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});
</script>

<svelte:head>
	<title>Dashboard — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto">
	<!-- ── Page heading ── -->
	<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
		<div>
			<p class="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
				{dateStr}
			</p>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Today's Work</h1>
		</div>
		<!-- Capacity bar -->
		<div class="flex items-center gap-3 text-sm">
			<span class="text-muted-foreground text-xs">Daily capacity</span>
			<div class="flex items-center gap-2">
				<Progress value={capacityUsed} class="w-24 h-1.5" />
				<span class="text-xs font-mono tabular-nums font-semibold text-foreground">
					{queueStore.todayVolume}/{dailyPatientCapacity}
				</span>
			</div>
		</div>
	</div>

	<!-- ── Alert strip (shown only when there's something critical) ── -->
	{#if hasAlerts}
		<div class="flex flex-col sm:flex-row gap-2">
			{#if redPatients.length > 0}
				<a
					href="/nurse"
					class="flex items-center gap-3 rounded-xl border-2 border-triage-red/40 bg-triage-red/8 px-4 py-3 hover:border-triage-red/70 transition-colors group"
				>
					<div class="size-2 rounded-full bg-triage-red animate-pulse shrink-0"></div>
					<span class="text-sm font-semibold text-triage-red">
						{redPatients.length} critical patient{redPatients.length > 1 ? 's' : ''} waiting
					</span>
					<ArrowRight
						class="size-4 text-triage-red ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
					/>
				</a>
			{/if}
			{#if overdueReminders > 0}
				<a
					href="/nurse/reminders"
					class="flex items-center gap-3 rounded-xl border border-triage-amber/50 bg-triage-amber/10 px-4 py-3 hover:border-triage-amber/80 transition-colors group"
				>
					<Bell class="size-4 text-triage-amber shrink-0" />
					<span class="text-sm font-semibold text-foreground">
						{overdueReminders} overdue reminder{overdueReminders > 1 ? 's' : ''}
					</span>
					<ArrowRight
						class="size-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
					/>
				</a>
			{/if}
			{#if lowStockItems.length > 0}
				<a
					href="/pharmacy/inventory"
					class="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 hover:border-border/80 transition-colors group"
				>
					<Package class="size-4 text-muted-foreground shrink-0" />
					<span class="text-sm font-medium text-foreground">
						{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} low on stock
					</span>
					<ArrowRight
						class="size-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
					/>
				</a>
			{/if}
		</div>
	{/if}

	<!-- ── Two-column layout: Queue overview + Quick launch ── -->
	<div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
		<!-- Left col: Queue overview (60%) -->
		<div class="lg:col-span-3 space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-foreground">Queue Overview</h2>
				<a href="/nurse" class="text-xs text-primary hover:underline flex items-center gap-1">
					View board <ArrowRight class="size-3" />
				</a>
			</div>

			<!-- Queue segments -->
			<div class="space-y-2">
				<!-- General -->
				<a
					href="/nurse"
					class="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 hover:border-primary/40 hover:bg-primary/5 transition-all group"
				>
					<!-- Left triage accent -->
					<div class="flex flex-col items-center gap-1 w-12 shrink-0">
						<span class="text-2xl font-bold font-mono tabular-nums text-foreground leading-none">
							{waitingGeneral}
						</span>
						<span class="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"
							>general</span
						>
					</div>
					<div class="h-10 w-px bg-border"></div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-foreground">General Queue</p>
						<p class="text-xs text-muted-foreground mt-0.5">
							{#if redPatients.length > 0}
								<span class="text-triage-red font-medium">{redPatients.length} critical · </span>
							{/if}
							{#if amberPatients.length > 0}
								<span class="text-triage-amber font-medium"
									>{amberPatients.length} priority ·
								</span>
							{/if}
							{#if waitingGeneral === 0}No patients waiting{/if}
						</p>
					</div>
					<ClipboardList class="size-4 text-muted-foreground shrink-0" />
				</a>

				<!-- ANC -->
				<a
					href="/nurse?tab=anc"
					class="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 hover:border-primary/40 hover:bg-primary/5 transition-all group"
				>
					<div class="flex flex-col items-center gap-1 w-12 shrink-0">
						<span class="text-2xl font-bold font-mono tabular-nums text-foreground leading-none">
							{waitingAnc}
						</span>
						<span class="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"
							>anc</span
						>
					</div>
					<div class="h-10 w-px bg-border"></div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-foreground">ANC / Maternal</p>
						<p class="text-xs text-muted-foreground mt-0.5">
							{waitingAnc === 0
								? 'No patients waiting'
								: `${waitingAnc} patient${waitingAnc > 1 ? 's' : ''} waiting`}
						</p>
					</div>
					<Baby class="size-4 text-muted-foreground shrink-0" />
				</a>

				<!-- EPI -->
				<a
					href="/nurse?tab=epi"
					class="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 hover:border-primary/40 hover:bg-primary/5 transition-all group"
				>
					<div class="flex flex-col items-center gap-1 w-12 shrink-0">
						<span class="text-2xl font-bold font-mono tabular-nums text-foreground leading-none">
							{waitingEpi}
						</span>
						<span class="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"
							>epi</span
						>
					</div>
					<div class="h-10 w-px bg-border"></div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-foreground">Immunization (EPI)</p>
						<p class="text-xs text-muted-foreground mt-0.5">
							{waitingEpi === 0
								? 'No patients waiting'
								: `${waitingEpi} patient${waitingEpi > 1 ? 's' : ''} waiting`}
						</p>
					</div>
					<Syringe class="size-4 text-muted-foreground shrink-0" />
				</a>
			</div>

			<!-- Today's volume -->
			<div class="rounded-xl border border-border bg-card px-4 py-3.5">
				<div class="flex items-center justify-between mb-2">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
						>Today's volume</span
					>
					<span class="text-xs font-mono tabular-nums text-muted-foreground"
						>{queueStore.todayVolume} seen</span
					>
				</div>
				<Progress value={capacityUsed} class="h-2" />
				<p class="text-xs text-muted-foreground mt-1.5">
					{capacityUsed}% of daily capacity ({dailyPatientCapacity} patients)
				</p>
			</div>
		</div>

		<!-- Right col: Quick launch (40%) -->
		<div class="lg:col-span-2 space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-foreground">Quick Launch</h2>
				<!-- Search for modules -->
				<div class="relative">
					<Search class="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
					<input
						bind:value={searchQuery}
						type="search"
						placeholder="Find…"
						class="h-7 w-32 rounded-lg border border-border bg-muted/50 pl-7 pr-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
			</div>

			<!-- Category filter chips -->
			<div class="flex flex-wrap gap-1.5">
				<button
					class="rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors {activeCategory ===
					'all'
						? 'bg-primary text-primary-foreground border-primary'
						: 'border-border bg-muted/50 text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeCategory = 'all')}
				>
					All
				</button>
				{#each orderedCategories as cat}
					<button
						class="rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors {activeCategory ===
						cat
							? 'bg-primary text-primary-foreground border-primary'
							: 'border-border bg-muted/50 text-muted-foreground hover:text-foreground'}"
						onclick={() => (activeCategory = cat)}
					>
						{cat.split(' ')[0]}
					</button>
				{/each}
			</div>

			<!-- Module tiles -->
			{#if filteredCategories.length === 0}
				<div
					class="flex flex-col items-center justify-center py-12 text-muted-foreground rounded-xl border border-dashed border-border bg-muted/20"
				>
					<ShieldCheck class="size-8 mb-2 opacity-30" />
					<p class="text-sm font-medium">No modules found</p>
					<p class="text-xs mt-0.5">Try a different category or search term</p>
				</div>
			{:else}
				<div class="space-y-5">
					{#each filteredCategories as category (category)}
						{@const mods = filterModules(groupedModules[category] ?? [])}
						{#if mods.length > 0}
							<div class="space-y-1.5">
								<!-- Section rule with label -->
								<div class="flex items-center gap-2">
									<span
										class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70"
									>
										{category}
									</span>
									<div class="h-px flex-1 bg-border/60"></div>
								</div>

								<!-- Module list (compact rows) -->
								<div class="space-y-1">
									{#each mods as mod (mod.id)}
										{@const IconComponent = ICONS[mod.iconName]}
										{@const liveStat = getLiveStat(mod.id)}
										{@const statVariant = getStatVariant(mod.id)}

										<a
											href={mod.href}
											class="flex items-center gap-3 rounded-lg px-3 py-2.5 border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group"
										>
											{#if IconComponent}
												<IconComponent
													class="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0"
													stroke-width={1.75}
												/>
											{/if}
											<span class="text-sm font-medium text-foreground flex-1 truncate">
												{mod.label}
											</span>
											{#if liveStat}
												<Badge
													variant={statVariant}
													class="text-[10px] font-mono tabular-nums shrink-0 h-5"
												>
													{liveStat}
												</Badge>
											{:else}
												<ArrowRight
													class="size-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
												/>
											{/if}
										</a>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
