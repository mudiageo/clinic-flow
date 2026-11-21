<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import AiDisclaimer from '#lib/components/ui/ai-disclaimer.svelte';
	import {
		Activity,
		Stethoscope,
		FlaskConical,
		Syringe,
		Baby,
		Users,
		Radar,
		ClipboardList,
		Bell,
		ShieldCheck,
		Smartphone,
		Wifi,
		WifiOff,
		CheckCircle2,
		ArrowRight,
		Download,
		Sparkles
	} from '@lucide/svelte';

	const coreFeatures = [
		{
			category: 'Frontline Clinical Operations',
			summary:
				'High-speed patient routing, triaging, and documentation that never stutters when the internet drops.',
			items: [
				{
					icon: Activity,
					title: 'Smart Queue & Automated Triage',
					desc: 'Register incoming patients in under 60 seconds. Vitals are checked against clinical threshold rules to automatically assign Red/Amber/Green urgency, ensuring critically ill patients are seen first.'
				},
				{
					icon: Stethoscope,
					title: 'Doctor Consultation & Clinical Notes',
					desc: 'Streamlined encounter documentation built for speed. Doctors review past visits, document diagnoses, and review instant AI symptom checks without waiting for network calls.'
				},
				{
					icon: FlaskConical,
					title: 'Pharmacy Dispensing & Inventory',
					desc: 'Digital prescriptions flow straight to the pharmacy desk. Dispensing automatically decrements local stock counts and warns of low inventory or impending stockouts.'
				},
				{
					icon: Syringe,
					title: 'Immunisation Tracking',
					desc: 'Track infant and maternal vaccine schedules according to NPHCDA immunization guidelines, tracking batch numbers and missed doses across family units.'
				},
				{
					icon: Baby,
					title: 'Antenatal & Maternity (ANC)',
					desc: 'Specialized workflow tracking gestational age, EDD, high-risk flags, delivery outcomes, and routine maternal lab investigations.'
				},
				{
					icon: Users,
					title: 'Family & Household Records',
					desc: 'Group patients under family folders so community health workers can track household health trends and maternal-child health clusters.'
				}
			]
		},
		{
			category: 'Intelligence & Population Health',
			summary: 'Early epidemiological cluster detection and real-time clinical safety nets.',
			items: [
				{
					icon: Sparkles,
					title: 'Dr. Assist & RxBrain Decision Support',
					desc: 'Dual clinical safety nets: Dr. Assist flags atypical symptom patterns during consultations, while RxBrain checks drug-drug interactions before prescriptions are finalized.'
				},
				{
					icon: Radar,
					title: 'Outbreak Radar Epidemiological Alerts',
					desc: 'Automated cluster detection flags unusual spikes in cholera, malaria, or respiratory cases across demographic cohorts before localized outbreaks explode.'
				},
				{
					icon: ClipboardList,
					title: 'Automated DHIS2 Reporting Pipeline',
					desc: 'Aggregate monthly national health indicators directly from daily encounters, eliminating the 10+ hours of tedious manual register reconciliation.'
				},
				{
					icon: Bell,
					title: 'SMS Reminders via Termii',
					desc: 'Automated patient follow-up and appointment notifications sent directly to patient phones, improving immunization completion and chronic care adherence.'
				}
			]
		},
		{
			category: 'Resilient Infrastructure',
			summary: 'Zero-config local networking and tamper-resistant kiosk runtimes.',
			items: [
				{
					icon: WifiOff,
					title: '100% Offline-First Architecture',
					desc: 'Zero reliance on continuous cloud connectivity. Patient records, queues, and medication stores reside locally in IndexedDB and edge SQLite stores.'
				},
				{
					icon: Wifi,
					title: 'Zero-Config LAN Auto-Discovery',
					desc: 'Built-in mDNS protocol broadcasts the local server as clinicflow.local. Kiosk tablets discover each other on the local Wi-Fi router without IT assistance or manual IP entry.'
				},
				{
					icon: Smartphone,
					title: 'Locked Kiosk Mode (Android & Windows)',
					desc: 'Packaged using Tauri v2 as dedicated Android APKs and Windows executables. Staff are locked into a distraction-free, tamper-proof touch interface.'
				},
				{
					icon: ShieldCheck,
					title: 'Role-Based Access Control & Auditing',
					desc: 'Strict permission separation across 8 clinical roles (Nurse, Doctor, Pharmacy, Admin, Maternity, Immunization, Field Officer, Superadmin) with tamper-evident audit logs.'
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Features — Comprehensive Clinic Management | ClinicFlow</title>
	<meta
		name="description"
		content="Explore all features of ClinicFlow: offline queue management, triage, AI clinical decision support, pharmacy, ANC, immunisation, and zero-config local sync."
	/>
</svelte:head>

<div class="space-y-20 py-12 md:py-16">
	<!-- Page Header Block (Editorial Left-Aligned) -->
	<section class="border-b border-border bg-background pb-14">
		<div class="container mx-auto px-4 md:px-8 max-w-7xl">
			<div class="max-w-3xl space-y-4">
				<p class="text-xs font-mono font-semibold tracking-wider text-primary">
					CAPABILITIES SPECIFICATION
				</p>
				<h1
					class="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]"
				>
					Every tool required to run a modern, digital Primary Health Centre.
				</h1>
				<p class="text-base sm:text-lg text-muted-foreground leading-relaxed pt-1">
					Built ground-up for low-resource environments. ClinicFlow combines the depth of an
					enterprise hospital information system with the resilience of a standalone offline
					utility.
				</p>
				<div class="flex flex-wrap items-center gap-3 pt-3">
					<Button
						href="/welcome"
						class="h-10 px-5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm"
					>
						Try Live Prototype
						<ArrowRight class="ml-2 size-4" />
					</Button>
					<Button
						href="/download"
						variant="outline"
						class="h-10 px-4 text-sm font-semibold rounded-md border-border"
					>
						<Download class="mr-2 size-4" />
						Download Installers
					</Button>
				</div>
			</div>
		</div>
	</section>

	<!-- Feature Groups -->
	<div class="container mx-auto px-4 md:px-8 max-w-7xl space-y-16">
		{#each coreFeatures as group}
			<section class="space-y-6">
				<div
					class="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2"
				>
					<div>
						<h2 class="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
							{group.category}
						</h2>
						<p class="text-xs sm:text-sm text-muted-foreground mt-0.5">{group.summary}</p>
					</div>
					<span class="text-xs font-mono text-muted-foreground">{group.items.length} modules</span>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each group.items as item}
						<div
							class="rounded-lg border border-border bg-card p-5 flex flex-col justify-between space-y-3 transition-colors hover:border-border/80"
						>
							<div class="space-y-3">
								<div
									class="size-9 rounded-md bg-muted text-foreground flex items-center justify-center shrink-0"
								>
									<item.icon class="size-4.5" />
								</div>
								<h3 class="text-base font-bold text-foreground tracking-tight">{item.title}</h3>
								<p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/each}
	</div>

	<!-- AI Safeguards banner -->
	<section class="container mx-auto px-4 md:px-8 max-w-7xl">
		<div class="rounded-xl border border-border bg-muted/40 p-6 md:p-8 space-y-4 max-w-4xl">
			<div class="flex items-center gap-2.5">
				<div
					class="size-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold font-mono"
				>
					AI
				</div>
				<h3 class="text-lg font-bold text-foreground tracking-tight">Clinical Safety Guardrails</h3>
			</div>
			<p class="text-sm text-muted-foreground leading-relaxed">
				All artificial intelligence features within ClinicFlow are intentionally engineered to
				augment health workers, not replace them. Diagnostic flags, adverse interaction warnings,
				and epidemiological pattern detections remain strictly advisory suggestions requiring human
				clinical validation.
			</p>
			<AiDisclaimer />
		</div>
	</section>

	<!-- CTA -->
	<section class="border-t border-border bg-background py-16">
		<div class="container mx-auto px-4 md:px-8 max-w-5xl">
			<div
				class="rounded-lg border border-border bg-card p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm"
			>
				<div class="space-y-1.5 text-left">
					<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
						Ready to deploy in your facility?
					</h2>
					<p class="text-sm text-muted-foreground">
						Deploy ClinicFlow on any existing Android tablet or Windows laptop in minutes.
					</p>
				</div>
				<div class="flex items-center gap-3 shrink-0">
					<Button
						href="/demo"
						class="rounded-md px-5 h-9 font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
					>
						Request Pilot Deployment
					</Button>
					<Button
						href="/pricing"
						variant="outline"
						class="rounded-md px-4 h-9 font-semibold text-xs border-border"
					>
						Review Pricing
					</Button>
				</div>
			</div>
		</div>
	</section>
</div>
