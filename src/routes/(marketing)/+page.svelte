<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import AwardBadge from '#lib/components/marketing/award-badge.svelte';
	import StatTile from '#lib/components/marketing/stat-tile.svelte';
	import SectionHeader from '#lib/components/marketing/section-header.svelte';
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
		Bell
	} from '@lucide/svelte';
</script>

<svelte:head>
	<title>ClinicFlow — Offline-First Clinic Management for Nigerian PHCs</title>
	<meta
		name="description"
		content="ClinicFlow digitizes Nigerian Primary Health Centres with offline-first patient records, AI clinical decision support, and zero-configuration local networking. Works without internet or stable power."
	/>
</svelte:head>

<!-- ═══════════════════════════════════════════
     1. HERO
════════════════════════════════════════════ -->
<section class="relative overflow-hidden pt-24 pb-32 lg:pt-40 lg:pb-48">
	<!-- Background glows -->
	<div
		class="pointer-events-none absolute -top-64 -right-32 size-[700px] rounded-full bg-primary/10 blur-[140px]"
	></div>
	<div
		class="pointer-events-none absolute -bottom-64 -left-32 size-[700px] rounded-full bg-accent/10 blur-[140px]"
	></div>
	<!-- Grid texture -->
	<div
		class="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]"
	></div>

	<div class="container mx-auto px-4 md:px-8 max-w-5xl relative z-10 text-center">
		<!-- Award badges -->
		<div class="flex flex-wrap justify-center gap-2 mb-8">
			<AwardBadge label="NextGen Knowledge Showcase" sublabel="Top 5 Finalist" variant="gold" />
			<AwardBadge label="3MTT × IdentArk.io" sublabel="2nd Place — National AI Hackathon" variant="silver" />
		</div>

		<h1
			class="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08] mb-6"
		>
			The clinic keeps running<br />
			<span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"
				>when the power doesn't.</span
			>
		</h1>

		<p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium mb-10">
			ClinicFlow digitizes Nigerian Primary Health Centres with offline-first records, AI clinical
			decision support, and zero-configuration local networking. No internet required.
		</p>

		<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
			<Button
				href="/welcome"
				size="lg"
				class="h-14 px-8 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-xl shadow-primary/20 rounded-full btn-press w-full sm:w-auto"
			>
				Get Started Free
				<ArrowRight class="ml-2 size-5" />
			</Button>
			<Button
				href="/demo"
				size="lg"
				variant="outline"
				class="h-14 px-8 text-lg font-bold border-border/80 bg-background/50 hover:bg-muted rounded-full btn-press w-full sm:w-auto"
			>
				Request a Demo
			</Button>
			<Button
				href="/download"
				size="lg"
				variant="ghost"
				class="h-14 px-8 text-lg font-medium hover:bg-muted rounded-full w-full sm:w-auto"
			>
				<Download class="mr-2 size-5" />
				Download App
			</Button>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     2. PROBLEM STRIP — Verified stats
════════════════════════════════════════════ -->
<section class="border-y border-border/40 bg-muted/30 py-14">
	<div class="container mx-auto px-4 md:px-8 max-w-7xl">
		<p class="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8">
			The state of Nigeria's 30,000 public Primary Health Centres
		</p>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
			<StatTile
				value="0 of 10"
				label="PHCs in Egor LGA had a medical records officer"
				source="Adam & Nwaogwugwu, 2020 · DOI:10.4081/acbr.2020.111"
				accent
			/>
			<StatTile
				value="76%"
				label="of PHC workers cite power and internet failures as operational barriers"
				source="IJRSI field survey, July 2026"
			/>
			<StatTile
				value="34"
				label="average paper registers maintained per PHC facility"
				source="BMC Health Services Research, 2021"
			/>
			<StatTile
				value="~10 hrs"
				label="per month spent re-entering records into DHIS2 per facility"
				source="BMC Health Services Research, 2021"
			/>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     3. SOLUTION OVERVIEW
