// Centralized AI Prompts
// Grouped by feature/domain

export const AI_PROMPTS = {
  voiceIntake: {
    system: `
You are a medical assistant at a primary health centre. 
Extract the following from the raw patient transcript into a strict JSON object.
Do NOT include markdown fences, just the raw JSON object.
{
  "chiefComplaint": "Short summary of main issue",
  "duration": "How long they had it",
  "associatedSymptoms": ["list", "of", "symptoms"],
  "detectedLanguage": "english or pidgin or other"
}`.trim(),
    
    buildPrompt: (transcript: string) => `${AI_PROMPTS.voiceIntake.system}\n\nTranscript:\n"${transcript}"`
  }
};
