<script lang="ts">
	import { Smartphone, Monitor, Wifi, Sun, CheckCircle2 } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button';
</script>

<svelte:head>
	<title>System & Hardware Requirements — ClinicFlow</title>
	<meta
		name="description"
		content="Recommended hardware specifications for deploying ClinicFlow in Nigerian Primary Health Centres: tablets, routers, workstations, and solar inverter power."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-20 space-y-16">
	<!-- Editorial Header -->
	<div class="border-b border-border/70 pb-8 space-y-4">
		<p class="text-xs font-mono uppercase tracking-wider text-primary">
			Technical Deployment Guide
		</p>
		<h1 class="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
			Hardware & System Requirements
		</h1>
		<p class="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
			ClinicFlow was designed to run reliably on consumer-grade hardware and low-cost off-grid power
			solutions commonly available in Nigeria.
		</p>
	</div>

	<!-- Hardware Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Android Tablets -->
		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-5">
			<div class="flex items-center gap-3">
				<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
					<Smartphone class="size-5" />
				</div>
				<div>
					<h3 class="font-bold text-lg text-foreground">Nurse & Triage Tablets</h3>
					<p class="text-xs text-muted-foreground">Mobile bedside and queue stations</p>
				</div>
			</div>

			<ul class="space-y-3 text-sm text-muted-foreground">
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">OS:</strong> Android 8.0 (Oreo) or later (Android 11+ recommended)</span
					>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">Memory (RAM):</strong> 3 GB minimum (4 GB recommended)</span
					>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span><strong class="text-foreground">Storage:</strong> 32 GB minimum internal flash</span
					>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">Display:</strong> 8-inch or 10-inch capacitive touchscreen</span
					>
				</li>
			</ul>
		</div>

		<!-- Workstations / Laptops -->
		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-5">
			<div class="flex items-center gap-3">
				<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
					<Monitor class="size-5" />
				</div>
				<div>
					<h3 class="font-bold text-lg text-foreground">Doctor & Admin Workstations</h3>
					<p class="text-xs text-muted-foreground">Consultation and administrative desks</p>
				</div>
			</div>

			<ul class="space-y-3 text-sm text-muted-foreground">
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">OS:</strong> Windows 10/11 (64-bit) or Ubuntu Linux 22.04+</span
					>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">Processor:</strong> Dual-Core Intel/AMD 2.0 GHz or higher</span
					>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">Memory (RAM):</strong> 4 GB minimum (8 GB recommended)</span
					>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">Browser:</strong> Latest Google Chrome, Mozilla Firefox,
						or Edge</span
					>
				</li>
			</ul>
		</div>

		<!-- Local Wi-Fi Router -->
		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-5">
			<div class="flex items-center gap-3">
				<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
					<Wifi class="size-5" />
				</div>
				<div>
					<h3 class="font-bold text-lg text-foreground">Local Clinic Wi-Fi Router</h3>
					<p class="text-xs text-muted-foreground">LAN interconnectivity (Internet NOT required)</p>
				</div>
			</div>

			<ul class="space-y-3 text-sm text-muted-foreground">
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">Type:</strong> Standard 802.11 b/g/n or Wi-Fi 5 wireless
						router</span
					>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">Range:</strong> Sufficient coverage for registration, wards,
						and pharmacy</span
					>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">Internet:</strong> Optional. The router only needs to provide
						a local LAN connection.</span
					>
				</li>
			</ul>
		</div>

		<!-- Solar / Power Backup -->
		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-5">
			<div class="flex items-center gap-3">
				<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
					<Sun class="size-5" />
				</div>
				<div>
					<h3 class="font-bold text-lg text-foreground">Power & Solar Inverter</h3>
					<p class="text-xs text-muted-foreground">Recommended for off-grid clinics</p>
				</div>
			</div>

			<ul class="space-y-3 text-sm text-muted-foreground">
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">Inverter Capacity:</strong> 1kVA / 12V or 24V basic solar
						inverter</span
					>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">Battery:</strong> 1x 200Ah deep-cycle tubular or lithium
						battery</span
					>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
					<span
						><strong class="text-foreground">Panels:</strong> 2x 300W monocrystalline solar panels for
						continuous router & tablet charging</span
					>
				</li>
			</ul>
		</div>
	</div>

	<!-- CTA -->
	<div class="rounded-lg border border-border bg-muted/20 p-6 md:p-8 space-y-4">
		<h3 class="text-lg font-bold text-foreground">
			Need assistance selecting hardware for your PHC?
		</h3>
		<p class="text-sm text-muted-foreground max-w-xl leading-relaxed">
			Our engineering team can review your facility's current equipment inventory or recommend
			vetted local suppliers in your state.
		</p>
		<div>
			<Button
				href="/contact?inquiry=pilot_application"
				class="rounded-md px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
			>
				Contact Technical Support
			</Button>
		</div>
	</div>
</div>
