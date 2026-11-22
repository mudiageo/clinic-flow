<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import { GitBranch, ExternalLink } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Open Source & Community — ClinicFlow</title>
	<meta
		name="description"
		content="ClinicFlow is developed openly on GitHub. Discover our stack, architecture, and developer contribution guidelines."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-20 space-y-16">
	<!-- Editorial Header -->
	<div class="border-b border-border/70 pb-8 space-y-4">
		<p class="text-xs font-mono uppercase tracking-wider text-primary">Community & Transparency</p>
		<h1 class="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
			Built in the open.
		</h1>
		<p class="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
			We believe core public health infrastructure must be transparent, auditable, and extensible by
			African software developers.
		</p>
		<div class="pt-2">
			<Button
				href="https://github.com/mudiageo/clinic-flow"
				target="_blank"
				rel="noopener"
				size="lg"
				class="rounded-md px-6 font-semibold bg-foreground text-background hover:bg-foreground/90"
			>
				<GitBranch class="mr-2 size-4" /> View on GitHub
			</Button>
		</div>
	</div>

	<!-- Stack Architecture -->
	<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-6">
		<div class="space-y-1">
			<p class="text-xs font-mono uppercase tracking-wider text-primary">Engineering Foundations</p>
			<h2 class="text-2xl font-bold text-foreground">The Modern Local-First Tech Stack</h2>
		</div>
		<p class="text-muted-foreground text-sm md:text-base leading-relaxed">
			ClinicFlow leverages cutting-edge web and edge capabilities to achieve deterministic
			performance without cloud dependencies:
		</p>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
			<div class="p-4 rounded-md border border-border bg-muted/20 space-y-1">
				<p class="font-bold text-sm text-foreground">SvelteKit 5 + Svelte 5 Runes</p>
				<p class="text-xs text-muted-foreground">
					Reactive class-based domain stores without boilerplate or memory leaks.
				</p>
			</div>
			<div class="p-4 rounded-md border border-border bg-muted/20 space-y-1">
				<p class="font-bold text-sm text-foreground">Dexie & IndexedDB Edge</p>
				<p class="text-xs text-muted-foreground">
					Full local CRUD data isolation guaranteeing sub-millisecond query responses.
				</p>
			</div>
			<div class="p-4 rounded-md border border-border bg-muted/20 space-y-1">
				<p class="font-bold text-sm text-foreground">Tauri v2 Kiosk Packaging</p>
				<p class="text-xs text-muted-foreground">
					Native lightweight Android APK and Windows binaries with zero Chromium overhead.
				</p>
			</div>
			<div class="p-4 rounded-md border border-border bg-muted/20 space-y-1">
				<p class="font-bold text-sm text-foreground">Drizzle ORM & PostgreSQL</p>
				<p class="text-xs text-muted-foreground">
					Type-safe schema migrations and reliable multi-tenant synchronization.
				</p>
			</div>
		</div>
	</div>

	<!-- Contributions -->
	<div class="rounded-lg border border-border bg-muted/20 p-6 md:p-8 space-y-5">
		<h3 class="text-lg font-bold text-foreground">Contributing & Deploying</h3>
		<p class="text-sm text-muted-foreground leading-relaxed max-w-2xl">
			Whether you want to build custom DHIS2 adapters, localize clinical language models, or test
			hardware compatibility, we welcome community pull requests and issue reports.
		</p>

		<div class="flex flex-wrap gap-4">
			<Button
				href="https://github.com/mudiageo/clinic-flow/blob/main/README.md"
				target="_blank"
				rel="noopener"
				variant="outline"
				class="rounded-md font-medium"
			>
				Developer Setup Guide <ExternalLink class="ml-2 size-4" />
			</Button>
			<Button
				href="https://github.com/mudiageo/clinic-flow/releases"
				target="_blank"
				rel="noopener"
				variant="ghost"
				class="rounded-md font-medium"
			>
				Releases & Assets <ExternalLink class="ml-2 size-4" />
			</Button>
		</div>
	</div>
</div>
