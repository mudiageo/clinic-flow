<script lang="ts">
	import {
		ShieldCheck,
		Lock,
		HardDrive,
		KeyRound,
		EyeOff,
		CheckCircle2,
		FileText
	} from '@lucide/svelte';
</script>

<svelte:head>
	<title>Security & Data Protection — ClinicFlow</title>
	<meta
		name="description"
		content="How ClinicFlow safeguards patient health data: local-first encryption, role-based access, and strict alignment with the Nigeria Data Protection Act 2023."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-20 space-y-16">
	<!-- Editorial Header -->
	<div class="border-b border-border/70 pb-8 space-y-3">
		<p class="text-xs font-mono uppercase tracking-wider text-primary">Health Data Governance</p>
		<h1 class="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
			Security engineered for frontline healthcare.
		</h1>
		<p class="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
			Protecting sensitive patient records in low-resource environments requires a defense-in-depth
			approach that works both disconnected and in the cloud.
		</p>
	</div>

	<!-- Core Pillars -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-4">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<HardDrive class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Local-First Data Isolation</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Unlike traditional web EMRs that expose all patient records directly over public HTTP
				endpoints, ClinicFlow stores active clinical records in sandboxed IndexedDB and encrypted
				local SQLite databases on clinic devices.
			</p>
		</div>

		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-4">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<Lock class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Encryption in Transit & at Rest</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				All inter-device synchronization across local Wi-Fi and uplink syncing to central cloud
				backups use TLS 1.3 and cryptographic hashing to prevent packet sniffing or
				man-in-the-middle tampering.
			</p>
		</div>

		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-4">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<KeyRound class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Granular Role-Based Access</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Staff access is strictly segregated by medical role. Pharmacy technicians only access
				prescription dispensation; triage nurses view triage and intake; doctors view clinical
				notes. Administrative privileges are logged and audit-trailed.
			</p>
		</div>

		<div class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-4">
			<div class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
				<EyeOff class="size-5" />
			</div>
			<h3 class="text-lg font-bold text-foreground">AI Privacy Safeguards</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Clinical prompts routed to AI decision support APIs are stripped of direct patient
				identifiers (names, home addresses, phone numbers) before transmission, mitigating
				cross-border privacy risks.
			</p>
		</div>
	</div>

	<!-- Compliance & Policy -->
	<section class="rounded-lg border border-border bg-muted/20 p-6 md:p-10 space-y-6">
		<div class="space-y-2">
			<p class="text-xs font-mono uppercase tracking-wider text-primary">Regulatory Alignment</p>
			<h2 class="text-2xl font-bold text-foreground">
				Compliance with Nigeria Data Protection Act (NDPA 2023)
			</h2>
		</div>
		<p class="text-muted-foreground leading-relaxed text-sm md:text-base">
			Health records are classified as sensitive personal data under Nigerian privacy jurisprudence.
			ClinicFlow is structured to meet data protection principles mandated by the Nigeria Data
			Protection Commission (NDPC):
		</p>
		<ul class="space-y-3 text-sm text-muted-foreground">
			<li class="flex items-start gap-2.5">
				<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
				<span
					><strong class="text-foreground">Data Minimization:</strong> Only vital demographic and clinical
					indicators necessary for patient care are gathered.</span
				>
			</li>
			<li class="flex items-start gap-2.5">
				<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
				<span
					><strong class="text-foreground">Data Sovereignty:</strong> Primary health facility data is
					stored within certified infrastructure aligned with national health IT requirements.</span
				>
			</li>
			<li class="flex items-start gap-2.5">
				<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
				<span
					><strong class="text-foreground">Audit Trail Accountability:</strong> Critical clinical edits,
					medication dispenses, and patient discharges are timestamped to responsible staff IDs.</span
				>
			</li>
			<li class="flex items-start gap-2.5">
				<CheckCircle2 class="size-4 text-primary shrink-0 mt-0.5" />
				<span
					><strong class="text-foreground">Patient Rights & Portability:</strong> Patients and custodians
					can export longitudinal records in standardized FHIR-compliant formats.</span
				>
			</li>
		</ul>
	</section>

	<!-- Responsible Disclosure -->
	<section class="border-t border-border/70 pt-8 space-y-3">
		<h3 class="text-lg font-bold text-foreground">Responsible Security Disclosure</h3>
		<p class="text-sm text-muted-foreground leading-relaxed max-w-3xl">
			We welcome security researchers and peer reviewers. If you discover a vulnerability or
			security flaw in ClinicFlow, please contact our engineering team directly at <a
				href="mailto:security@mudiageotech.com"
				class="text-primary font-semibold hover:underline">security@mudiageotech.com</a
			> before public disclosure. We review and remediate reported issues with urgency.
		</p>
	</section>
</div>
