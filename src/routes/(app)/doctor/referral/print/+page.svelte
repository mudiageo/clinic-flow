<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Printer, Send, Activity, ChevronLeft } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	
	let referralData: any = $state(null);
	let isSendingSms = $state(false);

	onMount(() => {
		const raw = localStorage.getItem('temp_referral');
		if (raw) {
			referralData = JSON.parse(raw);
		}
	});

	function handlePrint() {
		window.print();
	}

	function handleSendSms() {
		isSendingSms = true;
		setTimeout(() => {
			isSendingSms = false;
			toast.success(`Referral summary SMS sent to ${referralData.facility}`);
		}, 1500);
	}
</script>

<svelte:head>
	<title>Referral Letter — ClinicFlow</title>
</svelte:head>

<div class="min-h-screen bg-muted/20 py-8 px-4 print:bg-white print:py-0 print:px-0">
	<!-- Top Bar (Hidden on print) -->
	<div class="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden bg-card border rounded-lg p-3 shadow-sm">
		<Button variant="ghost" size="sm" onclick={() => window.close()}>
			<ChevronLeft class="size-4 mr-1" /> Close
		</Button>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" onclick={handleSendSms} disabled={isSendingSms || !referralData}>
				<Send class="size-4 mr-2 text-primary" /> {isSendingSms ? 'Sending...' : 'Send SMS Summary'}
			</Button>
			<Button size="sm" onclick={handlePrint} disabled={!referralData}>
				<Printer class="size-4 mr-2" /> Print PDF
			</Button>
		</div>
	</div>

	<!-- Printable Letterhead Area -->
	<div class="max-w-3xl mx-auto bg-white border shadow-sm print:border-none print:shadow-none p-10 md:p-14 print:p-0 font-serif text-slate-800">
		{#if referralData}
			<div class="flex items-center justify-between border-b-2 border-slate-800 pb-6 mb-8">
				<div>
					<h1 class="text-3xl font-bold uppercase tracking-wide">Patient Referral</h1>
					<p class="text-sm font-medium mt-1">Primary Healthcare Center • ClinicFlow Network</p>
				</div>
				<div class="text-right text-sm">
					<p class="font-bold">Date of Referral</p>
					<p>{new Date(referralData.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
					<p class="mt-2"><span class="font-bold">Urgency:</span> <span class="uppercase border px-1 py-0.5 rounded">{referralData.urgency}</span></p>
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
							{#if referralData.vitals.temperatureCelsius}<p>Temp: {referralData.vitals.temperatureCelsius}°C</p>{/if}
							{#if referralData.vitals.systolicBp && referralData.vitals.diastolicBp}<p>BP: {referralData.vitals.systolicBp}/{referralData.vitals.diastolicBp} mmHg</p>{/if}
							{#if referralData.vitals.pulseBpm}<p>Pulse: {referralData.vitals.pulseBpm} bpm</p>{/if}
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
						<p class="font-bold text-lg mt-1">Dr. ClinicFlow User</p>
						<p class="text-sm">Sign: ___________________</p>
					</div>
					<div class="text-right text-xs text-slate-400">
						Generated via ClinicFlow securely
					</div>
				</div>
			</div>
		{:else}
			<div class="py-20 text-center text-slate-500 animate-pulse">
				Loading referral data...
			</div>
		{/if}
	</div>
</div>
