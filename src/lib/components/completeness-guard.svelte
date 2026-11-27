<script lang="ts">
	import { executeHybridPrompt, Schema } from '#lib/ai/hybrid-engine';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Card, CardHeader, CardTitle, CardContent } from '#lib/components/ui/card/index.ts';
	import AiDisclaimer from '#lib/components/ui/ai-disclaimer.svelte';
	import { ShieldAlert, CheckCircle2, AlertTriangle, Loader2, Sparkles } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	export interface CompletenessAudit {
		isComplete: boolean;
		safetyScore: number; // 0-100
		missingCriticalItems: string[];
		clinicalObservations: string[];
		canSafelyClose: boolean;
	}

	let {
		chiefComplaint = '',
		doctorNotes = '',
		vitals,
		prescriptions = [],
		labTests = []
	}: {
		chiefComplaint?: string;
		doctorNotes?: string;
		vitals?: Record<string, unknown> | null;
		prescriptions?: { name: string; quantity: number }[];
		labTests?: string[];
	} = $props();

	let isAuditing = $state(false);
	let auditResult = $state<CompletenessAudit | null>(null);
	let executionSource = $state<'ON_DEVICE' | 'IN_CLOUD' | 'SERVER_FALLBACK' | null>(null);

	const auditSchema = Schema.object({
		properties: {
			isComplete: Schema.boolean(),
			safetyScore: Schema.number(),
			missingCriticalItems: Schema.array({ items: Schema.string() }),
			clinicalObservations: Schema.array({ items: Schema.string() }),
			canSafelyClose: Schema.boolean()
		}
	});

	export async function runCompletenessAudit(): Promise<CompletenessAudit | null> {
		isAuditing = true;
		try {
			const prompt = `Perform an encounter completeness and clinical safety audit for this primary care visit:
Chief Complaint: ${chiefComplaint || 'None recorded'}
Doctor Notes: ${doctorNotes || 'None recorded'}
Recorded Vitals: ${JSON.stringify(vitals || {})}
Ordered Prescriptions: ${JSON.stringify(prescriptions)}
Ordered Labs: ${JSON.stringify(labTests)}

Check for high-risk clinical omissions:
- Severe fever without temperature recorded or malaria test requested.
- Prescribed antibiotics or antimalarials without clear diagnostic notes.
- Incomplete pregnancy/ANC metrics for antenatal patients.
- Vital sign red flags unaddressed in the treatment plan.
Produce safety score and missing items.`;

			const result = await executeHybridPrompt<CompletenessAudit>({
				prompt,
				systemInstruction:
					'You are a clinical quality assurance safety auditor for Nigerian PHC records. Focus strictly on critical oversights.',
				schema: auditSchema,
				parseJson: true
			});

			auditResult = result.data;
			executionSource = result.metadata.source;

			return auditResult;
		} catch (err) {
			console.error('[CompletenessGuard] Error:', err);
			return null;
		} finally {
			isAuditing = false;
		}
	}
</script>

<Card class="border-border bg-card overflow-hidden">
	<CardHeader class="pb-3 border-b border-border bg-muted/20">
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<ShieldAlert class="size-4 text-primary" />
				<CardTitle class="text-base font-semibold">Encounter Completeness Guard</CardTitle>
			</div>
			{#if executionSource}
				<Badge variant="outline" class="font-mono text-xs">
					{executionSource === 'ON_DEVICE' ? 'On-Device (Nano)' : 'Cloud Hybrid'}
				</Badge>
			{/if}
		</div>
		<p class="text-xs text-muted-foreground mt-0.5">
			Fast on-device pre-close audit to prevent high-risk clinical omissions and coding gaps.
		</p>
	</CardHeader>

	<CardContent class="p-4 space-y-3">
		<AiDisclaimer compact />

		<div class="flex justify-between items-center">
			<span class="text-xs text-muted-foreground">Runs locally before concluding consultation.</span
			>
			<Button
				size="sm"
				variant="outline"
				disabled={isAuditing}
				onclick={() => runCompletenessAudit()}
				class="gap-1.5 text-xs"
			>
				{#if isAuditing}
					<Loader2 class="size-3 animate-spin" />
					Auditing...
				{:else}
					<Sparkles class="size-3 text-primary" />
					Run Safety Audit
				{/if}
			</Button>
		</div>

		{#if auditResult}
			<div
				class="rounded-lg border border-border p-3 space-y-2.5 text-xs bg-muted/10 animate-fade-in"
			>
				<div class="flex items-center justify-between">
					<span class="font-semibold text-foreground">Safety Score:</span>
					<Badge
						class="font-mono {auditResult.safetyScore >= 80
							? 'bg-triage-green'
							: auditResult.safetyScore >= 60
								? 'bg-triage-amber'
								: 'bg-triage-red'}"
					>
						{auditResult.safetyScore} / 100
					</Badge>
				</div>

				{#if auditResult.missingCriticalItems?.length > 0}
					<div class="space-y-1">
						<span class="font-semibold text-destructive flex items-center gap-1">
							<AlertTriangle class="size-3" />
							Missing Items Identified:
						</span>
						<ul class="list-disc list-inside text-muted-foreground pl-1 space-y-0.5">
							{#each auditResult.missingCriticalItems as item}
								<li>{item}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if auditResult.clinicalObservations?.length > 0}
					<div class="space-y-1 pt-1 border-t border-border/50">
						<span class="font-semibold text-foreground">Observations:</span>
						<ul class="list-disc list-inside text-muted-foreground pl-1 space-y-0.5">
							{#each auditResult.clinicalObservations as obs}
								<li>{obs}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}
	</CardContent>
</Card>
