<script lang="ts">
	import { onMount } from 'svelte';
	import { checkNanoAvailability, type NanoAvailabilityStatus } from '#lib/ai/hybrid-engine';
	import { getRemoteConfigValue } from '#lib/ai/firebase-client';
	import { Card, CardHeader, CardTitle, CardContent } from '#lib/components/ui/card/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Cpu, Cloud, ShieldCheck, Sparkles, RefreshCw, Lock, Activity } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let nanoStatus = $state<NanoAvailabilityStatus>({ supported: false, status: 'unknown' });
	let isChecking = $state(false);

	let remoteConfigPolicy = $state({
		hybridEnabled: true,
		cloudFallbackModel: 'gemini-2.5-flash',
		maxOnDeviceChars: 4000,
		allowCloudEscalation: true
	});

	async function refreshStatus() {
		isChecking = true;
		nanoStatus = await checkNanoAvailability();
		remoteConfigPolicy = {
			hybridEnabled: getRemoteConfigValue('hybrid_ai_enabled', true),
			cloudFallbackModel: getRemoteConfigValue('cloud_fallback_model', 'gemini-2.5-flash'),
			maxOnDeviceChars: getRemoteConfigValue('max_on_device_input_chars', 4000),
			allowCloudEscalation: getRemoteConfigValue('allow_cloud_escalation', true)
		};
		isChecking = false;
	}

	onMount(() => {
		void refreshStatus();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between pb-3 border-b border-border">
		<div>
			<h3 class="text-lg font-bold text-foreground">Hybrid AI Engine & Remote Config Console</h3>
			<p class="text-xs text-muted-foreground mt-0.5">
				Monitors local Chrome Gemini Nano on-device availability and Firebase Remote Config
				policies.
			</p>
		</div>
		<Button
			variant="outline"
			size="sm"
			disabled={isChecking}
			onclick={refreshStatus}
			class="gap-1.5 text-xs"
		>
			<RefreshCw class="size-3.5 {isChecking ? 'animate-spin' : ''}" />
			Refresh Diagnostics
		</Button>
	</div>

	<!-- System Status Grid -->
	<div
		class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border rounded-xl border border-border bg-card overflow-hidden"
	>
		<!-- Local Engine -->
		<div class="p-5 space-y-2">
			<div
				class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground"
			>
				<Cpu class="size-3.5" />
				On-Device Engine (Gemini Nano)
			</div>
			<div class="flex items-center gap-2 mt-2">
				<Badge
					variant="outline"
					class="font-mono text-xs {nanoStatus.status === 'readily'
						? 'border-triage-green text-triage-green bg-triage-green/10'
						: nanoStatus.status === 'after-download'
							? 'border-triage-amber text-amber-700 bg-triage-amber/10'
							: 'border-border text-muted-foreground'}"
				>
					{nanoStatus.status === 'readily'
						? 'Active & Ready'
						: nanoStatus.status === 'after-download'
							? 'Downloading Weights'
							: 'Unavailable (Fallback Active)'}
				</Badge>
			</div>
			<p class="text-[11px] text-muted-foreground leading-relaxed">
				Chrome Prompt API support: {nanoStatus.supported
					? 'Supported'
					: 'Not Detected (Chrome Desktop v139+ required)'}
			</p>
		</div>

		<!-- PII Redaction Guardrail -->
		<div class="p-5 space-y-2">
			<div
				class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground"
			>
				<ShieldCheck class="size-3.5" />
				Deterministic PII Redaction
			</div>
			<div class="flex items-center gap-2 mt-2">
				<Badge
					variant="outline"
					class="border-triage-green text-triage-green bg-triage-green/10 font-mono text-xs"
				>
					Zero-Trust Local Tokenization Active
				</Badge>
			</div>
			<p class="text-[11px] text-muted-foreground leading-relaxed">
				Names, phone numbers, and NIN/Clinic IDs are tokenized before leaving the device.
			</p>
		</div>

		<!-- Remote Config Policy -->
		<div class="p-5 space-y-2">
			<div
				class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground"
			>
				<Cloud class="size-3.5" />
				Cloud Hybrid Escalation
			</div>
			<div class="flex items-center gap-2 mt-2">
				<Badge
					variant="outline"
					class="border-primary text-primary bg-primary/10 font-mono text-xs"
				>
					{remoteConfigPolicy.cloudFallbackModel}
				</Badge>
			</div>
			<p class="text-[11px] text-muted-foreground leading-relaxed">
				App Check enabled with Firebase AI Logic backend. Max on-device chars: {remoteConfigPolicy.maxOnDeviceChars}.
			</p>
		</div>
	</div>
</div>
