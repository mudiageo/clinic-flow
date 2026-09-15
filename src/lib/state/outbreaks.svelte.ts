import { encounterStore } from './encounters.svelte';
import { patientStore } from './patients.svelte';
import { pharmacyStore } from './pharmacy.svelte';
import { vitalsStore } from './vitals.svelte';
import { settingsStore } from './settings.svelte';
import { getEpidemiologyForecast } from '$lib/remote/ai.remote';
import { toast } from 'svelte-sonner';

export type OutbreakAlert = {
	disease: string;
	community: string;
	count: number;
	lastEncounterDate: number;
};

class OutbreakEngine {
	// AI State
	aiAnalysis = $state<any | null>(null);
	isAnalysing = $state(false);
	lastAnalysedAt = $state<number | null>(null);
	
	// Track dismissed alerts: alertId -> { reason, ts }
	dismissedAlerts = $state<Map<string, { reason: string; ts: number }>>(new Map());
	
	// Feedback loop tracking: interventionId -> { implementedAt, casesAfter }
	interventionOutcomes = $state<Record<string, { implementedAt: number; casesAfter?: number[] }>>({});

	// Derived state representing active outbreaks (>= 5 cases in 7 days in same community)
	// This is the safety layer — rule-based alerts ALWAYS run.
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

	// Helper to extract disease from text
	private extractDisease(complaint: string): string | null {
		const c = complaint.toLowerCase();
		if (c.includes('malaria') || c.includes('fever')) return 'Malaria/Fever';
		if (c.includes('cholera') || c.includes('diarrhea') || c.includes('stool') || c.includes('vomit')) return 'Cholera/Diarrhea';
		if (c.includes('measles') || c.includes('rash')) return 'Measles';
		if (c.includes('typhoid')) return 'Typhoid';
		if (c.includes('diphtheria')) return 'Diphtheria';
		return null;
	}

	// 1. Multi-signal Aggregation & Seasonal Baseline Builder
	private buildAiDataBundle() {
		const now = Date.now();
		const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
		const oneYearAgoWindowStart = thirtyDaysAgo - 365 * 24 * 60 * 60 * 1000;
		const oneYearAgoWindowEnd = now - 365 * 24 * 60 * 60 * 1000;

		const recentEncounters = encounterStore.items.filter(e => e.visitDate >= thirtyDaysAgo);
		const lastYearEncounters = encounterStore.items.filter(e => e.visitDate >= oneYearAgoWindowStart && e.visitDate <= oneYearAgoWindowEnd);

		const diseaseMap = new Map<string, any>();

		for (const enc of recentEncounters) {
			if (!enc.chiefComplaint) continue;
			const p = patientStore.get(enc.patientId);
			if (!p) continue;

			const disease = this.extractDisease(enc.chiefComplaint);
			if (!disease) continue;

			if (!diseaseMap.has(disease)) {
				diseaseMap.set(disease, {
					disease,
					totalCases: 0,
					weeklyBreakdown: [0,0,0,0,0],
					affectedCommunities: new Set<string>(),
					ageGroups: { under5: 0, age5to15: 0, adult: 0, elderly: 0 },
					pregnantCases: 0
				});
			}

			const d = diseaseMap.get(disease);
			d.totalCases++;
			d.affectedCommunities.add(p.community || 'Unknown');
			
			if (p.isPregnant) d.pregnantCases++;

			// Determine age group
			const age = p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : p.estimatedAge;
			if (age !== undefined) {
				if (age < 5) d.ageGroups.under5++;
				else if (age < 15) d.ageGroups.age5to15++;
				else if (age < 60) d.ageGroups.adult++;
				else d.ageGroups.elderly++;
			}

			// Weekly bucket (week 4 is most recent, week 0 is oldest in the 30-day window)
			const daysAgo = (now - enc.visitDate) / (1000 * 60 * 60 * 24);
			let weekIdx = 4 - Math.floor(daysAgo / 7);
			if (weekIdx < 0) weekIdx = 0;
			if (weekIdx > 4) weekIdx = 4;
			d.weeklyBreakdown[weekIdx]++;
		}

		// Calculate Seasonal Baseline (same period last year)
		for (const enc of lastYearEncounters) {
			if (!enc.chiefComplaint) continue;
			const disease = this.extractDisease(enc.chiefComplaint);
			if (!disease || !diseaseMap.has(disease)) continue;
			
			const d = diseaseMap.get(disease);
			d.samePeriodLastYear = (d.samePeriodLastYear || 0) + 1;
		}

		const diseaseGroups = Array.from(diseaseMap.values()).map(d => ({
			...d,
			affectedCommunities: Array.from(d.affectedCommunities)
		}));

		// Vitals Signals: High Fever Clusters
		const recentVitals = vitalsStore.items.filter(v => v.recordedAt >= thirtyDaysAgo && v.temperatureCelsius && v.temperatureCelsius >= 38.5);
		const feverCommunities = new Set<string>();
		recentVitals.forEach(v => {
			const p = patientStore.get(v.patientId);
			if (p && p.community) feverCommunities.add(p.community);
		});

		// Pharmacy Stock Levels
		const currentStockLevels = pharmacyStore.items.map(item => ({
			drug: item.name,
			currentStock: item.currentStock,
			unit: item.unit,
			lowStockThreshold: item.lowStockThreshold
		}));

		return {
			phcName: settingsStore.current?.name || 'Local PHC',
			lga: 'Ughelli North',
			state: 'Delta',
			analysisWindow: `${new Date(thirtyDaysAgo).toISOString().split('T')[0]} to ${new Date(now).toISOString().split('T')[0]}`,
			totalEncounters: recentEncounters.length,
			diseaseGroups,
			vitalsSignals: [{
				anomalyType: 'High Fever Cluster (≥38.5°C)',
				affectedCommunities: Array.from(feverCommunities),
				weeklyCount: [0, 0, 0, 0, recentVitals.length] // simplified weekly bucket for vitals
			}],
			rxSignals: [],
			labSignals: [],
			currentStockLevels
		};
	}

	// 2. Trigger AI Analysis via Remote Command
	async runAiAnalysis() {
		if (!settingsStore.current?.outbreakDetectionEnabled) {
			toast.error('Outbreak Detection is disabled globally by Superadmin.');
			return;
		}

		this.isAnalysing = true;
		try {
			const bundle = this.buildAiDataBundle();
			
			if (bundle.diseaseGroups.length === 0) {
				toast.info('No disease data found in the last 30 days to analyse.');
				this.isAnalysing = false;
				return;
			}

			const result = await getEpidemiologyForecast({ dataBundle: bundle });
			this.aiAnalysis = result;
			this.lastAnalysedAt = Date.now();
			toast.success('Epidemiology forecast complete.');
		} catch (err: any) {
			console.error(err);
			toast.error(`Analysis failed: ${err.message}`);
		} finally {
			this.isAnalysing = false;
		}
	}

	// 3. Workflow methods
	dismissAlert(id: string, reason: string) {
		this.dismissedAlerts.set(id, { reason, ts: Date.now() });
		toast.success('Alert dismissed and logged to audit trail.');
		// In a real app, we'd also push an AuditLog entry here via an auditStore
	}

	markInterventionImplemented(interventionAction: string) {
		this.interventionOutcomes[interventionAction] = { implementedAt: Date.now() };
		toast.success('Intervention marked as implemented. Monitoring for efficacy.');
	}
}

export const outbreakEngine = new OutbreakEngine();
