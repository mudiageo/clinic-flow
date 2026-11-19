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

<div class="container mx-auto px-4 md:px-8 max-w-4xl py-16 md:py-24 space-y-20">
	<div class="text-center max-w-2xl mx-auto space-y-4">
		<div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
			Private Healthcare Operations
		</div>
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
			Keep your private clinic running when the network drops.
		</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			For private practitioners and mission clinics, internet downtime means lost revenue, frustrated patients, and clinical blindspots. ClinicFlow keeps your reception, consultation desks, and pharmacy in lockstep without internet reliance.
		</p>
		<div class="pt-2">
			<Button href="/contact?inquiry=enterprise" size="lg" class="rounded-full px-8 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20">
				Book Private Practice Demo <ArrowRight class="ml-2 size-4" />
			</Button>
		</div>
	</div>

	<!-- Features -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<div class="rounded-3xl border border-border bg-card p-8 space-y-3 shadow-sm">
			<div class="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
				<Zap class="size-5" />
			</div>
			<h3 class="text-xl font-bold text-foreground">Zero Reception Latency</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				No spinning loading indicators while patients stand at the front desk. Patient lookups and registration happen instantly from local cache.
			</p>
		</div>

		<div class="rounded-3xl border border-border bg-card p-8 space-y-3 shadow-sm">
			<div class="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
				<ShieldCheck class="size-5" />
			</div>
			<h3 class="text-xl font-bold text-foreground">RxBrain Drug Safety Checks</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Protect your clinic’s clinical reputation. RxBrain automatically flags dangerous drug-drug interactions before prescriptions are filled.
			</p>
		</div>

		<div class="rounded-3xl border border-border bg-card p-8 space-y-3 shadow-sm">
			<div class="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
				<Clock class="size-5" />
			</div>
			<h3 class="text-xl font-bold text-foreground">Complete Patient Longitudinal History</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Access a patient’s full history of vitals, past allergies, previous medications, and maternal visits in one clean, unified timeline.
			</p>
		</div>

		<div class="rounded-3xl border border-border bg-card p-8 space-y-3 shadow-sm">
			<div class="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
				<DollarSign class="size-5" />
			</div>
			<h3 class="text-xl font-bold text-foreground">Controlled Pharmacy Stock</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Prevent medication shrinkage and stockouts. Dispensing automatically decrements inventory and maintains a strict audit trail.
			</p>
		</div>
	</div>

	<!-- Private CTA -->
	<div class="rounded-3xl border border-border bg-muted/30 p-8 md:p-12 text-center space-y-5">
		<h2 class="text-2xl md:text-3xl font-bold text-foreground">Upgrade your private clinic’s digital workflow</h2>
		<p class="text-muted-foreground text-sm md:text-base max-w-xl mx-auto leading-relaxed">
			We offer tailored setups and dedicated on-boarding for private clinics and multi-specialty practices across Nigeria.
		</p>
		<Button href="/contact?inquiry=enterprise" class="rounded-full px-8 font-bold bg-primary text-primary-foreground">
			Contact Private Practice Team
		</Button>
	</div>
</div>
