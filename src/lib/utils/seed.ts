import { patientStore } from '$lib/state/patients.svelte';
import { vitalsStore } from '$lib/state/vitals.svelte';
import { queueStore } from '$lib/state/queue.svelte';
import { encounterStore } from '$lib/state/encounters.svelte';
import { prescriptionStore } from '$lib/state/prescriptions.svelte';

export async function seedDemoData() {
	// 1. Create Patients
	const p1Id = await patientStore.create({
		clinicId: 'PHC-DEMO-001',
		name: 'Amina Bello',
		sex: 'F',
		dob: '1995-05-12',
		phone: '08012345678',
		address: '14 Market Rd, Kano'
	});
	
	const p2Id = await patientStore.create({
		clinicId: 'PHC-DEMO-002',
		name: 'Chinedu Eze',
		sex: 'M',
		dob: '1982-11-03',
		phone: '08087654321',
		address: '22 Independence Layout, Enugu'
	});

	const p3Id = await patientStore.create({
		clinicId: 'PHC-DEMO-003',
		name: 'Fatima Musa',
		sex: 'F',
		dob: '2020-02-14',
		phone: '09011122233',
		address: 'Sabon Gari, Kaduna'
	});

	// Outbreak Cluster (Cholera)
	const ob1Id = await patientStore.create({ clinicId: 'PHC-OB-01', name: 'Yusuf Ibrahim', sex: 'M', dob: '2015-08-20', address: 'Bakin Ruwa village' });
	const ob2Id = await patientStore.create({ clinicId: 'PHC-OB-02', name: 'Halima Sani', sex: 'F', dob: '2018-01-10', address: 'Bakin Ruwa village' });
	const ob3Id = await patientStore.create({ clinicId: 'PHC-OB-03', name: 'Kabir Usman', sex: 'M', dob: '1990-07-25', address: 'Bakin Ruwa village' });

	// 2. Add Vitals & Encounters for Outbreak
	await vitalsStore.create({
		patientId: ob1Id,
		temperatureCelsius: 39.2,
		pulseBpm: 120,
		systolicBp: 90,
		diastolicBp: 60,
		triageLevel: 'red',
		notes: 'Severe watery diarrhea and vomiting, dehydration'
	});
	await encounterStore.create({
		patientId: ob1Id,
		doctorId: 'doctor-demo',
		chiefComplaint: 'Severe watery diarrhea, vomiting for 2 days',
		diagnosis: 'Suspected Cholera',
		notes: 'Patient severely dehydrated. Initiated IV fluids.',
		status: 'completed'
	});

	await vitalsStore.create({
		patientId: ob2Id,
		temperatureCelsius: 38.5,
		pulseBpm: 110,
		triageLevel: 'amber',
		notes: 'Diarrhea, weak'
	});
	await encounterStore.create({
		patientId: ob2Id,
		doctorId: 'doctor-demo',
		chiefComplaint: 'Frequent watery stools, abdominal cramps',
		diagnosis: 'Acute Gastroenteritis / Suspected Cholera',
		notes: 'Provided ORS and Zinc.',
		status: 'completed'
	});

	await vitalsStore.create({
		patientId: ob3Id,
		temperatureCelsius: 39.0,
		triageLevel: 'amber',
		notes: 'Vomiting and diarrhea'
	});
	await encounterStore.create({
		patientId: ob3Id,
		doctorId: 'doctor-demo',
		chiefComplaint: 'Diarrhea, fatigue, muscle cramps',
		diagnosis: 'Suspected Cholera',
		status: 'completed'
	});


	// 3. Queue patients for the demo
	await vitalsStore.create({
		patientId: p1Id,
		temperatureCelsius: 37.1,
		systolicBp: 120,
		diastolicBp: 80,
		pulseBpm: 75,
		triageLevel: 'green',
		notes: 'Routine ANC visit'
	});
	await queueStore.enqueue(p1Id, 'doctor', 'routine', 0);

	await vitalsStore.create({
		patientId: p2Id,
		temperatureCelsius: 38.8,
		systolicBp: 140,
		diastolicBp: 90,
		pulseBpm: 95,
		triageLevel: 'amber',
		notes: 'Fever, cough, body ache'
	});
	await queueStore.enqueue(p2Id, 'doctor', 'routine', 1); // priority 1
}
