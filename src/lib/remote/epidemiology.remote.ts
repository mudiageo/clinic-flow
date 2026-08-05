import { query } from '$app/server';
import { db as serverDb } from '$lib/server/db';
import * as v from 'valibot';

export const getOutbreakData = query(v.optional(v.any()), async () => {
	const allPhcs = await serverDb.query.phcs.findMany();
	
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
