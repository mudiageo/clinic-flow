<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import SectionHeader from '#lib/components/marketing/section-header.svelte';
	import { Check, HelpCircle, ArrowRight, ShieldCheck, Zap } from '@lucide/svelte';

	const tiers = [
		{
			name: 'Pilot Facility',
			tagline: 'For research partners & pilot PHCs',
			price: '₦0',
			period: 'during grant pilot',
			highlight: false,
			badge: 'Field Trial',
			features: [
				'Full offline clinic suite',
				'Up to 6 active staff kiosk devices',
				'Zero-config LAN auto-discovery',
				'Automated triage & vitals',
				'Local & cloud backup synchronization',
				'Direct on-site onboarding & support'
			],
			cta: 'Apply for Pilot',
			ctaHref: '/demo?plan=pilot',
			ctaVariant: 'outline' as const
		},
		{
			name: 'Public PHC Tier',
			tagline: 'Annual contract for State Primary Health Care Agencies',
			price: '₦30,000',
			period: '/ facility / month',
			highlight: true,
			badge: 'Most Common',
			features: [
				'Unlimited staff logins & kiosk tablets',
				'Full AI clinical decision support (Dr. Assist & RxBrain)',
				'Automated DHIS2 aggregated reporting',
				'Outbreak Radar surveillance alerts',
				'Automated daily encrypted cloud backup',
				'Central State/LGA administrative dashboard',
				'Dedicated technician support & SLA'
			],
			cta: 'State Procurement Contact',
			ctaHref: '/contact?inquiry=state',
			ctaVariant: 'default' as const
		},
		{
			name: 'Private & NGO Tier',
			tagline: 'For mission hospitals, private clinics, and global health donors',
			price: 'Custom',
			period: 'tailored per network',
			highlight: false,
			badge: 'Enterprise',
			features: [
				'Multi-facility centralized analytics',
				'Custom DHIS2 & national API push pipelines',
				'Custom clinical templates & formulary rules',
				'Termii automated SMS patient follow-up',
				'On-premise edge server installation option',
				'24/7 Priority support hotline'
			],
			cta: 'Request Quote',
			ctaHref: '/contact?inquiry=enterprise',
			ctaVariant: 'outline' as const
		}
	];

	const faqs = [
		{
			q: 'Do patients have to pay any fee to use ClinicFlow?',
			a: 'Never. ClinicFlow is strictly B2B/B2G software. Costs are covered at the agency or facility level; frontline patients are never charged for digital record generation or queuing.'
		},
		{
			q: 'What happens when power or internet is unavailable for weeks?',
			a: 'ClinicFlow was engineered specifically for this condition. All daily operations run from local IndexedDB and edge storage without requesting a single byte from the internet. When power and network return, changes merge deterministically.'
		},
		{
			q: 'What hardware does our clinic need to purchase?',
			a: 'Standard low-cost Android tablets (Android 8.0+, 3GB RAM recommended) and any consumer Wi-Fi router (no internet required). Doctors and administrators can also connect existing Windows laptops.'
		},
		{
			q: 'Who owns the health data recorded by ClinicFlow?',
			a: 'The healthcare facility and the managing health agency maintain 100% legal ownership of their clinical data. Mudiageo Technologies does not monetize or resell health records.'
		},
		{
			q: 'How does ClinicFlow connect with national reporting tools like DHIS2?',
			a: 'ClinicFlow automatically correlates daily encounters to compile standard NHMIS / DHIS2 monthly indicator summaries, drastically reducing manual clerical hours and reporting backlogs.'
		}
	];
</script>

<svelte:head>
	<title>Pricing & Plans — Transparent Digital Health | ClinicFlow</title>
	<meta
		name="description"
		content="Transparent pricing for Nigerian Primary Health Centres, State Health Agencies, and mission hospitals. Free during pilots."
	/>
</svelte:head>

<div class="py-16 md:py-24 space-y-24">
	<!-- Header -->
	<section class="container mx-auto px-4 md:px-8 max-w-4xl text-center space-y-6">
		<div
			class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary"
		>
			Predictable, Institutional Pricing
		</div>
		<h1 class="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
			Affordable for government agencies. Free for pilot clinics.
		</h1>
		<p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
			Designed to fit within public health budgets without recurring per-patient fees or predatory
			SaaS lock-in.
		</p>
	</section>

	<!-- Pricing Cards -->
	<section class="container mx-auto px-4 md:px-8 max-w-7xl">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			{#each tiers as tier}
				<div
					class="rounded-3xl border {tier.highlight
						? 'border-primary ring-2 ring-primary/20 shadow-xl bg-card'
						: 'border-border bg-card/60 shadow-sm'} p-8 flex flex-col justify-between relative overflow-hidden"
				>
					{#if tier.highlight}
						<div
							class="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider"
						>
							{tier.badge}
						</div>
					{/if}
					<div class="space-y-6">
						<div>
							<h3 class="text-xl font-bold text-foreground">{tier.name}</h3>
							<p class="text-sm text-muted-foreground mt-1 min-h-[40px]">{tier.tagline}</p>
						</div>

						<div class="flex items-baseline gap-2">
							<span class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground"
								>{tier.price}</span
							>
							<span class="text-sm text-muted-foreground">{tier.period}</span>
						</div>

						<div class="border-t border-border/60 pt-6 space-y-3">
							<p class="text-xs font-bold uppercase tracking-widest text-foreground">
								What’s included:
							</p>
							<ul class="space-y-2.5 text-sm text-muted-foreground">
								{#each tier.features as feat}
									<li class="flex items-start gap-2.5">
										<Check class="size-4 text-primary shrink-0 mt-0.5" />
										<span>{feat}</span>
									</li>
								{/each}
							</ul>
						</div>
					</div>

					<div class="pt-8 mt-6 border-t border-border/40">
						<Button
							href={tier.ctaHref}
							variant={tier.ctaVariant}
							class="w-full rounded-full h-12 font-bold {tier.highlight
								? 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/20'
								: ''}"
						>
							{tier.cta}
						</Button>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- FAQ Section -->
	<section class="container mx-auto px-4 md:px-8 max-w-4xl space-y-12">
		<SectionHeader
			eyebrow="Frequently Asked Questions"
			heading="Clear answers for healthcare administrators"
		/>

		<div class="space-y-6">
			{#each faqs as item}
				<div class="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-3 shadow-sm">
					<h3 class="text-lg font-bold text-foreground flex items-center gap-2.5">
						<HelpCircle class="size-5 text-primary shrink-0" />
						{item.q}
					</h3>
					<p class="text-muted-foreground leading-relaxed text-sm md:text-base pl-7">
						{item.a}
					</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Contact CTA -->
	<section class="border-t border-border/40 bg-muted/20 py-20 text-center">
		<div class="container mx-auto px-4 max-w-3xl space-y-6">
			<h2 class="text-3xl font-bold tracking-tight text-foreground">
				Need a formal procurement proposal?
			</h2>
			<p class="text-muted-foreground text-lg">
				We prepare customized implementation schedules and technical capability briefs for State
				Ministries of Health and LGA authorities.
			</p>
			<Button
				href="/contact"
				size="lg"
				class="rounded-full px-8 font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20"
			>
				Contact Institutional Sales <ArrowRight class="ml-2 size-4" />
			</Button>
		</div>
	</section>
</div>
