<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import ThemeToggle from '#lib/components/theme-toggle.svelte';
	import { HeartPulse, Menu, X, ChevronDown } from '@lucide/svelte';
	import { page } from '$app/state';

	let { children } = $props();

	let mobileOpen = $state(false);

	const navLinks = [
		{ href: '/features', label: 'Features' },
		{ href: '/pricing', label: 'Pricing' },
		{
			label: 'Solutions',
			children: [
				{ href: '/solutions/state-governments', label: 'State Governments' },
				{ href: '/solutions/ngos', label: 'NGOs & Donors' },
				{ href: '/solutions/private-clinics', label: 'Private Clinics' }
			]
		},
		{ href: '/use-cases', label: 'Use Cases' },
		{ href: '/download', label: 'Download' },
		{ href: '/support', label: 'Support' },
		{ href: '/about', label: 'About' }
	];

	const footerProduct = [
		{ href: '/features', label: 'Features' },
		{ href: '/pricing', label: 'Pricing' },
		{ href: '/download', label: 'Download' },
		{ href: '/releases', label: 'Releases' },
		{ href: '/changelog', label: 'Changelog' },
		{ href: '/roadmap', label: 'Roadmap' },
		{ href: '/system-requirements', label: 'System Requirements' }
	];

	const footerCompany = [
		{ href: '/about', label: 'About' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/use-cases', label: 'Use Cases' },
		{ href: '/partners', label: 'Partners' },
		{ href: '/press', label: 'Press' },
		{ href: '/open-source', label: 'Open Source' },
		{ href: '/contact', label: 'Contact' }
	];

	const footerSupport = [
		{ href: '/support', label: 'Support Centre' },
		{ href: '/support/getting-started', label: 'Getting Started' },
		{ href: '/support/installation', label: 'Installation Guide' },
		{ href: '/support/troubleshooting', label: 'Troubleshooting' },
		{ href: '/support/faq', label: 'FAQ' },
		{ href: '/demo', label: 'Request a Demo' }
	];

	const footerLegal = [
		{ href: '/privacy', label: 'Privacy Policy' },
		{ href: '/terms', label: 'Terms of Service' },
		{ href: '/security', label: 'Security' },
		{ href: '/cookies', label: 'Cookie Policy' }
	];

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<div
	class="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary"
>
	<!-- ═══ HEADER ═══ -->
	<header
		class="border-b border-border/60 bg-background/90 backdrop-blur-md sticky top-0 z-50 w-full"
	>
		<div class="container flex h-16 items-center justify-between mx-auto px-4 md:px-8 max-w-7xl">
			<!-- Logo -->
			<a
				href="/"
				class="flex items-center gap-2.5 font-bold text-base hover:opacity-90 transition-opacity shrink-0"
			>
				<div
					class="size-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-sm"
				>
					<HeartPulse class="size-4.5" />
				</div>
				<span class="tracking-tight font-extrabold text-lg text-foreground">ClinicFlow</span>
			</a>

			<!-- Desktop Nav -->
			<nav class="hidden lg:flex items-center gap-0.5 text-sm font-medium">
				{#each navLinks as link}
					{#if link.children}
						<!-- Dropdown -->
						<div class="relative group">
							<button
								class="flex items-center gap-1 px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors text-sm"
							>
								{link.label}
								<ChevronDown
									class="size-3.5 opacity-60 transition-transform group-hover:rotate-180"
								/>
							</button>
							<div
								class="absolute top-full left-0 mt-1 w-52 rounded-lg border border-border bg-popover shadow-xl p-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 translate-y-1 group-hover:translate-y-0"
							>
								{#each link.children as child}
									<a
										href={child.href}
										class="flex items-center px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
									>
										{child.label}
									</a>
								{/each}
							</div>
						</div>
					{:else}
						<a
							href={link.href}
							class="px-3 py-1.5 rounded-md text-sm transition-colors {isActive(link.href)
								? 'text-foreground font-semibold bg-muted/80'
								: 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}"
						>
							{link.label}
						</a>
					{/if}
				{/each}
			</nav>

			<!-- Desktop CTAs -->
			<div class="hidden lg:flex items-center gap-2.5">
				<ThemeToggle />
				<div class="h-4 w-px bg-border/80 mx-1"></div>
				<Button
					variant="ghost"
					href="/login"
					class="text-sm font-medium text-muted-foreground hover:text-foreground px-3 h-9"
				>
					Sign In
				</Button>
				<Button
					href="/welcome"
					class="bg-primary text-primary-foreground hover:bg-primary/95 rounded-md px-4 h-9 font-semibold text-sm shadow-sm transition-all"
				>
					Get Started
				</Button>
			</div>

			<!-- Mobile hamburger -->
			<div class="flex items-center gap-2 lg:hidden">
				<ThemeToggle />
				<button
					class="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
					onclick={() => (mobileOpen = !mobileOpen)}
					aria-label="Toggle menu"
				>
					{#if mobileOpen}
						<X class="size-5" />
					{:else}
						<Menu class="size-5" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile Drawer -->
		{#if mobileOpen}
			<div
				class="lg:hidden border-t border-border bg-background animate-in slide-in-from-top-2 duration-150"
			>
				<div class="container mx-auto px-4 py-4 max-w-7xl space-y-1">
					{#each navLinks as link}
						{#if link.children}
							<div class="py-1">
								<p
									class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80"
								>
									{link.label}
								</p>
								{#each link.children as child}
									<a
										href={child.href}
										class="flex items-center px-4 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
										onclick={() => (mobileOpen = false)}
									>
										{child.label}
									</a>
								{/each}
							</div>
						{:else}
							<a
								href={link.href}
								class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors {isActive(
									link.href
								)
									? 'text-foreground bg-muted font-semibold'
									: 'text-muted-foreground hover:text-foreground hover:bg-muted/70'}"
								onclick={() => (mobileOpen = false)}
							>
								{link.label}
							</a>
						{/if}
					{/each}

					<div class="pt-4 border-t border-border flex flex-col gap-2">
						<Button
							href="/welcome"
							class="w-full bg-primary text-primary-foreground font-semibold rounded-md h-10 shadow-sm"
						>
							Get Started Free
						</Button>
						<Button href="/login" variant="outline" class="w-full font-medium rounded-md h-10">
							Sign In to Station
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</header>

	<!-- ═══ MAIN ═══ -->
	<main class="flex-1 flex flex-col">
		{@render children()}
	</main>

	<!-- ═══ FOOTER ═══ -->
	<footer class="border-t border-border bg-muted/30 mt-auto">
		<!-- Main footer grid -->
		<div class="container mx-auto px-4 md:px-8 max-w-7xl py-14 md:py-16">
			<div class="grid grid-cols-2 md:grid-cols-5 gap-10">
				<!-- Brand column -->
				<div class="col-span-2 md:col-span-1 space-y-4">
					<a
						href="/"
						class="flex items-center gap-2 font-bold text-base hover:opacity-90 transition-opacity"
					>
						<div
							class="size-6 rounded bg-primary flex items-center justify-center text-primary-foreground"
						>
							<HeartPulse class="size-3.5" />
						</div>
						<span class="font-extrabold tracking-tight">ClinicFlow</span>
					</a>
					<p class="text-sm text-muted-foreground leading-relaxed">
						Offline-first clinic operating system engineered for Nigeria's Primary Health Centres.
					</p>
					<div class="pt-2">
						<span
							class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background text-xs font-medium text-muted-foreground"
						>
							<span class="size-2 rounded-full bg-primary animate-pulse"></span>
							v0.1.5 · Active Pilot
						</span>
					</div>
				</div>

				<!-- Product -->
				<div class="space-y-3">
					<h4 class="text-xs font-semibold tracking-wider text-foreground">Product</h4>
					<ul class="space-y-2">
						{#each footerProduct as link}
							<li>
								<a
									href={link.href}
									class="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Company -->
				<div class="space-y-3">
					<h4 class="text-xs font-semibold tracking-wider text-foreground">Company</h4>
					<ul class="space-y-2">
						{#each footerCompany as link}
							<li>
								<a
									href={link.href}
									class="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Support -->
				<div class="space-y-3">
					<h4 class="text-xs font-semibold tracking-wider text-foreground">Support</h4>
					<ul class="space-y-2">
						{#each footerSupport as link}
							<li>
								<a
									href={link.href}
									class="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Legal -->
				<div class="space-y-3">
					<h4 class="text-xs font-semibold tracking-wider text-foreground">Legal & Trust</h4>
					<ul class="space-y-2">
						{#each footerLegal as link}
							<li>
								<a
									href={link.href}
									class="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>

		<!-- Bottom bar -->
		<div class="border-t border-border py-6 bg-background/50">
			<div
				class="container mx-auto px-4 md:px-8 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground"
			>
				<p>
					© {new Date().getFullYear()} Mudiageo Technologies. Built for Nigerian primary healthcare.
				</p>
				<div class="flex items-center gap-5">
					<a
						href="https://github.com/mudiageo/clinic-flow"
						target="_blank"
						rel="noopener"
						class="hover:text-foreground transition-colors font-medium"
					>
						GitHub
					</a>
					<a href="/security" class="hover:text-foreground transition-colors">NDPR Compliant</a>
					<a href="/sitemap.xml" class="hover:text-foreground transition-colors">Sitemap</a>
				</div>
			</div>
		</div>
	</footer>
</div>