════════════════════════════════════════════ -->
<section class="py-24">
	<div class="container mx-auto px-4 md:px-8 max-w-5xl text-center">
		<SectionHeader
			eyebrow="The Solution"
			heading="One tablet. The whole clinic. No internet needed."
			subheading="A CHEW registers a patient in under a minute. Everything flows to the right screen automatically — queue, vitals, consultation, prescription, pharmacy — with or without connectivity."
		/>

		<!-- Role flow -->
		<div class="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0 mt-10">
			{#each [
				{ label: 'Nurse', sub: 'Register & Triage', icon: Activity, color: 'bg-primary/10 text-primary border-primary/20' },
				{ label: 'Doctor', sub: 'Consult & Prescribe', icon: Stethoscope, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400' },
				{ label: 'Pharmacy', sub: 'Dispense & Stock', icon: FlaskConical, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400' },
				{ label: 'Admin', sub: 'Reports & Oversight', icon: ClipboardList, color: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400' }
			] as role, i}
				<div class="flex md:flex-col items-center gap-3 md:gap-0">
					<div class="flex flex-col items-center gap-3">
						<div
							class="size-16 md:size-20 rounded-2xl border {role.color} flex flex-col items-center justify-center gap-1 shadow-sm"
						>
							<role.icon class="size-7 md:size-8" />
						</div>
						<div class="text-center">
							<p class="font-bold text-sm text-foreground">{role.label}</p>
							<p class="text-xs text-muted-foreground">{role.sub}</p>
						</div>
					</div>
					{#if i < 3}
						<ChevronRight class="size-5 text-muted-foreground md:hidden" />
						<div class="hidden md:block h-px w-10 bg-border mx-2 self-start mt-9"></div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="mt-10 inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-full px-4 py-2 border border-border/40">
			<Wifi class="size-4 text-primary" />
			Tablets auto-connect via <code class="font-mono text-xs text-foreground">clinicflow.local</code> — no IP address, no IT setup
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     4. HOW IT WORKS (Steps)
════════════════════════════════════════════ -->
<section class="py-24 bg-muted/20 border-y border-border/40">
	<div class="container mx-auto px-4 md:px-8 max-w-4xl">
		<SectionHeader
			eyebrow="Workflow"
			heading="How ClinicFlow works"
			subheading="A seamless flow from registration to pharmacy — completely offline."
		/>

		<div class="relative pl-4 md:pl-0">
			{#each [
				{ n: 1, color: 'bg-primary text-primary-foreground', title: 'Patient Arrives — CHEW Registers', body: 'The nurse or CHEW opens the app on a tablet and registers the patient in under a minute. The record is saved locally on the device immediately — no internet required, no waiting.' },
				{ n: 2, color: 'bg-blue-600 text-white', title: 'Vitals Recorded — Smart Triage Fires', body: 'Blood pressure, temperature, SpO₂, and other vitals are entered. The rules engine instantly assigns a Red / Amber / Green triage level, automatically elevating urgent patients to the top of the doctor queue.' },
				{ n: 3, color: 'bg-amber-500 text-white', title: 'Doctor Consults — AI Assists', body: 'The doctor sees the prioritized live queue on their own tablet. They review vitals, document clinical notes, and issue a digital prescription. AI tools flag dangerous drug interactions before the prescription is confirmed.' },
				{ n: 4, color: 'bg-violet-600 text-white', title: 'Pharmacy Dispenses — Stock Updates', body: 'The prescription appears instantly on the pharmacy screen. The pharmacist fulfills the order and stock levels are automatically decremented from local inventory.' },
				{ n: 5, color: 'bg-emerald-600 text-white', title: 'Internet Returns — Everything Syncs', body: 'All of the above happened on the local Wi-Fi network with zero cloud dependency. When an internet connection is detected, records sync encrypted to the cloud for regional oversight and backup.' }
			] as step, i}
				<div class="relative pb-10 md:pb-14 flex gap-6 md:gap-8 {i === 4 ? 'pb-0' : ''}">
					<div class="flex flex-col items-center">
						<div
							class="size-10 md:size-12 rounded-full {step.color} flex items-center justify-center font-bold text-base z-10 shrink-0 shadow-lg ring-4 ring-background"
						>
							{step.n}
						</div>
						{#if i < 4}
							<div class="w-px flex-1 bg-border mt-2"></div>
						{/if}
					</div>
					<div class="pt-1 md:pt-2 pb-2">
						<h3 class="text-lg md:text-xl font-bold text-foreground mb-2">{step.title}</h3>
						<p class="text-muted-foreground leading-relaxed text-sm md:text-base">{step.body}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     5. FEATURE HIGHLIGHTS (6-card grid)
════════════════════════════════════════════ -->
<section class="py-24">
	<div class="container mx-auto px-4 md:px-8 max-w-7xl">
		<SectionHeader
			eyebrow="Features"
			heading="Built for the realities of rural healthcare"
			subheading="Every feature designed to work where traditional cloud EMRs fail."
		/>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			<FeatureCard
				title="100% Offline Resilience"
				description="The entire application runs local-first on IndexedDB. Register patients, run consultations, and dispense medication with zero internet. Syncs automatically when connectivity returns."
			>
				{#snippet icon()}<WifiOff class="size-6" />{/snippet}
			</FeatureCard>

			<FeatureCard
				title="Zero-Config LAN Networking"
				description="The server broadcasts itself as clinicflow.local via mDNS. Tablets find each other on the clinic's Wi-Fi automatically — no IP address, no router config, no IT person needed."
				variant="accent"
			>
				{#snippet icon()}<Wifi class="size-6" />{/snippet}
			</FeatureCard>

			<FeatureCard
				title="Smart Triage Engine"
				description="Vitals are instantly evaluated by a clinical rules engine that assigns Red / Amber / Green priority levels and automatically re-orders the doctor queue in real time."
			>
				{#snippet icon()}<Activity class="size-6" />{/snippet}
			</FeatureCard>

			<FeatureCard
				title="Android & Windows Kiosk"
				description="Packaged via Tauri v2 as an Android APK and Windows installer. Staff cannot accidentally change settings — the app runs locked in kiosk mode on clinic hardware."
			>
				{#snippet icon()}<Smartphone class="size-6" />{/snippet}
			</FeatureCard>

			<FeatureCard
				title="Outbreak Radar"
				description="The admin dashboard monitors symptom clusters across the facility and flags unusual patterns that may indicate a localised outbreak — before it spreads."
				variant="accent"
			>
				{#snippet icon()}<Radar class="size-6" />{/snippet}
			</FeatureCard>

			<FeatureCard
				title="Role-Based Access Control"
				description="8 distinct roles — Nurse, Doctor, Pharmacy, Admin, Field Officer, Maternity, Immunisation, Superadmin — each with tailored dashboards and permission boundaries."
			>
				{#snippet icon()}<Users class="size-6" />{/snippet}
			</FeatureCard>
		</div>

		<div class="mt-10 text-center">
			<Button href="/features" variant="outline" class="rounded-full px-8 font-semibold">
				See all features <ChevronRight class="ml-1 size-4" />
			</Button>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     6. AI FEATURES SECTION
════════════════════════════════════════════ -->
<section class="py-24 bg-muted/20 border-y border-border/40">
	<div class="container mx-auto px-4 md:px-8 max-w-7xl">
		<SectionHeader
			eyebrow="AI Decision Support"
			heading="AI tools that assist, not replace"
			subheading="Every AI feature is a support tool for overstressed health workers — never a substitute for clinical judgment."
		/>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<div class="rounded-2xl border border-border bg-card p-7 space-y-3">
				<div class="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
					<Brain class="size-6" />
				</div>
				<h3 class="font-bold text-lg">Dr. Assist</h3>
				<p class="text-sm text-muted-foreground leading-relaxed">
					Surfaces unusual symptom combinations and flags potential diagnoses during the consultation — particularly valuable in facilities where a doctor may not always be present.
				</p>
				<a href="/support/dr-assist" class="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
					Learn more <ChevronRight class="size-3.5" />
				</a>
			</div>

			<div class="rounded-2xl border border-border bg-card p-7 space-y-3">
				<div class="size-11 rounded-xl bg-accent/20 text-accent-foreground flex items-center justify-center">
					<FlaskConical class="size-6" />
				</div>
				<h3 class="font-bold text-lg">RxBrain</h3>
				<p class="text-sm text-muted-foreground leading-relaxed">
					Checks every prescription against the patient's existing medications and flags dangerous drug interactions before the pharmacist dispenses — a critical safety net where specialist oversight is rare.
				</p>
				<a href="/support/rxbrain" class="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
					Learn more <ChevronRight class="size-3.5" />
				</a>
			</div>

			<div class="rounded-2xl border border-border bg-card p-7 space-y-3">
				<div class="size-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
					<Radar class="size-6" />
				</div>
				<h3 class="font-bold text-lg">Outbreak Radar</h3>
				<p class="text-sm text-muted-foreground leading-relaxed">
					Continuously monitors patient data for unusual epidemiological signals — clustering symptoms, age groups, or geographic patterns — and alerts administrators before a potential outbreak escalates.
				</p>
				<a href="/support/outbreak-radar" class="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
					Learn more <ChevronRight class="size-3.5" />
				</a>
			</div>
		</div>

		<AiDisclaimer />
	</div>
</section>

<!-- ═══════════════════════════════════════════
     7. CLINICAL MODULES
════════════════════════════════════════════ -->
<section class="py-24">
	<div class="container mx-auto px-4 md:px-8 max-w-7xl">
		<SectionHeader
			eyebrow="Clinical Coverage"
			heading="Every module a PHC needs"
		/>

		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
			{#each [
				{ icon: Activity, label: 'Queue & Triage' },
				{ icon: Stethoscope, label: 'Consultations' },
				{ icon: FlaskConical, label: 'Prescriptions' },
				{ icon: Syringe, label: 'Immunisation' },
				{ icon: Baby, label: 'ANC / Maternity' },
				{ icon: Users, label: 'Family Records' },
				{ icon: Radar, label: 'Outbreak Radar' },
				{ icon: ClipboardList, label: 'DHIS2 Reports' },
				{ icon: Bell, label: 'SMS Reminders' },
				{ icon: ShieldCheck, label: 'Role-Based Access' },
				{ icon: Smartphone, label: 'Android Kiosk' },
				{ icon: Wifi, label: 'LAN Sync' }
			] as module}
				<div class="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center hover:border-primary/30 hover:bg-primary/5 transition-colors">
					<module.icon class="size-5 text-muted-foreground" />
					<span class="text-xs font-medium text-foreground leading-tight">{module.label}</span>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     8. TRACTION / SOCIAL PROOF
════════════════════════════════════════════ -->
<section class="py-24 bg-muted/20 border-y border-border/40">
	<div class="container mx-auto px-4 md:px-8 max-w-5xl text-center">
		<SectionHeader
			eyebrow="Traction"
			heading="Built. Working. Independently validated."
		/>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
			<div class="rounded-2xl border border-border bg-card p-7 space-y-3">
				<div class="text-4xl font-extrabold text-primary">2.5<span class="text-2xl"> mo</span></div>
				<p class="text-sm text-muted-foreground">From first commit to fully working prototype with 8 clinical modules, CI/CD, and nightly Android APK builds.</p>
			</div>
			<div class="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-7 space-y-3">
				<AwardBadge label="NextGen Knowledge Showcase" sublabel="Top 5 Finalist" variant="gold" />
				<p class="text-sm text-muted-foreground">Selected from a nationwide pool of Nigerian student innovators. Pitching at the Stripe Community Pitch Day, November 2026.</p>
			</div>
			<div class="rounded-2xl border border-border bg-card p-7 space-y-3">
				<AwardBadge label="3MTT × IdentArk.io" sublabel="2nd Place — National AI Hackathon" variant="silver" />
				<p class="text-sm text-muted-foreground">Ranked 2nd from a national pool of AI projects. Pitch Day: September 19, 2026 — judged by an independent technical panel.</p>
			</div>
		</div>

		<div class="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
			{#each [
				'SvelteKit 5 + Svelte 5',
				'Dexie IndexedDB',
				'Drizzle ORM + PostgreSQL',
				'Gemini API + WebLLM',
				'Tauri v2 (Android + Windows)',
				'GitHub Actions CI'
			] as tech}
				<span class="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 font-mono text-xs">
					<CheckCircle2 class="size-3 text-primary" />
					{tech}
				</span>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     9. PRICING TEASER
════════════════════════════════════════════ -->
<section class="py-24">
	<div class="container mx-auto px-4 md:px-8 max-w-4xl text-center">
		<SectionHeader
			eyebrow="Pricing"
			heading="Free for pilot clinics. Affordable at scale."
			subheading="ClinicFlow is free for approved partner PHCs during the pilot period. Post-pilot pricing is designed for State agency contracts — not per-patient fees."
		/>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-5 text-left mb-8">
			<div class="rounded-2xl border border-border bg-card p-6 space-y-2">
				<p class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pilot PHCs</p>
				<p class="text-3xl font-extrabold text-foreground">Free</p>
				<p class="text-sm text-muted-foreground">For approved partner Primary Health Centres during the grant pilot period.</p>
			</div>
			<div class="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-2 relative overflow-hidden">
				<div class="absolute top-0 inset-x-0 h-1 bg-primary rounded-t-2xl"></div>
				<p class="text-xs font-bold uppercase tracking-widest text-primary">Public PHCs</p>
				<p class="text-3xl font-extrabold text-foreground">₦30k<span class="text-lg font-normal text-muted-foreground">/facility/mo</span></p>
				<p class="text-sm text-muted-foreground">Billed as an annual contract to the State Primary Health Care Development Agency.</p>
			</div>
			<div class="rounded-2xl border border-border bg-card p-6 space-y-2">
				<p class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Private & NGO</p>
				<p class="text-3xl font-extrabold text-foreground">Custom</p>
				<p class="text-sm text-muted-foreground">Tailored pricing for private clinics, hospitals, and international health NGOs.</p>
			</div>
		</div>

		<Button href="/pricing" variant="outline" class="rounded-full px-8 font-semibold">
			See full pricing details <ChevronRight class="ml-1 size-4" />
		</Button>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     10. CTA BAND
════════════════════════════════════════════ -->
<section class="py-24 bg-primary/5 border-y border-primary/10 relative overflow-hidden">
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,hsl(var(--primary)/0.12),transparent)]"
	></div>
	<div class="container mx-auto px-4 md:px-8 max-w-3xl text-center relative z-10">
		<h2 class="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
			Ready to digitize your clinic?
		</h2>
		<p class="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
			Join the pilot programme or download the app today. No subscription needed to get started.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<Button
				href="/demo"
				size="lg"
				class="h-14 px-8 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-xl shadow-primary/20 rounded-full btn-press"
			>
				Request a Pilot Demo
				<ArrowRight class="ml-2 size-5" />
			</Button>
			<Button
				href="/download"
				size="lg"
				variant="outline"
				class="h-14 px-8 text-lg font-bold border-border/80 bg-background/50 hover:bg-muted rounded-full btn-press"
			>
				<Download class="mr-2 size-5" />
				Download the App
			</Button>
		</div>
	</div>
</section>
