<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import SectionHeader from '#lib/components/marketing/section-header.svelte';
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
		Cpu,
		Download,
		Sparkles
	} from '@lucide/svelte';

	const coreFeatures = [
		{
			category: 'Frontline Clinical Operations',
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
					title: 'Automated DHIS2 Reporting UI',
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

<div class="py-16 md:py-24 space-y-24">
	<!-- Hero Header -->
	<section class="container mx-auto px-4 md:px-8 max-w-5xl text-center space-y-6">
		<div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
			Complete Feature Catalog
		</div>
		<h1 class="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
			Every tool required to run a modern, digital Primary Health Centre.
		</h1>
		<p class="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
			Built ground-up for low-resource environments. ClinicFlow combines the depth of an enterprise hospital information system with the resilience of a standalone offline utility.
		</p>
		<div class="flex flex-wrap justify-center gap-4 pt-4">
			<Button href="/welcome" size="lg" class="rounded-full px-8 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20">
				Try Live Prototype <ArrowRight class="ml-2 size-4" />
			</Button>
			<Button href="/download" variant="outline" size="lg" class="rounded-full px-8 font-semibold">
				<Download class="mr-2 size-4" /> Download Installers
			</Button>
		</div>
	</section>

	<!-- Feature Groups -->
	<div class="container mx-auto px-4 md:px-8 max-w-7xl space-y-20">
		{#each coreFeatures as group}
			<section class="space-y-8">
				<div class="border-b border-border/60 pb-4">
					<h2 class="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
						{group.category}
					</h2>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each group.items as item}
						<div class="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
							<div class="space-y-4">
								<div class="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
									<item.icon class="size-6" />
								</div>
								<h3 class="text-lg font-bold text-foreground">{item.title}</h3>
								<p class="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/each}
	</div>

	<!-- AI Safeguards banner -->
	<section class="container mx-auto px-4 md:px-8 max-w-5xl">
		<div class="rounded-3xl border border-border bg-muted/30 p-8 md:p-12 space-y-6">
			<div class="flex items-center gap-3">
				<div class="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
					AI
				</div>
				<h3 class="text-2xl font-bold text-foreground">Safety-First Clinical Intelligence</h3>
			</div>
			<p class="text-muted-foreground leading-relaxed">
				All artificial intelligence features within ClinicFlow are intentionally engineered to augment health workers, not replace them. Diagnostic flags, adverse interaction warnings, and epidemiological pattern detections remain strictly advisory suggestions requiring clinical validation.
			</p>
			<AiDisclaimer />
		</div>
	</section>

	<!-- CTA -->
	<section class="border-t border-border/40 bg-muted/20 py-20 text-center">
		<div class="container mx-auto px-4 max-w-3xl space-y-6">
			<h2 class="text-3xl font-bold tracking-tight text-foreground">Ready to test in your facility?</h2>
			<p class="text-muted-foreground text-lg">
				Deploy ClinicFlow on any existing Android tablet or Windows laptop in minutes.
			</p>
			<div class="flex justify-center gap-4">
				<Button href="/demo" class="rounded-full px-8 font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20">
					Request Pilot Deployment
				</Button>
				<Button href="/pricing" variant="outline" class="rounded-full px-8 font-semibold">
					Review Pricing
				</Button>
			</div>
		</div>
	</section>
</div>
