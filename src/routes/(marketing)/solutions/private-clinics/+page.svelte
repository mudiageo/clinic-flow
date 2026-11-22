<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import { Stethoscope, DollarSign, Clock, ShieldCheck, Zap, ArrowRight } from '@lucide/svelte';
</script>

<svelte:head>
	<title>ClinicFlow for Private Clinics & Mission Hospitals</title>
	<meta
		name="description"
		content="Fast, offline-resilient clinic management for private practices, mission hospitals, and maternity homes in Nigeria."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-20 space-y-16">
	<!-- Editorial Header -->
	<div class="border-b border-border/70 pb-8 space-y-4">
		<p class="text-xs font-mono uppercase tracking-wider text-primary">
			Private Healthcare Operations
		</p>
		<h1 class="text-3xl md:text-5xl font-bold tracking-tight text-foreground max-w-3xl">
			Keep your private clinic running when the network drops.
		</h1>
		<p class="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
			For private practitioners and mission clinics, internet downtime means lost revenue,
			frustrated patients, and clinical blindspots. ClinicFlow keeps your reception, consultation
			desks, and pharmacy in lockstep without internet reliance.
		</p>
		<div class="pt-2">
			<Button
				href="/contact?inquiry=enterprise"
				size="lg"
				class="rounded-md px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
			>
				Book Private Practice Demo <ArrowRight class="ml-2 size-4" />
			</Button>
		</div>
	</div>

	<!-- Features Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<Zap class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Zero Reception Latency</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				No spinning loading indicators while patients stand at the front desk. Patient lookups and
				registration happen instantly from local cache.
			</p>
		</div>

		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<ShieldCheck class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">RxBrain Drug Safety Checks</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Protect your clinic’s clinical reputation. RxBrain automatically flags dangerous drug-drug
				interactions before prescriptions are filled.
			</p>
		</div>

		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<Clock class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Complete Patient Longitudinal History</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Access a patient’s full history of vitals, past allergies, previous medications, and
				maternal visits in one clean, unified timeline.
			</p>
		</div>

		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-3">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<DollarSign class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Controlled Pharmacy Stock</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Prevent medication shrinkage and stockouts. Dispensing automatically decrements inventory
				and maintains a strict audit trail.
			</p>
		</div>
	</div>

	<!-- Private CTA -->
	<div class="rounded-lg border border-border bg-muted/20 p-6 md:p-10 space-y-5">
		<div class="space-y-2">
			<p class="text-xs font-mono uppercase tracking-wider text-primary">Facility Onboarding</p>
			<h2 class="text-2xl font-bold text-foreground">
				Upgrade your private clinic’s digital workflow
			</h2>
		</div>
		<p class="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
			We offer tailored setups and dedicated on-boarding for private clinics and multi-specialty
			practices across Nigeria.
		</p>
		<div>
			<Button
				href="/contact?inquiry=enterprise"
				class="rounded-md px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
			>
				Contact Private Practice Team
			</Button>
		</div>
	</div>
</div>
