<script lang="ts">
	import { CheckCircle2, Clock } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button';

	const roadmapPhases = [
		{
			phase: 'Phase 1: Core Offline Operations',
			status: 'Completed / Shipped',
			badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
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
			badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
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
			badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
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

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-20 space-y-16">
	<!-- Editorial Header -->
	<div class="border-b border-border/70 pb-8 space-y-4">
		<p class="text-xs font-mono uppercase tracking-wider text-primary">Engineering Transparency</p>
		<h1 class="text-3xl md:text-5xl font-bold tracking-tight text-foreground">Product Roadmap</h1>
		<p class="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
			We ship updates continuously. Here is our strategic trajectory toward transforming primary
			healthcare delivery across Nigeria.
		</p>
	</div>

	<!-- Timeline Cards -->
	<div class="space-y-6">
		{#each roadmapPhases as phase}
			<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-6">
				<div
					class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4"
				>
					<h2 class="text-xl font-bold text-foreground">{phase.phase}</h2>
					<span
						class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-medium {phase.badgeColor}"
					>
						<Clock class="size-3.5" />
						{phase.status}
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
	<div class="rounded-lg border border-border bg-muted/20 p-6 md:p-8 space-y-4">
		<h3 class="text-lg font-bold text-foreground">
			Have a specific feature request for your facility?
		</h3>
		<p class="text-sm text-muted-foreground max-w-xl leading-relaxed">
			We actively consult CHEWs, nurses, and medical officers across Edo State to prioritize
			clinical workflows.
		</p>
		<div>
			<Button
				href="/contact"
				class="rounded-md px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
			>
				Submit Clinical Feature Request
			</Button>
		</div>
	</div>
</div>
