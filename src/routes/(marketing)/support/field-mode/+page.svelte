<script lang="ts">
	import { MapPin, WifiOff, CloudUpload, ShieldAlert } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Using Field Mode (Offline) — ClinicFlow Support</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
	<div>
		<h1 class="text-3xl font-bold tracking-tight mb-2">Field Outreach Mode</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			A dedicated offline-first workflow for CHEWs and community health workers operating without
			internet access.
		</p>
	</div>

	<div class="prose prose-slate max-w-none">
		<h3>How Field Mode Works</h3>
		<p>
			ClinicFlow is built as a Progressive Web App (PWA) with a local database engine (Dexie). This
			means once you load the app while connected to the internet at the clinic, you can take your
			tablet or phone into the field and continue working completely offline.
		</p>

		<div
			class="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-lg my-6 flex items-start gap-3"
		>
			<WifiOff class="size-6 shrink-0 mt-1 text-blue-600" />
			<div>
				<strong>Offline Caching</strong>
				<p class="m-0 mt-1 text-sm text-blue-800">
					All patient data, family units, and clinic settings are cached on your device. When you
					register a new patient or log an outreach visit offline, it is saved securely to your
					device's local storage.
				</p>
			</div>
		</div>

		<h3>Using the Field Dashboard</h3>
		<p>
			When you navigate to the <strong>Field Outreach Mode</strong> from your bottom navigation or sidebar,
			you are presented with simplified, large-touch-target buttons designed for field use:
		</p>
		<ul>
			<li><strong>Register Patient:</strong> Create new patient records offline.</li>
			<li>
				<strong>Household Tracking:</strong> Manage and update family units in your catchment area.
			</li>
			<li>
				<strong>Outreach Log:</strong> Record bednet distributions, health talks, or immunization campaigns.
			</li>
		</ul>

		<h3>Recording an Outreach Activity</h3>
		<ol>
			<li>Open <strong>Field Mode → Outreach Log</strong>.</li>
			<li>Select the activity type and date, then enter the community or settlement.</li>
			<li>
				Enter aggregate counts for households visited, people reached, immunizations given, or
				bednets distributed.
			</li>
			<li>
				Select <strong>Save Activity</strong>. The record is stored on the device immediately.
			</li>
		</ol>
		<p>
			A <strong>pending</strong> badge means the record is waiting to synchronize. A
			<strong>conflict</strong> badge requires review after reconnecting. Only staff with the
			<strong>Manage Outreach</strong> permission can use this workspace, and records are restricted to
			the signed-in staff member's PHC.
		</p>

		<div class="my-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
			<strong>Protect patient privacy</strong>
			<p class="m-0 mt-2 text-sm text-amber-800">
				Outreach records are aggregate reports. Never enter a patient name, clinic ID, phone number,
				or clinical history in the notes field. Document individual care in the patient's clinical
				record.
			</p>
		</div>

		<h3>Syncing Your Data</h3>
		<p>
			At the top of the Field Dashboard, you will see a <span
				class="inline-flex items-center gap-1 font-semibold px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm"
				><CloudUpload class="size-3" /> Sync (X)</span
			> button. The number in parentheses indicates how many offline records are pending upload. When
			you return to the clinic or a zone with cellular data, simply open the app. The system will automatically
			detect the connection and flush your offline records to the cloud database. You can also press the
			Sync button to trigger it manually.
		</p>

		<div class="bg-red-50 border border-red-200 text-red-900 p-4 rounded-lg my-6">
			<strong
				><ShieldAlert class="inline size-5 mr-2 text-red-600" />Critical Safety Protocol</strong
			>
			<p class="mt-2 text-sm text-red-800">
				While ClinicFlow supports offline AI triage, AI suggestions in the field cannot replace
				clinical judgment. If you detect any critical red flags (e.g., severe acute malnutrition,
				prolonged fever, signs of Lassa), you MUST initiate an immediate physical referral to the
				Primary Health Centre.
			</p>
		</div>
	</div>
</div>
