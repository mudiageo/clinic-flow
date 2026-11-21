<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import AwardBadge from '#lib/components/marketing/award-badge.svelte';
	import StatTile from '#lib/components/marketing/stat-tile.svelte';
	import FeatureCard from '#lib/components/marketing/feature-card.svelte';
	import AiDisclaimer from '#lib/components/ui/ai-disclaimer.svelte';
	import {
		ArrowRight,
		WifiOff,
		Stethoscope,
		Download,
		Smartphone,
		Wifi,
		ShieldCheck,
		Activity,
		Radar,
		Users,
		Brain,
		FlaskConical,
		ChevronRight,
		CheckCircle2,
		Syringe,
		Baby,
		ClipboardList,
		ArrowUpRight,
		Layers,
		Database,
		Clock
	} from '@lucide/svelte';
</script>

<svelte:head>
	<title>ClinicFlow — Offline-First Operating System for Nigerian PHCs</title>
	<meta
		name="description"
		content="ClinicFlow digitizes Nigerian Primary Health Centres with offline-first patient records, automated smart triage, local zero-config sync, and clinical safety guardrails. Operates with zero internet."
	/>
</svelte:head>

<!-- ═══════════════════════════════════════════
     1. HERO (Asymmetric Editorial + Live Station Preview)
════════════════════════════════════════════ -->
<section
	class="relative overflow-hidden border-b border-border bg-background pt-12 pb-20 lg:pt-20 lg:pb-28"
