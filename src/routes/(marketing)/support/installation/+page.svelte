<script lang="ts">
	import { Smartphone, Monitor, Wifi, CheckCircle2, Download, ArrowRight } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<svelte:head>
	<title>Clinic Installation Guide — ClinicFlow Support</title>
	<meta
		name="description"
		content="Step-by-step setup guide for deploying ClinicFlow on Android tablets and Windows laptops in a Nigerian Primary Health Centre."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-4xl py-16 md:py-24 space-y-16">
	<!-- Header -->
	<div class="text-center max-w-2xl mx-auto space-y-4">
		<div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
			Deployment Playbook
		</div>
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
			Facility Installation Guide
		</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			How to configure your clinic’s router, install tablet kiosk applications, and initiate inter-device synchronization in under 30 minutes.
		</p>
	</div>

	<!-- Steps -->
	<div class="space-y-12">
		<!-- Step 1 -->
		<section class="rounded-3xl border border-border bg-card p-8 md:p-10 space-y-4 shadow-sm">
			<div class="flex items-center gap-3">
				<span class="size-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
					1
				</span>
				<h2 class="text-2xl font-bold text-foreground">Set Up the Clinic Local Wi-Fi Router</h2>
			</div>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Position any standard wireless router in a central room (such as the records or triage station). Plug the router into your solar inverter or main power socket.
			</p>
			<ul class="space-y-2 text-sm text-muted-foreground pl-4">
				<li class="flex items-center gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0" />
					<span>Ensure DHCP is enabled so connecting devices receive local IP addresses automatically.</span>
				</li>
				<li class="flex items-center gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0" />
					<span>Internet access is <strong>not required</strong> for the router to operate the local clinic network.</span>
				</li>
			</ul>
		</section>

		<!-- Step 2 -->
		<section class="rounded-3xl border border-border bg-card p-8 md:p-10 space-y-4 shadow-sm">
			<div class="flex items-center gap-3">
				<span class="size-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
					2
				</span>
				<h2 class="text-2xl font-bold text-foreground">Install the Application on Clinic Hardware</h2>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
				<div class="p-5 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
					<div class="flex items-center gap-2 font-bold text-foreground">
						<Smartphone class="size-5 text-primary" /> Android Tablets
					</div>
					<p class="text-xs text-muted-foreground leading-relaxed">
						Download the latest <code class="font-mono text-foreground font-bold">.apk</code> installer from our <a href="/download" class="text-primary hover:underline">Download page</a>. Allow installation from unknown sources, open the APK, and pin it as the default home kiosk launcher.
					</p>
				</div>
				<div class="p-5 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
					<div class="flex items-center gap-2 font-bold text-foreground">
						<Monitor class="size-5 text-blue-600" /> Windows Workstations
					</div>
					<p class="text-xs text-muted-foreground leading-relaxed">
						Download the Windows executable (<code class="font-mono text-foreground font-bold">.exe</code>). Run the installer, sign in with your staff account, and launch the kiosk interface.
					</p>
				</div>
			</div>
		</section>

		<!-- Step 3 -->
		<section class="rounded-3xl border border-border bg-card p-8 md:p-10 space-y-4 shadow-sm">
			<div class="flex items-center gap-3">
				<span class="size-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
					3
				</span>
				<h2 class="text-2xl font-bold text-foreground">Connect to clinicflow.local</h2>
			</div>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Connect all tablets and workstations to your clinic Wi-Fi network. ClinicFlow uses mDNS to broadcast <code class="font-mono text-primary font-bold">clinicflow.local</code> across the router. Devices discover each other without typing IP addresses.
			</p>
			<ul class="space-y-2 text-sm text-muted-foreground pl-4">
				<li class="flex items-center gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0" />
					<span>Patient registrations on Tablet 1 instantly show on the doctor's consultation queue.</span>
				</li>
				<li class="flex items-center gap-2">
					<CheckCircle2 class="size-4 text-primary shrink-0" />
					<span>Prescriptions finalized by the doctor immediately display on the pharmacy tablet.</span>
				</li>
			</ul>
		</section>
	</div>

	<!-- Need help banner -->
	<div class="rounded-2xl border border-border bg-muted/30 p-8 text-center space-y-4">
		<h3 class="text-xl font-bold text-foreground">Need hands-on technical support during setup?</h3>
		<p class="text-sm text-muted-foreground max-w-lg mx-auto">
			Our deployment team provides step-by-step guidance over WhatsApp or in-person for clinics in Edo State.
		</p>
		<Button href="/contact?inquiry=pilot_application" class="rounded-full px-6 font-bold bg-primary text-primary-foreground">
			Request Deployment Assistance
		</Button>
	</div>
</div>
