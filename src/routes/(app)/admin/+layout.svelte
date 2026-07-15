<script lang="ts">
	import { getContext } from 'svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import BottomNav, { type BottomNavItem } from '$lib/components/bottom-nav.svelte';
	import SyncIndicator from '$lib/components/SyncIndicator.svelte';
	import { toggleMode, mode } from 'mode-watcher';
	import {
		BarChart3,
		FolderOpen,
		Users,
		CalendarDays,
		Shield,
		Activity,
		FileText,
		SlidersHorizontal,
		Bell,
		Settings,
		Sun,
		Moon,
		Monitor
	} from '@lucide/svelte';
	import type { NavGroup } from '$lib/components/app-sidebar.svelte';

	let { children } = $props();

	const session = getContext<{ user: any; role: string | null; phcId: string | null }>('session');
	const user = session?.user;
	const role = session?.role ?? 'admin';

	const navGroups: NavGroup[] = [
		{
			label: 'Overview',
			items: [
				{ href: '/admin', label: 'Dashboard', icon: BarChart3 },
				{ href: '/admin/reports', label: 'Reports', icon: FileText }
			]
		},
		{
			label: 'Clinical',
			items: [
				{ href: '/admin/patients', label: 'Patient Registry', icon: FolderOpen },
				{ href: '/admin/appointments', label: 'Appointments', icon: CalendarDays }
			]
		},
		{
			label: 'Staff',
			items: [{ href: '/admin/staff', label: 'Manage Staff', icon: Users }]
		},
		{
			label: 'Configuration',
			items: [
				{ href: '/admin/triage-rules', label: 'Triage Rules', icon: SlidersHorizontal },
				{ href: '/admin/reminders', label: 'Reminders', icon: Bell },
				{ href: '/admin/settings', label: 'PHC Settings', icon: Settings }
			]
		},
		{
			label: 'System',
			items: [{ href: '/superadmin', label: 'Makers Dashboard', icon: Shield }]
		}
	];

	const bottomNavItems: BottomNavItem[] = [
		{ href: '/admin', label: 'Overview', icon: BarChart3 },
		{ href: '/admin/patients', label: 'Patients', icon: FolderOpen },
		{ href: '/admin/appointments', label: 'Schedule', icon: CalendarDays },
		{ href: '/admin/staff', label: 'Staff', icon: Users },
		{ href: '/admin/settings', label: 'Settings', icon: Settings }
	];

	const userInitials = $derived(
		user?.name
			?.split(' ')
			.slice(0, 2)
			.map((n: string) => n[0])
			.join('')
			.toUpperCase() ?? '??'
	);
</script>

<Sidebar.Provider>
	<AppSidebar {navGroups} {role} userName={user?.name ?? 'Admin'} {userInitials} />

	<Sidebar.Inset>
		<header
			class="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-40"
		>
			<div class="flex items-center gap-3">
				<Sidebar.Trigger class="text-muted-foreground hover:text-foreground transition-colors" />
				<Separator orientation="vertical" class="h-5 hidden md:block" />
				<span class="font-bold text-foreground tracking-tight md:hidden">ClinicFlow</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="md:hidden"><SyncIndicator /></div>
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="ghost"
								size="icon"
								class="h-8 w-8 text-muted-foreground hover:text-foreground transition-all duration-200 hover:rotate-12"
								onclick={toggleMode}
								aria-label="Toggle theme"
							>
								{#if mode.current === 'dark'}<Sun class="size-4" />
								{:else if mode.current === 'light'}<Moon class="size-4" />
								{:else}<Monitor class="size-4" />{/if}
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>Toggle theme</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</div>
		</header>
		<main class="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in pb-20 md:pb-8">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>

<BottomNav items={bottomNavItems} />
