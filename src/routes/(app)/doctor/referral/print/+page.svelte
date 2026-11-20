<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import {
		Printer,
		Send,
		Activity,
		ChevronLeft,
		AlertTriangle,
		CheckCircle2
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { sendReferralSms } from '#lib/remote/referrals.remote.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import { authStore } from '#lib/state/auth.svelte.ts';

	type SmsResult = Awaited<ReturnType<typeof sendReferralSms>>;

	let referralData: any = $state(null);
	let recipientPhone = $state('');
	let isSendingSms = $state(false);
	let smsResult = $state<SmsResult | null>(null);
	let smsError = $state<string | null>(null);

	// The server-derived signature is authoritative. Until a send succeeds, use
	// the signed-in user's real name — never a fabricated clinician name.
	const signatureName = $derived(
		smsResult?.signedBy?.trim() ||
			sessionStore.user?.name?.trim() ||
			authStore.profile?.name?.trim() ||
			''
	);

	onMount(() => {
		const raw = localStorage.getItem('temp_referral');
		if (raw) {
			referralData = JSON.parse(raw);
		}
	});

	function handlePrint() {
		window.print();
	}

	async function handleSendSms() {
		if (!referralData) return;
		const to = recipientPhone.trim();
		if (!to) {
			toast.error('Enter the receiving facility phone number first.');
			return;
		}

		isSendingSms = true;
		smsError = null;
		try {
			const result = await sendReferralSms({
				to,
				facility: String(referralData.facility ?? '').trim(),
				summary: String(referralData.reason ?? 'Referral summary')
					.trim()
					.slice(0, 480)
			});
			smsResult = result;
			if (result.mode === 'console') {
				toast.info('SMS not delivered — console mode. See the status message below.');
			} else {
				toast.success(`Referral summary delivered to ${referralData.facility}.`);
			}
		} catch (e: any) {
			const message = typeof e?.message === 'string' ? e.message : 'Failed to send referral SMS.';
			smsError = message;
			toast.error(message);
		} finally {
			isSendingSms = false;
		}
	}
</script>

<svelte:head>
	<title>Referral Letter — ClinicFlow</title>
</svelte:head>

<div class="min-h-screen bg-muted/20 py-8 px-4 print:bg-white print:py-0 print:px-0">
	<!-- Top Bar (Hidden on print) -->
	<div
		class="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 print:hidden bg-card border rounded-lg p-3 shadow-sm"
	>
		<Button variant="ghost" size="sm" onclick={() => window.close()} class="self-start">
			<ChevronLeft class="size-4 mr-1" /> Close
		</Button>
		<div class="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
			<div class="space-y-1">
				<Label for="sms-recipient" class="text-xs text-muted-foreground">Recipient phone</Label>
				<Input
					id="sms-recipient"
					type="tel"
					inputmode="tel"
					bind:value={recipientPhone}
					placeholder="Receiving facility phone"
					class="h-9 w-full sm:w-56"
				/>
			</div>
			<Button
				variant="outline"
				size="sm"
				onclick={handleSendSms}
				disabled={isSendingSms || !referralData || !recipientPhone.trim()}
			>
				<Send class="size-4 mr-2 text-primary" />
				{isSendingSms ? 'Sending...' : 'Send SMS Summary'}
			</Button>
			<Button size="sm" onclick={handlePrint} disabled={!referralData}>
				<Printer class="size-4 mr-2" /> Print PDF
			</Button>
		</div>
	</div>

	{#if smsResult}
		<div
			class="max-w-3xl mx-auto mb-4 print:hidden rounded-lg border p-3 text-sm flex gap-2 {smsResult.mode ===
			'console'
				? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
				: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'}"
		>
			{#if smsResult.mode === 'console'}
				<AlertTriangle class="size-4 shrink-0 mt-0.5" />
				<div>
					<p class="font-medium">SMS not delivered — console mode</p>
					<p class="text-xs mt-0.5">
						{smsResult.reason ??
							'No live SMS provider is configured; the message was logged for review.'}
						Reference: {smsResult.reference}
					</p>
				</div>
			{:else}
				<CheckCircle2 class="size-4 shrink-0 mt-0.5" />
				<div>
					<p class="font-medium">Referral summary delivered</p>
					<p class="text-xs mt-0.5">
						Reference: {smsResult.reference} • Signed by {smsResult.signedBy}
					</p>
				</div>
			{/if}
		</div>
	{:else if smsError}
		<div
			class="max-w-3xl mx-auto mb-4 print:hidden rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex gap-2"
		>
			<AlertTriangle class="size-4 shrink-0 mt-0.5" />
			<p>{smsError}</p>
		</div>
	{/if}

	<!-- Printable Letterhead Area -->
	<div
		class="max-w-3xl mx-auto bg-white border shadow-sm print:border-none print:shadow-none p-10 md:p-14 print:p-0 font-serif text-slate-800"
	>
		{#if referralData}
			<div class="flex items-center justify-between border-b-2 border-slate-800 pb-6 mb-8">
				<div>
					<h1 class="text-3xl font-bold uppercase tracking-wide">Patient Referral</h1>
					<p class="text-sm font-medium mt-1">Primary Healthcare Center • ClinicFlow Network</p>
				</div>
				<div class="text-right text-sm">
					<p class="font-bold">Date of Referral</p>
					<p>
						{new Date(referralData.date).toLocaleDateString(undefined, {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</p>
					<p class="mt-2">
						<span class="font-bold">Urgency:</span>
						<span class="uppercase border px-1 py-0.5 rounded">{referralData.urgency}</span>
					</p>
				</div>
			</div>

			<div class="mb-8 text-lg">
				<p class="mb-1"><span class="font-bold">To:</span> {referralData.facility}</p>
				<p><span class="font-bold">From:</span> ClinicFlow PHC Provider</p>
			</div>

			<div class="bg-slate-50 p-6 border rounded-lg mb-8">
				<h2 class="text-xl font-bold mb-4 flex items-center gap-2 border-b pb-2">
					<Activity class="size-5" /> Patient Details
				</h2>
				<div class="grid grid-cols-2 gap-4 text-base">
					<div>
						<p class="text-slate-500 text-sm">Patient Name</p>
						<p class="font-bold">{referralData.patientName}</p>
					</div>
					<div>
						<p class="text-slate-500 text-sm">Clinic ID</p>
						<p class="font-mono">{referralData.clinicId}</p>
					</div>
					<div>
						<p class="text-slate-500 text-sm">Age</p>
						<p>{referralData.age} years</p>
					</div>
					<div>
						<p class="text-slate-500 text-sm">Sex</p>
						<p class="capitalize">{referralData.sex}</p>
					</div>
				</div>

				{#if referralData.vitals}
					<div class="mt-6 pt-4 border-t">
						<p class="text-slate-500 text-sm mb-2">Latest Vitals</p>
						<div class="flex gap-6 text-sm font-medium">
							{#if referralData.vitals.temperatureCelsius}<p>
									Temp: {referralData.vitals.temperatureCelsius}°C
								</p>{/if}
							{#if referralData.vitals.systolicBp && referralData.vitals.diastolicBp}<p>
									BP: {referralData.vitals.systolicBp}/{referralData.vitals.diastolicBp} mmHg
								</p>{/if}
							{#if referralData.vitals.pulseBpm}<p>
									Pulse: {referralData.vitals.pulseBpm} bpm
								</p>{/if}
						</div>
					</div>
				{/if}
			</div>

			<div class="mb-12">
				<h2 class="text-xl font-bold mb-3 border-b pb-1">Reason for Referral</h2>
				<p class="text-base leading-relaxed whitespace-pre-wrap">{referralData.reason}</p>
			</div>

			<div class="mt-16 pt-8 border-t border-slate-300">
				<div class="flex justify-between items-end">
					<div>
						<p class="text-sm text-slate-500">Referring Physician</p>
						<p class="font-bold text-lg mt-1">{signatureName}</p>
						<p class="text-sm">Sign: ___________________</p>
					</div>
					<div class="text-right text-xs text-slate-400">Generated via ClinicFlow securely</div>
				</div>
			</div>
		{:else}
			<div class="py-20 text-center text-slate-500 animate-pulse">Loading referral data...</div>
		{/if}
	</div>
</div>
