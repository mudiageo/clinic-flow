import { describe, expect, it } from 'vite-plus/test';
import { drainChangeFeed, finalizeChangeBatch } from './change-feed.ts';

interface TestChange {
	version: number;
	phcId: string;
	deviceId: string;
	operationId: string;
	entityType: string;
	entityId: string;
	value: unknown;
}

class DurableTestFeed {
	#changes: TestChange[] = [];
	#versions = new Map<string, number>();

	commit(input: Omit<TestChange, 'version'>): TestChange {
		const duplicate = this.#changes.find((change) => change.operationId === input.operationId);
		if (duplicate) return duplicate;
		const version = (this.#versions.get(input.phcId) ?? 0) + 1;
		this.#versions.set(input.phcId, version);
		const change = { ...input, version };
		this.#changes.push(change);
		return change;
	}

	pull(phcId: string, _deviceId: string, since: number) {
		const highWatermark = this.#versions.get(phcId) ?? 0;
		const changes = this.#changes
			.filter((change) => change.phcId === phcId && change.version > since)
			.slice(0, 500);
		return finalizeChangeBatch(changes, { since, highWatermark });
	}
}

class TestClient {
	cursor = 0;
	records = new Map<string, unknown>();

	constructor(
		readonly id: string,
		readonly phcId: string,
		readonly feed: DurableTestFeed
	) {}

	mutate(input: { operationId: string; entityType: string; entityId: string; value: unknown }) {
		this.records.set(`${input.entityType}:${input.entityId}`, input.value);
		return this.feed.commit({
			...input,
			phcId: this.phcId,
			deviceId: this.id
		});
	}

	async catchUp() {
		this.cursor = await drainChangeFeed({
			initialCursor: this.cursor,
			pull: async (cursor) => this.feed.pull(this.phcId, this.id, cursor),
			applyBatch: async (batch) => {
				for (const change of batch.changes) {
					this.records.set(`${change.entityType}:${change.entityId}`, change.value);
				}
			}
		});
	}
}

describe('cross-device convergence', () => {
	it('converges queue, patient, reminder, and inventory writes between isolated clients', async () => {
		const feed = new DurableTestFeed();
		const reception = new TestClient('reception-device', 'phc-one', feed);
		const nurse = new TestClient('nurse-device', 'phc-one', feed);
		const entities = [
			['patients', 'patient-1', { name: 'Patient One' }],
			['queueTickets', 'ticket-1', { status: 'waiting' }],
			['reminders', 'reminder-1', { status: 'scheduled' }],
			['pharmacyInventory', 'stock-1', { currentStock: 42 }]
		] as const;

		for (const [entityType, entityId, value] of entities) {
			reception.mutate({
				operationId: `operation:${entityId}`,
				entityType,
				entityId,
				value
			});
		}

		await nurse.catchUp();
		for (const [entityType, entityId, value] of entities) {
			expect(nurse.records.get(`${entityType}:${entityId}`)).toEqual(value);
		}
		expect(nurse.cursor).toBe(4);

		nurse.mutate({
			operationId: 'operation:call-ticket',
			entityType: 'queueTickets',
			entityId: 'ticket-1',
			value: { status: 'called' }
		});
		await reception.catchUp();

		expect(reception.records).toEqual(nurse.records);
		expect(reception.cursor).toBe(5);
	});

	it('catches up through polling after a wake-up is missed', async () => {
		const feed = new DurableTestFeed();
		const first = new TestClient('first-device', 'phc-one', feed);
		const second = new TestClient('second-device', 'phc-one', feed);

		feed.commit({
			phcId: 'phc-one',
			deviceId: first.id,
			operationId: 'missed-signal-operation',
			entityType: 'queueTickets',
			entityId: 'ticket-1',
			value: { status: 'called' }
		});
		// No simulated wake-up. The mandatory reconciliation pass still drains the feed.
		await second.catchUp();

		expect(second.records.get('queueTickets:ticket-1')).toEqual({ status: 'called' });
	});

	it('applies a retried operation ID exactly once and isolates another PHC', async () => {
		const feed = new DurableTestFeed();
		const pharmacy = new TestClient('pharmacy-device', 'phc-one', feed);
		const remote = new TestClient('remote-device', 'phc-one', feed);
		const outsider = new TestClient('outside-device', 'phc-two', feed);
		const mutation = {
			phcId: 'phc-one',
			deviceId: pharmacy.id,
			operationId: 'stable-delta-operation',
			entityType: 'pharmacyInventory',
			entityId: 'stock-1',
			value: { currentStock: 9 }
		};

		const first = feed.commit(mutation);
		const retry = feed.commit(mutation);
		await remote.catchUp();
		await outsider.catchUp();

		expect(retry.version).toBe(first.version);
		expect(remote.cursor).toBe(1);
		expect(remote.records.get('pharmacyInventory:stock-1')).toEqual({ currentStock: 9 });
		expect(outsider.records.size).toBe(0);
		expect(outsider.cursor).toBe(0);
	});
});
