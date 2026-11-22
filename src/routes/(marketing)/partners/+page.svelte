<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import {
		Building2,
		HeartHandshake,
		Cpu,
		Globe2,
		ArrowRight,
		CheckCircle2,
		Stethoscope
	} from '@lucide/svelte';

	const partnerTracks = [
		{
			category: 'Government & Public Health Agencies',
			icon: Building2,
			color: 'bg-primary/10 text-primary',
			description:
				'State Primary Health Care Development Agencies (SPHCDAs) and Local Government Health Authorities partnering to modernize public primary healthcare networks.',
			offerings: [
				'Zero-cost pilot deployment in up to 3 facilities during evaluation phase',
				'Automated NHMIS / DHIS2 indicator aggregation pipelines',
				'Comprehensive 2-day on-site onboarding for CHEWs, nurses, and doctors',
				'Direct technical assistance with solar-inverter and tablet hardware selection'
			],
			cta: 'Discuss State Deployment',
			inquiry: 'state_procurement'
		},
		{
			category: 'International Donors & Implementing NGOs',
			icon: Globe2,
			color: 'bg-blue-500/10 text-blue-600',
			description:
				'Global health organizations (WHO, USAID partners, Gates Foundation grantees, MSF) delivering maternal-child health and immunization interventions.',
			offerings: [
				'High-fidelity monitoring & evaluation (M&E) encounter data without clerical delay',
				'Outbreak Radar epidemiological surveillance for early disease cluster alerts',
				'Custom clinical indicator tracking tailored to grant milestone reporting',
				'Data export and interoperability with regional health dashboards'
			],
			cta: 'Collaborate on Health Grants',
			inquiry: 'ngo_partnership'
		},
		{
			category: 'Hardware & Solar Infrastructure Vendors',
			icon: Cpu,
			color: 'bg-amber-500/10 text-amber-600',
			description:
				'Renewable energy providers, Android tablet distributors, and rural networking installers building turnkey bundles for primary health clinics.',
			offerings: [
				'Pre-configured kiosk images and automated provisioning scripts',
				'Joint facility procurement schedules and reference hardware bundles',
				'Certified compatibility testing for low-power DC routers and inverters'
			],
			cta: 'Become a Hardware Partner',
			inquiry: 'pilot_application'
		},
		{
			category: 'Academic & Clinical Advisory Board',
			icon: Stethoscope,
			color: 'bg-emerald-500/10 text-emerald-600',
			description:
				'Clinical researchers, public health lecturers, and medical officers validating decision support rules and conducting empirical field studies.',
			offerings: [
				'Anonymized clinical audit and override analysis for academic publication',
				'Refinement of triage scoring protocols and drug interaction matrices',
				'IRB ethical clearance collaboration with tertiary teaching hospitals'
			],
			cta: 'Join Clinical Advisory',
			inquiry: 'general'
		}
	];
</script>

<svelte:head>
	<title>Partner Programs & Ecosystem — ClinicFlow</title>
	<meta
		name="description"
		content="Collaborate with ClinicFlow: Government deployment partnerships, NGO health grants, hardware vendors, and clinical advisory boards."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-20 space-y-16">
	<!-- Editorial Hero -->
	<div class="border-b border-border/70 pb-8 space-y-4">
		<p class="text-xs font-mono uppercase tracking-wider text-primary">Collaborative Ecosystem</p>
		<h1 class="text-3xl md:text-5xl font-bold tracking-tight text-foreground max-w-3xl">
			Building the digital backbone for Nigerian primary healthcare together.
		</h1>
		<p class="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
			Transforming 30,000 paper-based clinics across Nigeria requires strong partnerships between
			public agencies, global health donors, hardware suppliers, and frontline medical workers.
		</p>
	</div>

	<!-- Partner Tracks Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		{#each partnerTracks as track}
			<div
				class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-6 flex flex-col justify-between"
			>
				<div class="space-y-4">
					<div class="size-10 rounded-md {track.color} flex items-center justify-center">
						<track.icon class="size-5" />
					</div>
					<h2 class="text-xl font-bold text-foreground">{track.category}</h2>
					<p class="text-sm text-muted-foreground leading-relaxed">{track.description}</p>

					<div class="border-t border-border/70 pt-4 space-y-2.5">
						<p class="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">
							Partnership Highlights:
						</p>
						<ul class="space-y-2 text-sm text-muted-foreground">
							{#each track.offerings as offering}
								<li class="flex items-start gap-2">
									<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
									<span>{offering}</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>

				<div class="pt-4 border-t border-border/70">
					<Button
						href="/contact?inquiry={track.inquiry}"
						variant="outline"
						class="w-full rounded-md font-medium"
					>
						{track.cta}
						<ArrowRight class="ml-2 size-4" />
					</Button>
				</div>
			</div>
		{/each}
	</div>

	<!-- Pilot Deployment Invitation -->
	<div class="rounded-lg border border-border bg-muted/20 p-6 md:p-10 space-y-4">
		<div class="space-y-1">
			<p class="text-xs font-mono uppercase tracking-wider text-primary">Regional Pilots</p>
			<h3 class="text-2xl font-bold text-foreground">
				Are you piloting health innovations in Edo State?
			</h3>
		</div>
		<p class="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
			We are actively establishing initial pilot cohorts in Egor LGA, Benin City. We provide
			tablets, routers, and hands-on staff training with zero software licensing costs during the
			trial.
		</p>
		<div class="flex flex-wrap gap-4 pt-2">
			<Button
				href="/demo"
				class="rounded-md px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
			>
				Apply for Facility Pilot
			</Button>
			<Button href="/contact" variant="outline" class="rounded-md px-6 font-medium">
				Contact Partnerships Desk
			</Button>
		</div>
	</div>
</div>
