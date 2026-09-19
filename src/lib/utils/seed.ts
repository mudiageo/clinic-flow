import { patientStore } from '$lib/state/patients.svelte';
import { vitalsStore } from '$lib/state/vitals.svelte';
import { queueStore } from '$lib/state/queue.svelte';
import { encounterStore } from '$lib/state/encounters.svelte';
import { prescriptionStore } from '$lib/state/prescriptions.svelte';

export async function seedDemoData() {
	// 1. Create Patients
	const p1Id = await patientStore.create({
		clinicId: 'PHC-DEMO-001',
		phcId: 'PHC-DEMO',
		name: 'Amina Bello',
		sex: 'F',
		dob: '1995-05-12',
		phone: '08012345678',
		address: '14 Market Rd, Kano',
		community: 'Kano Municipal',
		isPregnant: true,
		familyId: null,
		guardianId: null,
		nextOfKinPhone: null,
		deleted: false
	});
	
	const p2Id = await patientStore.create({
		clinicId: 'PHC-DEMO-002',
		phcId: 'PHC-DEMO',
		name: 'Chinedu Eze',
		sex: 'M',
		dob: '1982-11-03',
		phone: '08087654321',
		address: '22 Independence Layout, Enugu',
		community: 'Independence Layout',
		isPregnant: false,
		familyId: null,
		guardianId: null,
		nextOfKinPhone: null,
		deleted: false
	});

	const p3Id = await patientStore.create({
		clinicId: 'PHC-DEMO-003',
		phcId: 'PHC-DEMO',
		name: 'Fatima Musa',
		sex: 'F',
		dob: '2020-02-14',
		phone: '09011122233',
		address: 'Sabon Gari, Kaduna',
		community: 'Sabon Gari',
		isPregnant: false,
		familyId: null,
		guardianId: null,
		nextOfKinPhone: null,
		deleted: false
	});

	// Outbreak Cluster (Cholera) - 5 Cases to trigger threshold
	const ob1Id = await patientStore.create({ clinicId: 'PHC-OB-01', phcId: 'PHC-DEMO', isPregnant: false, familyId: null, guardianId: null, nextOfKinPhone: null, deleted: false, name: 'Yusuf Ibrahim', sex: 'M', dob: '2015-08-20', address: 'Bakin Ruwa', community: 'Bakin Ruwa' });
	const ob2Id = await patientStore.create({ clinicId: 'PHC-OB-02', phcId: 'PHC-DEMO', isPregnant: false, familyId: null, guardianId: null, nextOfKinPhone: null, deleted: false, name: 'Halima Sani', sex: 'F', dob: '2018-01-10', address: 'Bakin Ruwa', community: 'Bakin Ruwa' });
	const ob3Id = await patientStore.create({ clinicId: 'PHC-OB-03', phcId: 'PHC-DEMO', isPregnant: false, familyId: null, guardianId: null, nextOfKinPhone: null, deleted: false, name: 'Kabir Usman', sex: 'M', dob: '1990-07-25', address: 'Bakin Ruwa', community: 'Bakin Ruwa' });
	const ob4Id = await patientStore.create({ clinicId: 'PHC-OB-04', phcId: 'PHC-DEMO', isPregnant: false, familyId: null, guardianId: null, nextOfKinPhone: null, deleted: false, name: 'Zainab Ali', sex: 'F', dob: '2010-04-12', address: 'Bakin Ruwa', community: 'Bakin Ruwa' });
	const ob5Id = await patientStore.create({ clinicId: 'PHC-OB-05', phcId: 'PHC-DEMO', isPregnant: false, familyId: null, guardianId: null, nextOfKinPhone: null, deleted: false, name: 'Musa Dauda', sex: 'M', dob: '1985-09-30', address: 'Bakin Ruwa', community: 'Bakin Ruwa' });

	// 2. Add Vitals & Encounters for Outbreak
	await vitalsStore.create({
		patientId: ob1Id,
		encounterId: 'enc-ob-1',
		temperatureCelsius: 39.2,
		pulseBpm: 120,
		systolicBp: 90,
		diastolicBp: 60,
		weightKg: null,
		spo2Percent: null,
		triageLevel: 'red',
		triageReason: 'Dehydration',
		recordedAt: Date.now()
	});
	await encounterStore.create({
		patientId: ob1Id,
		phcId: 'PHC-DEMO',
		recordedByStaffId: 'staff-demo',
		visitDate: Date.now(),
		chiefComplaint: 'Severe watery diarrhea, vomiting for 2 days',
		chiefComplaintRaw: null,
		chiefComplaintLanguage: null,
		doctorNotes: 'Patient severely dehydrated.',
		isNhisBillable: false
	});

	await vitalsStore.create({
		patientId: ob2Id,
		encounterId: 'enc-ob-2',
		temperatureCelsius: 38.5,
		pulseBpm: 110,
		systolicBp: null,
		diastolicBp: null,
		weightKg: null,
		spo2Percent: null,
		triageLevel: 'amber',
		triageReason: 'Fever and diarrhea',
		recordedAt: Date.now()
	});
	await encounterStore.create({
		patientId: ob2Id,
		phcId: 'PHC-DEMO',
		recordedByStaffId: 'staff-demo',
		visitDate: Date.now(),
		chiefComplaint: 'Frequent watery stools, abdominal cramps',
		chiefComplaintRaw: null,
		chiefComplaintLanguage: null,
		doctorNotes: 'Monitor fluid intake.',
		isNhisBillable: false
	});

	await vitalsStore.create({
		patientId: ob3Id,
		encounterId: 'enc-ob-3',
		temperatureCelsius: 39.0,
		pulseBpm: null,
		systolicBp: null,
		diastolicBp: null,
		weightKg: null,
		spo2Percent: null,
		triageLevel: 'amber',
		triageReason: 'Vomiting and diarrhea',
		recordedAt: Date.now()
	});
	await encounterStore.create({
		patientId: ob3Id,
		phcId: 'PHC-DEMO',
		recordedByStaffId: 'staff-demo',
		visitDate: Date.now(),
		chiefComplaint: 'Diarrhea, fatigue, muscle cramps',
		chiefComplaintRaw: null,
		chiefComplaintLanguage: null,
		doctorNotes: 'Observation required',
		isNhisBillable: false
	});

	await vitalsStore.create({
		patientId: ob4Id,
		encounterId: 'enc-ob-4',
		temperatureCelsius: 39.1,
		pulseBpm: null,
		systolicBp: null,
		diastolicBp: null,
		weightKg: null,
		spo2Percent: null,
		triageLevel: 'amber',
		triageReason: 'Diarrhea',
		recordedAt: Date.now()
	});
	await encounterStore.create({
		patientId: ob4Id,
		phcId: 'PHC-DEMO',
		recordedByStaffId: 'staff-demo',
		visitDate: Date.now(),
		chiefComplaint: 'Profuse watery diarrhea',
		chiefComplaintRaw: null,
		chiefComplaintLanguage: null,
		doctorNotes: 'Patient stable',
		isNhisBillable: false
	});

	await vitalsStore.create({
		patientId: ob5Id,
		encounterId: 'enc-ob-5',
		temperatureCelsius: 38.9,
		pulseBpm: null,
		systolicBp: null,
		diastolicBp: null,
		weightKg: null,
		spo2Percent: null,
		triageLevel: 'amber',
		triageReason: 'Stooling',
		recordedAt: Date.now()
	});
	await encounterStore.create({
		patientId: ob5Id,
		phcId: 'PHC-DEMO',
		recordedByStaffId: 'staff-demo',
		visitDate: Date.now(),
		chiefComplaint: 'Passing watery stool constantly',
		chiefComplaintRaw: null,
		chiefComplaintLanguage: null,
		doctorNotes: 'Needs monitoring',
		isNhisBillable: false
	});


	// 3. Queue patients for the demo
	await vitalsStore.create({
		patientId: p1Id,
		encounterId: 'enc-demo-1',
		temperatureCelsius: 37.1,
		systolicBp: 120,
		diastolicBp: 80,
		pulseBpm: 75,
		triageLevel: 'green',
		triageReason: null,
		recordedAt: Date.now()
	});
	await queueStore.create({
		patientId: p1Id,
		phcId: 'PHC-DEMO',
		encounterId: null,
		ticketNumber: 1,
		status: 'waiting',
		triageLevel: 'green',
		triageReason: null,
		department: 'general',
		createdAt: Date.now()
	});

	await vitalsStore.create({
		patientId: p2Id,
		encounterId: 'enc-demo-2',
		temperatureCelsius: 38.8,
		systolicBp: 140,
		diastolicBp: 90,
		pulseBpm: 95,
		triageLevel: 'amber',
		triageReason: 'Fever',
		recordedAt: Date.now()
	});
	await queueStore.create({
		patientId: p2Id,
		phcId: 'PHC-DEMO',
		encounterId: null,
		ticketNumber: 2,
		status: 'waiting',
		triageLevel: 'amber',
		triageReason: 'Fever',
		department: 'general',
		createdAt: Date.now()
	});
}
