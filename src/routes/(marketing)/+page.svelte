<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		ArrowRight,
		WifiOff,
		LayoutDashboard,
		Stethoscope,
		Download,
		Building2
	} from '@lucide/svelte';
</script>

<svelte:head>
	<title>ClinicFlow — Offline-First Hospital Management for Rural Clinics</title>
	<meta
		name="description"
		content="ClinicFlow brings fast, resilient, offline-first digital infrastructure to Primary Healthcare Centers in Nigeria."
	/>
</svelte:head>

<!-- Hero Section -->
<section class="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
	<div
		class="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] dark:bg-bottom"
	></div>
	<div
		class="absolute w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] -top-64 -right-32 pointer-events-none"
	></div>
	<div
		class="absolute w-[600px] h-[600px] rounded-full bg-accent/10 blur-[120px] -bottom-64 -left-32 pointer-events-none"
	></div>

	<div class="container mx-auto px-4 md:px-8 max-w-7xl relative z-10 text-center">
		<div
			class="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8 animate-fade-in"
		>
			<span class="flex size-2 rounded-full bg-primary mr-2 animate-pulse"></span>
			Now available for Windows & Android Kiosks
		</div>

		<h1
			class="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1] animate-slide-up"
			style="animation-delay: 100ms;"
		>
			Offline-First Hospital Management for <span
				class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"
				>Rural Clinics</span
			>
		</h1>

		<p
			class="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium animate-slide-up"
			style="animation-delay: 200ms;"
		>
			Digitize patient records, manage triage queues, and dispense medications without relying on
			internet connectivity. Built specifically for Primary Healthcare Centers.
		</p>

		<div
			class="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up"
			style="animation-delay: 300ms;"
		>
			<Button
				href="/register"
				size="lg"
				class="h-14 px-8 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-xl shadow-primary/20 rounded-full btn-press w-full sm:w-auto"
			>
				Register Your PHC
				<Building2 class="ml-2 size-5" />
			</Button>
			<Button
				href="/download"
				size="lg"
				variant="outline"
				class="h-14 px-8 text-lg font-bold border-border/80 bg-background/50 hover:bg-muted rounded-full btn-press w-full sm:w-auto"
			>
				Download the App
				<Download class="ml-2 size-5" />
			</Button>
		</div>
	</div>
</section>

