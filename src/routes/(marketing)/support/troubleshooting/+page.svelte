<script lang="ts">
	import { AlertTriangle, Wifi, RotateCcw, ShieldAlert, CheckCircle2 } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button';

	const issues = [
		{
			title: 'Tablets cannot find clinicflow.local on the Wi-Fi network',
			cause:
				'The clinic Wi-Fi router may have "AP Isolation" or "Client Isolation" turned on in its settings, preventing connected devices from talking to one another.',
			fix: 'Log into your Wi-Fi router admin page (usually 192.168.1.1 or 192.168.0.1) and disable "Client Isolation" or "Guest Mode". All clinic tablets must be on the same subnet.'
		},
		{
			title: 'Records are saved locally but cloud sync indicator shows "Disconnected"',
			cause:
				'The clinic does not currently have active internet uplink connectivity to reach the central cloud server.',
			fix: 'This is expected behavior. ClinicFlow continues to operate normally in local-first mode. Once an internet connection (e.g. mobile hotspot or modem) is re-established, the sync engine will automatically upload all pending operations.'
		},
		{
			title: 'Staff member forgot password or role account locked',
			cause: 'Too many incorrect passcode attempts or a credential reset is needed.',
			fix: 'A designated facility Administrator can log into the Admin portal under "Staff Management" to generate a temporary reset PIN for the affected worker.'
		},
		{
			title: "Tablet screen is locked in Kiosk Mode and won't return to Android home",
			cause:
				'Tauri Kiosk Mode is configured to prevent staff from accidentally closing clinical workflows or opening non-work apps.',
			fix: 'Triple-tap the ClinicFlow logo in the top-left navigation bar and enter your facility Admin Master PIN to unlock system settings.'
		}
	];
</script>

<svelte:head>
	<title>Troubleshooting & Diagnostics — ClinicFlow Support</title>
	<meta
		name="description"
		content="Quick solutions to common operational and network issues encountered during ClinicFlow clinic deployments."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-4xl py-16 md:py-24 space-y-16">
	<!-- Header -->
	<div class="text-center max-w-2xl mx-auto space-y-4">
		<div
			class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary"
		>
			Diagnostics
		</div>
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
			Troubleshooting & Common Fixes
		</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			Solutions to network discovery, tablet kiosk configuration, and synchronization questions.
		</p>
	</div>

	<!-- Issues Accordion / Cards -->
	<div class="space-y-6">
		{#each issues as item}
			<div class="rounded-3xl border border-border bg-card p-8 space-y-4 shadow-sm">
				<div class="flex items-start gap-3">
					<div
						class="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5"
					>
						<AlertTriangle class="size-4" />
					</div>
					<h3 class="text-lg font-bold text-foreground">{item.title}</h3>
				</div>

				<div class="space-y-2 text-sm pl-11">
					<div>
						<span class="font-bold text-foreground">Probable Cause: </span>
						<span class="text-muted-foreground">{item.cause}</span>
					</div>
					<div>
						<span class="font-bold text-primary">Resolution: </span>
						<span class="text-foreground">{item.fix}</span>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Contact CTA -->
	<div class="rounded-2xl border border-border bg-muted/30 p-8 text-center space-y-4">
		<h3 class="text-xl font-bold text-foreground">Encountering an issue not covered here?</h3>
		<p class="text-sm text-muted-foreground max-w-md mx-auto">
			Send our technical response team a diagnostic report or message.
		</p>
		<Button href="/contact" class="rounded-full px-6 font-bold bg-primary text-primary-foreground">
			Contact ClinicFlow Support
		</Button>
	</div>
</div>
