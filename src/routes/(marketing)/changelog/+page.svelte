<script lang="ts">
	import { Calendar, CheckCircle2, ArrowRight } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button';

	const logEntries = [
		{
			version: 'v0.9.4',
			date: 'November 2026',
			highlight: 'NextGen Showcase & Kiosk Hardening',
			changes: [
				'Hardened Tauri v2 kiosk container on low-RAM Android 8.0+ devices',
				'Added comprehensive Institutional Marketing suite with NDPA compliance documentation',
				'Integrated live pilot application and demonstration dispatch endpoints',
				'Optimized Dexie reactive store bindings during rapid queue refreshes'
			]
		},
		{
			version: 'v0.9.0',
			date: 'October 2026',
			highlight: 'Edge LAN Discovery & AI Decision Safety',
			changes: [
				'Zero-configuration local Wi-Fi auto-discovery via mDNS protocol (clinicflow.local)',
				'Introduced RxBrain adverse drug interaction warning modal before prescription checkout',
				'Added Dr. Assist advisory diagnostic suggestions in consultation intake',
				'Outbreak Radar epidemiological anomaly surveillance dashboard'
			]
		},
		{
			version: 'v0.8.0',
			date: 'September 2026',
			highlight: '3MTT Hackathon Milestone Release',
			changes: [
				'Awarded 2nd place at 3MTT / IdentArk National AI Hackathon ("Build AI. Solve Local.")',
				'Full offline registration, vitals, consultation, pharmacy, and immunization workflows',
				'Color-coded smart triage priority re-ordering for urgent patients',
				'Nightly Android APK releases automated via GitHub Actions'
			]
		}
	];
</script>

<svelte:head>
	<title>Changelog & Product Updates — ClinicFlow</title>
	<meta
		name="description"
		content="A human-readable record of enhancements, security updates, and new features introduced into ClinicFlow."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-20 space-y-16">
	<!-- Editorial Header -->
	<div class="border-b border-border/70 pb-8 space-y-4">
		<p class="text-xs font-mono uppercase tracking-wider text-primary">Release Notes</p>
		<h1 class="text-3xl md:text-5xl font-bold tracking-tight text-foreground">Changelog</h1>
		<p class="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
			Every major improvement, performance optimization, and clinical feature we ship to Nigerian
			clinics.
		</p>
		<div class="pt-2">
			<Button href="/releases" variant="outline" class="rounded-md font-medium">
				View technical GitHub releases & APK assets <ArrowRight class="ml-2 size-4" />
			</Button>
		</div>
	</div>

	<!-- Log Entries -->
	<div class="space-y-6">
		{#each logEntries as entry}
			<article class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-6">
				<div
					class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-4"
				>
					<div class="flex items-center gap-3">
						<span class="text-2xl font-bold font-mono text-foreground">{entry.version}</span>
						<span class="text-sm font-semibold text-primary">{entry.highlight}</span>
					</div>
					<span class="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
						<Calendar class="size-3.5" />
						{entry.date}
					</span>
				</div>

				<ul class="space-y-3 text-sm text-muted-foreground">
					{#each entry.changes as change}
						<li class="flex items-start gap-2.5">
							<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
							<span>{change}</span>
						</li>
					{/each}
				</ul>
			</article>
		{/each}
	</div>
</div>
