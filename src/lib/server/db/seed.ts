import { db } from './index';
import { phcs, staff, families, patients, pharmacyInventory, triageRules } from './schema';
import { auth } from '../auth';
import { eq } from 'drizzle-orm';

// Mock getRequestEvent so Better Auth doesn't crash outside of SvelteKit context
globalThis.Request = class MockRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
  }
} as any;

async function main() {
  console.log('🌱 Starting database seeding in Benin City context...');

  try {
    // 1. Seed PHC (Benin City context)
    console.log('Inserting Primary Health Centre...');
    let phcRecord = await db.query.phcs.findFirst({
      where: eq(phcs.name, 'Oredo Primary Health Centre')
    });

    if (!phcRecord) {
      const [newPhc] = await db.insert(phcs).values({
        name: 'Oredo Primary Health Centre',
        lga: 'Oredo',
        state: 'Edo',
      }).returning();
      phcRecord = newPhc;
      console.log(`Created PHC: ${phcRecord.name} (${phcRecord.id})`);
    } else {
      console.log(`PHC already exists: ${phcRecord.name}`);
    }

    const phcId = phcRecord.id;

    // 2. Seed Staff Accounts
    console.log('Seeding staff accounts (Admin, Nurse, Doctor)...');
    const staffData = [
      { name: 'Admin User', email: 'admin@clinicflow.org', role: 'admin' as const },
      { name: 'Nurse Joy', email: 'nurse@clinicflow.org', role: 'nurse' as const },
      { name: 'Doctor Cole', email: 'doctor@clinicflow.org', role: 'doctor' as const },
    ];

    for (const staffMember of staffData) {
      // Check if staff already exists
      const existingStaff = await db.query.staff.findFirst({
        where: (s, { eq }) => eq(s.fullName, staffMember.name)
      });

      if (existingStaff) {
        console.log(`Staff ${staffMember.name} already exists.`);
        continue;
      }

      // Check if user already exists in auth user table
      let authUser = await db.query.user.findFirst({
        where: (u, { eq }) => eq(u.email, staffMember.email)
      });

      if (!authUser) {
        console.log(`Creating auth user for ${staffMember.name}...`);
        try {
          const userResult = await auth.api.signUpEmailAndPassword({
            body: {
              name: staffMember.name,
              email: staffMember.email,
              password: 'password123',
            }
          });
          authUser = userResult.user;
        } catch (e: any) {
          console.error(`Failed to create auth user for ${staffMember.name}:`, e.message || e);
          continue;
        }
      }

      if (authUser) {
        await db.insert(staff).values({
          authUserId: authUser.id,
          fullName: staffMember.name,
          role: staffMember.role,
          phcId: phcId,
          active: true,
        });
        console.log(`Created staff record for ${staffMember.name} as ${staffMember.role}`);
      }
    }

    // 3. Seed Pharmacy Inventory
    console.log('Seeding pharmacy inventory...');
    const inventoryItems = [
      { itemName: 'Artemether/Lumefantrine 80/480mg (Coartem)', category: 'antimalarial', unit: 'tablet', currentStock: 150, lowStockThreshold: 20, isCritical: true },
      { itemName: 'Amoxicillin 500mg', category: 'antibiotic', unit: 'capsule', currentStock: 200, lowStockThreshold: 30, isCritical: false },
      { itemName: 'Metronidazole 400mg', category: 'antibiotic', unit: 'tablet', currentStock: 180, lowStockThreshold: 25, isCritical: false },
      { itemName: 'Paracetamol 500mg', category: 'analgesic', unit: 'tablet', currentStock: 500, lowStockThreshold: 50, isCritical: false },
      { itemName: 'Ibuprofen 400mg', category: 'analgesic', unit: 'tablet', currentStock: 300, lowStockThreshold: 40, isCritical: false },
      { itemName: 'Folic Acid 5mg', category: 'supplement', unit: 'tablet', currentStock: 1000, lowStockThreshold: 100, isCritical: false },
      { itemName: 'Ferrous Sulfate 200mg', category: 'supplement', unit: 'tablet', currentStock: 1000, lowStockThreshold: 100, isCritical: false },
      { itemName: 'Oral Rehydration Salts (ORS)', category: 'rehydration', unit: 'sachet', currentStock: 80, lowStockThreshold: 15, isCritical: true },
      { itemName: 'Zinc Sulfate 20mg', category: 'supplement', unit: 'tablet', currentStock: 250, lowStockThreshold: 30, isCritical: true },
      { itemName: 'BCG Vaccine', category: 'vaccine', unit: 'vial', currentStock: 15, lowStockThreshold: 5, isCritical: true },
      { itemName: 'Oral Polio Vaccine (OPV)', category: 'vaccine', unit: 'dose', currentStock: 100, lowStockThreshold: 20, isCritical: true },
    ];

    for (const item of inventoryItems) {
      const existingItem = await db.query.pharmacyInventory.findFirst({
        where: (pi, { and, eq }) => and(eq(pi.phcId, phcId), eq(pi.itemName, item.itemName))
      });

      if (!existingItem) {
        await db.insert(pharmacyInventory).values({
          phcId: phcId,
          ...item,
        });
        console.log(`Added inventory item: ${item.itemName}`);
      }
    }

    // 4. Seed Triage Rules
    console.log('Seeding triage rules...');
    const rules = [
      // Temperature Rules
      { field: 'temperatureCelsius', operator: 'gte', threshold: 38.5, resultingLevel: 'red' as const, reasonTemplate: 'High Fever: {temperatureCelsius}°C', requiresPregnant: false },
      { field: 'temperatureCelsius', operator: 'gte', threshold: 37.5, resultingLevel: 'amber' as const, reasonTemplate: 'Mild Fever: {temperatureCelsius}°C', requiresPregnant: false },
      { field: 'temperatureCelsius', operator: 'lte', threshold: 35.0, resultingLevel: 'red' as const, reasonTemplate: 'Hypothermia: {temperatureCelsius}°C', requiresPregnant: false },
      
      // Blood Pressure Rules
      { field: 'systolicBp', operator: 'gte', threshold: 160, resultingLevel: 'red' as const, reasonTemplate: 'Severe Hypertension: BP {systolicBp}/{diastolicBp} mmHg', requiresPregnant: false },
      { field: 'diastolicBp', operator: 'gte', threshold: 100, resultingLevel: 'red' as const, reasonTemplate: 'Severe Hypertension: BP {systolicBp}/{diastolicBp} mmHg', requiresPregnant: false },
      { field: 'systolicBp', operator: 'gte', threshold: 140, resultingLevel: 'amber' as const, reasonTemplate: 'Moderate Hypertension: BP {systolicBp}/{diastolicBp} mmHg', requiresPregnant: false },
      { field: 'diastolicBp', operator: 'gte', threshold: 90, resultingLevel: 'amber' as const, reasonTemplate: 'Moderate Hypertension: BP {systolicBp}/{diastolicBp} mmHg', requiresPregnant: false },
      
      // Blood Pressure Rules (Pregnancy-specific)
      { field: 'systolicBp', operator: 'gte', threshold: 130, resultingLevel: 'red' as const, reasonTemplate: 'Pregnancy Hypertension Alert: BP {systolicBp}/{diastolicBp} mmHg', requiresPregnant: true },
      { field: 'diastolicBp', operator: 'gte', threshold: 80, resultingLevel: 'red' as const, reasonTemplate: 'Pregnancy Hypertension Alert: BP {systolicBp}/{diastolicBp} mmHg', requiresPregnant: true },

      // SpO2 Rules
      { field: 'spo2Percent', operator: 'lt', threshold: 90, resultingLevel: 'red' as const, reasonTemplate: 'Severe Hypoxia: SpO2 {spo2Percent}%', requiresPregnant: false },
      { field: 'spo2Percent', operator: 'lt', threshold: 95, resultingLevel: 'amber' as const, reasonTemplate: 'Mild Hypoxia: SpO2 {spo2Percent}%', requiresPregnant: false },

      // Pulse Rules
      { field: 'pulseBpm', operator: 'gte', threshold: 120, resultingLevel: 'red' as const, reasonTemplate: 'Severe Tachycardia: Pulse {pulseBpm} bpm', requiresPregnant: false },
      { field: 'pulseBpm', operator: 'lte', threshold: 50, resultingLevel: 'red' as const, reasonTemplate: 'Severe Bradycardia: Pulse {pulseBpm} bpm', requiresPregnant: false },
      { field: 'pulseBpm', operator: 'gte', threshold: 100, resultingLevel: 'amber' as const, reasonTemplate: 'Mild Tachycardia: Pulse {pulseBpm} bpm', requiresPregnant: false },
      { field: 'pulseBpm', operator: 'lte', threshold: 60, resultingLevel: 'amber' as const, reasonTemplate: 'Mild Bradycardia: Pulse {pulseBpm} bpm', requiresPregnant: false },
    ];

    for (const rule of rules) {
      const existingRule = await db.query.triageRules.findFirst({
        where: (tr, { and, eq }) => and(
          eq(tr.phcId, phcId),
          eq(tr.field, rule.field),
          eq(tr.operator, rule.operator),
          eq(tr.threshold, rule.threshold),
          eq(tr.requiresPregnant, rule.requiresPregnant)
        )
      });

      if (!existingRule) {
        await db.insert(triageRules).values({
          phcId: phcId,
          ...rule,
          active: true,
          version: 1,
        });
        console.log(`Added triage rule: ${rule.field} ${rule.operator} ${rule.threshold} -> ${rule.resultingLevel}`);
      }
    }

    // 5. Seed Patients and Families (Benin City names & communities)
    console.log('Seeding demo families and patients...');
    const familyData = [
      {
        householdName: 'Ighodaro Family',
        community: 'GRA',
        members: [
          { fullName: 'Osagie Ighodaro', phone: '2348011112222', dob: new Date('1981-05-14'), sex: 'male' as const, clinicId: 'OR-IGHO-01' },
          { fullName: 'Efe Ighodaro', phone: '2348011112223', dob: new Date('1988-09-20'), sex: 'female' as const, clinicId: 'OR-IGHO-02' },
          { fullName: 'Efosa Ighodaro', phone: null, dob: new Date('2014-11-02'), sex: 'female' as const, clinicId: 'OR-IGHO-03' },
          { fullName: 'Osahon Ighodaro', phone: null, dob: new Date('2018-04-18'), sex: 'male' as const, clinicId: 'OR-IGHO-04' },
        ]
      },
      {
        householdName: 'Osagie Family',
        community: 'Ikpoba Hill',
        members: [
          { fullName: 'Amen Osagie', phone: '2348022223333', dob: new Date('1997-03-10'), sex: 'female' as const, clinicId: 'OR-OSAG-01' },
          { fullName: 'Esosa Osagie', phone: null, dob: new Date('2023-01-15'), sex: 'male' as const, clinicId: 'OR-OSAG-02' },
          { fullName: 'Osasere Osagie', phone: null, dob: new Date('2025-06-05'), sex: 'female' as const, clinicId: 'OR-OSAG-03' },
        ]
      },
      {
        householdName: 'Idahosa Family',
        community: 'Uselu',
        members: [
          { fullName: 'Osaro Idahosa', phone: '2348033334444', dob: new Date('1976-12-05'), sex: 'male' as const, clinicId: 'OR-IDAH-01' },
          { fullName: 'Imose Idahosa', phone: '2348033334445', dob: new Date('1984-07-22'), sex: 'female' as const, clinicId: 'OR-IDAH-02' },
          { fullName: 'Isoken Idahosa', phone: null, dob: new Date('2010-02-15'), sex: 'female' as const, clinicId: 'OR-IDAH-03' },
        ]
      },
      {
        householdName: 'Igbinosa Family',
        community: 'Airport Road',
        members: [
          { fullName: 'Adesuwa Igbinosa', phone: '2348044445555', dob: new Date('1994-08-30'), sex: 'female' as const, clinicId: 'OR-IGBI-01', isPregnant: true },
          { fullName: 'Itohan Igbinosa', phone: null, dob: new Date('2020-04-10'), sex: 'female' as const, clinicId: 'OR-IGBI-02' },
          { fullName: 'Osamudiamen Igbinosa', phone: null, dob: new Date('2022-10-12'), sex: 'male' as const, clinicId: 'OR-IGBI-03' },
        ]
      },
      {
        householdName: 'Imasuen Family',
        community: 'Ekenwan Road',
        members: [
          { fullName: 'Victor Imasuen', phone: '2348055556666', dob: new Date('1964-01-18'), sex: 'male' as const, clinicId: 'OR-IMAS-01' },
          { fullName: 'Omono Imasuen', phone: '2348055556667', dob: new Date('1971-06-25'), sex: 'female' as const, clinicId: 'OR-IMAS-02' },
        ]
      }
    ];

    for (const fam of familyData) {
      // Find or create family
      let familyRecord = await db.query.families.findFirst({
        where: (f, { eq }) => eq(f.householdName, fam.householdName)
      });

      if (!familyRecord) {
        const [newFamily] = await db.insert(families).values({
          householdName: fam.householdName,
          community: fam.community,
        }).returning();
        familyRecord = newFamily;
        console.log(`Created Family: ${fam.householdName}`);
      }

      for (const member of fam.members) {
        const existingPatient = await db.query.patients.findFirst({
          where: (p, { and, eq }) => and(eq(p.phcId, phcId), eq(p.clinicId, member.clinicId))
        });

        if (!existingPatient) {
          await db.insert(patients).values({
            phcId: phcId,
            familyId: familyRecord.id,
            fullName: member.fullName,
            phone: member.phone,
            dob: member.dob,
            sex: member.sex,
            clinicId: member.clinicId,
            community: fam.community,
            isPregnant: (member as any).isPregnant || false,
            updatedAt: new Date(),
            createdAt: new Date(),
          });
          console.log(`Added patient: ${member.fullName} (${member.clinicId})`);
        }
      }
    }

    console.log('✅ Database seeding in Benin City context completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  }
}

main().catch(console.error);
