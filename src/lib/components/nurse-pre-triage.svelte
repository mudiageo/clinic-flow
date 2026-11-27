<script lang="ts">
	import { executeHybridPrompt, Schema } from '#lib/ai/hybrid-engine';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Card, CardHeader, CardTitle, CardContent } from '#lib/components/ui/card/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import AiDisclaimer from '#lib/components/ui/ai-disclaimer.svelte';
	import {
		Activity,
		Sparkles,
		Loader2,
		CheckCircle2,
		AlertTriangle,
		HelpCircle,
		MessageSquare
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	export interface PreTriageResult {
		normalizedComplaint: string;
		extractedSymptoms: string[];
		duration: string;
		suggestedPriority: 'red' | 'amber' | 'green';
		priorityRationale: string;
		clarifyingQuestions: string[];
	}

	let {
		patientName = '',
		patientAge = '',
		patientSex = '',
		vitalsSummary = '',
		onApplyTriage
	}: {
		patientName?: string;
		patientAge?: string | number;
		patientSex?: string;
		vitalsSummary?: string;
		onApplyTriage?: (result: PreTriageResult) => void;
	} = $props();

	let rawInput = $state('');
	let isAnalyzing = $state(false);
	let triageResult = $state<PreTriageResult | null>(null);
	let executionSource = $state<'ON_DEVICE' | 'IN_CLOUD' | 'SERVER_FALLBACK' | null>(null);
	let latencyMs = $state<number | null>(null);

	const triageSchema = Schema.object({
		properties: {
			normalizedComplaint: Schema.string(),
			extractedSymptoms: Schema.array({ items: Schema.string() }),
			duration: Schema.string(),
			suggestedPriority: Schema.string(),
			priorityRationale: Schema.string(),
			clarifyingQuestions: Schema.array({ items: Schema.string() })
		}
	});

	async function analyzeIntake() {
		if (rawInput.trim().length < 5) {
			toast.error('Please enter patient presenting complaints or notes first.');
			return;
		}

		isAnalyzing = true;
		try {
			const prompt = `Patient Details: ${patientName ? `${patientName}, ` : ''}${patientAge ? `Age ${patientAge}, ` : ''}${patientSex ? `Sex: ${patientSex}` : ''}
Current Vitals: ${vitalsSummary || 'Not yet recorded'}
Patient Presentation (may be English, Nigerian Pidgin, Yoruba, Hausa, or Igbo):
"${rawInput}"

Perform clinical pre-triage:
1. Translate/normalize the presentation into clear medical English for the Chief Complaint.
2. Extract all distinct symptoms and duration.
3. Suggest Triage Priority (red = emergency, amber = urgent, green = routine) with clinical rationale according to WHO/Emergency Triage Assessment standards.
4. Formulate 2-3 specific clarifying questions the nurse should ask the patient next to refine assessment.`;

			const result = await executeHybridPrompt<PreTriageResult>({
				prompt,
				systemInstruction:
					'You are an expert clinical triage support agent for rural Nigerian Primary Health Centres. Prioritize identifying red flags and severe dehydration or respiratory distress.',
				context: { knownName: patientName },
				schema: triageSchema,
				parseJson: true
			});

			triageResult = result.data;
			executionSource = result.metadata.source;
			latencyMs = result.metadata.durationMs;

			toast.success(
				executionSource === 'ON_DEVICE'
					? 'Pre-triage structured on-device (Gemini Nano)'
					: 'Pre-triage evaluated via cloud hybrid fallback'
			);
		} catch (err) {
			console.error('[PreTriage] Error:', err);
			toast.error('Failed to complete pre-triage assessment.');
		} finally {
			isAnalyzing = false;
		}
	}

	function confirmAndApply() {
		if (!triageResult) return;
		if (onApplyTriage) {
			onApplyTriage(triageResult);
		}
		toast.success('Pre-triage assessment applied to registration.');
	}
</script>

<Card class="border-border bg-card overflow-hidden">
	<CardHeader class="pb-3 border-b border-border bg-muted/20">
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<Activity class="size-4 text-primary" />
				<CardTitle class="text-base font-semibold">Intelligent Pre-Triage Assistant</CardTitle>
			</div>
			{#if executionSource}
				<Badge
					variant="outline"
					class="font-mono text-xs gap-1.5 {executionSource === 'ON_DEVICE'
						? 'border-triage-green text-triage-green bg-triage-green/10'
						: 'border-primary text-primary bg-primary/10'}"
				>
					<Sparkles class="size-3" />
					{executionSource === 'ON_DEVICE' ? 'On-Device (Nano)' : 'Cloud Hybrid'}
					{#if latencyMs}· {latencyMs}ms{/if}
				</Badge>
			{/if}
		</div>
		<p class="text-xs text-muted-foreground mt-0.5">
			Accepts vernacular expressions or dictated intake, extracts symptoms, and suggests priority
			levels.
		</p>
	</CardHeader>

	<CardContent class="p-5 space-y-4">
		<AiDisclaimer compact />

		<div class="space-y-2">
			<Textarea
				bind:value={rawInput}
				placeholder="Type or dictate patient complaints in English, Pidgin ('body dey hot since 3 days'), Yoruba, Hausa, or Igbo..."
				class="min-h-24 text-sm"
			/>
			<div class="flex justify-between items-center pt-1">
				<span class="text-xs text-muted-foreground"
					>Local PII sanitization active prior to any cloud routing.</span
				>
				<Button
					size="sm"
					disabled={isAnalyzing || rawInput.trim().length < 5}
					onclick={analyzeIntake}
					class="gap-1.5"
				>
					{#if isAnalyzing}
						<Loader2 class="size-3.5 animate-spin" />
						Triaging...
					{:else}
						<Sparkles class="size-3.5" />
						Analyze Pre-Triage
					{/if}
				</Button>
			</div>
		</div>

		<!-- Triage Assessment Results -->
		{#if triageResult}
			<div class="rounded-xl border border-border bg-muted/20 p-4 space-y-4 animate-fade-in">
				<div class="flex items-center justify-between border-b border-border/50 pb-2.5">
					<div class="flex items-center gap-2">
						<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
							>Suggested Priority:</span
						>
						<Badge
							class="font-mono uppercase text-xs {triageResult.suggestedPriority === 'red'
								? 'bg-triage-red'
								: triageResult.suggestedPriority === 'amber'
									? 'bg-triage-amber'
									: 'bg-triage-green'}"
						>
							{triageResult.suggestedPriority}
						</Badge>
					</div>
					<span class="text-xs font-mono text-muted-foreground"
						>Duration: {triageResult.duration}</span
					>
				</div>

				<div class="text-xs space-y-1">
					<span class="font-semibold text-muted-foreground uppercase tracking-wider"
						>Normalized Chief Complaint:</span
					>
					<p class="p-2.5 rounded-lg bg-card border border-border text-foreground font-medium">
						{triageResult.normalizedComplaint}
					</p>
				</div>

				<div class="text-xs space-y-1">
					<span class="font-semibold text-muted-foreground uppercase tracking-wider"
						>Clinical Rationale:</span
					>
					<p class="text-muted-foreground leading-relaxed">
						{triageResult.priorityRationale}
					</p>
				</div>

				{#if triageResult.extractedSymptoms?.length > 0}
					<div class="text-xs space-y-1.5">
						<span class="font-semibold text-muted-foreground uppercase tracking-wider"
							>Extracted Symptoms:</span
						>
						<div class="flex flex-wrap gap-1.5">
							{#each triageResult.extractedSymptoms as symptom}
								<Badge variant="secondary" class="text-xs">{symptom}</Badge>
							{/each}
						</div>
					</div>
				{/if}

				{#if triageResult.clarifyingQuestions?.length > 0}
					<div class="p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs space-y-1.5">
						<span class="font-semibold text-primary flex items-center gap-1.5">
							<HelpCircle class="size-3.5" />
							Recommended Clarifying Questions for Patient:
						</span>
						<ul class="list-disc list-inside space-y-1 text-foreground/90 pl-1">
							{#each triageResult.clarifyingQuestions as q}
								<li>{q}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<div class="pt-2 flex justify-end">
					<Button size="sm" onclick={confirmAndApply} class="gap-1.5">
						<CheckCircle2 class="size-3.5" />
						Confirm & Apply Triage to Form
					</Button>
				</div>
			</div>
		{/if}
	</CardContent>
</Card>
