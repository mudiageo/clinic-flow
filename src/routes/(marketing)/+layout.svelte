<script lang="ts">
	import { Button } from '#lib/components/ui/button';
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

<div class="min-h-screen bg-background flex flex-col font-sans">
	<!-- ═══ HEADER ═══ -->
	<header
		class="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full"
	>
		<div class="container flex h-16 items-center justify-between mx-auto px-4 md:px-8 max-w-7xl">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2 font-extrabold text-lg hover:text-primary transition-colors shrink-0">
				<HeartPulse class="size-6 text-primary" />
				<span class="tracking-tight">ClinicFlow</span>
			</a>

			<!-- Desktop Nav -->
			<nav class="hidden lg:flex items-center gap-1 text-sm font-medium">
				{#each navLinks as link}
					{#if link.children}
						<!-- Dropdown -->
						<div class="relative group">
							<button
								class="flex items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
							>
								{link.label}
								<ChevronDown class="size-3.5 transition-transform group-hover:rotate-180" />
							</button>
							<div
								class="absolute top-full left-0 mt-1 w-52 rounded-xl border border-border bg-popover shadow-lg p-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 translate-y-1 group-hover:translate-y-0"
							>
								{#each link.children as child}
									<a
										href={child.href}
										class="flex items-center px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
									>
										{child.label}
									</a>
								{/each}
							</div>
						</div>
					{:else}
						<a
							href={link.href}
							class="px-3 py-2 rounded-lg transition-colors {isActive(link.href)
								? 'text-foreground font-semibold bg-muted'
								: 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
						>
							{link.label}
						</a>
					{/if}
				{/each}
			</nav>

			<!-- Desktop CTAs -->
			<div class="hidden lg:flex items-center gap-3">
				<Button
					variant="ghost"
					href="/login"
					class="text-sm font-semibold text-muted-foreground hover:text-foreground"
				>
					Sign In
				</Button>
				<Button
					href="/demo"
					variant="outline"
					class="text-sm font-semibold rounded-full px-5"
				>
					Request Demo
				</Button>
				<Button
					href="/welcome"
					class="bg-primary text-primary-foreground hover:bg-primary/90 btn-press rounded-full px-6 font-bold shadow-md shadow-primary/20"
				>
					Get Started
				</Button>
			</div>

			<!-- Mobile hamburger -->
			<button
				class="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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

		<!-- Mobile Drawer -->
		{#if mobileOpen}
			<div
				class="lg:hidden border-t border-border/40 bg-background/98 backdrop-blur animate-in slide-in-from-top-2 duration-200"
			>
				<div class="container mx-auto px-4 py-4 max-w-7xl space-y-1">
					{#each navLinks as link}
						{#if link.children}
							<div class="py-1">
								<p class="px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
									{link.label}
								</p>
								{#each link.children as child}
									<a
										href={child.href}
										class="flex items-center px-5 py-2.5 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
										onclick={() => (mobileOpen = false)}
									>
										{child.label}
									</a>
								{/each}
							</div>
						{:else}
							<a
								href={link.href}
								class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {isActive(
									link.href
								)
									? 'text-foreground bg-muted'
									: 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
								onclick={() => (mobileOpen = false)}
							>
								{link.label}
							</a>
						{/if}
					{/each}

					<div class="pt-4 border-t border-border/40 flex flex-col gap-2">
						<Button href="/demo" variant="outline" class="w-full font-semibold rounded-full">
							Request Demo
						</Button>
						<Button
							href="/welcome"
							class="w-full bg-primary text-primary-foreground font-bold rounded-full shadow-md shadow-primary/20"
						>
							Get Started
						</Button>
						<Button href="/login" variant="ghost" class="w-full font-medium text-muted-foreground">
							Sign In
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
	<footer class="border-t border-border/40 bg-muted/20 mt-auto">
		<!-- Main footer grid -->
		<div class="container mx-auto px-4 md:px-8 max-w-7xl py-14 md:py-16">
			<div class="grid grid-cols-2 md:grid-cols-5 gap-10">
				<!-- Brand column -->
				<div class="col-span-2 md:col-span-1 space-y-4">
					<a href="/" class="flex items-center gap-2 font-extrabold text-base hover:text-primary transition-colors">
						<HeartPulse class="size-5 text-primary" />
						<span>ClinicFlow</span>
					</a>
					<p class="text-sm text-muted-foreground leading-relaxed">
						Offline-first clinic management for Nigeria's Primary Health Centres.
					</p>
					<p class="text-xs text-muted-foreground">
						A product of<br />
						<a
							href="https://mudiageotech.com"
							target="_blank"
							rel="noopener"
							class="font-semibold text-foreground hover:text-primary transition-colors"
						>
							Mudiageo Technologies
						</a>
					</p>
				</div>

				<!-- Product -->
				<div class="space-y-3">
					<h4 class="text-xs font-bold uppercase tracking-widest text-foreground">Product</h4>
					<ul class="space-y-2.5">
						{#each footerProduct as link}
							<li>
								<a href={link.href} class="text-sm text-muted-foreground hover:text-foreground transition-colors">
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Company -->
				<div class="space-y-3">
					<h4 class="text-xs font-bold uppercase tracking-widest text-foreground">Company</h4>
					<ul class="space-y-2.5">
						{#each footerCompany as link}
							<li>
								<a href={link.href} class="text-sm text-muted-foreground hover:text-foreground transition-colors">
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Support -->
				<div class="space-y-3">
					<h4 class="text-xs font-bold uppercase tracking-widest text-foreground">Support</h4>
					<ul class="space-y-2.5">
						{#each footerSupport as link}
							<li>
								<a href={link.href} class="text-sm text-muted-foreground hover:text-foreground transition-colors">
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Legal -->
				<div class="space-y-3">
					<h4 class="text-xs font-bold uppercase tracking-widest text-foreground">Legal</h4>
					<ul class="space-y-2.5">
						{#each footerLegal as link}
							<li>
								<a href={link.href} class="text-sm text-muted-foreground hover:text-foreground transition-colors">
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>

		<!-- Bottom bar -->
		<div class="border-t border-border/40 py-5">
			<div
				class="container mx-auto px-4 md:px-8 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground"
			>
				<p>© {new Date().getFullYear()} Mudiageo Technologies. All rights reserved.</p>
				<div class="flex items-center gap-4">
					<span>🇳🇬 Built in Nigeria</span>
					<a href="https://github.com/mudiageo/clinic-flow" target="_blank" rel="noopener" class="hover:text-foreground transition-colors">
						GitHub
					</a>
					<a href="/sitemap.xml" class="hover:text-foreground transition-colors">Sitemap</a>
				</div>
			</div>
		</div>
	</footer>
</div>
