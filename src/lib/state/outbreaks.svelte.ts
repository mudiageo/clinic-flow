import { encounterStore } from './encounters.svelte';
import { patientStore } from './patients.svelte';

export type OutbreakAlert = {
	disease: string;
	community: string;
	count: number;
	lastEncounterDate: number;
};

class OutbreakEngine {
	// Derived state representing active outbreaks (>= 5 cases in 7 days in same community)
	get alerts(): OutbreakAlert[] {
		const now = Date.now();
		const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
		
		const recentEncounters = encounterStore.items.filter(e => e.visitDate >= sevenDaysAgo && e.chiefComplaint);
		
		// Map community + normalized complaint -> count
		const clusters: Record<string, { count: number; disease: string; community: string, lastEncounterDate: number }> = {};
		
		for (const enc of recentEncounters) {
			const patient = patientStore.get(enc.patientId);
			if (!patient || !patient.community) continue;
			
			// Naive AI extraction fallback or text search for demo
			const complaintLower = enc.chiefComplaint.toLowerCase();
			let detectedDisease = null;
			
			if (complaintLower.includes('malaria') || complaintLower.includes('fever')) detectedDisease = 'Malaria/Fever';
			else if (complaintLower.includes('cholera') || complaintLower.includes('diarrhea') || complaintLower.includes('stool') || complaintLower.includes('vomit')) detectedDisease = 'Cholera/Diarrhea';
			else if (complaintLower.includes('measles') || complaintLower.includes('rash')) detectedDisease = 'Measles';
			else if (complaintLower.includes('typhoid')) detectedDisease = 'Typhoid';
			else if (complaintLower.includes('diphtheria')) detectedDisease = 'Diphtheria';
			
			if (detectedDisease) {
				const key = `${patient.community}-${detectedDisease}`;
				if (!clusters[key]) {
					clusters[key] = { count: 0, disease: detectedDisease, community: patient.community, lastEncounterDate: enc.visitDate };
				}
				clusters[key].count++;
				clusters[key].lastEncounterDate = Math.max(clusters[key].lastEncounterDate, enc.visitDate);
			}
		}
		
		// Return outbreaks that pass the threshold (5 cases)
		return Object.values(clusters).filter(c => c.count >= 5).sort((a, b) => b.count - a.count);
	}
}

export const outbreakEngine = new OutbreakEngine();
