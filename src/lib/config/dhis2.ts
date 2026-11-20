/** Documented placeholder UIDs used until a PHC configures its real DHIS2 UIDs. */
export const DHIS2_DEFAULT_UIDS = {
	dataSetUid: 'CLINIC_FLOW_DATASET_UID',
	orgUnitUid: 'CLINIC_FLOW_LOCAL_PHC_UID',
	totalPatientsUid: 'TOTAL_PATIENTS_UID',
	totalEncountersUid: 'TOTAL_ENCOUNTERS_UID',
	patientsMaleUid: 'PATIENTS_MALE_UID',
	patientsFemaleUid: 'PATIENTS_FEMALE_UID',
	triageRedUid: 'TRIAGE_RED_UID',
	triageAmberUid: 'TRIAGE_AMBER_UID',
	triageGreenUid: 'TRIAGE_GREEN_UID'
} as const;

export type Dhis2UidConfig = typeof DHIS2_DEFAULT_UIDS;
export type Dhis2UidKey = keyof Dhis2UidConfig;
