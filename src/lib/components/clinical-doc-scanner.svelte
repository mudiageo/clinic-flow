<script lang="ts">
	import { executeHybridPrompt, Schema } from '#lib/ai/hybrid-engine';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Card, CardHeader, CardTitle, CardContent } from '#lib/components/ui/card/index.ts';
	import AiDisclaimer from '#lib/components/ui/ai-disclaimer.svelte';
	import {
		Camera,
		Upload,
		Loader2,
		Sparkles,
		Check,
		AlertCircle,
		FileText,
		CheckCircle2
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	export interface ExtractedClinicalDoc {
		documentType: 'rapid_test_strip' | 'handwritten_note' | 'prescription_sheet' | 'unidentified';
		testName?: string;
		testResult?: 'positive' | 'negative' | 'indeterminate' | 'not_applicable';
		extractedNotes: string;
		medicationsIdentified: { name: string; dosage?: string; quantity?: number }[];
		confidence: 'high' | 'medium' | 'low';
	}

	let { onApplyExtractedData }: { onApplyExtractedData?: (data: ExtractedClinicalDoc) => void } =
		$props();

	let fileInputRef: HTMLInputElement | null = $state(null);
	let selectedImagePreview: string | null = $state(null);
	let selectedImageBase64: string | null = $state(null);
	let selectedImageMimeType = $state('image/jpeg');

	let isAnalyzing = $state(false);
	let extractedResult = $state<ExtractedClinicalDoc | null>(null);
	let executionSource = $state<'ON_DEVICE' | 'IN_CLOUD' | 'SERVER_FALLBACK' | null>(null);
	let latencyMs = $state<number | null>(null);

	const docSchema = Schema.object({
		properties: {
			documentType: Schema.string(),
			testName: Schema.string(),
			testResult: Schema.string(),
			extractedNotes: Schema.string(),
			medicationsIdentified: Schema.array({
				items: Schema.object({
					properties: {
						name: Schema.string(),
						dosage: Schema.string(),
						quantity: Schema.number()
					},
					optionalProperties: ['dosage', 'quantity']
				})
			}),
			confidence: Schema.string()
		},
		optionalProperties: ['testName', 'testResult']
	});

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		selectedImageMimeType = file.type || 'image/jpeg';
		const reader = new FileReader();
		reader.onload = () => {
			const resultStr = reader.result as string;
			selectedImagePreview = resultStr;
			// Strip the data:image/xyz;base64, prefix for the model payload
			selectedImageBase64 = resultStr.split(',')[1] || resultStr;
			extractedResult = null;
		};
		reader.readAsDataURL(file);
	}

	async function runHybridScan() {
		if (!selectedImageBase64) {
			toast.error('Please upload or capture a clinical document/strip image first.');
			return;
		}

		isAnalyzing = true;
		try {
			const prompt = `Analyze this clinical image from a rural Nigerian Primary Health Centre.
1. Determine if this is a Rapid Diagnostic Test strip (e.g. Malaria RDT, Hepatitis, HIV cassette), handwritten referral note, or medication packaging.
2. If it is an RDT, read the test line (C vs T) and report if positive, negative, or invalid.
3. If it contains handwritten notes or prescriptions, transcribe the key diagnoses, vital signs, and medication instructions into clinical notes.
Extract strictly structured clinical data.`;

			const result = await executeHybridPrompt<ExtractedClinicalDoc>({
				prompt,
				systemInstruction:
					'You are an assistive clinical OCR and rapid diagnostic vision assistant for Primary Healthcare Centres. Always flag uncertain readings with low confidence.',
				schema: docSchema,
				parseJson: true,
				imagePart: {
					inlineData: {
						data: selectedImageBase64,
						mimeType: selectedImageMimeType
					}
				}
			});

			extractedResult = result.data;
			executionSource = result.metadata.source;
			latencyMs = result.metadata.durationMs;

			toast.success(
				executionSource === 'ON_DEVICE'
					? 'Processed completely on-device via Gemini Nano'
					: 'Processed via secure cloud hybrid fallback'
			);
		} catch (err) {
			console.error('[DocumentScanner] Error:', err);
			toast.error('Failed to analyze document. Please check image clarity.');
		} finally {
			isAnalyzing = false;
		}
	}

	function handleConfirmAndApply() {
		if (!extractedResult) return;
		if (onApplyExtractedData) {
			onApplyExtractedData(extractedResult);
		}
		toast.success('Clinical data applied to encounter record.');
	}
</script>

