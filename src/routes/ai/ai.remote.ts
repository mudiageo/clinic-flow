import { command, getRequestEvent } from '$app/server';
import { GoogleGenAI } from '@google/genai';
import { AI_PROMPTS } from '../../lib/services/ai/prompts';
import { requirePermission } from '$lib/server/permissions';
import { GEMINI_API_KEY } from '$app/env/private';
import * as v from 'valibot';

export const structureIntake = command(
	v.object({ transcript: v.string(), language: v.optional(v.string()) }),
	async ({ transcript, language }) => {
	if (!GEMINI_API_KEY) {
		throw new Error('GEMINI_API_KEY is not set. Please configure it to use AI Voice Intake.');
	}

	const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

	const prompt = AI_PROMPTS.voiceIntake.buildPrompt(transcript, language);

	try {
		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: prompt
		});

		let text = response.text || '{}';
		text = text
			.replace(/```json/gi, '')
			.replace(/```/g, '')
			.trim();

		return JSON.parse(text);
	} catch (err: any) {
		throw new Error(`AI Extraction failed: ${err.message}`);
	}
});

export const getClinicalDecisionSupport = command(
	v.object({ 
		vitals: v.any(), 
		chiefComplaint: v.string() 
	}),
	async ({ vitals, chiefComplaint }) => {
		const event = getRequestEvent();
		if (!event.locals.staffId) throw new Error('Unauthorized');
		
		// Enforce permissions before allowing AI access to medical logic
		await requirePermission(event.locals.staffId, 'view:medical_records');

		if (!GEMINI_API_KEY) {
			throw new Error('GEMINI_API_KEY is not set.');
		}

		const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
		const prompt = AI_PROMPTS.clinicalDSS.buildPrompt(vitals, chiefComplaint);

		try {
			// Using gemini-2.5-pro for higher clinical reasoning capabilities
			const response = await ai.models.generateContent({
				model: 'gemini-2.5-pro', 
				contents: prompt
			});

			let text = response.text || '{}';
			text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

			return JSON.parse(text);
		} catch (err: any) {
			throw new Error(`Clinical DSS failed: ${err.message}`);
		}
	}
);

export const getRxBrainAnalysis = command(
	v.object({ 
		patientData: v.any(),
		prescriptions: v.array(v.any()) 
	}),
	async ({ patientData, prescriptions }) => {
		const event = getRequestEvent();
		if (!event.locals.staffId) throw new Error('Unauthorized');
		
		// Enforce permissions before allowing AI access to medical logic
		await requirePermission(event.locals.staffId, 'view:medical_records');

		if (!GEMINI_API_KEY) {
			throw new Error('GEMINI_API_KEY is not set.');
		}

		const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
		const prompt = AI_PROMPTS.rxBrain.buildPrompt(patientData, prescriptions);

		try {
			// Using gemini-2.5-pro for higher clinical reasoning capabilities (drug interactions)
			const response = await ai.models.generateContent({
				model: 'gemini-2.5-pro', 
				contents: prompt
			});

			let text = response.text || '{}';
			text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

			return JSON.parse(text);
		} catch (err: any) {
			throw new Error(`RxBrain failed: ${err.message}`);
		}
	}
);

export const generateSoapNote = command(
	v.object({ 
		vitals: v.any(), 
		transcript: v.string() 
	}),
	async ({ vitals, transcript }) => {
		const event = getRequestEvent();
		if (!event.locals.staffId) throw new Error('Unauthorized');
		
		// Enforce write permissions because this dictates official medical records
		await requirePermission(event.locals.staffId, 'write:medical_records');

		if (!GEMINI_API_KEY) {
			throw new Error('GEMINI_API_KEY is not set.');
		}

		const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
		const prompt = AI_PROMPTS.soapNote.buildPrompt(vitals, transcript);

		try {
			// Using gemini-2.5-pro for high clinical reasoning
			const response = await ai.models.generateContent({
				model: 'gemini-2.5-pro', 
				contents: prompt
			});

			let text = response.text || '{}';
			text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

			return JSON.parse(text);
		} catch (err: any) {
			throw new Error(`SOAP Note generation failed: ${err.message}`);
		}
	}
);
