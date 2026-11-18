<script lang="ts">
	import SupportArticle from '#lib/components/ui/support-article.svelte';
</script>

<svelte:head>
	<title>Nurse Queue Workflow — ClinicFlow Support</title>
</svelte:head>

<SupportArticle>
	<h1>Nurse Queue Workflow</h1>
	<p>
		The Nurse Station shows the synchronized General Outpatient, Antenatal Care (ANC), and
		Immunization (EPI) queues for your PHC.
	</p>

	<h2>Choose the correct queue</h2>
	<ol>
		<li>Open <strong>Queue &amp; Triage → Triage Board</strong>.</li>
		<li>
			Select <strong>General Outpatient</strong>, <strong>ANC</strong>, or <strong>EPI</strong>.
		</li>
		<li>Confirm the ticket number, patient identifier, triage level, and waiting time.</li>
	</ol>
	<p>
		Links containing <code>?tab=anc</code> or <code>?tab=epi</code> open the requested queue directly.
	</p>

	<h2>Find a patient</h2>
	<ul>
		<li>
			Use <strong>Patient Search</strong> and type at least two characters of the name, clinic ID, or
			phone number. All matching patients appear in a scrollable results list — scroll the list to see
			the full set before selecting one.
		</li>
		<li>
			Select a patient to review their profile, then choose a clinic/queue and route them to the
			waiting queue. To record triage and vital signs, use <strong>Take Vitals Instead</strong>.
		</li>
	</ul>

	<h2>Call and complete a ticket</h2>
	<ul>
		<li>
			<strong>Call Next Patient</strong> selects only a waiting ticket using the queue's urgency and arrival
			ordering.
		</li>
		<li>Use <strong>Call Next</strong> on a specific waiting ticket to call it directly.</li>
		<li>Use <strong>Done</strong> only after the workflow for that station is complete.</li>
		<li>Use <strong>Mark No-Show</strong> when a called patient does not respond.</li>
	</ul>

	<h2>Offline and synchronization state</h2>
	<p>
		Queue changes are written to the device's offline cache first and synchronized with the PHC
		server. If the Sync Indicator is stale or offline, keep the cached queue visible but verify
		recent changes with nearby staff before calling another patient.
	</p>

	<h2>Clinical safety</h2>
	<p>
		Triage colours and any AI risk badge are decision support only. They do not replace a nurse's
		assessment, vital signs, emergency protocol, or clinical judgment. Immediately escalate a
		patient with emergency signs even if the displayed queue priority is lower, and document the
		reason in the clinical record.
	</p>
</SupportArticle>