<!-- How it works Stepper -->
<section class="py-24 relative overflow-hidden">
	<div class="container mx-auto px-4 md:px-8 max-w-4xl">
		<div class="text-center mb-16">
			<h2 class="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
				How ClinicFlow Works
			</h2>
			<p class="mt-4 text-muted-foreground text-lg">
				A seamless workflow from registration to pharmacy, completely offline.
			</p>
		</div>

		<div class="relative pl-4 md:pl-0">
			<!-- Step 1 -->
			<div class="relative pb-12 md:pb-16 flex gap-6 md:gap-8">
				<div class="flex flex-col items-center">
					<div class="size-10 md:size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg z-10 shrink-0 shadow-lg ring-4 ring-background">
						1
					</div>
					<div class="w-px h-full bg-border absolute top-10 md:top-12 bottom-0 left-5 md:left-6 -z-10"></div>
				</div>
				<div class="pt-1 md:pt-2">
					<h3 class="text-xl md:text-2xl font-bold text-foreground mb-2">Nurse Registration & Triage</h3>
					<p class="text-muted-foreground leading-relaxed">
						Patients are registered at the kiosk. Nurses record vitals which are instantly analyzed by our smart rules engine to assign a color-coded triage level (Red/Amber/Green).
					</p>
				</div>
			</div>

			<!-- Step 2 -->
			<div class="relative pb-12 md:pb-16 flex gap-6 md:gap-8">
				<div class="flex flex-col items-center">
					<div class="size-10 md:size-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-lg z-10 shrink-0 shadow-lg ring-4 ring-background">
						2
					</div>
					<div class="w-px h-full bg-border absolute top-10 md:top-12 bottom-0 left-5 md:left-6 -z-10"></div>
				</div>
				<div class="pt-1 md:pt-2">
					<h3 class="text-xl md:text-2xl font-bold text-foreground mb-2">Doctor Consultation</h3>
					<p class="text-muted-foreground leading-relaxed">
						Doctors view the prioritized live queue on their tablets. They can review vitals, dictate clinical notes using local language voice AI, and issue digital prescriptions.
					</p>
				</div>
			</div>

			<!-- Step 3 -->
			<div class="relative pb-12 md:pb-16 flex gap-6 md:gap-8">
				<div class="flex flex-col items-center">
					<div class="size-10 md:size-12 rounded-full bg-triage-amber text-triage-amber-foreground flex items-center justify-center font-bold text-lg z-10 shrink-0 shadow-lg ring-4 ring-background">
						3
					</div>
					<div class="w-px h-full bg-border absolute top-10 md:top-12 bottom-0 left-5 md:left-6 -z-10"></div>
				</div>
				<div class="pt-1 md:pt-2">
					<h3 class="text-xl md:text-2xl font-bold text-foreground mb-2">Pharmacy Dispensing</h3>
					<p class="text-muted-foreground leading-relaxed">
						Prescriptions instantly appear on the Pharmacy dashboard. Pharmacists fulfill orders, and stock levels are automatically decremented from the local inventory.
					</p>
				</div>
			</div>

			<!-- Step 4 -->
			<div class="relative flex gap-6 md:gap-8">
				<div class="flex flex-col items-center">
					<div class="size-10 md:size-12 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg z-10 shrink-0 shadow-lg ring-4 ring-background">
						4
					</div>
				</div>
				<div class="pt-1 md:pt-2">
					<h3 class="text-xl md:text-2xl font-bold text-foreground mb-2">Background Sync</h3>
					<p class="text-muted-foreground leading-relaxed">
						All of the above happens via local Wi-Fi without internet. Once a connection is detected, the clinic's local server quietly pushes encrypted records to the cloud for regional admins to review.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section id="features" class="py-24 bg-muted/30 border-y border-border/40 relative">
	<div class="container mx-auto px-4 md:px-8 max-w-7xl">
		<div class="text-center mb-16">
			<h2 class="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
				Built for the realities of rural healthcare
			</h2>
			<p class="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
				ClinicFlow is designed to work exactly where traditional cloud-based EMRs fail.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<div class="bg-background rounded-2xl p-8 border border-border shadow-sm card-hover">
				<div
					class="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6"
				>
					<WifiOff class="size-6" />
				</div>
				<h3 class="text-xl font-bold text-foreground mb-3">100% Offline Resilience</h3>
				<p class="text-muted-foreground leading-relaxed">
					The entire application runs entirely local-first. Register patients, conduct encounters,
					and dispense medication with zero internet. Syncs to the cloud automatically when
					connectivity returns.
				</p>
			</div>

			<div class="bg-background rounded-2xl p-8 border border-border shadow-sm card-hover">
				<div
					class="size-12 rounded-xl bg-accent/20 text-accent-foreground flex items-center justify-center mb-6"
				>
					<LayoutDashboard class="size-6" />
				</div>
				<h3 class="text-xl font-bold text-foreground mb-3">POS-Style Kiosk Design</h3>
				<p class="text-muted-foreground leading-relaxed">
					Large touch targets, vibrant color-coded UI, and minimal typing required. Built so staff
					with any level of technical literacy can pick it up instantly.
				</p>
			</div>

			<div class="bg-background rounded-2xl p-8 border border-border shadow-sm card-hover">
				<div
					class="size-12 rounded-xl bg-triage-amber/20 text-triage-amber flex items-center justify-center mb-6"
				>
					<Stethoscope class="size-6" />
				</div>
				<h3 class="text-xl font-bold text-foreground mb-3">Smart Triage & AI Voice</h3>
				<p class="text-muted-foreground leading-relaxed">
					Automatically evaluate vitals to flag urgent patients to the top of the queue. Doctors can
					dictate intake notes using state-of-the-art AI structuring.
				</p>
			</div>
		</div>
	</div>
</section>


