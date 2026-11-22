<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import AwardBadge from '#lib/components/marketing/award-badge.svelte';
	import { Mail, Check, Calendar } from '@lucide/svelte';

	let copiedColor = $state<string | null>(null);

	function copyHex(hex: string) {
		navigator.clipboard.writeText(hex);
		copiedColor = hex;
		setTimeout(() => (copiedColor = null), 2000);
	}

	const brandColors = [
		{
			name: 'Deep Emerald (Primary)',
			hex: '#107353',
			oklch: 'oklch(0.46 0.14 162)',
			usage: 'Primary brand identity, primary buttons, clinical focus'
		},
		{
			name: 'Amber Accent',
			hex: '#d97706',
			oklch: 'oklch(0.68 0.16 65)',
			usage: 'Triage warnings, priority flags, highlights'
		},
		{
			name: 'Urgent Red',
			hex: '#dc2626',
			oklch: 'oklch(0.55 0.22 27)',
			usage: 'Triage red alert, emergency cases'
		},
		{
			name: 'Clinical Safe Green',
			hex: '#16a34a',
			oklch: 'oklch(0.62 0.17 145)',
			usage: 'Completed orders, green triage, sync success'
		},
		{
			name: 'Deep Slate / Neutral',
			hex: '#0f172a',
			oklch: 'oklch(0.145 0.01 260)',
			usage: 'High-contrast typography, dark surfaces'
		}
	];

	const pressReleases = [
		{
			title:
				'ClinicFlow Selected as Top 5 Finalist at NextGen Knowledge Showcase co-hosted with Stripe',
			date: 'November 2026',
			summary:
				'ClinicFlow, the offline-first hospital management platform built by UNIBEN Computer Engineering student Mudiaga Arharhire, has been announced as a Top 5 Finalist at the prestigious NextGen Knowledge Showcase in partnership with Stripe, set for Pitch Day on November 21, 2026.',
			link: '/blog'
		},
		{
			title: 'ClinicFlow Takes 2nd Place at National 3MTT / IdentArk AI Hackathon',
			date: 'September 2026',
			summary:
				'Recognized under the theme "Build AI. Solve Local.", ClinicFlow ranked 2nd out of 20 national finalists evaluated by an independent technical jury on September 19, 2026, for its dual offline decision-support tools (Dr. Assist & RxBrain).',
			link: '/blog'
		}
	];
</script>

