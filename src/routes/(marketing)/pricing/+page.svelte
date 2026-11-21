<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import { Check, HelpCircle, ArrowRight, ShieldCheck } from '@lucide/svelte';

	const tiers = [
		{
			name: 'Pilot Facility',
			tagline: 'For research partners, grant programmes, and approved trial PHCs.',
			price: '₦0',
			period: 'during grant pilot',
			highlight: false,
			badge: 'Field Trial',
			features: [
				'Complete offline clinical suite (intake, triage, consult, pharmacy)',
				'Up to 6 active staff kiosk devices per facility',
				'Zero-config local LAN auto-discovery',
				'Automated smart triage & vitals urgency rules',
				'Local SQLite edge broker & cloud synchronization',
				'Direct on-site onboarding and technician support'
			],
			cta: 'Apply for Pilot Cohort',
			ctaHref: '/demo?plan=pilot',
			ctaVariant: 'outline' as const
		},
		{
			name: 'Public PHC Network',
			tagline: 'Annual institutional contract for State Primary Health Care Agencies (SPHCDA).',
			price: '₦30,000',
			period: '/ facility / month',
			highlight: true,
			badge: 'Recommended',
			features: [
				'Unlimited staff logins and kiosk tablet seats',
				'Dual AI clinical safety nets (Dr. Assist & RxBrain)',
				'Automated monthly DHIS2 aggregated reporting',
				'Outbreak Radar epidemiological surveillance alerts',
				'Daily encrypted cloud backup & central facility analytics',
				'Central State/LGA administrative dashboard',
				'Dedicated technician field support SLA'
			],
			cta: 'State Procurement Contact',
			ctaHref: '/contact?inquiry=state',
			ctaVariant: 'default' as const
		},
		{
			name: 'Private & NGO Tier',
			tagline: 'For mission hospitals, private clinics, and international global health donors.',
			price: 'Custom',
			period: 'tailored per network',
			highlight: false,
			badge: 'Enterprise',
			features: [
				'Multi-facility centralized analytics & oversight',
				'Custom DHIS2 & national API push pipelines',
				'Custom clinical templates & formulary rules',
				'Termii automated SMS patient follow-up',
				'On-premise edge server installation option',
				'Dedicated SLA & custom cloud tenant deployment'
			],
			cta: 'Request Formal Proposal',
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
			a: 'ClinicFlow was engineered specifically for this condition. All daily operations run from local IndexedDB and edge SQLite storage without requesting a single byte from the internet. When power and network return, changes merge deterministically.'
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

<div class="space-y-20 py-12 md:py-16">
	<!-- Page Header (Editorial Left-Aligned) -->
	<section class="border-b border-border bg-background pb-14">
		<div class="container mx-auto px-4 md:px-8 max-w-7xl">
			<div class="max-w-3xl space-y-4">
				<p class="text-xs font-mono font-semibold tracking-wider text-primary">
					INSTITUTIONAL PROCUREMENT
				</p>
				<h1
					class="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]"
				>
					Affordable for state agencies. Free for pilot facilities.
				</h1>
				<p class="text-base sm:text-lg text-muted-foreground leading-relaxed pt-1">
					Designed to fit within public health budgets without recurring per-patient fees,
					unexpected cloud usage spikes, or proprietary software lock-in.
				</p>
			</div>
		</div>
	</section>

	<!-- Pricing Cards -->
	<section class="container mx-auto px-4 md:px-8 max-w-7xl">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
			{#each tiers as tier}
				<div
					class="rounded-lg border {tier.highlight
						? 'border-2 border-primary bg-card shadow-md'
						: 'border-border bg-card'} p-7 flex flex-col justify-between relative"
				>
					<div class="space-y-6">
						<div>
							<div class="flex items-center justify-between">
								<h2 class="text-lg font-bold text-foreground tracking-tight">{tier.name}</h2>
								<span
									class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold {tier.highlight
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-muted-foreground'}"
								>
									{tier.badge}
								</span>
							</div>
							<p class="text-xs text-muted-foreground mt-2 min-h-[36px] leading-relaxed">
								{tier.tagline}
							</p>
						</div>

						<div class="flex items-baseline gap-2 pt-2 border-t border-border">
							<span
								class="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono"
							>
								{tier.price}
							</span>
							<span class="text-xs text-muted-foreground font-mono">{tier.period}</span>
						</div>

						<div class="border-t border-border pt-5 space-y-3">
							<p class="text-xs font-mono font-semibold text-foreground tracking-wider uppercase">
								Capabilities:
							</p>
							<ul class="space-y-2.5 text-xs text-muted-foreground">
								{#each tier.features as feat}
									<li class="flex items-start gap-2.5 leading-normal">
										<Check class="size-3.5 text-primary shrink-0 mt-0.5" />
										<span class="text-foreground/90">{feat}</span>
									</li>
								{/each}
							</ul>
						</div>
					</div>

					<div class="pt-6 mt-6 border-t border-border">
						<Button
							href={tier.ctaHref}
							variant={tier.ctaVariant}
							class="w-full rounded-md h-10 font-semibold text-xs {tier.highlight
								? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
								: 'border-border'}"
						>
							{tier.cta}
						</Button>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- FAQ Section -->
	<section class="container mx-auto px-4 md:px-8 max-w-4xl space-y-8">
		<div class="border-b border-border pb-4">
			<p class="text-xs font-mono font-semibold tracking-wider text-primary mb-1">
				FREQUENT QUESTIONS
			</p>
			<h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
				Clear answers for healthcare administrators.
			</h2>
		</div>

		<div class="divide-y divide-border">
			{#each faqs as item}
				<div class="py-5 space-y-2">
					<h3 class="text-base font-bold text-foreground flex items-start gap-2">
						<HelpCircle class="size-4 text-primary shrink-0 mt-1" />
						<span>{item.q}</span>
					</h3>
					<p class="text-sm text-muted-foreground leading-relaxed pl-6">
						{item.a}
					</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Contact CTA -->
	<section class="border-t border-border bg-background py-16">
		<div class="container mx-auto px-4 md:px-8 max-w-5xl">
			<div
				class="rounded-lg border border-border bg-card p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm"
			>
				<div class="space-y-1.5 text-left">
					<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
						Need a formal procurement proposal?
					</h2>
					<p class="text-sm text-muted-foreground">
						We prepare customized implementation schedules and technical capability briefs for State
						Ministries of Health and LGA authorities.
					</p>
				</div>
				<Button
					href="/contact"
					class="rounded-md px-5 h-10 font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shrink-0"
				>
					Contact Institutional Sales <ArrowRight class="ml-2 size-3.5" />
				</Button>
			</div>
		</div>
	</section>
</div>
