import { LocalCollection } from './local-collection.svelte';
import type { LocalFamily } from '$lib/local-db/db';

export const familyStore = new LocalCollection<LocalFamily>('families');
