<script lang="ts">
	import { sessionStore } from '$lib/state/session.svelte';
	import { queueStore } from '$lib/state/queue.svelte';
	import { reminderStore } from '$lib/state/reminders.svelte';
	import { pharmacyStore } from '$lib/state/pharmacy.svelte';
	import { DASHBOARD_MODULES } from '$lib/config/dashboard-modules';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		UserPlus, Search, FolderOpen, Home, ClipboardList, Baby, Activity,
		Stethoscope, FlaskConical, Microscope, HeartHandshake, Heart, Waves,
		Syringe, Pill, Package, Thermometer, PackagePlus, CalendarDays, Bell,
		MapPin, Users, BarChart3, Download, FileText, ShieldCheck, Settings,
		Monitor, Sliders, CreditCard, MessageSquare, Wifi, FileSearch, Radar,
		ArrowRight, HeartPulse, Building2, Globe2, Megaphone, Rocket, Server,
		AlertTriangle, Send
	} from '@lucide/svelte';

	// Map icon names to icon components
	const ICONS: Record<string, any> = {
		UserPlus, Search, FolderOpen, Home, ClipboardList, Baby, Activity,
		Stethoscope, FlaskConical, Microscope, HeartHandshake, Heart, Waves,
		Syringe, Pill, Package, Thermometer, PackagePlus, CalendarDays, Bell,
		MapPin, Users, BarChart3, Download, FileText, ShieldCheck, Settings,
		Monitor, Sliders, CreditCard, MessageSquare, Wifi, FileSearch, Radar,
		Building2, Globe2, Megaphone, Rocket, Server
	};

	// Visible navigation modules
	const visibleModules = $derived(
		DASHBOARD_MODULES.filter(m => sessionStore.can(m.permission))
	);

	// Grouping
	const groupedModules = $derived(() => {
		const groups: Record<string, typeof DASHBOARD_MODULES> = {};
		for (const mod of visibleModules) {
			if (!groups[mod.category]) groups[mod.category] = [];
			groups[mod.category].push(mod);
		}
		return groups;
	});

	const CATEGORY_ORDER = [
		'Queue & Triage', 'Patient Care', 'Clinical', 'Maternal Health',
		'Pharmacy', 'Field & Community', 'Appointments',
		'Analytics & Reporting', 'Administration', 'Platform Management'
	];
	const orderedCategories = $derived(CATEGORY_ORDER.filter(cat => groupedModules()[cat]?.length));
	const CATEGORY_COLORS: Record<string, string> = {
		'Queue & Triage': 'text-blue-600 bg-blue-50 border-blue-100',
		'Patient Care': 'text-emerald-600 bg-emerald-50 border-emerald-100',
		'Clinical': 'text-violet-600 bg-violet-50 border-violet-100',
		'Maternal Health': 'text-pink-600 bg-pink-50 border-pink-100',
		'Pharmacy': 'text-amber-600 bg-amber-50 border-amber-100',
		'Field & Community': 'text-teal-600 bg-teal-50 border-teal-100',
		'Appointments': 'text-indigo-600 bg-indigo-50 border-indigo-100',
		'Analytics & Reporting': 'text-cyan-600 bg-cyan-50 border-cyan-100',
		'Administration': 'text-slate-600 bg-slate-50 border-slate-100',
		'Platform Management': 'text-red-600 bg-red-50 border-red-100',
	};

	// Widget Data Data
	const waitingGeneral = $derived(queueStore.generalQueue.length);
	const waitingAnc = $derived(queueStore.ancQueue.length);
	const waitingEpi = $derived(queueStore.epiQueue.length);
	const overdueReminders = $derived(reminderStore.pendingReminders?.length ?? 0);
	
	const lowStockItems = $derived(pharmacyStore.items.filter((i: any) => i.quantity <= (i.reorderLevel ?? 5)));
	const redPatients = $derived(queueStore.sortedQueue.filter((t: any) => t.triageLevel === 'red'));

	function getLiveStat(moduleId: string): string | null {
		switch (moduleId) {
			case 'triage-board': return waitingGeneral > 0 ? `${waitingGeneral} waiting` : null;
			case 'anc-queue': return waitingAnc > 0 ? `${waitingAnc} waiting` : null;
			case 'epi-queue': return waitingEpi > 0 ? `${waitingEpi} waiting` : null;
			case 'doctor-queue': return (waitingGeneral + waitingAnc) > 0 ? `${waitingGeneral + waitingAnc} to see` : null;
			case 'reminders': return overdueReminders > 0 ? `${overdueReminders} overdue` : null;
			case 'inventory': return lowStockItems.length > 0 ? `${lowStockItems.length} low stock` : null;
			default: return null;
		}
	}

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

