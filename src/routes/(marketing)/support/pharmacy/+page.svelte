<script lang="ts">
	import SupportArticle from '#lib/components/ui/support-article.svelte';
</script>

<svelte:head>
	<title>Pharmacy Inventory — ClinicFlow Support</title>
</svelte:head>

<SupportArticle>
	<h1>Pharmacy Inventory and Dispensing</h1>
	<p>
		The Pharmacy workspace uses your PHC's synchronized inventory, prescriptions, and restock
		requests. Access depends on the pharmacy permissions assigned by your PHC administrator.
	</p>

	<h2>Review inventory</h2>
	<ol>
		<li>Open <strong>Pharmacy → Inventory</strong>.</li>
		<li>Search by medicine or supply name.</li>
		<li>
			Review the current stock, unit, and status. An item is marked low when its stock is at or
			below its configured low-stock threshold.
		</li>
	</ol>

	<h2>Common actions</h2>
	<ul>
		<li><strong>Add Item:</strong> register an inventory item for the current PHC.</li>
		<li><strong>Dispense Queue:</strong> review pending prescriptions before dispensing.</li>
		<li><strong>Restock Requests:</strong> review durable requests and their current status.</li>
		<li><strong>Restock:</strong> create a request for a low or out-of-stock item.</li>
	</ul>

	<h2>Offline operation</h2>
	<p>
		Inventory changes and requests are cached locally and reconciled through ClinicFlow's sync
		engine. When the Sync Indicator is stale or offline, the displayed quantity may not include
		changes made on another device. Reconcile stock before dispensing scarce or critical medicines.
	</p>

	<h2>Medication safety</h2>
	<p>
		Before dispensing, verify the patient, prescription, medicine, strength, dosage instructions,
		quantity, allergies, and physical stock. ClinicFlow does not authorize automatic substitutions
		and does not replace pharmacist review or local medication-safety procedures.
	</p>
</SupportArticle>