>
	<!-- Subtle ambient illumination -->
	<div
		class="pointer-events-none absolute -top-40 right-1/4 size-96 rounded-full bg-primary/5 blur-3xl"
	></div>

	<div class="container mx-auto px-4 md:px-8 max-w-7xl">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
			<!-- Left: Editorial Headline & Actions -->
			<div class="lg:col-span-7 space-y-6 text-left">
				<!-- Accreditations & Validations -->
				<div
					class="inline-flex flex-wrap items-center gap-2 p-1 pr-3 rounded-md border border-border bg-muted/40 text-xs text-muted-foreground font-medium"
				>
					<span
						class="px-2 py-0.5 rounded bg-primary text-primary-foreground font-mono text-[11px] font-semibold"
						>PILOT</span
					>
					<span>NextGen Top 5 Finalist · 3MTT AI Hackathon 2nd Place</span>
				</div>

				<h1
					class="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08]"
				>
					The clinic keeps running <br class="hidden sm:inline" />
					<span class="text-primary">when the grid doesn't.</span>
				</h1>

				<p class="text-base sm:text-lg text-muted-foreground max-w-2xl font-normal leading-relaxed">
					ClinicFlow is an offline-first clinical operating system engineered for Primary Health
					Centres. Instant patient intake, automated triage, and local Wi-Fi peer synchronization —
					designed specifically for facilities operating without continuous electricity or cellular
					data.
				</p>

				<!-- CTAs -->
				<div class="flex flex-wrap items-center gap-3 pt-2">
					<Button
						href="/welcome"
						class="h-11 px-6 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm transition-all"
					>
						Get Started Free
						<ArrowRight class="ml-2 size-4" />
					</Button>
					<Button
						href="/demo"
						variant="outline"
						class="h-11 px-5 text-sm font-semibold rounded-md border-border bg-background hover:bg-muted transition-colors"
					>
						Request Facility Demo
					</Button>
					<Button
						href="/download"
						variant="ghost"
						class="h-11 px-4 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md"
					>
						<Download class="mr-2 size-4" />
						Download APK & Desktop
					</Button>
				</div>

				<!-- Trust metrics checklist -->
				<div
					class="pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground"
				>
					<div class="flex items-center gap-2">
						<CheckCircle2 class="size-4 text-primary shrink-0" />
						<span>100% offline local reads & writes</span>
					</div>
					<div class="flex items-center gap-2">
						<CheckCircle2 class="size-4 text-primary shrink-0" />
						<span>Zero-config mDNS Wi-Fi mesh</span>
					</div>
					<div class="flex items-center gap-2">
						<CheckCircle2 class="size-4 text-primary shrink-0" />
						<span>NDPR health privacy compliant</span>
					</div>
				</div>
			</div>

			<!-- Right: Concrete Clinical Station Card (Product Demonstration) -->
			<div class="lg:col-span-5">
				<div class="rounded-xl border border-border bg-card shadow-xl overflow-hidden font-sans">
					<!-- Station Header -->
					<div
						class="border-b border-border bg-muted/50 px-4 py-3 flex items-center justify-between text-xs"
					>
						<div class="flex items-center gap-2">
							<span class="size-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
							<span class="font-mono font-semibold text-foreground">Oredo PHC · Station 01</span>
						</div>
						<span class="font-mono text-muted-foreground">Local Mesh (Active)</span>
					</div>

					<!-- Station Body -->
					<div class="p-5 space-y-4">
						<!-- Live Status Indicators -->
						<div class="grid grid-cols-3 gap-2 text-center">
							<div class="rounded-md border border-border p-2 bg-background">
								<p class="text-[10px] text-muted-foreground font-mono">ACTIVE QUEUE</p>
								<p class="text-lg font-bold text-foreground font-mono">14</p>
							</div>
							<div class="rounded-md border border-border p-2 bg-background">
								<p class="text-[10px] text-muted-foreground font-mono">AVG TRIAGE WAIT</p>
								<p class="text-lg font-bold text-foreground font-mono">6m</p>
							</div>
							<div class="rounded-md border border-border p-2 bg-background">
								<p class="text-[10px] text-muted-foreground font-mono">PENDING UPLINK</p>
								<p class="text-lg font-bold text-primary font-mono">42 ops</p>
							</div>
						</div>

						<!-- Active Triage Patient Slip -->
						<div class="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2.5">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span
										class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-white"
									>
										AMBER PRIORITY
									</span>
									<span class="font-semibold text-sm text-foreground">Amina Lawal</span>
								</div>
								<span class="text-xs text-muted-foreground font-mono">28y · Female</span>
							</div>

							<div class="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
								<div>
									<span class="text-muted-foreground block text-[10px]">BP</span>
									<span class="font-semibold text-foreground">145/95 mmHg</span>
								</div>
								<div>
									<span class="text-muted-foreground block text-[10px]">TEMP</span>
									<span class="font-semibold text-foreground">38.4 °C</span>
								</div>
								<div>
									<span class="text-muted-foreground block text-[10px]">SpO₂</span>
									<span class="font-semibold text-foreground">98%</span>
								</div>
							</div>

							<div
								class="pt-1 text-xs text-muted-foreground border-t border-amber-500/20 flex items-center justify-between"
							>
								<span>Chief Complaint: High fever & severe rigors × 3d</span>
								<span class="text-foreground font-medium font-mono text-[11px]"
									>→ Room 01 (Doctor)</span
								>
							</div>
						</div>

						<!-- Offline Network Status -->
						<div
							class="rounded-md border border-border bg-muted/40 p-3 flex items-start gap-3 text-xs"
						>
							<WifiOff class="size-4 text-muted-foreground shrink-0 mt-0.5" />
							<div>
								<p class="font-semibold text-foreground">Operating Without Cellular Internet</p>
								<p class="text-muted-foreground text-[11px] mt-0.5 leading-normal">
									Prescriptions and vitals synchronize across staff tablets via local router Wi-Fi.
									Records queue in Dexie IndexedDB and flush automatically on next uplink.
								</p>
							</div>
						</div>
					</div>

					<!-- Station Footer -->
					<div
						class="border-t border-border px-4 py-2.5 bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground font-mono"
					>
						<span>IndexedDB (Dexie) + SQLite Core</span>
						<span class="text-emerald-600 dark:text-emerald-400 font-semibold"
							>● 0 Sync Conflicts</span
						>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     2. THE NIGERIAN PHC REALITY (Verified Data Strip)