<div class="space-y-8 animate-fade-in px-4 md:px-8 pt-6">
	<!-- ── Header ── -->
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

	<!-- ── Live Dashboard Widgets ── -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
		
		<!-- Admin/OIC Analytics Widget -->
		{#if sessionStore.can('manage:phc')}
			<Card class="bg-card border shadow-sm col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 overflow-hidden relative">
				<div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
					<BarChart3 class="w-32 h-32" />
				</div>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-semibold text-muted-foreground flex items-center gap-2">
						<Activity class="size-4" /> Today's Analytics
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-3 gap-4 mt-2">
						<div class="space-y-1">
							<p class="text-3xl font-bold text-foreground">{waitingGeneral + waitingAnc + waitingEpi}</p>
							<p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Queue</p>
						</div>
						<div class="space-y-1">
							<p class="text-3xl font-bold text-emerald-600">24</p>
							<p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</p>
						</div>
						<div class="space-y-1">
							<p class="text-3xl font-bold text-blue-600">89%</p>
							<p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sync Health</p>
						</div>
					</div>
					<div class="mt-6 space-y-2">
						<div class="flex justify-between text-xs text-muted-foreground">
							<span>Clinic Capacity (Estimated)</span>
							<span>45%</span>
						</div>
						<Progress value={45} class="h-2" />
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Triage / Queue Widget -->
		{#if sessionStore.can('view:queue:general')}
			<Card class="bg-card border shadow-sm flex flex-col">
				<CardHeader class="pb-2 flex flex-row items-center justify-between">
					<CardTitle class="text-sm font-semibold text-muted-foreground flex items-center gap-2">
						<Users class="size-4" /> Active Queue
					</CardTitle>
					<Badge variant="secondary" class="text-xs">{waitingGeneral} waiting</Badge>
				</CardHeader>
				<CardContent class="flex-1 p-0">
					<ScrollArea class="h-[140px] px-6 pb-4">
						{#if queueStore.generalQueue.length === 0}
							<div class="h-full flex flex-col items-center justify-center text-muted-foreground/60 py-4">
								<ClipboardList class="size-8 mb-2" />
								<p class="text-xs">Queue is empty</p>
							</div>
						{:else}
							<div class="space-y-3 mt-2">
								{#each queueStore.generalQueue.slice(0, 3) as ticket (ticket.id)}
									<div class="flex items-center justify-between text-sm">
										<div class="flex items-center gap-2">
											<div class="size-2 rounded-full {ticket.triageLevel === 'red' ? 'bg-red-500 animate-pulse' : ticket.triageLevel === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}"></div>
											<span class="font-medium text-foreground">Patient {ticket.patientId.substring(0, 8)}</span>
										</div>
										<span class="text-xs text-muted-foreground">NO. {ticket.ticketNumber}</span>
									</div>
								{/each}
								{#if queueStore.generalQueue.length > 3}
									<p class="text-xs text-center text-muted-foreground pt-2 border-t">+ {queueStore.generalQueue.length - 3} more waiting</p>
								{/if}
							</div>
						{/if}
					</ScrollArea>
				</CardContent>
			</Card>
		{/if}

		<!-- Critical Alerts Widget (Red Triage or Low Stock) -->
		{#if sessionStore.can('manage:inventory') || sessionStore.can('view:queue:general')}
			{#if lowStockItems.length > 0 || redPatients.length > 0}
				<Card class="bg-destructive/5 border-destructive/20 shadow-sm">
					<CardHeader class="pb-2">
						<CardTitle class="text-sm font-semibold text-destructive flex items-center gap-2">
							<AlertTriangle class="size-4" /> Action Required
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3">
						{#if redPatients.length > 0}
							<div class="flex items-center justify-between bg-background rounded-lg p-3 border border-destructive/20">
								<div>
									<p class="text-sm font-bold text-destructive">{redPatients.length} Critical Patient(s)</p>
									<p class="text-xs text-muted-foreground">Require immediate attention</p>
								</div>
								<Button size="sm" variant="destructive" href="/nurse?tab=general">View</Button>
							</div>
						{/if}
						
						{#if lowStockItems.length > 0 && sessionStore.can('manage:inventory')}
							<div class="flex items-center justify-between bg-background rounded-lg p-3 border border-amber-500/20">
								<div>
									<p class="text-sm font-bold text-amber-600">{lowStockItems.length} Items Low Stock</p>
									<p class="text-xs text-muted-foreground">Inventory depletion alert</p>
								</div>
								<Button size="sm" variant="outline" class="text-amber-600 border-amber-200 hover:bg-amber-50" href="/pharmacy/restock">Restock</Button>
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}
		{/if}
	</div>

	<!-- ── Navigation Modules (Launchpad) ── -->
	{#if visibleModules.length === 0}
		<div class="flex flex-col items-center justify-center py-24 text-muted-foreground border rounded-2xl bg-card border-dashed">
			<ShieldCheck class="size-12 text-muted-foreground/30 mb-4" />
			<p class="text-lg font-semibold text-foreground">No modules assigned</p>
			<p class="text-sm mt-1">Ask your administrator to configure your permissions.</p>
		</div>
	{:else}
		{#each orderedCategories as category}
			{@const mods = groupedModules()[category]}
			<section class="space-y-4 pt-4">
				<h2 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
					<span class="h-px w-8 bg-border/60"></span>
					{category}
					<span class="h-px flex-1 bg-border/60"></span>
				</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{#each mods as mod}
						{@const IconComponent = ICONS[mod.iconName]}
						{@const liveStat = getLiveStat(mod.id)}
						{@const colorClass = CATEGORY_COLORS[category] ?? 'text-primary bg-primary/10 border-primary/10'}

						<div class="group flex flex-col rounded-xl border bg-card hover:border-accent hover:shadow-md transition-all duration-200 overflow-hidden">
							<!-- Main Tile Link -->
							<a href={mod.href} class="flex-1 p-5 flex flex-col gap-4">
								<div class="flex items-start justify-between">
									<div class="p-2.5 rounded-xl border {colorClass} transition-colors">
										{#if IconComponent}
											<IconComponent class="size-5" />
										{/if}
									</div>
									{#if liveStat}
										<Badge variant="secondary" class="bg-accent/50 text-xs font-medium border-0">{liveStat}</Badge>
									{/if}
								</div>
								
								<div class="space-y-1">
									<p class="font-semibold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">{mod.label}</p>
									<p class="text-xs text-muted-foreground line-clamp-1">Access {mod.label.toLowerCase()} module</p>
								</div>
							</a>

							<!-- Inline Action Footer -->
							<div class="px-5 py-3 border-t bg-muted/20 flex items-center justify-between">
								{#if mod.id === 'appointments' || mod.id === 'register-patient'}
									<Button variant="ghost" size="sm" class="h-8 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 w-full justify-between" href={mod.href}>
										Register New <UserPlus class="size-3.5 ml-2" />
									</Button>
								{:else if mod.id === 'reminders'}
									<Button variant="ghost" size="sm" class="h-8 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 w-full justify-between" href={mod.href}>
										Send SMS <Send class="size-3.5 ml-2" />
									</Button>
								{:else if mod.id === 'triage-board'}
									<Button variant="ghost" size="sm" class="h-8 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 w-full justify-between" href={mod.href}>
										Triage Patient <Activity class="size-3.5 ml-2" />
									</Button>
								{:else if mod.id === 'inventory'}
									<Button variant="ghost" size="sm" class="h-8 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 w-full justify-between" href="/pharmacy/restock">
										Request Restock <PackagePlus class="size-3.5 ml-2" />
									</Button>
								{:else}
									<Button variant="ghost" size="sm" class="h-8 text-xs font-medium text-muted-foreground hover:text-foreground w-full justify-between" href={mod.href}>
										Open Module <ArrowRight class="size-3.5 ml-2" />
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>
