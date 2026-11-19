<script lang="ts">
	import SectionHeader from '$lib/components/marketing/section-header.svelte';
	import { CheckCircle2, Clock, Sparkles, ArrowRight } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	const roadmapPhases = [
		{
			phase: 'Phase 1: Core Offline Operations',
			status: 'Completed / Shipped',
			badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
			items: [
				'Patient intake, quick search, and automated digital queuing',
				'Automated vitals triage with Red / Amber / Green urgency routing',
				'Doctor encounter notes & digital prescription dispensing',
				'NPHCDA-aligned immunization & maternal health (ANC) records',
				'Dexie IndexedDB local-first storage with sub-millisecond local queries',
				'Tauri v2 Android APK and Windows kiosk builds with nightly CI'
			]
		},
		{
			phase: 'Phase 2: Local AI & Edge Synchronization',
			status: 'In Active Deployment',
			badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
			items: [
				'Zero-configuration local Wi-Fi auto-discovery via mDNS (clinicflow.local)',
				'RxBrain adverse drug-drug interaction checker on prescription entry',
				'Dr. Assist clinical decision support for atypical symptom patterns',
				'Outbreak Radar surveillance dashboard for epidemiological clusters',
				'Multiplexed wake-up signal and debounced cloud sync engine'
			]
		},
		{
			phase: 'Phase 3: National Systems Integration & Scaling',
			status: 'Planned (Q1–Q2 2027)',
			badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
			items: [
				'Direct one-click monthly DHIS2 aggregate export pipeline',
				'National Health Insurance Authority (NHIA/NHIS) automated claims integration',
				'On-device local fine-tuned MedGemma SLM via in-browser WebGPU',
				'Solar-inverter hardware reference bundles for off-grid clinics',
				'State-wide multi-PHC central epidemiological monitoring portal'
			]
		}
	];
</script>

<svelte:head>
	<title>Public Roadmap & Evolution — ClinicFlow</title>
	<meta
		name="description"
		content="Explore ClinicFlow’s development trajectory: from offline clinic operations to edge AI and national DHIS2 integration."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-4xl py-16 md:py-24 space-y-16">
	<!-- Header -->
	<div class="text-center max-w-2xl mx-auto space-y-4">
		<div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
			Engineering Transparency
		</div>
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
			Product Roadmap
		</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			We ship updates continuously. Here is our strategic trajectory toward transforming primary healthcare delivery across Nigeria.
		</p>
	</div>

	<!-- Timeline Cards -->
	<div class="space-y-8">
		{#each roadmapPhases as phase}
			<div class="rounded-3xl border border-border bg-card p-8 md:p-10 space-y-6 shadow-sm">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
					<h2 class="text-2xl font-bold text-foreground">{phase.phase}</h2>
					<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider {phase.badgeColor}">
						<Clock class="size-3.5" /> {phase.status}
					</span>
				</div>

				<ul class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
					{#each phase.items as item}
						<li class="flex items-start gap-2.5">
							<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
							<span>{item}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>

	<!-- Suggest features -->
	<div class="rounded-2xl border border-border bg-muted/30 p-8 text-center space-y-4">
		<h3 class="text-xl font-bold text-foreground">Have a specific feature request for your facility?</h3>
		<p class="text-sm text-muted-foreground max-w-xl mx-auto">
			We actively consult CHEWs, nurses, and medical officers across Edo State to prioritize clinical workflows.
		</p>
		<Button href="/contact" class="rounded-full px-6 font-bold bg-primary text-primary-foreground">
			Submit Clinical Feature Request
		</Button>
	</div>
</div>
