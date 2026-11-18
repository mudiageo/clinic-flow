import { liveQuery, type Table, type UpdateSpec } from 'dexie';
import { db } from '#lib/local-db/db.ts';

export abstract class LocalCollection<
	T extends { id: string; updatedAt: number; syncStatus: string }
> {
	items = $state<T[]>([]);

	protected constructor(
		protected table: Table<T, string>,
		protected entityType: string,
		queryFn: () => Promise<T[]>
	) {
		liveQuery(queryFn).subscribe((result) => {
			this.items = result;
		});
	}

	get(id: string): T | undefined {
		return this.items.find((item) => item.id === id);
	}

	async create(data: Omit<T, 'id' | 'updatedAt' | 'syncStatus'>): Promise<string> {
		const id = crypto.randomUUID();
		const timestamp = Date.now();
		const record = { ...data, id, updatedAt: timestamp, syncStatus: 'pending' } as T;
		await db.transaction('rw', this.table, db.syncLog, async () => {
			await this.table.add(record);
			await db.syncLog.add({
				entityType: this.entityType,
				entityId: id,
				operation: 'create',
				payload: record,
				timestamp,
				synced: 0
			});
		});
		return id;
	}

	async update(id: string, changes: Partial<T>): Promise<void> {
		const timestamp = Date.now();
		const patch = {
			...changes,
			updatedAt: timestamp,
			syncStatus: 'pending'
		} as UpdateSpec<T>;
		await db.transaction('rw', this.table, db.syncLog, async () => {
			const updated = await this.table.update(id, patch);
			if (updated === 0) throw new Error(`Cannot update missing ${this.entityType} record ${id}`);
			await db.syncLog.add({
				entityType: this.entityType,
				entityId: id,
				operation: 'update',
				payload: patch,
				timestamp,
				synced: 0
			});
		});
	}

	async delete(id: string): Promise<void> {
		await db.transaction('rw', this.table, db.syncLog, async () => {
			const record = await this.table.get(id);
			if (!record) throw new Error(`Cannot delete missing ${this.entityType} record ${id}`);
			await this.table.delete(id);
			await db.syncLog.add({
				entityType: this.entityType,
				entityId: id,
				operation: 'delete',
				payload: record,
				timestamp: Date.now(),
				synced: 0
			});
		});
	}
}
