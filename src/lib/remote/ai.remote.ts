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
		await requirePermission('view:patients');

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
		await requirePermission('view:patients');

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
		transcript: v.string(),
		patient: v.any(),
		prescriptions: v.array(v.any()),
		labs: v.any(),
		history: v.array(v.any())
	}),
	async ({ vitals, transcript, patient, prescriptions, labs, history }) => {
		const event = getRequestEvent();
		if (!event.locals.staffId) throw new Error('Unauthorized');
		
		// Enforce write permissions because this dictates official medical records
		await requirePermission('manage:consultations');

		if (!GEMINI_API_KEY) {
			throw new Error('GEMINI_API_KEY is not set.');
		}

		// PRIVACY / NDPR COMPLIANCE: 
		// Strip all Personally Identifiable Information (PII) before sending to the LLM.
		// We only send clinical context needed for the SOAP note.
		const deidentifiedProfile = {
			age: patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : patient.estimatedAge,
			sex: patient.sex,
			isPregnant: patient.isPregnant,
			bloodGroup: patient.bloodGroup,
			genotype: patient.genotype
		};

		// Strip PII from history encounters too (e.g., recordedBy staff names if any exist, just send clinical notes)
		const cleanHistory = history.map(h => ({
			visitDate: h.visitDate,
			chiefComplaint: h.chiefComplaint,
			doctorNotes: h.doctorNotes,
			triageLevel: h.triageLevel
		}));

		const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
		const prompt = AI_PROMPTS.soapNote.buildPrompt(vitals, transcript, deidentifiedProfile, cleanHistory, prescriptions, labs);

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

export const getPatientRiskScore = command(
	v.object({ 
		vitals: v.any(), 
		patient: v.any(),
		chiefComplaint: v.string(),
		pastVitals: v.array(v.any())
	}),
	async ({ vitals, patient, chiefComplaint, pastVitals }) => {
		const event = getRequestEvent();
		if (!event.locals.staffId) throw new Error('Unauthorized');
		
		// Enforce read permissions
		await requirePermission('view:patients');

		if (!GEMINI_API_KEY) {
			throw new Error('GEMINI_API_KEY is not set.');
		}

		// PRIVACY / NDPR COMPLIANCE
		const deidentifiedProfile = {
			age: patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : patient.estimatedAge,
			sex: patient.sex,
			isPregnant: patient.isPregnant,
			bloodGroup: patient.bloodGroup
		};

		// Strip PII from past vitals just in case
		const cleanPastVitals = pastVitals.map(v => ({
			temperatureCelsius: v.temperatureCelsius,
			systolicBp: v.systolicBp,
			diastolicBp: v.diastolicBp,
			pulseBpm: v.pulseBpm,
			weightKg: v.weightKg,
			spo2Percent: v.spo2Percent,
			recordedAt: v.recordedAt
		}));

		const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
		const prompt = AI_PROMPTS.riskStratification.buildPrompt(vitals, deidentifiedProfile, chiefComplaint, cleanPastVitals);

		try {
			const response = await ai.models.generateContent({
				model: 'gemini-2.5-flash', 
				contents: prompt
			});

			let text = response.text || '{}';
			text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

			return JSON.parse(text);
		} catch (err: any) {
			throw new Error(`Risk Stratification failed: ${err.message}`);
		}
	}
);

export const getEpidemiologyForecast = command(
	v.object({
		dataBundle: v.any() // De-identified aggregated signals from client
	}),
	async ({ dataBundle }) => {
		const event = getRequestEvent();
		if (!event.locals.staffId) throw new Error('Unauthorized');

		// Enforce reporting permissions
		await requirePermission('view:reports');

		if (!GEMINI_API_KEY) {
			throw new Error('GEMINI_API_KEY is not set.');
		}

		// Use Gemini 2.5 Pro for deep epidemiological reasoning
		const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
		const prompt = AI_PROMPTS.epidemiologyForecast.buildPrompt(dataBundle);

		try {
			const response = await ai.models.generateContent({
				model: 'gemini-2.5-pro',
				contents: prompt
			});

			let text = response.text || '{}';
			text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

			return JSON.parse(text);
		} catch (err: any) {
			throw new Error(`Epidemiology Forecast failed: ${err.message}`);
		}
	}
);
