<script lang="ts">
	import { executeHybridPrompt, Schema } from '#lib/ai/hybrid-engine';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Card, CardHeader, CardTitle, CardContent } from '#lib/components/ui/card/index.ts';
	import AiDisclaimer from '#lib/components/ui/ai-disclaimer.svelte';
	import {
		FileHeart,
		Printer,
		Send,
		Sparkles,
		Loader2,
		Languages,
		CheckCircle2
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	export interface CarePlanOutput {
		language: string;
		greeting: string;
		plainLanguageSummary: string;
		medicationSchedules: { drug: string; schedule: string; instructions: string }[];
		lifestyleAdvice: string[];
		redFlagWarningSigns: string[];
	}

	let {
		patientName = 'Patient',
		chiefComplaint = '',
		doctorNotes = '',
		prescriptions = []
	}: {
		patientName?: string;
		chiefComplaint?: string;
		doctorNotes?: string;
		prescriptions?: { name: string; quantity: number; dosage?: string }[];
	} = $props();

	let selectedLanguage = $state<'English' | 'Nigerian Pidgin' | 'Hausa' | 'Yoruba' | 'Igbo'>(
		'English'
	);
	let isGenerating = $state(false);
	let carePlan = $state<CarePlanOutput | null>(null);
	let executionSource = $state<'ON_DEVICE' | 'IN_CLOUD' | 'SERVER_FALLBACK' | null>(null);
	let latencyMs = $state<number | null>(null);

	const carePlanSchema = Schema.object({
		properties: {
			language: Schema.string(),
			greeting: Schema.string(),
			plainLanguageSummary: Schema.string(),
			medicationSchedules: Schema.array({
				items: Schema.object({
					properties: {
						drug: Schema.string(),
						schedule: Schema.string(),
						instructions: Schema.string()
					}
				})
			}),
			lifestyleAdvice: Schema.array({ items: Schema.string() }),
			redFlagWarningSigns: Schema.array({ items: Schema.string() })
		}
	});

	async function generateCarePlan() {
		isGenerating = true;
		try {
			const prompt = `Patient Name: ${patientName}
Language for Output: ${selectedLanguage}
Chief Complaint: ${chiefComplaint}
Doctor's Clinical Notes: ${doctorNotes}
Prescribed Medications: ${JSON.stringify(prescriptions)}

Generate an easy-to-understand Take-Home Care Plan at a 4th-grade reading level.
If the language is Nigerian Pidgin, Yoruba, Hausa, or Igbo, produce culturally natural, warm vernacular phrasing that uneducated community members can understand.
Include morning/afternoon/night medicine schedules, food requirements, home rest advice, and specific red flags when they must return immediately to the clinic.`;

			const result = await executeHybridPrompt<CarePlanOutput>({
				prompt,
				systemInstruction:
					'You are an empathetic community health worker in Nigeria explaining doctor orders in clear, simple vernacular language.',
				context: { knownName: patientName },
				schema: carePlanSchema,
				parseJson: true
			});

			carePlan = result.data;
			executionSource = result.metadata.source;
			latencyMs = result.metadata.durationMs;

			toast.success(
				executionSource === 'ON_DEVICE'
					? `Generated locally on-device (${selectedLanguage})`
					: `Generated via high-fidelity cloud hybrid (${selectedLanguage})`
			);
		} catch (err) {
			console.error('[CarePlanGenerator] Error:', err);
			toast.error('Failed to generate care plan.');
		} finally {
			isGenerating = false;
		}
	}

	function printHandout() {
		window.print();
	}
</script>

<Card class="border-border bg-card overflow-hidden">
	<CardHeader class="pb-3 border-b border-border bg-muted/20">
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<FileHeart class="size-4 text-primary" />
				<CardTitle class="text-base font-semibold"
					>Take-Home Care Plan & Vernacular Instructions</CardTitle
				>
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
			Converts complex diagnoses and prescriptions into simple, culturally accessible discharge
			instructions.
		</p>
	</CardHeader>

	<CardContent class="p-5 space-y-4">
		<AiDisclaimer compact />

		<!-- Language Selector & Generator Bar -->
		<div
			class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border bg-muted/10"
		>
			<div class="flex items-center gap-2">
				<Languages class="size-4 text-muted-foreground" />
				<span class="text-xs font-medium text-foreground">Target Language:</span>
				<select
					bind:value={selectedLanguage}
					class="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
				>
					<option value="English">English (Simple)</option>
					<option value="Nigerian Pidgin">Nigerian Pidgin</option>
					<option value="Yoruba">Yorùbá</option>
					<option value="Hausa">Hausa</option>
					<option value="Igbo">Asụsụ Igbo</option>
				</select>
			</div>

			<Button
				size="sm"
				disabled={isGenerating || (!chiefComplaint && !doctorNotes)}
				onclick={generateCarePlan}
				class="gap-1.5"
			>
				{#if isGenerating}
					<Loader2 class="size-3.5 animate-spin" />
					Composing Care Plan...
				{:else}
					<Sparkles class="size-3.5" />
					Generate Vernacular Care Plan
				{/if}
			</Button>
		</div>

		<!-- Generated Care Plan Display -->
		{#if carePlan}
			<div
				class="rounded-xl border border-border bg-card p-5 space-y-4 animate-fade-in print:border-none print:p-0"
			>
				<div class="flex items-center justify-between border-b border-border pb-3">
					<div>
						<h3 class="text-base font-bold text-foreground">
							{carePlan.greeting || `Hello ${patientName}`}
						</h3>
						<p class="text-xs text-muted-foreground font-mono">Language: {carePlan.language}</p>
					</div>
					<div class="flex gap-2 print:hidden">
						<Button variant="outline" size="sm" onclick={printHandout} class="gap-1.5 text-xs">
							<Printer class="size-3.5" />
							Print Handout
						</Button>
					</div>
				</div>

				<div
					class="text-sm text-foreground/90 leading-relaxed bg-muted/20 p-3.5 rounded-lg border border-border/50"
				>
					{carePlan.plainLanguageSummary}
				</div>

				{#if carePlan.medicationSchedules?.length > 0}
					<div class="space-y-2">
						<h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
							How to Take Your Medicine:
						</h4>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
							{#each carePlan.medicationSchedules as item}
								<div class="p-3 rounded-lg border border-border bg-background text-xs space-y-1">
									<div class="flex justify-between items-center font-bold text-primary">
										<span>{item.drug}</span>
										<Badge variant="outline" class="font-mono text-[10px]">{item.schedule}</Badge>
									</div>
									<p class="text-muted-foreground">{item.instructions}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if carePlan.lifestyleAdvice?.length > 0}
					<div class="space-y-1.5 text-xs">
						<h4 class="font-semibold text-muted-foreground uppercase tracking-wider">
							What to Do at Home:
						</h4>
						<ul class="list-disc list-inside space-y-1 text-foreground/90 pl-1">
							{#each carePlan.lifestyleAdvice as tip}
								<li>{tip}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if carePlan.redFlagWarningSigns?.length > 0}
					<div
						class="p-3 rounded-lg border border-triage-red/30 bg-triage-red/10 text-xs space-y-1.5"
					>
						<h4 class="font-bold text-triage-red flex items-center gap-1.5">
							⚠️ Come Back Immediately If You Notice:
						</h4>
						<ul class="list-disc list-inside space-y-1 text-foreground font-medium pl-1">
							{#each carePlan.redFlagWarningSigns as warning}
								<li>{warning}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}
	</CardContent>
</Card>
