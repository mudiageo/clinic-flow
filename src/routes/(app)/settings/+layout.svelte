<script lang="ts">
	import { ArrowLeft, User, Shield, Bell } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { page } from '$app/stores';

	let { children } = $props();

	const navItems = [
		{ href: '/settings', label: 'Profile', icon: User },
		{ href: '/settings/security', label: 'Security', icon: Shield },
		{ href: '/settings/notifications', label: 'Notifications', icon: Bell }
	];
	
	const currentPath = $derived($page.url.pathname);
</script>

<svelte:head>
	<title>Account Settings — ClinicFlow</title>
</svelte:head>

<div class="min-h-screen bg-background/50 flex flex-col">
	<!-- Top Navigation for settings (acting as a standalone view) -->
	<header class="h-14 border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-40 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<!-- Generic back button that goes to the dashboard based on role -->
			<Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground" onclick={() => window.history.back()}>
				<ArrowLeft class="size-4" />
			</Button>
			<h1 class="font-bold text-foreground">Account Settings</h1>
		</div>
	</header>

	<div class="flex-1 flex flex-col md:flex-row container max-w-6xl mx-auto py-6 md:py-10 px-4 md:px-6 gap-6 md:gap-10">
		<!-- Sidebar Navigation -->
		<aside class="md:w-64 shrink-0">
			<nav class="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
				{#each navItems as item}
					{@const isActive = currentPath === item.href}
					<a href={item.href} class="flex-1 md:flex-none">
						<div class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors {isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}">
							<item.icon class="size-4 {isActive ? 'text-primary' : 'text-muted-foreground'}" />
							<span class="text-sm">{item.label}</span>
						</div>
					</a>
				{/each}
			</nav>
		</aside>
		
		<!-- Main Content Area -->
		<main class="flex-1 min-w-0 max-w-3xl animate-fade-in">
			{@render children()}
		</main>
	</div>
</div>
