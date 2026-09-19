<script lang="ts">
	import { ArrowRight, Download, FileJson } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Using the DHIS2 Data Bridge — ClinicFlow Support</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
	<div>
		<h1 class="text-3xl font-bold tracking-tight mb-2">How to export data to DHIS2</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			ClinicFlow provides a one-click Data Bridge to aggregate your local clinic encounters into the National Health Management Information System (DHIS2) format.
		</p>
	</div>

	<div class="prose prose-slate max-w-none">
		<h3>Overview</h3>
		<p>
			The DHIS2 Data Bridge is designed for Local PHC Admins and Officers in Charge (OIC) to fulfill their monthly reporting requirements to the LGA without manual data entry.
		</p>
		
		<div class="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-lg my-6">
			<strong>Data Integrity Notice:</strong> 
			The DHIS2 exporter strictly uses deterministic aggregation (counting actual database rows). It does <strong>not</strong> use AI to generate the report payload, ensuring zero risk of hallucinated or falsified data entering the national system.
		</div>

		<h3>Generating a Payload</h3>
		<ol>
			<li>Navigate to the <strong>HMIS Analytics</strong> module in your Admin Dashboard.</li>
			<li>Select the <strong>DHIS2 Export</strong> sub-menu.</li>
			<li>Click the <strong>Preview Data</strong> button to view the aggregated JSON payload on your screen. Verify the totals.</li>
			<li>Click the <span class="inline-flex items-center gap-1 font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm"><Download class="size-3" /> Download JSON</span> button.</li>
		</ol>

		<h3>Uploading to DHIS2</h3>
		<p>
			Once you have downloaded the <code>.json</code> file, you can upload it directly via the DHIS2 Data Import application at your LGA headquarters, or email it to your LGA Disease Surveillance and Notification Officer (DSNO).
		</p>
	</div>
</div>
