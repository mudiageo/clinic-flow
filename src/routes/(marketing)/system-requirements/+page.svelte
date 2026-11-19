<script lang="ts">
	import SectionHeader from '#lib/components/marketing/section-header.svelte';
	import { Smartphone, Monitor, Wifi, Sun, CheckCircle2, AlertCircle } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button';
</script>

<svelte:head>
	<title>System & Hardware Requirements — ClinicFlow</title>
	<meta
		name="description"
		content="Recommended hardware specifications for deploying ClinicFlow in Nigerian Primary Health Centres: tablets, routers, workstations, and solar inverter power."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-4xl py-16 md:py-24 space-y-16">
	<div class="text-center max-w-2xl mx-auto space-y-4">
		<div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
			Technical Deployment Guide
		</div>
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
			Hardware & System Requirements
		</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			ClinicFlow was designed to run reliably on consumer-grade hardware and low-cost off-grid power solutions commonly available in Nigeria.
		</p>
	</div>

	<!-- Hardware Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<!-- Android Tablets -->
		<div class="rounded-3xl border border-border bg-card p-8 space-y-5 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
					<Smartphone class="size-6" />
				</div>
				<div>
					<h3 class="font-bold text-lg text-foreground">Nurse & Triage Tablets</h3>
					<p class="text-xs text-muted-foreground">Mobile bedside and queue stations</p>
				</div>
			</div>

			<ul class="space-y-3 text-sm text-muted-foreground">
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span><strong>OS:</strong> Android 8.0 (Oreo) or later (Android 11+ recommended)</span>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span><strong>Memory (RAM):</strong> 3 GB minimum (4 GB recommended for speed)</span>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span><strong>Storage:</strong> 32 GB minimum internal flash</span>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span><strong>Display:</strong> 8-inch or 10-inch capacitive touchscreen</span>
				</li>
			</ul>
		</div>

		<!-- Workstations / Laptops -->
		<div class="rounded-3xl border border-border bg-card p-8 space-y-5 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="size-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
					<Monitor class="size-6" />
				</div>
				<div>
					<h3 class="font-bold text-lg text-foreground">Doctor & Admin Workstations</h3>
					<p class="text-xs text-muted-foreground">Consultation and administrative desks</p>
				</div>
			</div>

			<ul class="space-y-3 text-sm text-muted-foreground">
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-blue-600 shrink-0 mt-0.5" />
					<span><strong>OS:</strong> Windows 10/11 (64-bit) or Ubuntu Linux 22.04+</span>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-blue-600 shrink-0 mt-0.5" />
					<span><strong>Processor:</strong> Dual-Core Intel/AMD 2.0 GHz or higher</span>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-blue-600 shrink-0 mt-0.5" />
					<span><strong>Memory (RAM):</strong> 4 GB minimum (8 GB recommended)</span>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-blue-600 shrink-0 mt-0.5" />
					<span><strong>Browser:</strong> Latest Google Chrome, Mozilla Firefox, or Edge</span>
				</li>
			</ul>
		</div>

		<!-- Local Wi-Fi Router -->
		<div class="rounded-3xl border border-border bg-card p-8 space-y-5 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="size-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
					<Wifi class="size-6" />
				</div>
				<div>
					<h3 class="font-bold text-lg text-foreground">Local Clinic Wi-Fi Router</h3>
					<p class="text-xs text-muted-foreground">LAN interconnectivity (Internet NOT required)</p>
				</div>
			</div>

			<ul class="space-y-3 text-sm text-muted-foreground">
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-amber-600 shrink-0 mt-0.5" />
					<span><strong>Type:</strong> Standard 802.11 b/g/n or Wi-Fi 5 wireless router</span>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-amber-600 shrink-0 mt-0.5" />
					<span><strong>Range:</strong> Sufficient coverage for registration, wards, and pharmacy</span>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-amber-600 shrink-0 mt-0.5" />
					<span><strong>Internet:</strong> Optional. The router only needs to provide a local LAN connection.</span>
				</li>
			</ul>
		</div>

		<!-- Solar / Power Backup -->
		<div class="rounded-3xl border border-border bg-card p-8 space-y-5 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
					<Sun class="size-6" />
				</div>
				<div>
					<h3 class="font-bold text-lg text-foreground">Power & Solar Inverter</h3>
					<p class="text-xs text-muted-foreground">Recommended for off-grid clinics</p>
				</div>
			</div>

			<ul class="space-y-3 text-sm text-muted-foreground">
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-emerald-600 shrink-0 mt-0.5" />
					<span><strong>Inverter Capacity:</strong> 1kVA / 12V or 24V basic solar inverter</span>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-emerald-600 shrink-0 mt-0.5" />
					<span><strong>Battery:</strong> 1x 200Ah deep-cycle tubular or lithium battery</span>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-emerald-600 shrink-0 mt-0.5" />
					<span><strong>Panels:</strong> 2x 300W monocrystalline solar panels for continuous router & tablet charging</span>
				</li>
			</ul>
		</div>
	</div>

	<!-- CTA -->
	<div class="rounded-2xl border border-border bg-muted/30 p-8 text-center space-y-4">
		<h3 class="text-xl font-bold text-foreground">Need assistance selecting hardware for your PHC?</h3>
		<p class="text-sm text-muted-foreground max-w-xl mx-auto">
			Our engineering team can review your facility's current equipment inventory or recommend vetted local suppliers in your state.
		</p>
		<Button href="/contact?inquiry=pilot_application" class="rounded-full px-6 font-bold bg-primary text-primary-foreground">
			Contact Technical Support
		</Button>
	</div>
</div>
