<script lang="ts">
	import { ArrowLeft, User, Shield, Bell } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { page } from '$app/state';

	let { children } = $props();

	const navItems = [
		{ href: '/settings', label: 'Profile', icon: User },
		{ href: '/settings/security', label: 'Security', icon: Shield },
		{ href: '/settings/notifications', label: 'Notifications', icon: Bell }
	];

	const currentPath = $derived(page.url.pathname);
</script>

<svelte:head>
	<title>Account Settings — ClinicFlow</title>
</svelte:head>

<div class="min-h-screen bg-background flex flex-col">
	<!-- Settings Sub-header -->
	<header
		class="h-14 border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-40 flex items-center gap-3"
	>
		<Button
			variant="ghost"
			size="icon"
			class="h-9 w-9 text-muted-foreground hover:text-foreground"
			onclick={() => window.history.back()}
			aria-label="Go back"
		>
			<ArrowLeft class="size-4" />
		</Button>
		<h1 class="font-bold text-foreground">Account Settings</h1>
	</header>

	<div
		class="flex-1 flex flex-col md:flex-row container max-w-6xl mx-auto py-6 md:py-10 px-4 md:px-6 gap-6 md:gap-10"
	>
		<!-- Settings Navigation -->
		<aside class="md:w-60 shrink-0">
			<nav class="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0">
				{#each navItems as item (item.href)}
					{@const isActive = currentPath === item.href}
					<a
						href={item.href}
						class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap min-h-11 {isActive
							? 'bg-primary text-primary-foreground font-semibold'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					>
						<item.icon class="size-4 shrink-0" />
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>
		</aside>

		<!-- Main Content -->
		<main class="flex-1 min-w-0 max-w-3xl">
			{@render children()}
		</main>
	</div>
</div>