<svelte:head>
	<title>Press & Media Kit — ClinicFlow</title>
	<meta
		name="description"
		content="Official media kit, brand assets, founder bio, and news announcements for ClinicFlow by Mudiageo Technologies."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-20 space-y-16">
	<!-- Editorial Header -->
	<div class="border-b border-border/70 pb-8 space-y-4">
		<p class="text-xs font-mono uppercase tracking-wider text-primary">
			Newsroom & Media Resources
		</p>
		<h1 class="text-3xl md:text-5xl font-bold tracking-tight text-foreground">Press & Media Kit</h1>
		<p class="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
			Brand assets, executive bios, and official announcements for journalists, conference curators,
			and health researchers.
		</p>
	</div>

	<!-- Boilerplate -->
	<section class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
		<p class="text-xs font-mono uppercase tracking-wider text-primary">
			Official Product Boilerplate
		</p>
		<p class="text-sm md:text-base text-muted-foreground leading-relaxed">
			ClinicFlow is an offline-first clinic management and clinical decision support platform built
			for Primary Health Centres (PHCs) in Nigeria. Developed by Mudiageo Technologies, ClinicFlow
			enables healthcare workers on low-cost Android tablets to register patients, manage queues,
			record vitals, and issue prescriptions with zero internet connectivity. The system
			incorporates automated triage prioritization, local network auto-discovery (clinicflow.local),
			and AI clinical safety tools (Dr. Assist and RxBrain) that flag adverse drug interactions
			before dispensation.
		</p>
	</section>

	<!-- News & Announcements -->
	<section class="space-y-6">
		<div class="border-b border-border/70 pb-3">
			<h2 class="text-2xl font-bold text-foreground">Press Releases & Awards</h2>
		</div>

		<div class="space-y-4">
			{#each pressReleases as pr}
				<article class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
					<div class="flex items-center gap-2 text-xs font-mono text-muted-foreground">
						<Calendar class="size-3.5" />
						{pr.date}
					</div>
					<h3 class="text-xl font-bold text-foreground">{pr.title}</h3>
					<p class="text-sm text-muted-foreground leading-relaxed">{pr.summary}</p>
				</article>
			{/each}
		</div>
	</section>

	<!-- Founder Bio -->
	<section class="rounded-lg border border-border bg-muted/20 p-6 md:p-8 space-y-6">
		<div
			class="border-b border-border/70 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
		>
			<h2 class="text-xl font-bold text-foreground">Executive Bio: Mudiaga Arharhire</h2>
			<span class="text-xs font-mono uppercase text-primary tracking-wider"
				>Founder & Lead Engineer</span
			>
		</div>

		<div class="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
			<p>
				<strong class="text-foreground">Mudiaga Arharhire</strong> is a 500-level Computer Engineering
				student at the University of Benin (UNIBEN) and the founder of Mudiageo Technologies (CAC registered
				October 2021).
			</p>
			<p>
				He built every layer of ClinicFlow alone over 2.5 months — encompassing the SvelteKit 5
				frontend, Dexie IndexedDB offline store, mDNS zero-config LAN discovery, Tauri v2 Android
				packaging, and dual Gemini/WebLLM AI integration. Prior to ClinicFlow, Mudiaga was an active
				contributor to the Svelte open-source ecosystem, maintainer of open libraries like
				omni-svelte, and DevOps lead for university student initiatives.
			</p>
			<div class="flex flex-wrap gap-2 pt-2">
				<AwardBadge
					label="NextGen Knowledge Showcase"
					sublabel="Top 5 Finalist (Stripe co-host)"
					variant="gold"
				/>
				<AwardBadge
					label="3MTT × IdentArk.io"
					sublabel="2nd Place National Winner"
					variant="silver"
				/>
			</div>
		</div>
	</section>

	<!-- Brand Assets & Color Palette -->
	<section class="space-y-6">
		<div class="border-b border-border/70 pb-3">
			<h2 class="text-2xl font-bold text-foreground">Brand Palette & Assets</h2>
			<p class="text-xs text-muted-foreground mt-1">
				Click any color swatch to copy its hexadecimal code.
			</p>
		</div>

		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
			{#each brandColors as color}
				<button
					type="button"
					onclick={() => copyHex(color.hex)}
					class="p-4 rounded-lg border border-border bg-card text-left space-y-2 hover:border-primary/50 transition-colors group cursor-pointer"
				>
					<div
						class="w-full h-12 rounded-md border border-black/10 flex items-center justify-center font-mono text-xs font-bold transition-transform group-hover:scale-[1.02]"
						style="background-color: {color.hex}; color: #ffffff;"
					>
						{#if copiedColor === color.hex}
							<span
								class="flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white"
							>
								<Check class="size-3" /> Copied
							</span>
						{:else}
							<span>{color.hex}</span>
						{/if}
					</div>
					<div>
						<p class="font-bold text-xs text-foreground">{color.name}</p>
						<p class="text-[10px] text-muted-foreground leading-tight mt-0.5">{color.usage}</p>
					</div>
				</button>
			{/each}
		</div>
	</section>

	<!-- Press Contact -->
	<section class="rounded-lg border border-border bg-muted/20 p-6 md:p-8 space-y-4">
		<h3 class="text-lg font-bold text-foreground">Media & Interview Inquiries</h3>
		<p class="text-sm text-muted-foreground max-w-md leading-relaxed">
			For interview requests, high-resolution product photography, or commentary on primary
			healthcare digitization in Nigeria:
		</p>
		<div>
			<Button
				href="mailto:press@mudiageotech.com"
				class="rounded-md px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
			>
				<Mail class="mr-2 size-4" /> press@mudiageotech.com
			</Button>
		</div>
	</section>
</div>
