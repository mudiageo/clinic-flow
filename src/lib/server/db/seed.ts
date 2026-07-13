import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema.js';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL is not set. Run with --env-file=.env');
}

const client = postgres(dbUrl);
const db = drizzle(client, { schema });

// Minimal auth instance just for seeding
const auth = betterAuth({
  baseURL: 'http://localhost:5173',
  secret: 'seed-secret-do-not-use-in-prod',
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
});

async function seed() {
  console.log('🌱 Seeding database with comprehensive Benin City context...');

  // 1. Create a PHC in Benin City
  console.log('-> Creating PHC: Oredo Primary Health Centre');
  const [oredoPhc] = await db.insert(schema.phcs).values({
    name: 'Oredo Primary Health Centre',
    lga: 'Oredo',
    state: 'Edo State',
  }).returning();

  // 2. Create Staff Users (with Better Auth login)
  console.log('-> Creating Staff users (password: "password123")');
  const staffToCreate = [
    { email: 'doctor@clinic.com', name: 'Dr. Osasere', role: 'doctor' },
    { email: 'nurse@clinic.com', name: 'Nurse Idia', role: 'nurse' },
    { email: 'reception@clinic.com', name: 'Receptionist Efe', role: 'receptionist' },
    { email: 'pharmacy@clinic.com', name: 'Pharmacist Nosakhare', role: 'pharmacy' },
    { email: 'admin@clinic.com', name: 'Admin Izevbokun', role: 'admin' },
  ];

  const staffRecords = [];
  for (const s of staffToCreate) {
    // We use the auth API directly on the server instance
    let user;
    try {
      const res = await auth.api.signUpEmail({
        body: {
          email: s.email,
          password: 'password123',
          name: s.name,
        }
      });
      user = res.user;
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.status === 400) {
        // Find existing user if already seeded
        const existing = await db.query.user.findFirst({ where: (u, { eq }) => eq(u.email, s.email) });
        if (existing) user = existing;
      } else {
        throw e;
      }
    }

    if (user) {
      const [staff] = await db.insert(schema.staff).values({
        authUserId: user.id,
        fullName: s.name,
        role: s.role as any,
        phcId: oredoPhc.id,
        active: true,
      }).onConflictDoNothing().returning();
      
      // If it already existed, fetch it
      if (!staff) {
        const existingStaff = await db.query.staff.findFirst({ where: (st, { eq }) => eq(st.authUserId, user.id) });
        if (existingStaff) staffRecords.push(existingStaff);
      } else {
        staffRecords.push(staff);
      }
    }
  }

  const doctor = staffRecords.find(s => s.role === 'doctor');
  const nurse = staffRecords.find(s => s.role === 'nurse');

  // 3. Create Families and Patients
  console.log('-> Creating Families and Patients');
  const [familyA, familyB] = await db.insert(schema.families).values([
    { householdName: 'The Igbinosa Family', community: 'GRA, Benin City' },
    { householdName: 'The Osagie Family', community: 'Ring Road, Benin City' }
  ]).returning();

  const [patient1, patient2, patient3, patient4, patient5] = await db.insert(schema.patients).values([
    {
      clinicId: 'ORD-2026-001',
      phcId: oredoPhc.id,
      familyId: familyA.id,
      fullName: 'Adesuwa Igbinosa',
      phone: '08012345678',
      dob: new Date('1990-05-15'),
      sex: 'female',
      address: '15 Boundary Road',
      community: 'GRA',
      isPregnant: true,
    },
    {
      clinicId: 'ORD-2026-002',
      phcId: oredoPhc.id,
      familyId: familyA.id,
      fullName: 'Osaro Igbinosa',
      phone: '08012345679',
      estimatedAge: 38,
      sex: 'male',
      address: '15 Boundary Road',
      community: 'GRA',
      isPregnant: false,
    },
    {
      clinicId: 'ORD-2026-003',
      phcId: oredoPhc.id,
      familyId: familyB.id,
      fullName: 'Efosa Osagie',
      phone: '08098765432',
      dob: new Date('2015-02-10'), // Child
      sex: 'male',
      address: '42 Mission Road',
      community: 'Ring Road',
      isPregnant: false,
    },
    {
      clinicId: 'ORD-2026-004',
      phcId: oredoPhc.id,
      fullName: 'Ivie Omoregie',
      phone: '07011223344',
      estimatedAge: 65,
      sex: 'female',
      address: '10 Sapele Road',
      community: 'Oka',
      isPregnant: false,
    },
    {
      clinicId: 'ORD-2026-005',
      phcId: oredoPhc.id,
      fullName: 'Nosakhare Eboigbe',
      phone: '08122334455',
      dob: new Date('1985-08-20'),
      sex: 'male',
      address: '5 Ekenwan Road',
      community: 'Ugbiyoko',
      isPregnant: false,
    }
  ]).returning();

  // Create Guardian relation for Efosa (Child) -> Osaro (Adult, let's pretend they are related or we just link family)
  await db.update(schema.patients).set({ guardianId: patient2.id }).where(eq(schema.patients.id, patient3.id));

  // 4. Create Encounters & Vitals
  console.log('-> Creating Encounters and Vitals');
  const [enc1, enc2] = await db.insert(schema.encounters).values([
    {
      patientId: patient1.id,
      phcId: oredoPhc.id,
      recordedByStaffId: nurse?.id,
      chiefComplaint: 'Fever and headache for 3 days. Also experiencing slight nausea.',
      chiefComplaintRaw: 'I dey get fever and headache since 3 days now, my body just dey hot.',
      chiefComplaintLanguage: 'pidgin',
    },
    {
      patientId: patient4.id,
      phcId: oredoPhc.id,
      recordedByStaffId: nurse?.id,
      chiefComplaint: 'Routine BP check, feeling dizzy.',
    }
  ]).returning();

  await db.insert(schema.vitalsRecords).values([
    {
      encounterId: enc1.id,
      patientId: patient1.id,
      temperatureCelsius: 38.5,
      systolicBp: 110,
      diastolicBp: 70,
      pulseBpm: 90,
      weightKg: 65,
      triageLevel: 'amber',
      triageReason: 'High Fever (≥38.0°C)',
    },
    {
      encounterId: enc2.id,
      patientId: patient4.id,
      systolicBp: 165,
      diastolicBp: 95,
      pulseBpm: 85,
      weightKg: 78,
      triageLevel: 'red',
      triageReason: 'Critical Hypertension (Systolic ≥160)',
    }
  ]);

  // 5. Create Queue Tickets
  console.log('-> Creating Queue Tickets');
  await db.insert(schema.queueTickets).values([
    {
      patientId: patient1.id,
      phcId: oredoPhc.id,
      encounterId: enc1.id,
      ticketNumber: 1,
      status: 'waiting',
      triageLevel: 'amber',
      triageReason: 'High Fever (≥38.0°C)',
    },
    {
      patientId: patient4.id,
      phcId: oredoPhc.id,
      encounterId: enc2.id,
      ticketNumber: 2,
      status: 'called',
      triageLevel: 'red',
      triageReason: 'Critical Hypertension (Systolic ≥160)',
      calledAt: new Date(),
    },
    {
      patientId: patient5.id,
      phcId: oredoPhc.id,
      ticketNumber: 3,
      status: 'waiting',
      triageLevel: 'green',
    }
  ]);

  // 6. Pharmacy Inventory
  console.log('-> Creating Pharmacy Inventory');
  const [itemAL, itemPara, itemAmox] = await db.insert(schema.pharmacyInventory).values([
    { phcId: oredoPhc.id, itemName: 'Artemether-Lumefantrine (AL) 20/120mg', category: 'antimalarial', unit: 'pack', currentStock: 150, lowStockThreshold: 20, isCritical: true },
    { phcId: oredoPhc.id, itemName: 'Paracetamol 500mg', category: 'analgesic', unit: 'pack', currentStock: 500, lowStockThreshold: 50, isCritical: false },
    { phcId: oredoPhc.id, itemName: 'Amoxicillin 500mg', category: 'antibiotic', unit: 'pack', currentStock: 100, lowStockThreshold: 30, isCritical: true },
    { phcId: oredoPhc.id, itemName: 'Oral Rehydration Salts (ORS)', category: 'other', unit: 'sachet', currentStock: 300, lowStockThreshold: 50, isCritical: true },
    { phcId: oredoPhc.id, itemName: 'Zinc Tablets 20mg', category: 'other', unit: 'pack', currentStock: 200, lowStockThreshold: 40, isCritical: false },
    { phcId: oredoPhc.id, itemName: 'Sulfadoxine-Pyrimethamine (SP)', category: 'antimalarial', unit: 'dose', currentStock: 80, lowStockThreshold: 20, isCritical: true },
    { phcId: oredoPhc.id, itemName: 'Mebendazole 500mg', category: 'other', unit: 'tablet', currentStock: 150, lowStockThreshold: 30, isCritical: false },
  ]).returning();

  // 7. Prescriptions
  console.log('-> Creating Prescriptions');
  await db.insert(schema.prescriptions).values([
    {
      encounterId: enc1.id,
      patientId: patient1.id,
      inventoryItemId: itemAL.id,
      quantity: 1,
      dosageInstructions: 'Take 1 pack over 3 days as directed.',
      dispensed: false,
    },
    {
      encounterId: enc1.id,
      patientId: patient1.id,
      inventoryItemId: itemPara.id,
      quantity: 10,
      dosageInstructions: 'Take 2 tablets every 8 hours for fever.',
      dispensed: false,
    }
  ]);

  // 8. Triage Rules
  console.log('-> Creating Triage Rules');
  await db.insert(schema.triageRules).values([
    { phcId: oredoPhc.id, field: 'temperatureCelsius', operator: 'gte', threshold: 39.5, resultingLevel: 'red', reasonTemplate: 'Critical Fever (≥39.5°C)', requiresPregnant: false, active: true, version: 1 },
    { phcId: oredoPhc.id, field: 'temperatureCelsius', operator: 'gte', threshold: 38.0, resultingLevel: 'amber', reasonTemplate: 'High Fever (≥38.0°C)', requiresPregnant: false, active: true, version: 1 },
    { phcId: oredoPhc.id, field: 'systolicBp', operator: 'gte', threshold: 160, resultingLevel: 'red', reasonTemplate: 'Critical Hypertension (Systolic ≥160)', requiresPregnant: false, active: true, version: 1 },
    { phcId: oredoPhc.id, field: 'systolicBp', operator: 'gte', threshold: 140, resultingLevel: 'red', reasonTemplate: 'Pregnancy Hypertension Alert (Systolic ≥140)', requiresPregnant: true, active: true, version: 1 },
    { phcId: oredoPhc.id, field: 'spo2Percent', operator: 'lte', threshold: 92, resultingLevel: 'red', reasonTemplate: 'Critical Hypoxia (SpO2 ≤92%)', requiresPregnant: false, active: true, version: 1 }
  ]);

  // 9. Reminders
  console.log('-> Creating Reminders');
  await db.insert(schema.reminders).values([
    {
      patientId: patient1.id,
      phcId: oredoPhc.id,
      type: 'antenatal',
      label: 'ANC Follow-up Visit',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      recipientPhone: patient1.phone!,
      status: 'scheduled'
    },
    {
      patientId: patient3.id,
      phcId: oredoPhc.id,
      type: 'immunization',
      label: 'Polio Dose 3',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      recipientPhone: patient2.phone!, // Osaro is guardian
      status: 'scheduled'
    }
  ]);

  console.log('✅ Comprehensive seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding DB:', err);
  process.exit(1);
});
