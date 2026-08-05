import { db } from '../index';
import * as pgSchema from '../schema';
import * as sqliteSchema from '../schema.sqlite';
import { DATABASE_URL } from '$app/env/private';

export const isLibSql =
	DATABASE_URL.startsWith('file:') ||
	DATABASE_URL.startsWith('libsql:') ||
	DATABASE_URL.endsWith('.db');

/**
 * A type-escaped version of the database instance to allow dynamic cross-dialect queries.
 * The strict typing is enforced at the function boundary of the DAL queries instead.
 */
export const database = db as any;

/**
 * Dynamically resolves the table schema based on the active runtime dialect.
 */
export function getTable<T extends keyof typeof pgSchema>(tableName: T): any {
	return isLibSql ? (sqliteSchema as any)[tableName] : pgSchema[tableName];
}
