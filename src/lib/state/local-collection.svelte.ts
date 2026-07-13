import { liveQuery, type Table } from 'dexie';
import { db } from '$lib/local-db/db';

export abstract class LocalCollection<T extends { id: string; updatedAt: number; syncStatus: string }> {
  items = $state<T[]>([]);

  protected constructor(
    protected table: Table<T, string>,
    protected entityType: string,
    queryFn: () => Promise<T[]>,
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
    const record = { ...data, id, updatedAt: Date.now(), syncStatus: 'pending' } as T;
    await this.table.add(record);
    await db.syncLog.add({
      entityType: this.entityType,
      entityId: id,
      operation: 'create',
      payload: record,
      timestamp: Date.now(),
      synced: 0,
    });
    return id;
  }

  async update(id: string, changes: Partial<T>): Promise<void> {
    const patch = { ...changes, updatedAt: Date.now(), syncStatus: 'pending' } as any;
    await this.table.update(id, patch);
    await db.syncLog.add({
      entityType: this.entityType,
      entityId: id,
      operation: 'update',
      payload: patch,
      timestamp: Date.now(),
      synced: 0,
    });
  }
}
