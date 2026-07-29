import { query } from '$app/server';
import { db as serverDb } from '$lib/server/db/db';
import * as schema from '$lib/server/db/schema';
import * as v from 'valibot';

export const getOutbreakData = query(v.optional(v.any()), async () => {
	// This would normally do a complex JOIN between encounters and patients across all PHCs.
	// For the demo/hackathon, we will aggregate dummy or existing data dynamically.
	
	const allPhcs = await serverDb.query.phcs.findMany();
	
	// Create mock heatmap data aggregating cases per LGA
	const heatmapData = allPhcs.map(phc => ({
		lga: phc.lga,
		state: phc.state,
		cases: {
			malaria: Math.floor(Math.random() * 50) + 10,
			cholera: Math.floor(Math.random() * 5),
			measles: Math.floor(Math.random() * 2),
			typhoid: Math.floor(Math.random() * 15)
		},
		riskLevel: Math.random() > 0.8 ? 'High' : Math.random() > 0.5 ? 'Medium' : 'Low'
	}));
	
	return heatmapData;
});
