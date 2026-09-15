<script lang="ts">
	import { getReleases } from '$lib/remote/releases.remote';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
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
		Check
	} from '@lucide/svelte';

	const releasesData = getReleases();

	function formatBytes(bytes: number) {
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
		return (bytes / 1024 / 1024).toFixed(1) + ' MB';
	}

	function channelBadge(channel: string) {
		return {
			stable: 'bg-emerald-100 text-emerald-800 border-emerald-200',
			beta: 'bg-blue-100 text-blue-800 border-blue-200',
			alpha: 'bg-amber-100 text-amber-800 border-amber-200',
			nightly: 'bg-purple-100 text-purple-800 border-purple-200'
		}[channel] ?? '';
	}

	function relativeDate(iso: string) {
		const diff = Date.now() - new Date(iso).getTime();
		const days = Math.floor(diff / 86400000);
		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 30) return `${days} days ago`;
		return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Download ClinicFlow</title>
</svelte:head>

{#await releasesData}
	<div class="container mx-auto px-4 max-w-5xl py-32 flex justify-center">
		<div class="text-center space-y-4">
			<div class="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
			<p class="text-muted-foreground">Fetching latest releases…</p>
		</div>
	</div>
{:then releases}
	<div class="container mx-auto px-4 md:px-8 max-w-5xl py-16 space-y-20 animate-fade-in flex-1">

		<!-- Header -->
		<div class="text-center space-y-4">
			<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
				Download ClinicFlow
			</h1>
			{#if releases.latest}
				<p class="text-muted-foreground text-lg">
					Latest stable: <span class="font-mono font-semibold text-foreground">v{releases.latest.version}</span>
					<span class="text-sm ml-2 text-muted-foreground">· Released {relativeDate(releases.latest.publishedAt)}</span>
				</p>
			{:else}
				<p class="text-muted-foreground text-lg">Get the cross-platform kiosk app for your PHC hardware.</p>
			{/if}
		</div>

		<!-- Stable Release Downloads -->
		{#if releases.latest}
			{@const r = releases.latest}
			<section class="space-y-6">
				<div class="flex items-center gap-3">
					<h2 class="text-2xl font-bold">Stable Release</h2>
					<Badge class="bg-emerald-100 text-emerald-800 border-emerald-200">v{r.version}</Badge>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Windows -->
					{#if r.downloads.windows?.x64}
						<div class="bg-card border rounded-2xl overflow-hidden shadow-sm">
							<div class="h-1.5 bg-blue-500"></div>
							<div class="p-6 space-y-4">
								<div class="flex items-center gap-3">
									<div class="size-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
										<Monitor class="size-5" />
									</div>
									<div>
										<div class="font-semibold">Windows (64-bit)</div>
										<div class="text-xs text-muted-foreground">Recommended for Reception & Doctor Desks</div>
									</div>
								</div>
								<ul class="space-y-1.5 text-sm text-muted-foreground">
									<li class="flex items-center gap-2"><Cpu class="size-3.5" /> Windows 10 or 11 (64-bit)</li>
									<li class="flex items-center gap-2"><HardDrive class="size-3.5" /> 4 GB RAM minimum</li>
									<li class="flex items-center gap-2"><ShieldCheck class="size-3.5" /> Auto-updates enabled</li>
								</ul>
								<Button href={r.downloads.windows.x64} class="w-full bg-blue-600 hover:bg-blue-700 text-white">
									<Download class="size-4 mr-2" /> Download .exe (64-bit)
								</Button>
							</div>
						</div>
					{/if}

					<!-- Android -->
					{#if r.downloads.android}
						<div class="bg-card border rounded-2xl overflow-hidden shadow-sm">
							<div class="h-1.5 bg-emerald-500"></div>
							<div class="p-6 space-y-4">
								<div class="flex items-center gap-3">
									<div class="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
										<Smartphone class="size-5" />
									</div>
									<div>
										<div class="font-semibold">Android Tablet</div>
										<div class="text-xs text-muted-foreground">Recommended for Nurse Triage Stations</div>
									</div>
								</div>
								<ul class="space-y-1.5 text-sm text-muted-foreground">
									<li class="flex items-center gap-2"><Cpu class="size-3.5" /> Android 10 or higher</li>
									<li class="flex items-center gap-2"><HardDrive class="size-3.5" /> 3 GB RAM minimum</li>
									<li class="flex items-center gap-2"><ShieldCheck class="size-3.5" /> Sideloading must be enabled</li>
								</ul>
								<div class="space-y-2">
									{#if r.downloads.android.arm64}
										<Button href={r.downloads.android.arm64} class="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
											<Download class="size-4 mr-2" /> APK (ARM64 — most tablets)
										</Button>
									{/if}
									{#if r.downloads.android.arm32}
										<Button href={r.downloads.android.arm32} variant="outline" class="w-full text-emerald-700 border-emerald-200">
											<Download class="size-4 mr-2" /> APK (ARM32 — older tablets)
										</Button>
									{/if}
								</div>
							</div>
						</div>
					{/if}

					<!-- macOS -->
					{#if r.downloads.macos}
						<div class="bg-card border rounded-2xl overflow-hidden shadow-sm">
							<div class="h-1.5 bg-slate-500"></div>
							<div class="p-6 space-y-4">
								<div class="flex items-center gap-3">
									<div class="size-11 rounded-xl bg-slate-500/10 text-slate-600 flex items-center justify-center">
										<Monitor class="size-5" />
									</div>
									<div>
										<div class="font-semibold">macOS</div>
										<div class="text-xs text-muted-foreground">Apple Silicon & Intel</div>
									</div>
								</div>
								<ul class="space-y-1.5 text-sm text-muted-foreground">
									<li class="flex items-center gap-2"><Cpu class="size-3.5" /> macOS 11.0 or higher</li>
									<li class="flex items-center gap-2"><HardDrive class="size-3.5" /> 4 GB RAM minimum</li>
								</ul>
								<div class="space-y-2">
									{#if r.downloads.macos.arm64}
										<Button href={r.downloads.macos.arm64} class="w-full bg-slate-700 hover:bg-slate-800 text-white">
											<Download class="size-4 mr-2" /> Apple Silicon (M1/M2/M3)
										</Button>
									{/if}
									{#if r.downloads.macos.x64}
										<Button href={r.downloads.macos.x64} variant="outline" class="w-full text-slate-700 border-slate-200">
											<Download class="size-4 mr-2" /> Intel Mac
										</Button>
									{/if}
								</div>
							</div>
						</div>
					{/if}

					<!-- Linux -->
					{#if r.downloads.linux}
						<div class="bg-card border rounded-2xl overflow-hidden shadow-sm">
							<div class="h-1.5 bg-orange-500"></div>
							<div class="p-6 space-y-4">
								<div class="flex items-center gap-3">
									<div class="size-11 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
										<Monitor class="size-5" />
									</div>
									<div>
										<div class="font-semibold">Linux (Debian/Ubuntu)</div>
										<div class="text-xs text-muted-foreground">For open-source server setups</div>
									</div>
								</div>
								<ul class="space-y-1.5 text-sm text-muted-foreground">
									<li class="flex items-center gap-2"><Cpu class="size-3.5" /> Ubuntu 20.04+ or Debian 11+</li>
									<li class="flex items-center gap-2"><HardDrive class="size-3.5" /> 4 GB RAM minimum</li>
								</ul>
								<div class="space-y-2">
									{#if r.downloads.linux.amd64}
										<Button href={r.downloads.linux.amd64} class="w-full bg-orange-600 hover:bg-orange-700 text-white">
											<Download class="size-4 mr-2" /> .deb (AMD64)
										</Button>
									{/if}
									{#if r.downloads.linux.arm64}
										<Button href={r.downloads.linux.arm64} variant="outline" class="w-full text-orange-700 border-orange-200">
											<Download class="size-4 mr-2" /> .deb (ARM64)
										</Button>
									{/if}
								</div>
							</div>
						</div>
					{/if}
				</div>
			</section>
		{:else if !releases.error}
			<!-- Fallback static downloads while no releases are published yet -->
			<section class="p-8 rounded-2xl bg-muted/50 border border-dashed text-center space-y-2">
				<p class="text-muted-foreground">No stable release published yet.</p>
				<p class="text-sm text-muted-foreground">Check back soon or <a href="/support/getting-started" class="text-primary underline">read the guide</a>.</p>
			</section>
		{/if}

		<!-- Pre-release Channels -->
		{#if releases.latestBeta || releases.latestAlpha || releases.latestNightly}
			<section class="space-y-4">
				<div class="flex items-center gap-3">
					<h2 class="text-2xl font-bold">Pre-release Channels</h2>
					<Badge variant="outline" class="border-amber-300 text-amber-700">⚠️ Experimental</Badge>
				</div>

				<div class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
					<AlertTriangle class="size-4 mt-0.5 shrink-0" />
					<p>Pre-release builds are intended for testing only. <strong>Do not use in a live clinical environment.</strong> Data may be incompatible with the stable release.</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					{#each [releases.latestBeta, releases.latestAlpha, releases.latestNightly] as r}
						{#if r && (r.channel === 'beta' || r.channel === 'alpha' || r.channel === 'nightly')}
							{@const icons = { beta: FlaskConical, alpha: Zap, nightly: Clock }}
							{@const Icon = icons[r.channel]}
							<div class="bg-card border rounded-2xl p-5 space-y-3">
								<div class="flex items-center gap-2">
									<Icon class="size-4 text-muted-foreground" />
									<span class="font-semibold capitalize">{r.channel}</span>
									<Badge class="{channelBadge(r.channel)} text-xs ml-auto">v{r.version}</Badge>
								</div>
								<p class="text-xs text-muted-foreground">{relativeDate(r.publishedAt)}</p>
								<div class="space-y-1.5">
									{#if r.downloads.windows?.x64}
										<a href={r.downloads.windows.x64} class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
											<Download class="size-3" /> Windows .exe
										</a>
									{/if}
									{#if r.downloads.linux?.amd64}
										<a href={r.downloads.linux.amd64} class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
											<Download class="size-3" /> Linux .deb
										</a>
									{/if}
									{#if r.downloads.android?.arm64}
										<a href={r.downloads.android.arm64} class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
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

		<!-- Version History -->
		{#if releases.all.length > 1}
			<section class="space-y-4">
				<h2 class="text-2xl font-bold">Version History</h2>
				<div class="space-y-2">
					{#each releases.all as r (r.id)}
						<div class="border rounded-xl px-4 py-4">
							<div class="w-full text-left flex items-center gap-3 mb-2">
								<span class="font-mono font-medium">{r.tag}</span>
								<Badge class="{channelBadge(r.channel)} text-xs">{r.channel}</Badge>
								<span class="text-xs text-muted-foreground ml-auto">{relativeDate(r.publishedAt)}</span>
							</div>
							<div class="space-y-3">
								{#if r.body}
									<div class="prose prose-sm max-w-none text-muted-foreground">
										<pre class="whitespace-pre-wrap text-xs font-sans leading-relaxed">{r.body}</pre>
									</div>
								{/if}
								<div class="flex flex-wrap gap-2 pt-2">
									{#if r.downloads.windows?.x64}
										<a href={r.downloads.windows.x64} class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors border">
											<Download class="size-3" /> Windows
										</a>
									{/if}
									{#if r.downloads.macos?.arm64}
										<a href={r.downloads.macos.arm64} class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors border">
											<Download class="size-3" /> macOS
										</a>
									{/if}
									{#if r.downloads.linux?.amd64}
										<a href={r.downloads.linux.amd64} class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors border">
											<Download class="size-3" /> Linux
										</a>
									{/if}
									{#if r.downloads.android?.arm64}
										<a href={r.downloads.android.arm64} class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors border">
											<Download class="size-3" /> Android
										</a>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Server Download -->
		<section class="space-y-4">
			<h2 class="text-2xl font-bold">ClinicFlow Server</h2>
			<div class="bg-card border rounded-2xl overflow-hidden shadow-sm">
				<div class="h-1.5 bg-indigo-600"></div>
				<div class="p-6 md:flex gap-8 items-start">
					<div class="size-14 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0 mb-4 md:mb-0">
						<Server class="size-7" />
					</div>
					<div class="flex-1 space-y-4">
						<div>
							<h3 class="font-bold text-lg">PHC Local Server (Self-hosted)</h3>
							<p class="text-sm text-muted-foreground mt-1">
								The ClinicFlow server is the backbone of your offline network. Run it on a dedicated Linux machine inside your clinic. All tablets and desktops connect to it via Wi-Fi — no internet required.
							</p>
						</div>
						<ul class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
							<li class="flex items-center gap-2"><Check class="size-4 text-emerald-500" /> Ubuntu 20.04 LTS or higher</li>
							<li class="flex items-center gap-2"><Check class="size-4 text-emerald-500" /> 4 GB RAM, 50 GB storage minimum</li>
							<li class="flex items-center gap-2"><Check class="size-4 text-emerald-500" /> Works completely offline on LAN</li>
							<li class="flex items-center gap-2"><Check class="size-4 text-emerald-500" /> Cloud sync when internet available</li>
						</ul>
						<div class="flex flex-wrap gap-3">
							{#if releases.latest?.downloads.linux?.amd64}
								<Button href={releases.latest.downloads.linux.amd64} class="bg-indigo-600 hover:bg-indigo-700 text-white">
									<Download class="size-4 mr-2" /> Server .deb (AMD64)
								</Button>
							{:else}
								<Button href="https://github.com/mudiageo/clinic-flow/releases/latest" class="bg-indigo-600 hover:bg-indigo-700 text-white">
									<Download class="size-4 mr-2" /> Download Server Package
								</Button>
							{/if}
							<Button href="/support/getting-started" variant="outline">
								View Installation Guide
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Installation Guide -->
		<section class="space-y-6">
			<h2 class="text-2xl font-bold text-center">Installation Guide</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each [
					{ step: '1', title: 'Download & Install', body: 'Choose the correct installer for your OS above. Run the installer and follow the on-screen prompts.' },
					{ step: '2', title: 'First Launch', body: 'Open ClinicFlow. You will need an internet connection on first launch to authenticate and pull your PHC data.' },
					{ step: '3', title: 'Go Offline', body: 'Once synced, disconnect. ClinicFlow operates 100% on your local network — register patients, dispense drugs, and record vitals without internet.' }
				] as item}
					<div class="bg-card border rounded-2xl p-6 space-y-3">
						<div class="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">{item.step}</div>
						<h3 class="font-semibold">{item.title}</h3>
						<p class="text-sm text-muted-foreground">{item.body}</p>
					</div>
				{/each}
			</div>
		</section>

	</div>
{:catch err}
	<div class="container mx-auto px-4 max-w-2xl py-32 text-center space-y-4">
		<p class="text-destructive font-medium">Could not fetch release data.</p>
		<p class="text-sm text-muted-foreground">{err.message}</p>
		<Button href="https://github.com/mudiageo/clinic-flow/releases" variant="outline">
			View Releases on GitHub
		</Button>
	</div>
{/await}
