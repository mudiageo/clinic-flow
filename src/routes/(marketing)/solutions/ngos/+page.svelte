<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import { Globe2, FileCheck2, BarChart2, Shield, ArrowRight } from '@lucide/svelte';
</script>

<svelte:head>
	<title>ClinicFlow for NGOs, Donors & Global Health Programs</title>
	<meta
		name="description"
		content="Empower frontline global health initiatives with verified encounter data, maternal-child tracking, and resilient offline electronic medical records."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-20 space-y-16">
	<!-- Editorial Header -->
	<div class="border-b border-border/70 pb-8 space-y-4">
		<p class="text-xs font-mono uppercase tracking-wider text-primary">
			Global Health Implementation
		</p>
		<h1 class="text-3xl md:text-5xl font-bold tracking-tight text-foreground max-w-3xl">
			Verifiable primary health data for donors and implementing partners.
		</h1>
		<p class="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
			Health system strengthening grants require empirical, tamper-evident data. ClinicFlow equips
			frontline clinics with offline point-of-care capture, ensuring program dollars translate
			directly into measurable health outcomes.
		</p>
		<div class="pt-2">
			<Button
				href="/contact?inquiry=ngo_partnership"
				size="lg"
				class="rounded-md px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
			>
				Request NGO Program Pack <ArrowRight class="ml-2 size-4" />
			</Button>
		</div>
	</div>

	<!-- Pillars -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<FileCheck2 class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">High-Fidelity M&E Data</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Eliminate estimate bias and phantom reports. Every immunization dose, maternal checkup, and
				antimalarial prescription is timestamped and auditable at the facility level.
			</p>
		</div>

		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<Globe2 class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Rapid Field Deployment</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Runs on inexpensive Android tablets with zero local IT engineering required. Clinic workers
				can be fully onboarded and proficient in less than two days.
			</p>
		</div>

		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<BarChart2 class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Outbreak Early Warning</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Our Outbreak Radar module surfaces unusual localized clusters of epidemic-prone diseases
				(cholera, Lassa fever, meningitis) weeks faster than traditional paper tally compilations.
			</p>
		</div>

		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<Shield class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Ethical & Compliant</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Fully compliant with the Nigeria Data Protection Act 2023 and international health
				information privacy frameworks.
			</p>
		</div>
	</div>

	<!-- Partnership CTA -->
	<div class="rounded-lg border border-border bg-muted/20 p-6 md:p-10 space-y-5">
		<div class="space-y-2">
			<p class="text-xs font-mono uppercase tracking-wider text-primary">Grant Alignment</p>
			<h2 class="text-2xl font-bold text-foreground">Integrating with your global health grant?</h2>
		</div>
		<p class="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
			We collaborate with technical leads on milestone planning, equipment budgets, and custom
			indicator pipelines for funding applications and active program deployments.
		</p>
		<div>
			<Button
				href="/contact?inquiry=ngo_partnership"
				class="rounded-md px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
			>
				Contact NGO Partnership Desk
			</Button>
		</div>
	</div>
</div>
