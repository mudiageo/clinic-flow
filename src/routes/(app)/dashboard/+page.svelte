<script lang="ts">
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import { queueStore } from '#lib/state/queue.svelte.ts';
	import { reminderStore } from '#lib/state/reminders.svelte.ts';
	import { pharmacyStore } from '#lib/state/pharmacy.svelte.ts';
	import { prescriptionStore } from '#lib/state/prescriptions.svelte.ts';
	import { labRequestStore } from '#lib/state/lab-requests.svelte.ts';
	import { settingsStore } from '#lib/state/settings.svelte.ts';
	import { syncStore } from '#lib/state/sync.svelte.ts';
	import { DASHBOARD_MODULES } from '#lib/config/dashboard-modules.ts';
	import type { Component } from 'svelte';
	import { calculateCapacityUsed } from '#lib/dashboard/metrics.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Progress } from '#lib/components/ui/progress/index.ts';
	import QueueTicketCard from '#lib/components/queue-ticket-card.svelte';
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
		Building2,
		Globe2,
		Megaphone,
		Rocket,
		Server,
		Send,
		RefreshCw
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

	const role = $derived((sessionStore.role ?? 'staff').toLowerCase());
	const visibleModules = $derived(DASHBOARD_MODULES.filter((m) => sessionStore.can(m.permission)));

	// Role-first category ordering so a doctor with admin permissions still sees Clinical first
	const ROLE_CATEGORY_PRIORITY: Record<string, string[]> = {
		doctor: [
			'Clinical',
			'Patient Care',
			'Queue & Triage',
			'Maternal Health',
			'Pharmacy',
			'Appointments'
		],
		nurse: [
			'Queue & Triage',
			'Patient Care',
			'Maternal Health',
			'Clinical',
			'Appointments',
			'Pharmacy'
		],
		nurse_midwife: [
			'Maternal Health',
			'Queue & Triage',
			'Patient Care',
			'Clinical',
			'Appointments'
		],
		pharmacy: ['Pharmacy', 'Clinical', 'Patient Care', 'Queue & Triage'],
		receptionist: ['Patient Care', 'Appointments', 'Queue & Triage', 'Field & Community'],
		chew: ['Field & Community', 'Queue & Triage', 'Patient Care', 'Maternal Health'],
		jchew: ['Field & Community', 'Patient Care', 'Queue & Triage'],
		cho: ['Field & Community', 'Queue & Triage', 'Analytics & Reporting', 'Administration'],
		eho: ['Field & Community', 'Analytics & Reporting', 'Clinical'],
		admin: [
			'Analytics & Reporting',
			'Administration',
			'Queue & Triage',
			'Patient Care',
			'Pharmacy'
		],
		oic: ['Analytics & Reporting', 'Administration', 'Queue & Triage', 'Clinical', 'Pharmacy'],
		superadmin: ['Platform Management', 'Administration', 'Analytics & Reporting']
	};

	const DEFAULT_CATEGORY_ORDER = [
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

	const orderedCategories = $derived.by(() => {
		const preferred = ROLE_CATEGORY_PRIORITY[role] ?? [];
		const merged = [...preferred, ...DEFAULT_CATEGORY_ORDER.filter((c) => !preferred.includes(c))];
		// Also include any category not in DEFAULT_CATEGORY_ORDER
		for (const cat of Object.keys(groupedModules)) {
			if (!merged.includes(cat)) merged.push(cat);
		}
		return merged.filter((cat) => groupedModules[cat]?.length);
	});

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

	// Live clinical & operational metrics
	const waitingGeneral = $derived(queueStore.generalQueue.length);
	const waitingAnc = $derived(queueStore.ancQueue.length);
	const waitingEpi = $derived(queueStore.epiQueue.length);
	const totalWaiting = $derived(waitingGeneral + waitingAnc + waitingEpi);
	const overdueReminders = $derived(reminderStore.overdueReminders.length);
	const lowStockItems = $derived(pharmacyStore.lowStock);
	const pendingPrescriptions = $derived(prescriptionStore.pending);
	const pendingLabs = $derived(labRequestStore.sortedItems.filter((l) => l.status === 'pending'));

	const redPatients = $derived(queueStore.sortedQueue.filter((t) => t.triageLevel === 'red'));
	const amberPatients = $derived(queueStore.sortedQueue.filter((t) => t.triageLevel === 'amber'));
	const doctorQueue = $derived(
		queueStore.sortedQueue.filter(
			(t) => t.status === 'called' || t.status === 'waiting' || t.status === 'in_progress'
		)
	);
	const nextNurseTicket = $derived(queueStore.nextTicket);

	const dailyPatientCapacity = $derived(Math.max(1, settingsStore.current.dailyPatientCapacity));
	const capacityUsed = $derived(
		calculateCapacityUsed(queueStore.todayVolume, dailyPatientCapacity)
	);

	const hasAlerts = $derived(
		redPatients.length > 0 || overdueReminders > 0 || lowStockItems.length > 0
	);

	// Role-driven focal point selector (role takes precedence over extra admin permissions)
	type FocalMode = 'doctor' | 'nurse' | 'pharmacy' | 'reception' | 'field' | 'admin' | 'superadmin';
	const focalMode = $derived.by<FocalMode>(() => {
		if (role === 'doctor') return 'doctor';
		if (role === 'nurse' || role === 'nurse_midwife') return 'nurse';
		if (role === 'pharmacy') return 'pharmacy';
		if (role === 'receptionist') return 'reception';
		if (role === 'chew' || role === 'jchew' || role === 'cho' || role === 'eho') return 'field';
		if (role === 'superadmin') return 'superadmin';
		if (role === 'admin' || role === 'oic') return 'admin';
		// Fallback by permissions if role is custom
		if (sessionStore.can('manage:consultations')) return 'doctor';
		if (sessionStore.can('view:queue:general')) return 'nurse';
		if (sessionStore.can('manage:dispensing')) return 'pharmacy';
		return 'reception';
	});

	function getLiveStat(moduleId: string): string | null {
		switch (moduleId) {
			case 'triage-board':
				return waitingGeneral > 0 ? `${waitingGeneral} waiting` : null;
			case 'anc-queue':
				return waitingAnc > 0 ? `${waitingAnc} waiting` : null;
			case 'epi-queue':
				return waitingEpi > 0 ? `${waitingEpi} waiting` : null;
			case 'doctor-queue':
				return doctorQueue.length > 0 ? `${doctorQueue.length} to see` : null;
			case 'lab-requests':
				return pendingLabs.length > 0 ? `${pendingLabs.length} pending` : null;
			case 'dispense':
				return pendingPrescriptions.length > 0 ? `${pendingPrescriptions.length} pending` : null;
			case 'reminders':
				return overdueReminders > 0 ? `${overdueReminders} overdue` : null;
			case 'inventory':
				return lowStockItems.length > 0 ? `${lowStockItems.length} low` : null;
			default:
				return null;
		}
	}

	const dateStr = new Date().toLocaleDateString('en-NG', {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});
</script>

<svelte:head>
	<title>Dashboard — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto">
	<!-- ── Shift Header Bar ── -->
	<div
		class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-border"
	>
		<div>
			<div class="flex flex-wrap items-center gap-2 mb-1">
				<span class="text-xs font-mono uppercase tracking-widest text-muted-foreground">
					{dateStr}
				</span>
				<Badge variant="secondary" class="text-[10px] font-mono uppercase tracking-wider">
					{role.replace('_', ' ')}
				</Badge>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Clinical Shift Console</h1>
		</div>

		<div class="flex flex-wrap items-center gap-4">
			<!-- Local-first Sync & Mesh Status -->
			<button
				type="button"
				onclick={() => syncStore.flush()}
				class="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-mono hover:border-primary/40 transition-colors min-h-9"
			>
				<span
					class="size-2 rounded-full {syncStore.pendingCount > 0
						? 'bg-triage-amber'
						: 'bg-triage-green'}"
				></span>
				<span>
					{syncStore.isSyncing
						? 'Syncing…'
						: syncStore.pendingCount > 0
							? `${syncStore.pendingCount} queued`
							: 'Synced'}
				</span>
				<RefreshCw
					class="size-3 text-muted-foreground {syncStore.isSyncing ? 'animate-spin' : ''}"
				/>
			</button>

			<!-- Daily Capacity -->
			<div class="flex items-center gap-2.5 text-xs">
				<span class="text-muted-foreground font-medium">Capacity</span>
				<Progress value={capacityUsed} class="w-24 h-1.5" />
				<span class="font-mono tabular-nums font-semibold text-foreground">
					{queueStore.todayVolume}/{dailyPatientCapacity}
				</span>
			</div>
		</div>
	</div>

	<!-- ── Urgent Alert Strip (only when actionable) ── -->
	{#if hasAlerts}
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
			{#if redPatients.length > 0}
				<a
					href={focalMode === 'doctor' ? '/doctor' : '/nurse'}
					class="flex items-center gap-3 rounded-xl border border-triage-red/40 border-l-4 border-l-triage-red bg-triage-red/8 px-4 py-3 hover:bg-triage-red/12 transition-colors group"
				>
					<span class="size-2 rounded-full bg-triage-red animate-pulse shrink-0"></span>
					<span class="text-sm font-semibold text-triage-red flex-1">
						{redPatients.length} critical patient{redPatients.length > 1 ? 's' : ''} waiting
					</span>
					<ArrowRight class="size-4 text-triage-red shrink-0" />
				</a>
			{/if}
			{#if overdueReminders > 0}
				<a
					href="/nurse/reminders"
					class="flex items-center gap-3 rounded-xl border border-triage-amber/50 border-l-4 border-l-triage-amber bg-triage-amber/10 px-4 py-3 hover:bg-triage-amber/15 transition-colors group"
				>
					<Bell class="size-4 text-amber-700 dark:text-triage-amber shrink-0" />
					<span class="text-sm font-semibold text-foreground flex-1">
						{overdueReminders} overdue reminder{overdueReminders > 1 ? 's' : ''}
					</span>
					<ArrowRight class="size-4 text-muted-foreground shrink-0" />
				</a>
			{/if}
			{#if lowStockItems.length > 0}
				<a
					href="/pharmacy"
					class="flex items-center gap-3 rounded-xl border border-border border-l-4 border-l-destructive bg-card px-4 py-3 hover:border-destructive/50 transition-colors group"
				>
					<Package class="size-4 text-destructive shrink-0" />
					<span class="text-sm font-medium text-foreground flex-1">
						{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} low on stock
					</span>
					<ArrowRight class="size-4 text-muted-foreground shrink-0" />
				</a>
			{/if}
		</div>
	{/if}

	<!-- ── Role-First Focal Point (Adapts to Role first, then Permissions) ── -->
	<section class="rounded-xl border border-border bg-card overflow-hidden">
		{#if focalMode === 'doctor'}
			<!-- DOCTOR FOCAL POINT -->
			<div
				class="px-5 py-4 border-b border-border bg-primary/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
			>
				<div class="flex items-center gap-3">
					<div
						class="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0"
					>
						<Stethoscope class="size-5" />
					</div>
					<div>
						<h2 class="text-base font-bold text-foreground">Doctor Consultation Desk</h2>
						<p class="text-xs text-muted-foreground">
							{doctorQueue.length} patient{doctorQueue.length === 1 ? '' : 's'} to see ·
							{pendingLabs.length} pending lab{pendingLabs.length === 1 ? '' : 's'}
						</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button variant="outline" href="/doctor/lab" class="min-h-10 text-xs font-semibold">
						<FlaskConical class="size-3.5 mr-1.5" />
						Lab Hub ({pendingLabs.length})
					</Button>
					<Button href="/doctor" class="min-h-10 text-xs font-semibold">
						Open Doctor Desk
						<ArrowRight class="size-3.5 ml-1.5" />
					</Button>
				</div>
			</div>
			<div class="p-4 sm:p-5 space-y-3">
				{#if doctorQueue.length === 0}
					<p class="text-sm text-muted-foreground py-4 text-center">
						No patients currently waiting for consultation.
					</p>
				{:else}
					{#each doctorQueue.slice(0, 2) as ticket (ticket.id)}
						<QueueTicketCard {ticket} role="doctor" />
					{/each}
					{#if doctorQueue.length > 2}
						<div class="text-right">
							<a href="/doctor" class="text-xs font-semibold text-primary hover:underline">
								View all {doctorQueue.length} patients in queue →
							</a>
						</div>
					{/if}
				{/if}
			</div>
		{:else if focalMode === 'nurse'}
			<!-- NURSE / MIDWIFE FOCAL POINT -->
			<div
				class="px-5 py-4 border-b border-border bg-primary/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
			>
				<div class="flex items-center gap-3">
					<div
						class="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0"
					>
						<ClipboardList class="size-5" />
					</div>
					<div>
						<h2 class="text-base font-bold text-foreground">Triage &amp; Vitals Station</h2>
						<p class="text-xs text-muted-foreground">
							{waitingGeneral} General · {waitingAnc} ANC · {waitingEpi} EPI waiting
						</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button variant="outline" href="/nurse/vitals" class="min-h-10 text-xs font-semibold">
						<Thermometer class="size-3.5 mr-1.5" />
						Record Vitals
					</Button>
					<Button
						onclick={() => queueStore.callNext()}
						disabled={!nextNurseTicket}
						class="min-h-10 text-xs font-semibold"
					>
						<Megaphone class="size-3.5 mr-1.5" />
						Call Next Patient
					</Button>
				</div>
			</div>
			<div class="p-4 sm:p-5 space-y-3">
				{#if nextNurseTicket}
					<QueueTicketCard ticket={nextNurseTicket} role="nurse" />
				{:else}
					<p class="text-sm text-muted-foreground py-4 text-center">
						Queue is currently clear. Use "Record Vitals" or "Register Patient" to intake a walk-in.
					</p>
				{/if}
			</div>
		{:else if focalMode === 'pharmacy'}
			<!-- PHARMACY FOCAL POINT -->
			<div
				class="px-5 py-4 border-b border-border bg-primary/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
			>
				<div class="flex items-center gap-3">
					<div
						class="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0"
					>
						<Pill class="size-5" />
					</div>
					<div>
						<h2 class="text-base font-bold text-foreground">Dispensary Counter</h2>
						<p class="text-xs text-muted-foreground">
							{pendingPrescriptions.length} pending prescription{pendingPrescriptions.length === 1
								? ''
								: 's'} ·
							{lowStockItems.length} low-stock alert{lowStockItems.length === 1 ? '' : 's'}
						</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button variant="outline" href="/pharmacy/restock" class="min-h-10 text-xs font-semibold">
						<PackagePlus class="size-3.5 mr-1.5" />
						Restock
					</Button>
					<Button href="/pharmacy/dispense" class="min-h-10 text-xs font-semibold">
						Open Dispense Queue
						<ArrowRight class="size-3.5 ml-1.5" />
					</Button>
				</div>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
				<div class="p-4">
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
						Pending Rx
					</p>
					<p class="text-2xl font-bold font-mono tabular-nums mt-1">
						{pendingPrescriptions.length}
					</p>
				</div>
				<div class="p-4">
					<p class="text-[11px] font-mono uppercase tracking-wider text-destructive">
						Low Stock Items
					</p>
					<p class="text-2xl font-bold font-mono tabular-nums text-destructive mt-1">
						{lowStockItems.length}
					</p>
				</div>
				<div class="p-4">
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
						Tracked SKUs
					</p>
					<p class="text-2xl font-bold font-mono tabular-nums mt-1">{pharmacyStore.items.length}</p>
				</div>
			</div>
		{:else if focalMode === 'reception'}
			<!-- RECEPTIONIST FOCAL POINT -->
			<div
				class="px-5 py-4 border-b border-border bg-primary/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
			>
				<div class="flex items-center gap-3">
					<div
						class="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0"
					>
						<UserPlus class="size-5" />
					</div>
					<div>
						<h2 class="text-base font-bold text-foreground">Reception &amp; Intake Window</h2>
						<p class="text-xs text-muted-foreground">
							{totalWaiting} waiting across clinics · {queueStore.todayVolume} checked in today
						</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button variant="outline" href="/nurse/search" class="min-h-10 text-xs font-semibold">
						<Search class="size-3.5 mr-1.5" />
						Find Patient
					</Button>
					<Button href="/nurse/register" class="min-h-10 text-xs font-semibold">
						<UserPlus class="size-3.5 mr-1.5" />
						Register New Patient
					</Button>
				</div>
			</div>
			<div class="grid grid-cols-3 divide-x divide-border">
				<div class="p-4">
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
						General
					</p>
					<p class="text-2xl font-bold font-mono tabular-nums mt-1">{waitingGeneral}</p>
				</div>
				<div class="p-4">
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">ANC</p>
					<p class="text-2xl font-bold font-mono tabular-nums mt-1">{waitingAnc}</p>
				</div>
				<div class="p-4">
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">EPI</p>
					<p class="text-2xl font-bold font-mono tabular-nums mt-1">{waitingEpi}</p>
				</div>
			</div>
		{:else if focalMode === 'field'}
			<!-- FIELD / OUTREACH FOCAL POINT -->
			<div
				class="px-5 py-4 border-b border-border bg-primary/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
			>
				<div class="flex items-center gap-3">
					<div
						class="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0"
					>
						<MapPin class="size-5" />
					</div>
					<div>
						<h2 class="text-base font-bold text-foreground">Field &amp; Community Outreach</h2>
						<p class="text-xs text-muted-foreground">
							Offline-ready capture · {syncStore.pendingCount} pending sync
						</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button variant="outline" href="/families" class="min-h-10 text-xs font-semibold">
						<Home class="size-3.5 mr-1.5" />
						Households
					</Button>
					<Button href="/field" class="min-h-10 text-xs font-semibold">
						Open Field Mode
						<ArrowRight class="size-3.5 ml-1.5" />
					</Button>
				</div>
			</div>
		{:else}
			<!-- ADMIN / OIC / SUPERADMIN FOCAL POINT -->
			<div
				class="px-5 py-4 border-b border-border bg-primary/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
			>
				<div class="flex items-center gap-3">
					<div
						class="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0"
					>
						<BarChart3 class="size-5" />
					</div>
					<div>
						<h2 class="text-base font-bold text-foreground">
							{focalMode === 'superadmin' ? 'Platform Operations' : 'Facility Operations'}
						</h2>
						<p class="text-xs text-muted-foreground">
							{totalWaiting} waiting · {overdueReminders} overdue reminders · {lowStockItems.length} low-stock
							alerts
						</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					{#if focalMode === 'superadmin'}
						<Button href="/superadmin/phcs" class="min-h-10 text-xs font-semibold">
							Manage PHCs <ArrowRight class="size-3.5 ml-1.5" />
						</Button>
					{:else}
						<Button variant="outline" href="/admin/staff" class="min-h-10 text-xs font-semibold">
							<Users class="size-3.5 mr-1.5" /> Staff
						</Button>
						<Button href="/admin/reports" class="min-h-10 text-xs font-semibold">
							Reports <ArrowRight class="size-3.5 ml-1.5" />
						</Button>
					{/if}
				</div>
			</div>
		{/if}
	</section>

	<!-- ── All Clinical & Operational Stations (Role-Ordered Grid) ── -->
	<section class="space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<!-- Category Filter Chips -->
			<div class="flex flex-wrap gap-1.5">
				<button
					class="rounded-full border px-3 py-1 text-xs font-medium transition-colors min-h-8 {activeCategory ===
					'all'
						? 'bg-primary text-primary-foreground border-primary'
						: 'border-border bg-card text-muted-foreground hover:text-foreground'}"
					onclick={() => (activeCategory = 'all')}
				>
					All Stations
				</button>
				{#each orderedCategories as cat (cat)}
					<button
						class="rounded-full border px-3 py-1 text-xs font-medium transition-colors min-h-8 {activeCategory ===
						cat
							? 'bg-primary text-primary-foreground border-primary'
							: 'border-border bg-card text-muted-foreground hover:text-foreground'}"
						onclick={() => (activeCategory = cat)}
					>
						{cat}
					</button>
				{/each}
			</div>

			<!-- Station Search -->
			<div class="relative w-full sm:w-64">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
				<input
					bind:value={searchQuery}
					type="search"
					placeholder="Filter stations…"
					class="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
		</div>

		{#if filteredCategories.length === 0}
			<div
				class="flex flex-col items-center justify-center py-14 text-muted-foreground border rounded-xl bg-card border-dashed space-y-2"
			>
				<ShieldCheck class="size-9 text-muted-foreground/30" />
				<p class="text-sm font-semibold text-foreground">No stations found</p>
				<p class="text-xs">Your assigned role may not have permissions for these modules.</p>
			</div>
		{:else}
			<div class="space-y-7">
				{#each filteredCategories as category (category)}
					{@const mods = filterModules(groupedModules[category] ?? [])}
					{#if mods.length > 0}
						<div class="space-y-3">
							<div class="flex items-center gap-2">
								<h3
									class="text-[11px] font-mono uppercase tracking-widest text-muted-foreground font-semibold"
								>
									{category}
								</h3>
								<span class="text-xs text-muted-foreground/60 font-mono">({mods.length})</span>
								<div class="h-px flex-1 bg-border"></div>
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
								{#each mods as mod (mod.id)}
									{@const IconComponent = ICONS[mod.iconName]}
									{@const liveStat = getLiveStat(mod.id)}

									<div
										class="group rounded-xl border border-border bg-card p-4 flex flex-col justify-between hover:border-primary/45 transition-colors"
									>
										<div class="space-y-2.5">
											<div class="flex items-start justify-between gap-2">
												<div
													class="size-9 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors"
												>
													{#if IconComponent}
														<IconComponent class="size-4.5" />
													{/if}
												</div>

												{#if liveStat}
													<Badge
														variant="outline"
														class="text-[10px] font-mono tabular-nums border-primary/35 text-primary font-semibold"
													>
														{liveStat}
													</Badge>
												{/if}
											</div>

											<div>
												<a
													href={mod.href}
													class="font-semibold text-foreground text-sm hover:text-primary transition-colors block leading-snug"
												>
													{mod.label}
												</a>
												<p class="text-xs text-muted-foreground line-clamp-1 mt-0.5">
													Operational station for {mod.label.toLowerCase()}
												</p>
											</div>
										</div>

										<div class="pt-3 mt-3 border-t border-dashed border-border">
											{#if mod.id === 'appointments' || mod.id === 'register-patient'}
												<Button
													variant="ghost"
													size="sm"
													class="h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 w-full justify-between px-2"
													href={mod.href}
												>
													<span>Register New</span>
													<UserPlus class="size-3.5" />
												</Button>
											{:else if mod.id === 'reminders'}
												<Button
													variant="ghost"
													size="sm"
													class="h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 w-full justify-between px-2"
													href={mod.href}
												>
													<span>Dispatch SMS</span>
													<Send class="size-3.5" />
												</Button>
											{:else if mod.id === 'triage-board'}
												<Button
													variant="ghost"
													size="sm"
													class="h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 w-full justify-between px-2"
													href={mod.href}
												>
													<span>Triage Patient</span>
													<Activity class="size-3.5" />
												</Button>
											{:else if mod.id === 'inventory'}
												<Button
													variant="ghost"
													size="sm"
													class="h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 w-full justify-between px-2"
													href="/pharmacy/restock"
												>
													<span>Request Restock</span>
													<PackagePlus class="size-3.5" />
												</Button>
											{:else}
												<Button
													variant="ghost"
													size="sm"
													class="h-8 text-xs font-medium text-muted-foreground hover:text-foreground w-full justify-between px-2"
													href={mod.href}
												>
													<span>Launch Station</span>
													<ArrowRight class="size-3.5" />
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
