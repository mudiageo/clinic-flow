<script lang="ts">
	import { getCurrentSession } from '$lib/remote/auth.remote';
	import { syncStore } from '$lib/state/sync.svelte';
	import { settingsStore } from '$lib/state/settings.svelte';
	import { sessionStore } from '$lib/state/session.svelte';
	import { queueStore } from '$lib/state/queue.svelte';
	import { reminderStore } from '$lib/state/reminders.svelte';
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { ModeWatcher } from 'mode-watcher';
	import { setContext, onMount, onDestroy } from 'svelte';

	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import BottomNav, { type BottomNavItem } from '$lib/components/bottom-nav.svelte';
	import { DASHBOARD_MODULES } from '$lib/config/dashboard-modules';
	import type { NavGroup } from '$lib/components/app-sidebar.svelte';

	import {
		UserPlus, Search, FolderOpen, Home, ClipboardList, Baby, Activity,
		Stethoscope, FlaskConical, Microscope, HeartHandshake, Heart, Waves,
		Syringe, Pill, Package, Thermometer, PackagePlus, CalendarDays, Bell,
		MapPin, Users, BarChart3, Download, FileText, ShieldCheck, Settings,
		Monitor, Sliders, CreditCard, MessageSquare, Wifi, FileSearch, Radar,
		ArrowRight, HeartPulse, Pin, LayoutDashboard, Database,
		Building2, Globe2, Megaphone, Rocket, Server
	} from '@lucide/svelte';

	let { children } = $props();

	setContext('session', {
		get user() { return sessionStore.user; },
		get role() { return sessionStore.role; },
		get phcId() { return sessionStore.phcId; },
		get permissions() { return sessionStore.permissions; }
	});

	let sessionData: any;
	try {
		sessionData = await getCurrentSession();
		if (browser && sessionData?.user) {
			localStorage.setItem('clinicflow_offline_session', JSON.stringify(sessionData));
		}
	} catch (error) {
		console.error('Failed to fetch session (offline):', error);
		if (browser) {
			const cached = localStorage.getItem('clinicflow_offline_session');
			if (cached) {
				sessionData = JSON.parse(cached);
			} else {
				goto('/login');
			}
		}
	}

	if (sessionData) {
		sessionStore.init(sessionData);
	}

	if (browser && !sessionData?.user) {
		goto('/login');
	}

	onMount(() => {
		settingsStore.fetchFromServer();
	});

	const ICONS: Record<string, any> = {
		UserPlus, Search, FolderOpen, Home, ClipboardList, Baby, Activity,
		Stethoscope, FlaskConical, Microscope, HeartHandshake, Heart, Waves,
		Syringe, Pill, Package, Thermometer, PackagePlus, CalendarDays, Bell,
		MapPin, Users, BarChart3, Download, FileText, ShieldCheck, Settings,
		Monitor, Sliders, CreditCard, MessageSquare, Wifi, FileSearch, Radar, Database,
		Building2, Globe2, Megaphone, Rocket, Server
	};

	// ── DYNAMIC SIDEBAR & BOTTOM NAV ──
	const visibleModules = $derived(
		DASHBOARD_MODULES.filter(m => sessionStore.can(m.permission))
	);

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
			if (mod.id === 'inventory') badge = pharmacyStore.items.filter((i: any) => i.quantity <= (i.reorderLevel ?? 5)).length;

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
		nurse: ['triage-board', 'vitals-station', 'register-patient', 'reminders'],
		nurse_midwife: ['anc-clinics', 'maternity-ward', 'immunization', 'triage-board'],
		doctor: ['doctor-queue', 'patient-records', 'lab-requests', 'appointments'],
		pharmacy: ['dispense', 'inventory', 'restock', 'pharmacy-reports'],
		chew: ['field-mode', 'outreach-log', 'triage-board', 'register-patient'],
		jchew: ['field-mode', 'outreach-log', 'register-patient'],
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
			.map(id => visibleModules.find(m => m.id === id))
			.filter(Boolean) as typeof visibleModules;
			
		// 2. Backfill with other visible modules if we don't have 4 yet
		if (selectedMods.length < 4) {
			const backfill = visibleModules.filter(m => !selectedMods.includes(m));
			selectedMods = [...selectedMods, ...backfill].slice(0, 4);
		}
		
		for (const mod of selectedMods) {
			let badge = 0;
			if (mod.id === 'triage-board') badge = queueStore.generalQueue.length;
			if (mod.id === 'anc-queue') badge = queueStore.ancQueue.length;
			if (mod.id === 'epi-queue') badge = queueStore.epiQueue.length;
			if (mod.id === 'reminders') badge = reminderStore.pendingReminders?.length ?? 0;
			if (mod.id === 'inventory') badge = pharmacyStore.items.filter((i: any) => i.quantity <= (i.reorderLevel ?? 5)).length;
			
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
		<AppSidebar
			{navGroups}
			role={roleName}
			{userName}
			{userInitials}
		/>
		
		<Sidebar.Inset class="flex flex-col flex-1 h-screen overflow-hidden">
			<header class="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-6 lg:h-[60px] md:hidden">
				<Sidebar.Trigger />
				<h1 class="font-bold">ClinicFlow</h1>
			</header>
			
			<main class="flex-1 overflow-y-auto bg-muted/10 pb-16 md:pb-0">
				{@render children()}
			</main>
			
			<BottomNav items={bottomNavItems} />
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
