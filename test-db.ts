import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/lib/server/db/schema';
import 'dotenv/config';

async function test() {
    const queryClient = postgres(process.env.DATABASE_URL as string);
    const db = drizzle(queryClient, { schema });
    try {
        console.log('Querying staff...');
        await db.query.staff.findFirst();
        console.log('Success!');
    } catch (e) {
        console.error(e);
    } finally {
        queryClient.end();
    }
}

test();
