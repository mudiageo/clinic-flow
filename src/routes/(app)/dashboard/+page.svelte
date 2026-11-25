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
		Send,
		Clock,
		CheckCircle2,
		RefreshCw,
		PhoneCall,
		Zap
	} from '@lucide/svelte';

	// Map icon names to icon components
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

	// Visible navigation modules
	const visibleModules = $derived(DASHBOARD_MODULES.filter((m) => sessionStore.can(m.permission)));

	// Filter state
	let activeCategory = $state<string>('all');
	let searchQuery = $state<string>('');

	// Grouping
	const groupedModules = $derived.by(() => {
		const groups: Record<string, typeof DASHBOARD_MODULES> = {};
		for (const mod of visibleModules) {
			if (!groups[mod.category]) groups[mod.category] = [];
			groups[mod.category].push(mod);
		}
		return groups;
	});

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
	const orderedCategories = $derived(CATEGORY_ORDER.filter((cat) => groupedModules[cat]?.length));

	const filteredCategories = $derived(
		activeCategory === 'all'
			? orderedCategories
			: orderedCategories.filter((cat) => cat === activeCategory)
	);

	// Filtered modules by search
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
	const redPatients = $derived(
		queueStore.sortedQueue.filter((ticket) => ticket.triageLevel === 'red')
	);
	const amberPatients = $derived(
		queueStore.sortedQueue.filter((ticket) => ticket.triageLevel === 'amber')
	);
	const dailyPatientCapacity = $derived(Math.max(1, settingsStore.current.dailyPatientCapacity));
	const capacityUsed = $derived(
		calculateCapacityUsed(queueStore.todayVolume, dailyPatientCapacity)
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
				return lowStockItems.length > 0 ? `${lowStockItems.length} low stock` : null;
			default:
				return null;
		}
	}

	function getPatientName(patientId: string): string {
		const patient = patientStore.get(patientId);
		if (patient?.name) return patient.name;
		return `Patient #${patientId.substring(0, 6)}`;
	}

	function getWaitMinutes(createdAt: number): string {
		const mins = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
		if (mins === 0) return 'Just registered';
		if (mins === 1) return '1 min ago';
		return `${mins} mins ago`;
	}

	let isSyncing = $state(false);
	async function handleManualSync() {
		if (isSyncing) return;
		isSyncing = true;
		try {
			syncStore.requestSyncAcrossTabs();
			if (sessionStore.phcId) {
				await syncStore.pushPendingOperations();
			}
		} finally {
			setTimeout(() => {
				isSyncing = false;
			}, 1000);
		}
	}

	let isCallingNext = $state(false);
	async function handleCallNextPatient() {
		if (isCallingNext || !queueStore.nextTicket) return;
		isCallingNext = true;
		try {
			await queueStore.callNext();
		} finally {
			isCallingNext = false;
		}
	}

	const ROLE_LABELS: Record<string, string> = {
		nurse: 'Nurse',
		nurse_midwife: 'Nurse/Midwife',
		doctor: 'Medical Officer',
		chew: 'CHEW Extension Worker',
		jchew: 'JCHEW Worker',
		cho: 'Community Health Officer',
		oic: 'Officer in Charge (OIC)',
		admin: 'Facility Administrator',
		pharmacy: 'Pharmacy Technician',
		eho: 'Environmental Health Officer',
		superadmin: 'Super Admin',
		receptionist: 'Intake Receptionist'
	};
</script>

