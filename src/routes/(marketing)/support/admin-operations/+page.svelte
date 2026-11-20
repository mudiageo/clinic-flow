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
			How to publish releases, read sync health, and register devices using real server data.
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
				All three actions are permission-checked on the server and limited to the signed-in user's
				PHC (platform-wide for superadmins). Ask your superadmin if an action you need is locked.
			</span>
		</p>
	</div>
</div>
