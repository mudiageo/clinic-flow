<script lang="ts">
	import { getCurrentSession } from '#lib/remote/auth.remote.ts';
	import { syncStore } from '#lib/state/sync.svelte.ts';
	import { settingsStore } from '#lib/state/settings.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import { queueStore } from '#lib/state/queue.svelte.ts';
	import { reminderStore } from '#lib/state/reminders.svelte.ts';
	import { pharmacyStore } from '#lib/state/pharmacy.svelte.ts';
	import { announcementStore } from '#lib/state/announcements.svelte.ts';
	import { Skeleton } from '#lib/components/ui/skeleton/index.ts';
	import { ModeWatcher } from 'mode-watcher';
	import { setContext, onMount, type Component } from 'svelte';

	import { goto } from '$app/navigation';
	import { browser } from '$app/env';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	import * as Sidebar from '#lib/components/ui/sidebar/index.ts';
	import AppSidebar from '#lib/components/app-sidebar.svelte';
	import AnnouncementBanner from '#lib/components/announcement-banner.svelte';
	import BottomNav, { type BottomNavItem } from '#lib/components/bottom-nav.svelte';
	import { DASHBOARD_MODULES } from '#lib/config/dashboard-modules.ts';
	import type { NavGroup } from '#lib/components/app-sidebar.svelte';

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
		Pin,
		LayoutDashboard,
		Database,
		Building2,
		Globe2,
		Megaphone,
		Rocket,
		Server
	} from '@lucide/svelte';

	let { children } = $props();

	// Routes that provide their own padding (nested settings layout, standalone
	// print view) opt out of the shared app-shell padding applied around children.
	const SELF_PADDED_ROUTES = ['/settings', '/doctor/referral/print'];
	const isSelfPadded = $derived(
		SELF_PADDED_ROUTES.some((route) => {
			const routeId = page.route.id;
			return routeId === route || routeId?.startsWith(`${route}/`) === true;
		})
	);

	setContext('session', {
		get user() {
			return sessionStore.user;
		},
		get role() {
			return sessionStore.role;
		},
		get phcId() {
			return sessionStore.phcId;
		},
		get staffId() {
			return sessionStore.staffId;
		},
		get permissions() {
			return sessionStore.permissions;
		}
	});

	async function loadSessionData() {
		try {
			const data = await getCurrentSession();
			if (browser && data?.user) {
				localStorage.setItem('clinicflow_offline_session', JSON.stringify(data));
			}
			return data;
		} catch (error) {
			console.error('Failed to fetch session (offline):', error);
			if (browser) {
				const cached = localStorage.getItem('clinicflow_offline_session');
				if (cached) return JSON.parse(cached);
				goto(resolve('/login'));
			}
			return null;
		}
	}

	const sessionData = await loadSessionData();

	if (sessionData) {
		sessionStore.init(sessionData);
		if (browser && sessionStore.phcId) {
			// Without this the sync store never pushes or pulls anything.
			syncStore.setPhcId(sessionStore.phcId);
		}
	}

	if (browser && !sessionData?.user) {
		goto(resolve('/login'));
	}

	onMount(() => {
		void settingsStore.fetchFromServer();
		if (sessionStore.user?.id) void announcementStore.connect(sessionStore.user.id);
		if (sessionStore.phcId) syncStore.connect(sessionStore.phcId);

		return () => {
			announcementStore.disconnect();
			syncStore.disconnect();
		};
	});

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
		Database,
		Building2,
		Globe2,
		Megaphone,
		Rocket,
		Server
	};

	// ── DYNAMIC SIDEBAR & BOTTOM NAV ──
	const visibleModules = $derived(DASHBOARD_MODULES.filter((m) => sessionStore.can(m.permission)));

	const navGroups = $derived.by(() => {
		const groups: Record<string, NavGroup> = {};

		groups['Overview'] = {
			label: 'Overview',
			items: [
				{
					href: '/dashboard',
					label: 'Dashboard',
					icon: LayoutDashboard
				}
			]
		};

		for (const mod of visibleModules) {
			if (!groups[mod.category]) {
				groups[mod.category] = { label: mod.category, items: [] };
			}

			let badge = 0;
			if (mod.id === 'triage-board') badge = queueStore.generalQueue.length;
			if (mod.id === 'anc-queue') badge = queueStore.ancQueue.length;
			if (mod.id === 'epi-queue') badge = queueStore.epiQueue.length;
			if (mod.id === 'reminders') badge = reminderStore.pendingReminders?.length ?? 0;
			if (mod.id === 'inventory')
				badge = pharmacyStore.items.filter((i) => i.currentStock <= i.lowStockThreshold).length;

			groups[mod.category].items.push({
				href: mod.href,
				label: mod.label,
				icon: ICONS[mod.iconName] ?? Home,
				badge
			});
		}

		return Object.values(groups);
	});

	const ROLE_PRIORITY_MODULES: Record<string, string[]> = {
		receptionist: ['register-patient', 'search-patient', 'appointments', 'triage-board'],
		nurse: ['triage-board', 'vitals-station', 'register-patient', 'reminders'],
		nurse_midwife: ['anc-clinics', 'maternity-ward', 'immunization', 'triage-board'],
		doctor: ['doctor-queue', 'patient-records', 'lab-requests', 'appointments'],
		pharmacy: ['dispense', 'inventory', 'restock', 'pharmacy-reports'],
		chew: ['field-mode', 'outreach-log', 'triage-board', 'register-patient'],
		jchew: ['field-mode', 'outreach-log', 'register-patient'],
		cho: ['triage-board', 'outreach-log', 'reports', 'staff-management'],
		eho: ['outbreak-radar', 'idsr-report', 'field-mode', 'reports'],
		admin: ['reports', 'staff-management', 'phc-settings', 'appointments'],
		oic: ['reports', 'staff-management', 'phc-settings', 'appointments'],
		superadmin: ['global-phcs', 'system-health', 'global-billing', 'ota-releases']
	};

	const bottomNavItems = $derived.by(() => {
		const items: BottomNavItem[] = [];
		items.push({
			href: '/dashboard',
			label: 'Home',
			icon: LayoutDashboard
		});

		const role = sessionStore.role ?? 'staff';
		const priorities = ROLE_PRIORITY_MODULES[role] ?? [];

		// 1. Extract priority modules the user actually has permission to see
		let selectedMods = priorities
			.map((id) => visibleModules.find((m) => m.id === id))
			.filter(Boolean) as typeof visibleModules;

		// 2. Backfill with other visible modules if we don't have 4 yet
		if (selectedMods.length < 4) {
			const backfill = visibleModules.filter((m) => !selectedMods.includes(m));
			selectedMods = [...selectedMods, ...backfill].slice(0, 4);
		}

		for (const mod of selectedMods) {
			let badge = 0;
			if (mod.id === 'triage-board') badge = queueStore.generalQueue.length;
			if (mod.id === 'anc-queue') badge = queueStore.ancQueue.length;
			if (mod.id === 'epi-queue') badge = queueStore.epiQueue.length;
			if (mod.id === 'reminders') badge = reminderStore.pendingReminders?.length ?? 0;
			if (mod.id === 'inventory')
				badge = pharmacyStore.items.filter((i) => i.currentStock <= i.lowStockThreshold).length;

			items.push({
				href: mod.href,
				label: mod.label,
				icon: ICONS[mod.iconName] ?? Home,
				badge,
				badgeVariant: badge > 0 ? 'destructive' : 'default'
			});
		}
		return items;
	});

	const userName = $derived(sessionStore.user?.name ?? 'Staff');
	const userInitials = $derived(userName.substring(0, 2).toUpperCase());
	const roleName = $derived(sessionStore.role ?? 'staff');
</script>

<ModeWatcher />

{#if sessionData?.user}
	<Sidebar.Provider>
		<AppSidebar {navGroups} role={roleName} {userName} {userInitials} />

		<Sidebar.Inset class="flex flex-col flex-1 h-screen overflow-hidden">
			<header
				class="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-6 lg:h-[60px] md:hidden"
			>
				<Sidebar.Trigger />
				<h1 class="font-bold">ClinicFlow</h1>
			</header>

			<AnnouncementBanner />

			<main class="flex-1 overflow-y-auto bg-muted/10 pb-16 md:pb-0">
				<!-- Opt-out routes supply their own spacing; everyone else inherits the shell padding. -->
				{#if isSelfPadded}
					{@render children()}
				{:else}
					<div class="px-4 py-6 md:px-6 print:p-0">
						{@render children()}
					</div>
				{/if}
			</main>

			<BottomNav items={bottomNavItems} />
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
