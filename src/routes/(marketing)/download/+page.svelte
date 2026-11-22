<script lang="ts">
	import { getReleases } from '#lib/remote/releases.remote.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import {
		Monitor,
		Smartphone,
		Download,
		HardDrive,
		Cpu,
		ShieldCheck,
		Server,
		FlaskConical,
		Zap,
		AlertTriangle,
		Clock,
		Check,
		ArrowRight
	} from '@lucide/svelte';

	const releasesData = getReleases();

	function relativeDate(iso: string) {
		const diff = Date.now() - new Date(iso).getTime();
		const days = Math.floor(diff / 86400000);
		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 30) return `${days} days ago`;
		return new Date(iso).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function channelBadge(channel: string) {
		return (
			{
				stable: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
				beta: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
				alpha: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
				nightly: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
			}[channel] ?? ''
		);
	}
</script>

<svelte:head>
	<title>Download ClinicFlow — Kiosk Apps & Releases</title>
	<meta
		name="description"
		content="Download ClinicFlow for Android tablets, Windows workstations, and local Linux edge servers."
	/>
</svelte:head>

{#await releasesData}
	<div class="container mx-auto px-4 max-w-5xl py-32 flex justify-center">
		<div class="text-center space-y-4">
			<div
				class="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"
			></div>
			<p class="text-sm font-mono text-muted-foreground">Fetching verified release packages…</p>
		</div>
	</div>
{:then releases}
	<div
		class="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-20 space-y-16 animate-fade-in flex-1"
	>
		<!-- Editorial Header -->
		<div class="border-b border-border/70 pb-8 space-y-4">
			<p class="text-xs font-mono uppercase tracking-wider text-primary">
				Deployment Binaries & Kiosk Images
			</p>
			<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<h1 class="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
						Download ClinicFlow
					</h1>
					<p class="text-base md:text-lg text-muted-foreground max-w-xl mt-2 leading-relaxed">
						Native kiosk binaries engineered for frontline Android tablets, desktop consultation
						stations, and local edge servers.
					</p>
				</div>
				{#if releases.latest}
					<div class="rounded-lg border border-border bg-card p-4 space-y-1 text-right shrink-0">
						<div class="text-xs text-muted-foreground">Latest Verified Stable</div>
						<div class="font-mono font-bold text-foreground text-lg">
							v{releases.latest.version}
						</div>
						<div class="text-[11px] text-muted-foreground font-mono">
							{relativeDate(releases.latest.publishedAt)}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Stable Release Downloads -->
		{#if releases.latest}
			{@const r = releases.latest}
			<section class="space-y-6">
				<div class="flex items-center gap-3">
					<h2 class="text-xl font-bold text-foreground">Frontline Station Clients</h2>
					<Badge class="bg-primary/10 text-primary border-primary/20 font-mono text-xs"
						>v{r.version}</Badge
					>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Android -->
					{#if r.downloads.android}
						<div
							class="bg-card border border-border rounded-lg overflow-hidden flex flex-col justify-between"
						>
							<div class="p-6 md:p-8 space-y-5">
								<div class="flex items-center gap-3">
									<div
										class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0"
									>
										<Smartphone class="size-5" />
									</div>
									<div>
										<h3 class="font-bold text-foreground">Android Kiosk (Tablet)</h3>
										<p class="text-xs text-muted-foreground">
											Recommended for Nurse Triage & Bedside Intake
										</p>
									</div>
								</div>

								<ul class="space-y-2 text-sm text-muted-foreground">
									<li class="flex items-center gap-2">
										<Cpu class="size-3.5 text-primary" /> Android 8.0 or higher (Android 11+ recommended)
									</li>
									<li class="flex items-center gap-2">
										<HardDrive class="size-3.5 text-primary" /> 3 GB RAM minimum (4 GB recommended)
									</li>
									<li class="flex items-center gap-2">
										<ShieldCheck class="size-3.5 text-primary" /> Native offline IndexedDB edge storage
									</li>
								</ul>
							</div>

							<div class="p-6 md:p-8 pt-0 space-y-2">
								{#if r.downloads.android.arm64}
									<Button
										href={r.downloads.android.arm64}
										class="w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
									>
										<Download class="size-4 mr-2" /> Download APK (ARM64 — Most Tablets)
									</Button>
								{/if}
								{#if r.downloads.android.arm32}
									<Button
										href={r.downloads.android.arm32}
										variant="outline"
										class="w-full rounded-md font-medium"
									>
										<Download class="size-4 mr-2" /> Download APK (ARM32 — Legacy Tablets)
									</Button>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Windows -->
					{#if r.downloads.windows?.x64}
						<div
							class="bg-card border border-border rounded-lg overflow-hidden flex flex-col justify-between"
						>
							<div class="p-6 md:p-8 space-y-5">
								<div class="flex items-center gap-3">
									<div
										class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0"
									>
										<Monitor class="size-5" />
									</div>
									<div>
										<h3 class="font-bold text-foreground">Windows Workstation (64-bit)</h3>
										<p class="text-xs text-muted-foreground">
											Recommended for Consultation & Administrative Desks
										</p>
									</div>
								</div>

								<ul class="space-y-2 text-sm text-muted-foreground">
									<li class="flex items-center gap-2">
										<Cpu class="size-3.5 text-primary" /> Windows 10 or 11 (64-bit)
									</li>
									<li class="flex items-center gap-2">
										<HardDrive class="size-3.5 text-primary" /> 4 GB RAM minimum
									</li>
									<li class="flex items-center gap-2">
										<ShieldCheck class="size-3.5 text-primary" /> High-volume record search & printing
									</li>
								</ul>
							</div>

							<div class="p-6 md:p-8 pt-0">
								<Button
									href={r.downloads.windows.x64}
									class="w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
								>
									<Download class="size-4 mr-2" /> Download Installer (.exe)
								</Button>
							</div>
						</div>
					{/if}

					<!-- macOS -->
					{#if r.downloads.macos}
						<div
							class="bg-card border border-border rounded-lg overflow-hidden flex flex-col justify-between"
						>
							<div class="p-6 md:p-8 space-y-5">
								<div class="flex items-center gap-3">
									<div
										class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0"
									>
										<Monitor class="size-5" />
									</div>
									<div>
										<h3 class="font-bold text-foreground">macOS Desktop</h3>
										<p class="text-xs text-muted-foreground">Apple Silicon & Intel workstations</p>
									</div>
								</div>

								<ul class="space-y-2 text-sm text-muted-foreground">
									<li class="flex items-center gap-2">
										<Cpu class="size-3.5 text-primary" /> macOS 11.0 Big Sur or later
									</li>
									<li class="flex items-center gap-2">
										<HardDrive class="size-3.5 text-primary" /> 4 GB RAM minimum
									</li>
								</ul>
							</div>

							<div class="p-6 md:p-8 pt-0 space-y-2">
								{#if r.downloads.macos.arm64}
									<Button
										href={r.downloads.macos.arm64}
										variant="outline"
										class="w-full rounded-md font-medium"
									>
										<Download class="size-4 mr-2" /> Apple Silicon (.dmg)
									</Button>
								{/if}
								{#if r.downloads.macos.x64}
									<Button
										href={r.downloads.macos.x64}
										variant="outline"
										class="w-full rounded-md font-medium"
									>
										<Download class="size-4 mr-2" /> Intel Mac (.dmg)
									</Button>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Linux Client -->
					{#if r.downloads.linux}
						<div
							class="bg-card border border-border rounded-lg overflow-hidden flex flex-col justify-between"
						>
							<div class="p-6 md:p-8 space-y-5">
								<div class="flex items-center gap-3">
									<div
										class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0"
									>
										<Monitor class="size-5" />
									</div>
									<div>
										<h3 class="font-bold text-foreground">Linux Desktop (Debian / Ubuntu)</h3>
										<p class="text-xs text-muted-foreground">Client workstation package</p>
									</div>
								</div>

								<ul class="space-y-2 text-sm text-muted-foreground">
									<li class="flex items-center gap-2">
										<Cpu class="size-3.5 text-primary" /> Ubuntu 20.04+ or Debian 11+
									</li>
									<li class="flex items-center gap-2">
										<HardDrive class="size-3.5 text-primary" /> 4 GB RAM minimum
									</li>
								</ul>
							</div>

							<div class="p-6 md:p-8 pt-0 space-y-2">
								{#if r.downloads.linux.amd64}
									<Button
										href={r.downloads.linux.amd64}
										variant="outline"
										class="w-full rounded-md font-medium"
									>
										<Download class="size-4 mr-2" /> .deb Package (AMD64)
									</Button>
								{/if}
								{#if r.downloads.linux.arm64}
									<Button
										href={r.downloads.linux.arm64}
										variant="outline"
										class="w-full rounded-md font-medium"
									>
										<Download class="size-4 mr-2" /> .deb Package (ARM64)
									</Button>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</section>
		{:else if !releases.error}
			<section
				class="p-8 rounded-lg bg-muted/20 border border-dashed border-border text-center space-y-2"
			>
				<p class="text-muted-foreground font-medium">No stable release published yet.</p>
				<p class="text-sm text-muted-foreground">
					Check back soon or <a href="/support/getting-started" class="text-primary underline"
						>read the setup documentation</a
					>.
				</p>
			</section>
		{/if}

		<!-- Server Section -->
		<section class="rounded-lg border border-border bg-card p-6 md:p-8 space-y-6">
			<div class="flex items-center gap-3 border-b border-border/70 pb-4">
				<div
					class="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0"
				>
					<Server class="size-5" />
				</div>
				<div>
					<h2 class="text-xl font-bold text-foreground">ClinicFlow Local Facility Hub (Server)</h2>
					<p class="text-xs text-muted-foreground">
						LAN coordination node for multi-device health centres
					</p>
				</div>
			</div>

			<div class="space-y-4">
				<p class="text-sm text-muted-foreground leading-relaxed max-w-3xl">
					The ClinicFlow server acts as the local coordination anchor inside your facility. Running
					on an inexpensive local Linux mini-PC or workstation, it keeps all nurse tablets and
					doctor desks in sync across local Wi-Fi even during complete regional telecom blackout.
				</p>

				<ul class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
					<li class="flex items-center gap-2">
						<Check class="size-4 text-primary" /> Ubuntu 20.04 LTS or Debian 11+
					</li>
					<li class="flex items-center gap-2">
						<Check class="size-4 text-primary" /> 4 GB RAM, 50 GB storage minimum
					</li>
					<li class="flex items-center gap-2">
						<Check class="size-4 text-primary" /> Operates 100% offline via local Wi-Fi router
					</li>
					<li class="flex items-center gap-2">
						<Check class="size-4 text-primary" /> Automatic uplink sync when cellular/broadband is detected
					</li>
				</ul>

				<div class="flex flex-wrap gap-3 pt-2">
					{#if releases.latest?.downloads.linux?.amd64}
						<Button
							href={releases.latest.downloads.linux.amd64}
							class="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
						>
							<Download class="size-4 mr-2" /> Server .deb (AMD64)
						</Button>
					{:else}
						<Button
							href="https://github.com/mudiageo/clinic-flow/releases/latest"
							class="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
						>
							<Download class="size-4 mr-2" /> Download Server Release
						</Button>
					{/if}
					<Button href="/support/installation" variant="outline" class="rounded-md font-medium">
						Installation & Provisioning Guide
					</Button>
				</div>
			</div>
		</section>

		<!-- Pre-release Channels -->
		{#if releases.latestBeta || releases.latestAlpha || releases.latestNightly}
			<section class="space-y-4">
				<div class="flex items-center gap-3">
					<h2 class="text-xl font-bold text-foreground">Pre-release Channels</h2>
					<Badge
						variant="outline"
						class="border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono text-xs"
						>Experimental</Badge
					>
				</div>

				<div
					class="p-4 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-sm flex items-start gap-3"
				>
					<AlertTriangle class="size-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
					<p class="leading-relaxed">
						Pre-release builds are intended for test environments only. <strong
							>Do not deploy on active clinical desks treating real patients.</strong
						> Database schemas may break across development updates.
					</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					{#each [releases.latestBeta, releases.latestAlpha, releases.latestNightly] as r}
						{#if r && (r.channel === 'beta' || r.channel === 'alpha' || r.channel === 'nightly')}
							{@const icons = { beta: FlaskConical, alpha: Zap, nightly: Clock }}
							{@const Icon = icons[r.channel]}
							<div class="bg-card border border-border rounded-lg p-5 space-y-3">
								<div class="flex items-center gap-2">
									<Icon class="size-4 text-muted-foreground" />
									<span class="font-semibold capitalize text-foreground">{r.channel}</span>
									<Badge class="{channelBadge(r.channel)} text-xs ml-auto font-mono"
										>v{r.version}</Badge
									>
								</div>
								<p class="text-xs text-muted-foreground font-mono">{relativeDate(r.publishedAt)}</p>
								<div class="space-y-1.5 pt-2 border-t border-border/70">
									{#if r.downloads.windows?.x64}
										<a
											href={r.downloads.windows.x64}
											class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
										>
											<Download class="size-3" /> Windows .exe
										</a>
									{/if}
									{#if r.downloads.linux?.amd64}
										<a
											href={r.downloads.linux.amd64}
											class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
										>
											<Download class="size-3" /> Linux .deb
										</a>
									{/if}
									{#if r.downloads.android?.arm64}
										<a
											href={r.downloads.android.arm64}
											class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
										>
											<Download class="size-3" /> Android APK
										</a>
									{/if}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</section>
		{/if}

		<!-- Stepper Guide -->
		<section class="rounded-lg border border-border bg-muted/20 p-6 md:p-8 space-y-6">
			<h2 class="text-xl font-bold text-foreground">Three-Step Facility Deployment</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				{#each [{ step: '01', title: 'Install Binary', body: 'Flash APK onto nurse tablets or run the installer on desktop intake stations.' }, { step: '02', title: 'Initial Seed Sync', body: 'Connect once to internet or local hub to authenticate staff and pull facility master inventory.' }, { step: '03', title: 'Operate Disconnected', body: 'Unplug. ClinicFlow runs 100% offline on local Wi-Fi with instant queuing and zero cloud lag.' }] as item}
					<div class="space-y-2">
						<span class="font-mono text-xs text-primary font-bold">{item.step}</span>
						<h3 class="font-bold text-foreground text-sm">{item.title}</h3>
						<p class="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
					</div>
				{/each}
			</div>
		</section>
	</div>
{:catch err}
	<div class="container mx-auto px-4 max-w-2xl py-32 text-center space-y-4">
		<p class="text-destructive font-medium">Could not fetch release data.</p>
		<p class="text-sm text-muted-foreground">{err.message}</p>
		<Button
			href="https://github.com/mudiageo/clinic-flow/releases"
			variant="outline"
			class="rounded-md"
		>
			View Releases on GitHub
		</Button>
	</div>
{/await}
