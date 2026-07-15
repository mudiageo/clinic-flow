export interface AIStructuredIntake {
	chiefComplaint: string;
	duration?: string;
	associatedSymptoms?: string[];
	detectedLanguage?: string;
}

export interface AIProvider {
	name: string;
	isAvailable(): Promise<boolean> | boolean;
	structureIntake(transcript: string): Promise<AIStructuredIntake>;
}
