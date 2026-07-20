import { db } from './src/lib/server/db/index.ts';
import { sql } from 'drizzle-orm';

async function main() {
	try {
		await db.execute(sql`ALTER TYPE triage_level ADD VALUE 'unassigned' BEFORE 'green';`);
		console.log('Added unassigned to triage_level');
	} catch (e: any) {
		if (e.message.includes('already exists')) {
			console.log('Value already exists');
		} else {
			console.error('Error:', e.message);
		}
	}
}
main();