<Card class="border-border bg-card overflow-hidden">
	<CardHeader class="pb-3 border-b border-border bg-muted/20">
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<Camera class="size-4 text-primary" />
				<CardTitle class="text-base font-semibold">Clinical Document & Lab-Strip Scanner</CardTitle>
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
			Capture Malaria RDT cassettes, paper referral notes, or drug packages for instant on-device
			extraction.
		</p>
	</CardHeader>

	<CardContent class="p-5 space-y-4">
		<AiDisclaimer compact />

		<!-- Upload / Camera Input Area -->
		<div class="flex flex-col sm:flex-row gap-4 items-center">
			<input
				type="file"
				accept="image/jpeg,image/png,image/webp"
				capture="environment"
				class="hidden"
				bind:this={fileInputRef}
				onchange={handleFileSelect}
			/>

			{#if selectedImagePreview}
				<div
					class="relative size-32 rounded-xl overflow-hidden border border-border bg-muted/30 shrink-0"
				>
					<img
						src={selectedImagePreview}
						alt="Clinical upload preview"
						class="size-full object-cover"
					/>
					<Button
						variant="secondary"
						size="sm"
						class="absolute bottom-1 right-1 text-[10px] h-6 px-1.5"
						onclick={() => fileInputRef?.click()}
					>
						Retake
					</Button>
				</div>
			{:else}
				<button
					type="button"
					onclick={() => fileInputRef?.click()}
					class="size-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/10 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
				>
					<Upload class="size-6 text-primary" />
					<span class="text-xs font-medium">Upload or Snap</span>
				</button>
			{/if}

			<div class="flex-1 space-y-2">
				<p class="text-sm text-foreground font-medium">
					{selectedImagePreview ? 'Document ready for inference' : 'No document selected'}
				</p>
				<p class="text-xs text-muted-foreground">
					On-device execution extracts text without patient photos ever leaving this facility.
				</p>
				<Button
					size="sm"
					disabled={!selectedImagePreview || isAnalyzing}
					onclick={runHybridScan}
					class="gap-2"
				>
					{#if isAnalyzing}
						<Loader2 class="size-3.5 animate-spin" />
						Analyzing On-Device...
					{:else}
						<Sparkles class="size-3.5" />
						Run Hybrid OCR Analysis
					{/if}
				</Button>
			</div>
		</div>

		<!-- Structured Extraction Results Preview -->
		{#if extractedResult}
			<div class="rounded-xl border border-border bg-muted/20 p-4 space-y-3 animate-fade-in">
				<div class="flex items-center justify-between pb-2 border-b border-border/50">
					<div class="flex items-center gap-2">
						<FileText class="size-4 text-primary" />
						<span class="text-sm font-semibold capitalize">
							{extractedResult.documentType.replace(/_/g, ' ')}
						</span>
					</div>
					<Badge
						variant="outline"
						class="text-[10px] font-mono {extractedResult.confidence === 'high'
							? 'border-triage-green text-triage-green'
							: 'border-triage-amber text-amber-700 dark:text-triage-amber'}"
					>
						Confidence: {extractedResult.confidence}
					</Badge>
				</div>

				{#if extractedResult.testName || extractedResult.testResult}
					<div
						class="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between text-xs"
					>
						<span class="font-medium">{extractedResult.testName || 'Diagnostic Strip'}</span>
						<Badge
							class="capitalize {extractedResult.testResult === 'positive'
								? 'bg-triage-red'
								: extractedResult.testResult === 'negative'
									? 'bg-triage-green'
									: 'bg-muted text-foreground'}"
						>
							{extractedResult.testResult}
						</Badge>
					</div>
				{/if}

				{#if extractedResult.extractedNotes}
					<div class="text-xs space-y-1">
						<span class="font-semibold text-muted-foreground uppercase tracking-wider"
							>Clinical Transcription:</span
						>
						<p
							class="p-2 rounded-lg bg-card border border-border text-foreground leading-relaxed whitespace-pre-wrap"
						>
							{extractedResult.extractedNotes}
						</p>
					</div>
				{/if}

				{#if extractedResult.medicationsIdentified?.length > 0}
					<div class="text-xs space-y-1.5">
						<span class="font-semibold text-muted-foreground uppercase tracking-wider"
							>Detected Medications:</span
						>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
							{#each extractedResult.medicationsIdentified as med}
								<div
									class="p-2 rounded border border-border bg-card flex justify-between items-center"
								>
									<span class="font-medium">{med.name}</span>
									<span class="text-muted-foreground font-mono"
										>{med.dosage || ''} {med.quantity ? `x${med.quantity}` : ''}</span
									>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="pt-2 flex justify-end">
					<Button size="sm" onclick={handleConfirmAndApply} class="gap-1.5">
						<CheckCircle2 class="size-3.5" />
						Verify & Insert into Record
					</Button>
				</div>
			</div>
		{/if}
	</CardContent>
</Card>
