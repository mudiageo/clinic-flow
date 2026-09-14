export interface AIStructuredIntake {
	chiefComplaint: string;
	duration?: string;
	associatedSymptoms?: string[];
	detectedLanguage?: string;
}

export interface ClinicalDSSResult {
	differentials: Array<{
		condition: string;
		probability: 'High' | 'Medium' | 'Low';
		rationale: string;
	}>;
	suggestedTests: string[];
	treatments: string[];
	redFlags: string[];
	disclaimer: string;
}

export interface RxBrainResult {
	interactions: Array<{
		drugs: string[];
		severity: 'High' | 'Moderate' | 'Minor';
		description: string;
	}>;
	contraindications: string[];
	dosageWarnings: string[];
	safeToDispense: boolean;
}

export interface SoapNoteResult {
	subjective: string;
	objective: string;
	assessment: string;
	plan: string;
}

export interface AIProvider {
	name: string;
	isAvailable(): Promise<boolean> | boolean;
	structureIntake(transcript: string, language?: string): Promise<AIStructuredIntake>;
}
