<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import { Globe2, FileCheck2, BarChart2, Shield, HeartHandshake, ArrowRight } from '@lucide/svelte';
</script>

<svelte:head>
	<title>ClinicFlow for NGOs, Donors & Global Health Programs</title>
	<meta
		name="description"
		content="Empower frontline global health initiatives with verified encounter data, maternal-child tracking, and resilient offline electronic medical records."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-4xl py-16 md:py-24 space-y-20">
	<div class="text-center max-w-2xl mx-auto space-y-4">
		<div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
			Global Health Implementation
		</div>
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
			Verifiable primary health data for donors and implementing partners.
		</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			Health system strengthening grants require empirical, tamper-evident data. ClinicFlow equips frontline clinics with offline point-of-care capture, ensuring program dollars translate directly into measurable health outcomes.
		</p>
		<div class="pt-2">
			<Button href="/contact?inquiry=ngo_partnership" size="lg" class="rounded-full px-8 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20">
				Request NGO Program Pack <ArrowRight class="ml-2 size-4" />
			</Button>
		</div>
	</div>

	<!-- Pillars -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<div class="rounded-3xl border border-border bg-card p-8 space-y-3 shadow-sm">
			<div class="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
				<FileCheck2 class="size-5" />
			</div>
			<h3 class="text-xl font-bold text-foreground">High-Fidelity M&E Data</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Eliminate estimate bias and phantom reports. Every immunization dose, maternal checkup, and antimalarial prescription is timestamped and auditable at the facility level.
			</p>
		</div>

		<div class="rounded-3xl border border-border bg-card p-8 space-y-3 shadow-sm">
			<div class="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
				<Globe2 class="size-5" />
			</div>
			<h3 class="text-xl font-bold text-foreground">Rapid Field Deployment</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Runs on inexpensive Android tablets with zero local IT engineering required. Clinic workers can be fully onboarded and proficient in less than two days.
			</p>
		</div>

		<div class="rounded-3xl border border-border bg-card p-8 space-y-3 shadow-sm">
			<div class="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
				<BarChart2 class="size-5" />
			</div>
			<h3 class="text-xl font-bold text-foreground">Outbreak Early Warning</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Our Outbreak Radar module surfaces unusual localized clusters of epidemic-prone diseases (cholera, Lassa fever, meningitis) weeks faster than traditional paper tally compilations.
			</p>
		</div>

		<div class="rounded-3xl border border-border bg-card p-8 space-y-3 shadow-sm">
			<div class="size-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
				<Shield class="size-5" />
			</div>
			<h3 class="text-xl font-bold text-foreground">Ethical & Compliant</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Fully compliant with the Nigeria Data Protection Act 2023 and international health information privacy frameworks.
			</p>
		</div>
	</div>

	<!-- Partnership CTA -->
	<div class="rounded-3xl border border-border bg-muted/30 p-8 md:p-12 text-center space-y-5">
		<h2 class="text-2xl md:text-3xl font-bold text-foreground">Integrating with your global health grant?</h2>
		<p class="text-muted-foreground text-sm md:text-base max-w-xl mx-auto leading-relaxed">
			We collaborate with technical leads on milestone planning, equipment budgets, and custom indicator pipelines for funding applications and active program deployments.
		</p>
		<Button href="/contact?inquiry=ngo_partnership" class="rounded-full px-8 font-bold bg-primary text-primary-foreground">
			Contact NGO Partnership Desk
		</Button>
	</div>
</div>