════════════════════════════════════════════ -->
<section class="border-b border-border bg-muted/20 py-16">
	<div class="container mx-auto px-4 md:px-8 max-w-7xl">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
			<div class="lg:col-span-4 space-y-3">
				<p class="text-xs font-mono font-semibold tracking-wider text-primary">FIELD REALITY</p>
				<h2
					class="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight"
				>
					Why traditional cloud EMRs fail in rural clinics.
				</h2>
				<p class="text-sm text-muted-foreground leading-relaxed">
					Nigeria’s 30,000 public Primary Health Centres deliver frontline care under chronic power
					cuts, intermittent cellular coverage, and severe paper documentation overload.
				</p>
			</div>

			<div class="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
				<StatTile
					value="0 of 10"
					label="PHCs in Egor LGA had a dedicated records officer"
					source="Adam & Nwaogwugwu, 2020 · DOI:10.4081/acbr.2020.111"
					accent
				/>
				<StatTile
					value="76%"
					label="of health workers report power and network as primary EMR bottlenecks"
					source="IJRSI Primary Health Survey, 2026"
				/>
				<StatTile
					value="34"
					label="separate paper registers maintained per facility"
					source="BMC Health Services Research"
				/>
				<StatTile
					value="~10 hrs"
					label="lost monthly per clinic re-keying paper data into DHIS2"
					source="National Health Information Policy"
				/>
			</div>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     3. CLINICAL WORKFLOW ARCHITECTURE
════════════════════════════════════════════ -->
<section class="py-20 border-b border-border bg-background">
	<div class="container mx-auto px-4 md:px-8 max-w-7xl space-y-12">
		<div class="max-w-2xl">
			<p class="text-xs font-mono font-semibold tracking-wider text-primary mb-2">
				END-TO-END FLOW
			</p>
			<h2
				class="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight"
			>
				How clinical data travels inside an offline facility.
			</h2>
			<p class="text-muted-foreground text-sm sm:text-base mt-3 leading-relaxed">
				From the triage bench to the pharmacy hatch, records update concurrently across staff
				devices over local Wi-Fi without needing an internet connection.
			</p>
		</div>

		<!-- Step Sequence Cards -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
			<div
				class="rounded-lg border border-border bg-card p-6 flex flex-col justify-between space-y-4"
			>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="font-mono text-xs font-bold text-primary">01 / INTAKE</span>
						<Activity class="size-5 text-muted-foreground" />
					</div>
					<h3 class="font-bold text-base text-foreground tracking-tight">
						CHEW Registration & Triage
					</h3>
					<p class="text-xs text-muted-foreground leading-relaxed">
						Patient is registered in under 60 seconds on a low-cost Android tablet. Vitals trigger
						automated Red/Amber/Green urgency calculation immediately.
					</p>
				</div>
				<div class="pt-3 border-t border-border text-[11px] font-mono text-muted-foreground">
					Saved directly to IndexedDB
				</div>
			</div>

			<div
				class="rounded-lg border border-border bg-card p-6 flex flex-col justify-between space-y-4"
			>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="font-mono text-xs font-bold text-primary">02 / CONSULT</span>
						<Stethoscope class="size-5 text-muted-foreground" />
					</div>
					<h3 class="font-bold text-base text-foreground tracking-tight">Doctor Examination</h3>
					<p class="text-xs text-muted-foreground leading-relaxed">
						Doctor’s tablet receives prioritized queue via local peer mesh. Clinical history,
						diagnoses, and digital prescriptions are logged with zero UI lag.
					</p>
				</div>
				<div class="pt-3 border-t border-border text-[11px] font-mono text-muted-foreground">
					Assisted by Dr. Assist safety net
				</div>
			</div>

			<div
				class="rounded-lg border border-border bg-card p-6 flex flex-col justify-between space-y-4"
			>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="font-mono text-xs font-bold text-primary">03 / DISPENSE</span>
						<FlaskConical class="size-5 text-muted-foreground" />
					</div>
					<h3 class="font-bold text-base text-foreground tracking-tight">
						Pharmacy Stock Decrement
					</h3>
					<p class="text-xs text-muted-foreground leading-relaxed">
						Prescription appears instantly at the dispensary. Dispensing decrements local stock
						counts and warns of low inventory or impending stockouts.
					</p>
				</div>
				<div class="pt-3 border-t border-border text-[11px] font-mono text-muted-foreground">
					RxBrain drug-drug checks
				</div>
			</div>

			<div
				class="rounded-lg border border-border bg-card p-6 flex flex-col justify-between space-y-4"
			>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="font-mono text-xs font-bold text-primary">04 / UPLINK</span>
						<Database class="size-5 text-muted-foreground" />
					</div>
					<h3 class="font-bold text-base text-foreground tracking-tight">
						Opportunistic Cloud Sync
					</h3>
					<p class="text-xs text-muted-foreground leading-relaxed">
						When any cellular hotspot or dongle connection is detected, the local edge server pushes
						queued operations to the central state PostgreSQL database.
					</p>
				</div>
				<div class="pt-3 border-t border-border text-[11px] font-mono text-muted-foreground">
					Monotonic idempotent outbox
				</div>
			</div>
		</div>

		<!-- mDNS Callout -->
		<div
			class="rounded-lg border border-border bg-muted/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
		>
			<div class="flex items-center gap-3">
				<div
					class="size-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0"
				>
					<Wifi class="size-4" />
				</div>
				<div>
					<span class="font-semibold text-foreground">Zero-configuration network discovery:</span>
					<span class="text-muted-foreground ml-1"
						>Staff tablets resolve the clinic server automatically at</span
					>
					<code
						class="font-mono text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-background border border-border ml-1"
						>clinicflow.local:3000</code
					>
				</div>
			</div>
			<a
				href="/support/installation"
				class="text-primary font-medium hover:underline inline-flex items-center gap-1 shrink-0"
			>
				Read hardware guide <ChevronRight class="size-3" />
			</a>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     4. CLINICAL CAPABILITIES (Modular Suite)