<svelte:head>
	<title>Clinical Shift Console — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 md:space-y-8 animate-fade-in pb-12">
	<!-- ══════════════════════════════════════════════════════════════════ -->
	<!-- 1. SHIFT HEADER & FACILITY TELEMETRY BAR                           -->
	<!-- ══════════════════════════════════════════════════════════════════ -->
	<header
		class="rounded-lg border border-border bg-card p-4 md:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
	>
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<p class="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
					{settingsStore.current.phcName || 'Primary Health Centre'}
				</p>
				<span class="text-muted-foreground/50">·</span>
				<Badge variant="outline" class="text-[11px] font-mono font-medium rounded-sm">
					{ROLE_LABELS[sessionStore.role ?? ''] ?? sessionStore.role}
				</Badge>
			</div>
			<h1 class="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
				Shift Console — {sessionStore.user?.name ?? 'Clinical Staff'}
			</h1>
			<p class="text-xs md:text-sm text-muted-foreground font-mono">
				{new Intl.DateTimeFormat('en-NG', {
					weekday: 'long',
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				}).format(new Date())}
			</p>
		</div>

		<!-- Edge & Sync Telemetry Pill -->
		<div
			class="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 text-xs font-mono self-start lg:self-auto"
		>
			<!-- LAN Mesh Status -->
			<div class="flex items-center gap-2">
				<span class="relative flex size-2.5">
					<span
						class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
					></span>
					<span class="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
				</span>
				<span class="text-foreground font-medium">clinicflow.local (LAN)</span>
			</div>

			<span class="text-border">|</span>

			<!-- Uplink Outbox Status -->
			<div class="flex items-center gap-1.5">
				{#if syncStore.pendingCount > 0}
					<span class="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
						<span class="size-1.5 rounded-full bg-amber-500"></span>
						{syncStore.pendingCount} queued for uplink
					</span>
				{:else}
					<span class="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
						<CheckCircle2 class="size-3.5" /> All changes synced
					</span>
				{/if}
			</div>

			<span class="text-border">|</span>

			<!-- Manual Sync Trigger -->
			<Button
				variant="ghost"
				size="sm"
				class="h-7 px-2.5 text-xs font-mono text-muted-foreground hover:text-foreground"
				onclick={handleManualSync}
				disabled={isSyncing}
				title="Trigger immediate sync across local network"
			>
				<RefreshCw class="size-3 mr-1.5 {isSyncing ? 'animate-spin text-primary' : ''}" />
				{isSyncing ? 'Syncing…' : 'Sync Now'}
			</Button>
		</div>
	</header>

	<!-- ══════════════════════════════════════════════════════════════════ -->
	<!-- 2. ACTION REQUIRED / URGENT CARE BANNER                            -->
	<!-- ══════════════════════════════════════════════════════════════════ -->
	{#if redPatients.length > 0 || (lowStockItems.length > 0 && sessionStore.can('manage:inventory'))}
		<section class="space-y-3">
			{#if redPatients.length > 0}
				<div
					class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
				>
					<div class="flex items-start gap-3">
						<div
							class="size-9 rounded-md bg-destructive text-destructive-foreground flex items-center justify-center shrink-0 mt-0.5 animate-pulse"
						>
							<AlertTriangle class="size-5" />
						</div>
						<div>
							<div class="flex items-center gap-2">
								<h2 class="text-base font-bold text-destructive">
									Critical Emergency Triage Alert
								</h2>
								<Badge variant="destructive" class="text-[10px] font-mono uppercase">
									{redPatients.length} Red Case{redPatients.length > 1 ? 's' : ''}
								</Badge>
							</div>
							<p class="text-xs md:text-sm text-foreground/80 mt-0.5 leading-relaxed">
								Severe triage danger signs detected. Immediate clinical assessment and doctor
								intervention required.
							</p>
						</div>
					</div>
					<Button
						href="/nurse?tab=general"
						variant="destructive"
						class="rounded-md font-semibold text-xs shrink-0 self-start sm:self-auto"
					>
						Attend Emergency Queue <ArrowRight class="size-3.5 ml-1.5" />
					</Button>
				</div>
			{/if}

			{#if lowStockItems.length > 0 && sessionStore.can('manage:inventory')}
				<div
					class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
				>
					<div class="flex items-start gap-3">
						<div
							class="size-9 rounded-md bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5"
						>
							<Pill class="size-5" />
						</div>
						<div>
							<div class="flex items-center gap-2">
								<h2 class="text-base font-bold text-amber-900 dark:text-amber-300">
									Dispensary Inventory Depletion Warning
								</h2>
								<Badge
									variant="outline"
									class="text-[10px] font-mono border-amber-500/40 text-amber-800 dark:text-amber-300"
								>
									{lowStockItems.length} Item{lowStockItems.length > 1 ? 's' : ''} Low
								</Badge>
							</div>
							<p
								class="text-xs md:text-sm text-amber-900/80 dark:text-amber-200/80 mt-0.5 leading-relaxed"
							>
								Essential drugs have fallen below safety buffer stock levels. Reorder to prevent
								clinic stockouts.
							</p>
						</div>
					</div>
					<Button
						href="/pharmacy/restock"
						variant="outline"
						class="rounded-md border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 text-xs shrink-0 self-start sm:self-auto font-medium"
					>
						Open Restock Order <ArrowRight class="size-3.5 ml-1.5" />
					</Button>
				</div>
			{/if}
		</section>
	{/if}

	<!-- ══════════════════════════════════════════════════════════════════ -->
	<!-- 3. WARD FLOW LEDGER (REPLACING 4 IDENTICAL KPI CARDS)               -->
	<!-- ══════════════════════════════════════════════════════════════════ -->
	<section
		class="rounded-lg border border-border bg-card p-4 md:p-6 shadow-sm divide-y divide-border/60"
	>
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4">
			<div>
				<p class="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
					Shift Overview
				</p>
				<h2 class="text-lg font-bold text-foreground">Ward Flow & Capacity Ledger</h2>
			</div>
			<div class="text-xs text-muted-foreground font-mono">
				{#if redPatients.length === 0 && amberPatients.length === 0}
					<span class="text-emerald-600 dark:text-emerald-400 font-semibold"
						>● Normal Shift Rhythm</span
					>
				{:else}
					<span class="text-amber-600 dark:text-amber-400 font-semibold"
						>● Active Priority Triage</span
					>
				{/if}
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-5">
			<!-- Col 1: Active Waiting -->
			<div class="space-y-2">
				<p class="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">
					Total Waiting Queue
				</p>
				<div class="flex items-baseline gap-2">
					<span class="text-3xl md:text-4xl font-bold font-mono tracking-tight text-foreground">
						{totalWaiting}
					</span>
					<span class="text-xs text-muted-foreground font-mono">patients</span>
				</div>
				<div class="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
					<span class="px-1.5 py-0.5 rounded bg-muted">{waitingGeneral} General</span>
					<span class="px-1.5 py-0.5 rounded bg-muted">{waitingAnc} ANC</span>
					<span class="px-1.5 py-0.5 rounded bg-muted">{waitingEpi} EPI</span>
				</div>
			</div>

			<!-- Col 2: Seen & Completed Today -->
			<div class="space-y-2">
				<p class="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">
					Completed Encounters
				</p>
				<div class="flex items-baseline gap-2">
					<span
						class="text-3xl md:text-4xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400"
					>
						{queueStore.completedToday}
					</span>
					<span class="text-xs text-muted-foreground font-mono">discharged</span>
				</div>
				<p class="text-xs text-muted-foreground">Patients seen, prescribed, or transferred today</p>
			</div>

			<!-- Col 3: Capacity Used -->
			<div class="space-y-2">
				<div class="flex items-center justify-between text-xs font-mono">
					<span class="uppercase tracking-wider text-muted-foreground font-medium"
						>Capacity Used</span
					>
					<span class="font-bold text-foreground">{capacityUsed}%</span>
				</div>
				<div class="flex items-baseline gap-2">
					<span class="text-3xl md:text-4xl font-bold font-mono tracking-tight text-foreground">
						{queueStore.todayVolume}
					</span>
					<span class="text-xs text-muted-foreground font-mono"
						>/ {dailyPatientCapacity} target</span
					>
				</div>
				<Progress value={capacityUsed} class="h-1.5" />
			</div>

			<!-- Col 4: Network & Sync Integrity -->
			<div class="space-y-2">
				<p class="text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">
					Edge Sync Integrity
				</p>
				<div class="flex items-baseline gap-2">
					<span
						class="text-3xl md:text-4xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-400"
					>
						{syncStore.syncHealth}%
					</span>
					<span class="text-xs text-muted-foreground font-mono">health score</span>
				</div>
				<p class="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
					<span class="size-2 rounded-full bg-emerald-500"></span>
					Local Dexie DB Active
				</p>
			</div>
		</div>
	</section>

	<!-- ══════════════════════════════════════════════════════════════════ -->
	<!-- 4. LIVE PATIENT QUEUE (DOMAIN SIGNATURE: TICKET-STUB ANATOMY)      -->
	<!-- ══════════════════════════════════════════════════════════════════ -->
	{#if sessionStore.can('view:queue:general')}
		<section class="rounded-lg border border-border bg-card p-4 md:p-6 shadow-sm space-y-4">
			<div
				class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4"
			>
				<div>
					<p class="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
						Next Up For Clinical Care
					</p>
					<h2 class="text-xl font-bold text-foreground">
						Live Triage Queue ({queueStore.sortedQueue.length} Active)
					</h2>
				</div>

				<div class="flex items-center gap-2">
					{#if queueStore.nextTicket}
						<Button
							size="sm"
							class="rounded-md font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90"
							onclick={handleCallNextPatient}
							disabled={isCallingNext}
						>
							<PhoneCall class="size-3.5 mr-1.5" />
							Call Next Ticket (#{queueStore.nextTicket.ticketNumber})
						</Button>
					{/if}
					<Button href="/nurse?tab=general" variant="outline" size="sm" class="rounded-md text-xs">
						View Full Triage Board <ArrowRight class="size-3 ml-1" />
					</Button>
				</div>
			</div>

			{#if queueStore.sortedQueue.length === 0}
				<div
					class="rounded-lg border border-dashed border-border p-8 text-center space-y-2 bg-muted/10"
				>
					<CheckCircle2 class="size-8 text-emerald-500 mx-auto" />
					<p class="text-sm font-semibold text-foreground">Triage Queue is Currently Clear</p>
					<p class="text-xs text-muted-foreground max-w-sm mx-auto">
						No patients are actively waiting in the intake queue. Register new arrivals using the
						intake button below.
					</p>
					{#if sessionStore.can('manage:patients')}
						<div class="pt-2">
							<Button href="/nurse/register" size="sm" class="rounded-md font-medium text-xs">
								<UserPlus class="size-3.5 mr-1.5" /> Register Walk-in Arrival
							</Button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each queueStore.sortedQueue.slice(0, 6) as ticket (ticket.id)}
						{@const isRed = ticket.triageLevel === 'red'}
						{@const isAmber = ticket.triageLevel === 'amber'}
						<div
							class="rounded-lg border p-3.5 bg-card flex flex-col justify-between gap-3 transition-colors {isRed
								? 'border-destructive/50 bg-destructive/5 shadow-sm'
								: isAmber
									? 'border-amber-500/40 bg-amber-500/5'
									: 'border-border hover:border-primary/40'}"
						>
							<div class="flex items-start justify-between gap-2">
								<div class="flex items-center gap-2">
									<span
										class="font-mono font-bold text-sm px-2 py-0.5 rounded {isRed
											? 'bg-destructive text-destructive-foreground'
											: isAmber
												? 'bg-amber-600 text-white'
												: 'bg-muted text-foreground'}"
									>
										#{ticket.ticketNumber}
									</span>
									<span class="text-xs font-mono uppercase text-muted-foreground font-medium">
										{ticket.department}
									</span>
								</div>

								<span
									class="inline-flex items-center gap-1 text-[11px] font-mono {isRed
										? 'text-destructive font-bold'
										: isAmber
											? 'text-amber-700 dark:text-amber-300 font-semibold'
											: 'text-emerald-700 dark:text-emerald-400'}"
								>
									<span
										class="size-1.5 rounded-full {isRed
											? 'bg-destructive animate-ping'
											: isAmber
												? 'bg-amber-500'
												: 'bg-emerald-500'}"
									></span>
									{ticket.triageLevel.toUpperCase()}
								</span>
							</div>

							<div>
								<p class="font-bold text-foreground text-sm leading-tight">
									{getPatientName(ticket.patientId)}
								</p>
								<p class="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
									<Clock class="size-3" />
									{getWaitMinutes(ticket.createdAt)}
								</p>
							</div>

							<div class="pt-2 border-t border-border/60 flex items-center justify-between">
								<span class="text-[11px] font-mono text-muted-foreground capitalize">
									Status: {ticket.status}
								</span>
								{#if ticket.status === 'waiting'}
									<Button
										size="sm"
										variant="ghost"
										class="h-7 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 px-2"
										href="/doctor"
									>
										Attend <ArrowRight class="size-3 ml-1" />
									</Button>
								{:else}
									<Badge variant="outline" class="text-[10px] font-mono">Called</Badge>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				{#if queueStore.sortedQueue.length > 6}
					<div class="text-center pt-2">
						<Button
							href="/nurse?tab=general"
							variant="ghost"
							size="sm"
							class="text-xs text-primary"
						>
							+ {queueStore.sortedQueue.length - 6} more patients in queue →
						</Button>
					</div>
				{/if}
			{/if}
		</section>
	{/if}

	<!-- ══════════════════════════════════════════════════════════════════ -->
	<!-- 5. QUICK ACTION BAR (THUMB-REACHABLE HIGH-FREQUENCY ACTIONS)       -->
	<!-- ══════════════════════════════════════════════════════════════════ -->
	<section class="rounded-lg border border-border bg-muted/20 p-4 md:p-5 space-y-3">
		<p class="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
			Frontline Quick Actions
		</p>
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
			{#if sessionStore.can('manage:patients')}
				<Button
					href="/nurse/register"
					variant="outline"
					class="h-11 rounded-md text-xs font-medium justify-start gap-2 bg-card hover:bg-accent hover:border-primary/40"
				>
					<UserPlus class="size-4 text-primary" />
					<span class="truncate">Register Patient</span>
				</Button>
			{/if}

			{#if sessionStore.can('manage:vitals')}
				<Button
					href="/nurse/vitals"
					variant="outline"
					class="h-11 rounded-md text-xs font-medium justify-start gap-2 bg-card hover:bg-accent hover:border-primary/40"
				>
					<Activity class="size-4 text-emerald-600" />
					<span class="truncate">Take Vitals</span>
				</Button>
			{/if}

			{#if sessionStore.can('manage:consultations')}
				<Button
					href="/doctor"
					variant="outline"
					class="h-11 rounded-md text-xs font-medium justify-start gap-2 bg-card hover:bg-accent hover:border-primary/40"
				>
					<Stethoscope class="size-4 text-violet-600" />
					<span class="truncate">Doctor's Desk</span>
				</Button>
			{/if}

			{#if sessionStore.can('manage:dispensing')}
				<Button
					href="/pharmacy/dispense"
					variant="outline"
					class="h-11 rounded-md text-xs font-medium justify-start gap-2 bg-card hover:bg-accent hover:border-primary/40"
				>
					<Pill class="size-4 text-amber-600" />
					<span class="truncate">Dispense Rx</span>
				</Button>
			{/if}

			{#if sessionStore.can('view:anc')}
				<Button
					href="/nurse?tab=anc"
					variant="outline"
					class="h-11 rounded-md text-xs font-medium justify-start gap-2 bg-card hover:bg-accent hover:border-primary/40"
				>
					<Baby class="size-4 text-pink-600" />
					<span class="truncate">ANC Maternal</span>
				</Button>
			{/if}

			{#if sessionStore.can('manage:immunization')}
				<Button
					href="/immunization"
					variant="outline"
					class="h-11 rounded-md text-xs font-medium justify-start gap-2 bg-card hover:bg-accent hover:border-primary/40"
				>
					<Syringe class="size-4 text-teal-600" />
					<span class="truncate">EPI Vaccine</span>
				</Button>
			{/if}
		</div>
	</section>

	<!-- ══════════════════════════════════════════════════════════════════ -->
	<!-- 6. CLINICAL STATION MATRIX (ORGANIZED BY FUNCTIONAL WINGS)        -->
	<!-- ══════════════════════════════════════════════════════════════════ -->
	<section class="space-y-5">
		<div
			class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/70 pb-4"
		>
			<div>
				<p class="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
					Facility Navigation
				</p>
				<h2 class="text-xl font-bold text-foreground">Clinical Station Launchpad</h2>
			</div>

			<!-- Category Filter Chips -->
			<div class="flex flex-wrap items-center gap-1.5">
				<button
					type="button"
					onclick={() => (activeCategory = 'all')}
					class="px-2.5 py-1 rounded-md text-xs font-mono transition-colors {activeCategory ===
					'all'
						? 'bg-primary text-primary-foreground font-semibold'
						: 'bg-muted text-muted-foreground hover:text-foreground'}"
				>
					All Stations
				</button>
				{#each orderedCategories as cat}
					<button
						type="button"
						onclick={() => (activeCategory = cat)}
						class="px-2.5 py-1 rounded-md text-xs font-mono transition-colors {activeCategory ===
						cat
							? 'bg-primary text-primary-foreground font-semibold'
							: 'bg-muted text-muted-foreground hover:text-foreground'}"
					>
						{cat}
					</button>
				{/each}
			</div>
		</div>

		{#if filteredCategories.length === 0}
			<div
				class="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg bg-card border-dashed space-y-2"
			>
				<ShieldCheck class="size-10 text-muted-foreground/30" />
				<p class="text-base font-semibold text-foreground">No stations found in this category</p>
				<p class="text-xs">Your assigned role may not have permissions for these modules.</p>
			</div>
		{:else}
			<div class="space-y-8">
				{#each filteredCategories as category (category)}
					{@const mods = filterModules(groupedModules[category] ?? [])}
					{#if mods.length > 0}
						<div class="space-y-3">
							<div class="flex items-center gap-2">
								<h3
									class="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold"
								>
									{category}
								</h3>
								<span class="text-xs text-muted-foreground/50 font-mono">({mods.length})</span>
								<div class="h-px flex-1 bg-border/60"></div>
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
								{#each mods as mod (mod.id)}
									{@const IconComponent = ICONS[mod.iconName]}
									{@const liveStat = getLiveStat(mod.id)}

									<div
										class="group rounded-lg border border-border bg-card p-4 flex flex-col justify-between hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
									>
										<div class="space-y-3">
											<div class="flex items-start justify-between gap-2">
												<div
													class="size-9 rounded-md bg-muted text-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors"
												>
													{#if IconComponent}
														<IconComponent class="size-4.5" />
													{/if}
												</div>

												{#if liveStat}
													<Badge
														variant="outline"
														class="text-[10px] font-mono border-primary/30 text-primary font-semibold"
													>
														{liveStat}
													</Badge>
												{/if}
											</div>

											<div>
												<a
													href={mod.href}
													class="font-bold text-foreground text-sm hover:text-primary transition-colors block leading-snug"
												>
													{mod.label}
												</a>
												<p class="text-xs text-muted-foreground line-clamp-1 mt-0.5">
													Operational station for {mod.label.toLowerCase()}
												</p>
											</div>
										</div>

										<div class="pt-3 mt-3 border-t border-border/60">
											{#if mod.id === 'appointments' || mod.id === 'register-patient'}
												<Button
													variant="ghost"
													size="sm"
													class="h-7 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 w-full justify-between p-0"
													href={mod.href}
												>
													<span>Register New</span>
													<UserPlus class="size-3.5 ml-1" />
												</Button>
											{:else if mod.id === 'reminders'}
												<Button
													variant="ghost"
													size="sm"
													class="h-7 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 w-full justify-between p-0"
													href={mod.href}
												>
													<span>Dispatch SMS</span>
													<Send class="size-3.5 ml-1" />
												</Button>
											{:else if mod.id === 'triage-board'}
												<Button
													variant="ghost"
													size="sm"
													class="h-7 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 w-full justify-between p-0"
													href={mod.href}
												>
													<span>Triage Patient</span>
													<Activity class="size-3.5 ml-1" />
												</Button>
											{:else if mod.id === 'inventory'}
												<Button
													variant="ghost"
													size="sm"
													class="h-7 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 w-full justify-between p-0"
													href="/pharmacy/restock"
												>
													<span>Request Restock</span>
													<PackagePlus class="size-3.5 ml-1" />
												</Button>
											{:else}
												<Button
													variant="ghost"
													size="sm"
													class="h-7 text-xs font-medium text-muted-foreground hover:text-foreground w-full justify-between p-0"
													href={mod.href}
												>
													<span>Launch Station</span>
													<ArrowRight class="size-3 ml-1" />
												</Button>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</section>
</div>
