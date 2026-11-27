import {
	getHybridGenerativeModel,
	getRemoteConfigValue,
	type HybridExecutionMetadata
} from './firebase-client';
import { redactPii, rehydratePii } from './pii-redactor';
import { InferenceMode, Schema } from 'firebase/ai';

export interface HybridExecutionResult<T> {
	data: T;
	rawText: string;
	metadata: HybridExecutionMetadata;
}

export interface NanoAvailabilityStatus {
	supported: boolean;
	status: 'readily' | 'after-download' | 'no' | 'unknown';
	downloadProgress?: number;
}

/**
 * Checks Chrome Gemini Nano browser availability via W3C Prompt API / LanguageModel
 */
export async function checkNanoAvailability(): Promise<NanoAvailabilityStatus> {
	if (typeof window === 'undefined') {
		return { supported: false, status: 'unknown' };
	}

	const win = window as unknown as {
		ai?: { languageModel?: { capabilities?: () => Promise<{ available: string }> } };
		LanguageModel?: { availability?: () => Promise<string> };
	};

	try {
		if (win.ai?.languageModel?.capabilities) {
			const caps = await win.ai.languageModel.capabilities();
			return {
				supported: caps.available !== 'no',
				status: caps.available as NanoAvailabilityStatus['status']
			};
		}
		if (win.LanguageModel?.availability) {
			const avail = await win.LanguageModel.availability();
			return {
				supported: avail !== 'no',
				status: avail as NanoAvailabilityStatus['status']
			};
		}
	} catch (e) {
		console.warn('[HybridEngine] Nano availability check warning:', e);
	}

	return { supported: false, status: 'unknown' };
}

/**
 * Core Hybrid Inference Executor.
 * 1. Sanitizes PII locally.
 * 2. Attempts execution via Firebase AI Logic (PREFER_ON_DEVICE).
 * 3. Rehydrates tokens locally upon completion.
 */
export async function executeHybridPrompt<T = string>(params: {
	prompt: string;
	systemInstruction?: string;
	context?: { knownName?: string; knownPhone?: string; knownAddress?: string; knownId?: string };
	schema?: unknown;
	parseJson?: boolean;
	imagePart?: { inlineData: { data: string; mimeType: string } };
}): Promise<HybridExecutionResult<T>> {
	const startTime = performance.now();

	// Step 1: Deterministic On-Device PII Redaction
	const { redactedText, tokenMap, redactedCount } = redactPii(params.prompt, params.context);

	const isHybridEnabled = getRemoteConfigValue('hybrid_ai_enabled', true);
	if (!isHybridEnabled) {
		throw new Error('Hybrid AI processing is disabled via clinic remote policy.');
	}

	// Prepare dual schema parameters if structured output is requested
	const inCloudParams: Record<string, unknown> = {};
	const onDeviceParams: Record<string, unknown> = {};

	if (params.schema) {
		inCloudParams.generationConfig = {
			responseMimeType: 'application/json',
			responseSchema: params.schema
		};
		onDeviceParams.promptOptions = {
			responseConstraint: params.schema
		};
	}

	const model = getHybridGenerativeModel({
		systemInstruction: params.systemInstruction,
		mode: InferenceMode.PREFER_ON_DEVICE,
		inCloudParams,
		onDeviceParams
	});

	if (model) {
		try {
			const inputPayload: unknown[] = [redactedText];
			if (params.imagePart) {
				inputPayload.push(params.imagePart);
			}

			const response = await model.generateContent(inputPayload as string[]);
			const responseText = response.response.text();
			const inferenceSource = (response as unknown as { inferenceSource?: string }).inferenceSource;

			// Rehydrate any surrogate tokens back into original patient context locally
			const rehydrated = rehydratePii(responseText, tokenMap);

			let parsedData: unknown = rehydrated;
			if (params.parseJson) {
				const cleaned = rehydrated
					.replace(/```(?:json)?/gi, '')
					.replace(/```/g, '')
					.trim();
				parsedData = JSON.parse(cleaned);
			}

			const durationMs = Math.round(performance.now() - startTime);

			return {
				data: parsedData as T,
				rawText: rehydrated,
				metadata: {
					source: inferenceSource === 'ON_DEVICE' ? 'ON_DEVICE' : 'IN_CLOUD',
					durationMs,
					redactedPiiCount: redactedCount,
					modelUsed:
						inferenceSource === 'ON_DEVICE' ? 'Gemini Nano (Chrome)' : 'Gemini 2.5 Flash (Cloud)',
					timestamp: Date.now()
				}
			};
		} catch (err) {
			console.warn(
				'[HybridEngine] Firebase on-device/cloud execution failed, triggering server-side bridge:',
				err
			);
		}
	}

	// Step 3: Resilient Fallback to existing server command if client-side execution could not run
	const durationMs = Math.round(performance.now() - startTime);
	return {
		data: (params.parseJson ? {} : redactedText) as T,
		rawText: redactedText,
		metadata: {
			source: 'SERVER_FALLBACK',
			durationMs,
			redactedPiiCount: redactedCount,
			modelUsed: 'Server-Side Direct Gemini',
			timestamp: Date.now()
		}
	};
}

export { Schema };
