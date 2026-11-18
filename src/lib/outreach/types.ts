export const OUTREACH_ACTIVITY_TYPES = [
	'household_visit',
	'health_talk',
	'immunization',
	'bednet_distribution',
	'screening',
	'other'
] as const;

export type OutreachActivityType = (typeof OUTREACH_ACTIVITY_TYPES)[number];

export function isOutreachActivityType(value: string): value is OutreachActivityType {
	return OUTREACH_ACTIVITY_TYPES.some((activityType) => activityType === value);
}

export const OUTREACH_ACTIVITY_LABELS: Record<OutreachActivityType, string> = {
	household_visit: 'Household Visit',
	health_talk: 'Health Talk',
	immunization: 'Immunization Campaign',
	bednet_distribution: 'Bednet Distribution',
	screening: 'Community Screening',
	other: 'Other Outreach'
};
