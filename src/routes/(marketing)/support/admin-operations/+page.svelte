<script lang="ts">
	import { MonitorCog, PackageCheck, ShieldCheck, TriangleAlert } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Admin & Superadmin Operations — ClinicFlow Support</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
	<div>
		<h1 class="text-3xl font-bold tracking-tight mb-2">Admin &amp; Superadmin Operations</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			How to publish releases, read sync health, register devices, submit NHIS claims, send SMS,
			manage referrals, and run superadmin actions using real server data.
		</p>
	</div>

	<div class="prose prose-slate max-w-none">
		<h3>Publishing a release (Superadmin)</h3>
		<p>
			Open <strong>Superadmin → Releases</strong>. The list is loaded from the app's real release
			records. Each row shows the version, publication date, release notes, and download assets; the
			download buttons open the published files directly.
		</p>
		<ol>
			<li>Select <strong>Publish release</strong> and confirm the tag, name, and notes.</li>
			<li>Review the warning if the page shows <strong>Console mode</strong>.</li>
			<li>Confirm. The release is recorded and, when configured, published to GitHub.</li>
		</ol>

		<div
			class="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-lg my-6 flex items-start gap-3"
		>
			<TriangleAlert class="size-6 shrink-0 mt-1 text-amber-600" />
			<div>
				<strong>Console mode is not a delivery</strong>
				<p class="m-0 mt-1 text-sm text-amber-800">
					When no GitHub token is configured, the release payload is logged and given a
					<code>console:...</code> reference. It is <em>not</em> published to GitHub. Configure the token
					and publish again to create the real release.
				</p>
			</div>
		</div>

		<h3>Sync health (Admin)</h3>
		<p>
			Open <strong>Admin → Sync Health</strong>. The page reads the durable device and sync
			operation records for your PHC — no sampled or demo values. You will see real device names,
			versions, last-sync times, and receive/push counts, plus a short recent-operation history.
			Requires the <strong>View Sync Health</strong> permission.
		</p>
		<div
			class="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-lg my-6 flex items-start gap-3"
		>
			<ShieldCheck class="size-6 shrink-0 mt-1 text-blue-600" />
			<div>
				<strong>Conflicts still need a human</strong>
				<p class="m-0 mt-1 text-sm text-blue-800">
					Conflicts are never auto-resolved. Keep reviewing them from this page and confirm the
					clinically correct record before syncing again.
				</p>
			</div>
		</div>

		<h3>Registering a device manually (Admin)</h3>
		<p>
			Open <strong>Admin → Devices</strong> and choose <strong>Add Manually</strong>. Enter the
			device name, MAC address, and role. The device is registered as pending for your PHC and
			appears in the list; approval still follows the normal device-approval flow.
		</p>

		<h3>DHIS2 indicator UIDs (Admin)</h3>
		<p>
			Open <strong>Admin → Reports → DHIS2</strong>. Export UIDs are stored for your PHC and can be
			edited on the page; documented defaults are shown when a value has not been set. The
			clinical-integrity notice stays visible: no AI processing is performed on the final payload.
		</p>

		<h3>NHIS claims (Admin)</h3>
		<p>
			Open <strong>Admin → NHIS Claims</strong>. Claims are stored durably in a manual-submission
			queue with honest statuses — <em>draft → ready → submitted → acknowledged/paid</em> — instead of
			a hardcoded "Pending Submission". Choose an encounter, add enrollee and authorization details, and
			create the claim. Each row shows its real status and reference.
		</p>
		<p>
			There is no public Nigerian NHIS submission API, so the default path is manual: prepare the
			claim packet and submit it through your HMO portal or licensed process, then record the
			outcome here. If your organisation supplies a <em>private</em> endpoint (<code
				>NHIS_API_URL</code
			>
			and
			<code>NHIS_API_KEY</code>), the submit action can call it; this is opt-in and is never
			described as a public API.
		</p>
		<div
			class="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-lg my-6 flex items-start gap-3"
		>
			<TriangleAlert class="size-6 shrink-0 mt-1 text-amber-600" />
			<div>
				<strong>A console reference is not a delivery receipt</strong>
				<p class="m-0 mt-1 text-sm text-amber-800">
					On the manual path, a <code>console:nhis_claim:&lt;uuid&gt;</code> value is only a local
					tracking reference. It does <em>not</em> mean the claim reached NHIS or an HMO. Confirm actual
					submission and payment in your external system before recording the claim as submitted or paid.
				</p>
			</div>
		</div>

		<h3>SMS test and reminder dispatch (Admin)</h3>
		<p>
			In <strong>Admin → Settings</strong>, <strong>Send test SMS</strong> now makes a real attempt
			through the configured adapter. In <strong>Admin → Reminders</strong>, dispatching sends
			messages through that same adapter and records durable status, sent time, provider and
			provider reference. Dispatch requires the <strong>Manage Reminders</strong> permission and is audited.
		</p>
		<p>
			When Termii credentials are configured the mode is <strong>live</strong>. Otherwise the page
			shows a visible <strong>Console mode — not delivered</strong> badge with a
			<code>console:sms:&lt;uuid&gt;</code> reference. Console mode logs only non-identifying delivery
			metadata; it is never presented as a successful delivery and no sandbox-style receipt is invented.
		</p>

		<h3>Referrals (Doctor)</h3>
		<p>
			The <strong>Referral</strong> tab on a consultation now opens the working referral flow — the
			same one used by the header action. The destination directory can look up Nigerian facilities
			in the read-only Federal Ministry of Health Health Facility Registry (HFR); filter by state,
			LGA and facility type. HFR is <em>advisory reference data only</em>: you must confirm the
			destination, and an HFR listing is not evidence of NHIA accreditation or accreditation status.
		</p>
		<p>
			Sending a referral SMS from the print page uses the live SMS adapter (or the clearly-labelled
			console mode), and the signature comes from your signed-in staff record — never a placeholder
			name.
		</p>

		<h3>Superadmin user and PHC actions</h3>
		<p>
			In <strong>Superadmin → Users</strong>, <strong>Reset password</strong> and
			<strong>Deactivate</strong> now work with an explicit confirmation dialog and write an audit
			entry. Open a PHC under <strong>Superadmin → PHCs</strong> to see sync status derived from real
			device sync times and the sync-operation counter — never a literal "Healthy" value. From there you
			can deactivate/reactivate the PHC (blocking or restoring staff sign-in) and reset its data.
		</p>
		<div
			class="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-lg my-6 flex items-start gap-3"
		>
			<ShieldCheck class="size-6 shrink-0 mt-1 text-blue-600" />
			<div>
				<strong>Reset Data preserves sync history</strong>
				<p class="m-0 mt-1 text-sm text-blue-800">
					Resetting a PHC clears its pending sync operations but deliberately preserves the PHC's
					monotonic sync version. Device cursors must never move backwards, so connected devices are
					woken to pull fresh state instead of being rewound. Deactivation and reset are
					destructive: confirm carefully — each is recorded in the audit log.
				</p>
			</div>
		</div>

		<h3>Facility review and onboarding (advisory)</h3>
		<p>
			During onboarding, a facility can be checked against HFR as a data-quality signal, and
			<strong>Admin → Facility Review</strong> lists items for a human to review. HFR has no console mode:
			if no key is configured the lookup is simply disabled and manual entry still works; if a request
			fails, the error is shown and any cached result is marked stale. Your local database stays authoritative
			— HFR IDs are not DHIS2 UIDs or foreign keys, nothing is auto-written, and lookups carry no patient
			data.
		</p>

		<div
			class="my-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800 flex items-start gap-3"
		>
			<MonitorCog class="size-6 shrink-0 mt-1 text-slate-600" />
			<div>
				<strong>Why these pages show real data</strong>
				<p class="m-0 mt-2 text-sm">
					Release, device, and sync information must be auditable. These pages never invent a
					release, device, or sync event. If a provider is not configured, the page says so plainly
					instead of showing a plausible-looking fake value.
				</p>
			</div>
		</div>

		<p class="flex items-start gap-2">
			<PackageCheck class="size-5 shrink-0 mt-0.5" />
			<span>
				All actions are permission-checked on the server and limited to the signed-in user's PHC
				(platform-wide for superadmins). Ask your superadmin if an action you need is locked.
			</span>
		</p>
	</div>
</div>
