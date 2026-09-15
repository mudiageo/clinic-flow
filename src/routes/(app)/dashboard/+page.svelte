<script lang="ts">
	import { sessionStore } from '$lib/state/session.svelte';
	import { queueStore } from '$lib/state/queue.svelte';
	import { reminderStore } from '$lib/state/reminders.svelte';
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import { DASHBOARD_MODULES, type DashboardModule } from '$lib/config/dashboard-modules';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		UserPlus, Search, FolderOpen, Home, ClipboardList, Baby, Activity,
		Stethoscope, FlaskConical, Microscope, HeartHandshake, Heart, Waves,
		Syringe, Pill, Package, Thermometer, PackagePlus, CalendarDays, Bell,
		MapPin, Users, BarChart3, Download, FileText, ShieldCheck, Settings,
		Monitor, Sliders, CreditCard, MessageSquare, Wifi, FileSearch, Radar,
		ArrowRight, HeartPulse, Pin
	} from '@lucide/svelte';

	// Map icon names to icon components
	const ICONS: Record<string, any> = {
		UserPlus, Search, FolderOpen, Home, ClipboardList, Baby, Activity,
		Stethoscope, FlaskConical, Microscope, HeartHandshake, Heart, Waves,
		Syringe, Pill, Package, Thermometer, PackagePlus, CalendarDays, Bell,
		MapPin, Users, BarChart3, Download, FileText, ShieldCheck, Settings,
		Monitor, Sliders, CreditCard, MessageSquare, Wifi, FileSearch, Radar
	};

	// Group modules by category, filtered to only visible ones
	const visibleModules = $derived(
		DASHBOARD_MODULES.filter(m => sessionStore.can(m.permission))
	);

	const groupedModules = $derived(() => {
		const groups: Record<string, DashboardModule[]> = {};
		for (const mod of visibleModules) {
			if (!groups[mod.category]) groups[mod.category] = [];
			groups[mod.category].push(mod);
		}
		return groups;
	});

	// Live stats for widgets
	const waitingGeneral = $derived(queueStore.generalQueue.length);
	const waitingAnc = $derived(queueStore.ancQueue.length);
	const waitingEpi = $derived(queueStore.epiQueue.length);
	const redPatients = $derived(queueStore.sortedQueue.filter((t: any) => t.triageLevel === 'red').length);
	const overdueReminders = $derived(reminderStore.overdue?.length ?? 0);
	const lowStock = $derived(pharmacyStore.items.filter((i: any) => i.quantity <= (i.reorderLevel ?? 5)).length);

	// Per-module live stats
	function getLiveStat(moduleId: string): string | null {
		switch (moduleId) {
			case 'triage-board': return waitingGeneral > 0 ? `${waitingGeneral} waiting${redPatients > 0 ? ` · ${redPatients} 🔴` : ''}` : null;
			case 'anc-queue': return waitingAnc > 0 ? `${waitingAnc} waiting` : null;
			case 'epi-queue': return waitingEpi > 0 ? `${waitingEpi} waiting` : null;
			case 'doctor-queue': return (waitingGeneral + waitingAnc) > 0 ? `${waitingGeneral + waitingAnc} to see` : null;
			case 'reminders': return overdueReminders > 0 ? `${overdueReminders} overdue` : null;
			case 'inventory': return lowStock > 0 ? `${lowStock} low stock` : null;
			default: return null;
		}
	}

	// Category order for display
	const CATEGORY_ORDER = [
		'Queue & Triage',
		'Patient Care',
		'Clinical',
		'Maternal Health',
		'Pharmacy',
		'Field & Community',
		'Appointments',
		'Analytics & Reporting',
		'Administration'
	];

	const orderedCategories = $derived(
		CATEGORY_ORDER.filter(cat => groupedModules()[cat]?.length)
	);

	// Category colour accents
	const CATEGORY_COLORS: Record<string, string> = {
		'Queue & Triage': 'text-blue-600 bg-blue-50 border-blue-100',
		'Patient Care': 'text-emerald-600 bg-emerald-50 border-emerald-100',
		'Clinical': 'text-violet-600 bg-violet-50 border-violet-100',
		'Maternal Health': 'text-pink-600 bg-pink-50 border-pink-100',
		'Pharmacy': 'text-amber-600 bg-amberald-50 border-amber-100',
		'Field & Community': 'text-teal-600 bg-teal-50 border-teal-100',
		'Appointments': 'text-indigo-600 bg-indigo-50 border-indigo-100',
		'Analytics & Reporting': 'text-cyan-600 bg-cyan-50 border-cyan-100',
		'Administration': 'text-slate-600 bg-slate-50 border-slate-100',
	};

	const ROLE_LABELS: Record<string, string> = {
		nurse: 'Nurse', nurse_midwife: 'Nurse/Midwife', doctor: 'Doctor',
		chew: 'CHEW', jchew: 'JCHEW', cho: 'CHO', oic: 'Officer in Charge',
		admin: 'Administrator', pharmacy: 'Pharmacy', eho: 'Env. Health Officer',
		superadmin: 'Super Admin', receptionist: 'Receptionist'
	};
</script>

<svelte:head>
	<title>Dashboard — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
		<div class="flex items-center gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<HeartPulse class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">
					Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {sessionStore.user?.name?.split(' ')[0] ?? 'Staff'} 👋
				</h1>
				<p class="text-muted-foreground text-sm mt-0.5 flex items-center gap-2">
					<Badge variant="outline" class="text-[10px] uppercase font-semibold tracking-wider">
						{ROLE_LABELS[sessionStore.role ?? ''] ?? sessionStore.role}
					</Badge>
					<span>·</span>
					<span>{new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span>
				</p>
			</div>
		</div>
	</div>

	{#if visibleModules.length === 0}
		<div class="flex flex-col items-center justify-center py-24 text-muted-foreground border rounded-2xl bg-card border-dashed">
			<ShieldCheck class="size-12 text-muted-foreground/30 mb-4" />
			<p class="text-lg font-semibold text-foreground">No modules assigned</p>
			<p class="text-sm mt-1">Ask your administrator to configure your permissions.</p>
		</div>
	{:else}
		<!-- Modules by Category -->
		{#each orderedCategories as category}
			{@const mods = groupedModules()[category]}
			<section class="space-y-3">
				<h2 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
					<span class="h-px flex-1 bg-border/60"></span>
					{category}
					<span class="h-px flex-1 bg-border/60"></span>
				</h2>

				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
					{#each mods as mod}
						{@const IconComponent = ICONS[mod.iconName]}
						{@const liveStat = getLiveStat(mod.id)}
						{@const colorClass = CATEGORY_COLORS[category] ?? 'text-primary bg-primary/10 border-primary/10'}

						<a
							href={mod.href}
							class="group relative flex flex-col gap-3 p-4 rounded-xl border bg-card hover:bg-accent/30 hover:border-accent transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
						>
							<div class="flex items-start justify-between">
								<div class="p-2 rounded-lg border {colorClass} transition-colors">
									{#if IconComponent}
										<IconComponent class="size-4" />
									{/if}
								</div>
								<ArrowRight class="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors mt-1" />
							</div>

							<div class="space-y-0.5">
								<p class="text-sm font-semibold text-foreground leading-tight">{mod.label}</p>
								{#if liveStat}
									<p class="text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 inline-block">{liveStat}</p>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>
