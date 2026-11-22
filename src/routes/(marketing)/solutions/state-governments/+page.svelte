<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import {
		Building2,
		ShieldCheck,
		BarChart3,
		WifiOff,
		Users,
		ArrowRight,
		CheckCircle2
	} from '@lucide/svelte';
</script>

<svelte:head>
	<title>ClinicFlow for State Governments & SPHCDAs</title>
	<meta
		name="description"
		content="Digitize your state's Primary Health Centres at scale. Real-time DHIS2 indicators, offline-first reliability, and transparent agency pricing."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-20 space-y-16">
	<!-- Editorial Header -->
	<div class="border-b border-border/70 pb-8 space-y-4">
		<p class="text-xs font-mono uppercase tracking-wider text-primary">
			State & LGA Transformation
		</p>
		<h1 class="text-3xl md:text-5xl font-bold tracking-tight text-foreground max-w-3xl">
			Digital infrastructure for state primary healthcare agencies.
		</h1>
		<p class="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
			State Primary Health Care Development Agencies (SPHCDAs) in Nigeria oversee hundreds of
			low-power, disconnected rural facilities. ClinicFlow gives commissioners and directors
			verifiable clinical visibility without requiring state-wide fiber or continuous internet.
		</p>
		<div class="pt-2">
			<Button
				href="/contact?inquiry=state_procurement"
				size="lg"
				class="rounded-md px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
			>
				Request State Executive Briefing <ArrowRight class="ml-2 size-4" />
			</Button>
		</div>
	</div>

	<!-- Strategic Benefits Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<WifiOff class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Zero Rural Failure Rate</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Traditional imported health software fails when generators run dry or rural cell towers cut
				out. ClinicFlow keeps running 100% offline at the PHC, uploading encrypted batches whenever
				bandwidth becomes available.
			</p>
		</div>

		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<BarChart3 class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Automated DHIS2 / NHMIS Rollups</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Eliminate weeks of manual data re-entry backlogs. Frontline patient consultations
				automatically populate standardized state health indicator registries.
			</p>
		</div>

		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<ShieldCheck class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Complete Data Sovereignty</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Your state retains absolute legal ownership of all clinical records, aligned with the
				Nigeria Data Protection Act 2023. Data is never monetized or exposed.
			</p>
		</div>

		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<Users class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Predictable Agency Budgeting</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Billed at an affordable institutional rate (₦30,000 per facility/month) through standard
				public procurement frameworks, with no unpredictable per-patient fees.
			</p>
		</div>
	</div>

	<!-- Pilot Evaluation Block -->
	<div class="rounded-lg border border-border bg-muted/20 p-6 md:p-10 space-y-5">
		<div class="space-y-2">
			<p class="text-xs font-mono uppercase tracking-wider text-primary">Structured Pilots</p>
			<h2 class="text-2xl font-bold text-foreground">
				Evaluate ClinicFlow in 3 PHCs in your state
			</h2>
		</div>
		<p class="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
			We partner with State Ministries of Health to run structured 8-week pilot trials with zero
			software licensing costs, gathering empirical usage and triage accuracy data before broader
			deployment.
		</p>
		<div>
			<Button
				href="/contact?inquiry=state_procurement"
				class="rounded-md px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
			>
				Initiate State Partnership Discussion
			</Button>
		</div>
	</div>
</div>