════════════════════════════════════════════ -->
<section class="py-20 border-b border-border bg-muted/20">
	<div class="container mx-auto px-4 md:px-8 max-w-7xl space-y-10">
		<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
			<div class="max-w-xl">
				<p class="text-xs font-mono font-semibold tracking-wider text-primary mb-2">
					COMPLETE COVERAGE
				</p>
				<h2
					class="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight"
				>
					Every essential primary care workflow.
				</h2>
			</div>
			<Button
				href="/features"
				variant="outline"
				class="rounded-md h-9 text-xs font-semibold self-start sm:self-auto"
			>
				View technical specifications <ArrowUpRight class="ml-1 size-3.5" />
			</Button>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
			<FeatureCard
				title="Automated Triage Engine"
				description="Patient vitals (BP, SpO₂, pulse, temperature) are checked against clinical threshold rules to auto-assign Red/Amber/Green urgency levels."
			>
				{#snippet icon()}<Activity class="size-5" />{/snippet}
			</FeatureCard>

			<FeatureCard
				title="Maternity & Antenatal Care (ANC)"
				description="Specialized longitudinal tracking for gestational age, fundal height, expected delivery date, maternal lab results, and high-risk pregnancy alerts."
			>
				{#snippet icon()}<Baby class="size-5" />{/snippet}
			</FeatureCard>

			<FeatureCard
				title="NPHCDA Immunisation Schedule"
				description="Batch-controlled child vaccine schedule management, tracking missed doses, community outreach registers, and adverse event reporting."
			>
				{#snippet icon()}<Syringe class="size-5" />{/snippet}
			</FeatureCard>

			<FeatureCard
				title="Family Folders & Household Health"
				description="Groups patients by household units, allowing community health extension workers (CHEWs) to trace family epidemiological patterns."
			>
				{#snippet icon()}<Users class="size-5" />{/snippet}
			</FeatureCard>

			<FeatureCard
				title="Automated DHIS2 Reporting"
				description="Generates national health indicators directly from daily clinical entries, eliminating hours of manual paper tally reconciliation."
			>
				{#snippet icon()}<ClipboardList class="size-5" />{/snippet}
			</FeatureCard>

			<FeatureCard
				title="Role-Based Security & Audit Trail"
				description="Strict role isolation for Nurses, Doctors, Pharmacists, and Records Officers with immutable, medicolegally defensible action logs."
			>
				{#snippet icon()}<ShieldCheck class="size-5" />{/snippet}
			</FeatureCard>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     5. AI CLINICAL SAFETY GUARDS
════════════════════════════════════════════ -->
<section class="py-20 border-b border-border bg-background">
	<div class="container mx-auto px-4 md:px-8 max-w-7xl">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
			<div class="lg:col-span-5 space-y-4">
				<p class="text-xs font-mono font-semibold tracking-wider text-primary">CLINICAL SAFETY</p>
				<h2
					class="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight"
				>
					Decision support that protects, not replaces, clinicians.
				</h2>
				<p class="text-sm text-muted-foreground leading-relaxed">
					Rural clinics often operate without a full-time resident physician. ClinicFlow
					incorporates dual clinical safety nets with strict human-in-the-loop validation to assist
					overstressed frontline workers.
				</p>
				<div class="pt-2">
					<AiDisclaimer />
				</div>
			</div>

			<div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
				<div class="rounded-lg border border-border bg-card p-6 space-y-3">
					<div
						class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center"
					>
						<Brain class="size-5" />
					</div>
					<h3 class="font-bold text-base text-foreground tracking-tight">
						Dr. Assist Diagnostic Guide
					</h3>
					<p class="text-xs text-muted-foreground leading-relaxed">
						Evaluates documented symptom combinations against standardized national clinical
						guidelines. Flags atypical disease patterns and suggests confirmatory lab tests before
						patient departure.
					</p>
					<a
						href="/support/dr-assist"
						class="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
					>
						Review clinical protocol <ChevronRight class="size-3" />
					</a>
				</div>

				<div class="rounded-lg border border-border bg-card p-6 space-y-3">
					<div
						class="size-10 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center"
					>
						<FlaskConical class="size-5" />
					</div>
					<h3 class="font-bold text-base text-foreground tracking-tight">
						RxBrain Interaction Screening
					</h3>
					<p class="text-xs text-muted-foreground leading-relaxed">
						Screens every prescribed medication in real time against known drug-drug interactions,
						patient allergies, and pediatric contraindications before dispensation is authorized.
					</p>
					<a
						href="/support/rxbrain"
						class="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
					>
						Drug database coverage <ChevronRight class="size-3" />
					</a>
				</div>

				<div class="sm:col-span-2 rounded-lg border border-border bg-muted/40 p-5 space-y-2">
					<div class="flex items-center gap-2">
						<Radar class="size-4 text-primary" />
						<span class="font-bold text-sm text-foreground">Outbreak Radar Early Warning</span>
					</div>
					<p class="text-xs text-muted-foreground leading-relaxed">
						Monitors aggregated syndromic trends across the facility. Flags localized case clusters
						(cholera, measles, hemorrhagic fever symptoms) to local public health epidemiologists
						before widespread outbreaks occur.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     6. PRICING & SCALE (Transparent Tiers)
════════════════════════════════════════════ -->
<section class="py-20 border-b border-border bg-muted/20">
	<div class="container mx-auto px-4 md:px-8 max-w-7xl space-y-12">
		<div class="text-center max-w-2xl mx-auto space-y-3">
			<p class="text-xs font-mono font-semibold tracking-wider text-primary">
				INSTITUTIONAL PRICING
			</p>
			<h2
				class="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight"
			>
				Free for pilot facilities. Transparent at state scale.
			</h2>
			<p class="text-muted-foreground text-sm sm:text-base leading-relaxed">
				ClinicFlow is licensed per facility contract through State Primary Health Care Development
				Agencies (SPHCDA) or healthcare partners — never charged per patient.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
			<div
				class="rounded-lg border border-border bg-card p-6 flex flex-col justify-between space-y-6"
			>
				<div class="space-y-4">
					<div>
						<p class="text-xs font-mono text-muted-foreground uppercase font-bold">PILOT PHCS</p>
						<div class="mt-2 text-3xl font-extrabold text-foreground font-mono">Free</div>
						<p class="text-xs text-muted-foreground mt-1">Full grant-supported deployment</p>
					</div>
					<ul class="space-y-2.5 text-xs text-muted-foreground">
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> Up to 5 tablets per PHC facility
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> Full local-first clinical module
							suite
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> On-site staff training and setup
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> Monthly cloud backup & DHIS2 export
						</li>
					</ul>
				</div>
				<Button href="/demo" variant="outline" class="w-full text-xs font-semibold rounded-md h-9">
					Apply for Pilot Cohort
				</Button>
			</div>

			<div
				class="rounded-lg border-2 border-primary bg-card p-6 flex flex-col justify-between space-y-6 relative shadow-lg"
			>
				<div class="space-y-4">
					<div>
						<div class="flex items-center justify-between">
							<p class="text-xs font-mono text-primary uppercase font-bold">PUBLIC PHC NETWORK</p>
							<span
								class="px-2 py-0.5 rounded text-[10px] font-mono bg-primary text-primary-foreground font-semibold"
								>RECOMMENDED</span
							>
						</div>
						<div class="mt-2 text-3xl font-extrabold text-foreground font-mono">
							₦30,000 <span class="text-xs font-normal text-muted-foreground"
								>/ facility / month</span
							>
						</div>
						<p class="text-xs text-muted-foreground mt-1">
							Billed annually to State Health Agencies
						</p>
					</div>
					<ul class="space-y-2.5 text-xs text-foreground">
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> Unlimited patient records & consultations
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> State-level Outbreak Radar monitoring
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> Central pharmacy drug supply tracking
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> Automated monthly DHIS2 pipeline
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> Dedicated LGA field support SLA
						</li>
					</ul>
				</div>
				<Button
					href="/contact"
					class="w-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md h-9 shadow-sm"
				>
					Contact State Partnership Team
				</Button>
			</div>

			<div
				class="rounded-lg border border-border bg-card p-6 flex flex-col justify-between space-y-6"
			>
				<div class="space-y-4">
					<div>
						<p class="text-xs font-mono text-muted-foreground uppercase font-bold">
							PRIVATE & NGOS
						</p>
						<div class="mt-2 text-3xl font-extrabold text-foreground font-mono">Custom</div>
						<p class="text-xs text-muted-foreground mt-1">Tailored for hospitals & aid missions</p>
					</div>
					<ul class="space-y-2.5 text-xs text-muted-foreground">
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> Multi-site clinic management
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> Custom laboratory and billing integrations
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> Dedicated VPC cloud tenant deployment
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle2 class="size-3.5 text-primary shrink-0" /> Custom indicator exports & NGO dashboards
						</li>
					</ul>
				</div>
				<Button
					href="/solutions/ngos"
					variant="outline"
					class="w-full text-xs font-semibold rounded-md h-9"
				>
					Explore NGO Solutions
				</Button>
			</div>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     7. CLOSING ACTION (High-Contrast Heroic Banner)
════════════════════════════════════════════ -->
<section class="py-20 bg-background">
	<div class="container mx-auto px-4 md:px-8 max-w-5xl">
		<div
			class="rounded-xl border border-border bg-card p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm"
		>
			<div class="space-y-2 max-w-xl text-left">
				<h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
					Ready to modernize your primary care facility?
				</h2>
				<p class="text-sm text-muted-foreground leading-relaxed">
					Download the standalone Android or Windows client, or schedule a physical demonstration
					with our team.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-3 shrink-0">
				<Button
					href="/welcome"
					class="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5 h-10 rounded-md text-sm shadow-sm"
				>
					Launch Web App
					<ArrowRight class="ml-2 size-4" />
				</Button>
				<Button
					href="/download"
					variant="outline"
					class="font-medium px-4 h-10 rounded-md text-sm border-border"
				>
					<Download class="mr-2 size-4" />
					Download Installer
				</Button>
			</div>
		</div>
	</div>
</section>
