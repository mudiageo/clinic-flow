<script lang="ts">
	import { getReleases } from '$lib/remote/releases.remote';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Download, GitBranch, Tag } from '@lucide/svelte';

	const releasesData = getReleases();

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
	<title>Releases — ClinicFlow</title>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-4xl py-16 space-y-12 animate-fade-in">
	<div class="space-y-2">
		<h1 class="text-4xl font-extrabold tracking-tight">Releases</h1>
		<p class="text-muted-foreground text-lg">Full history of ClinicFlow releases across all channels.</p>
		<div class="flex gap-3 pt-2">
			<a href="https://github.com/mudiageo/clinic-flow/releases" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
				<GitBranch class="size-4" /> View on GitHub
			</a>
			<a href="/download" class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
				<Download class="size-4" /> Download latest
			</a>
		</div>
	</div>

	{#await releasesData}
		<div class="space-y-4">
			{#each Array(5) as _}
				<div class="h-28 rounded-2xl bg-muted animate-pulse"></div>
			{/each}
		</div>
	{:then releases}
		{#if releases.all.length === 0}
			<div class="p-12 rounded-2xl bg-muted/50 border border-dashed text-center space-y-2">
				<Tag class="size-8 text-muted-foreground mx-auto" />
				<p class="font-medium">No releases published yet.</p>
				<p class="text-sm text-muted-foreground">Check back soon — the first release is on its way!</p>
			</div>
		{:else}
			<div class="space-y-6">
				{#each releases.all as r (r.id)}
					<article class="bg-card border rounded-2xl overflow-hidden">
						<div class="h-1 {
							r.channel === 'stable' ? 'bg-emerald-500' :
							r.channel === 'beta' ? 'bg-blue-500' :
							r.channel === 'alpha' ? 'bg-amber-500' :
							'bg-purple-500'
						}"></div>
						<div class="p-6 space-y-4">
							<!-- Header -->
							<div class="flex items-start justify-between gap-4">
								<div class="space-y-1">
									<div class="flex items-center gap-2 flex-wrap">
										<h2 class="text-xl font-bold font-mono">{r.name || r.tag}</h2>
										<Badge class="{channelBadge(r.channel)} capitalize">{r.channel}</Badge>
									</div>
									<p class="text-sm text-muted-foreground">{relativeDate(r.publishedAt)}</p>
								</div>
								<Button href="/download?channel={r.channel}&version={r.version}" variant="outline" size="sm" class="shrink-0">
									<Download class="size-3.5 mr-1.5" /> Download
								</Button>
							</div>

							<!-- Release notes -->
							{#if r.body}
								<div class="text-sm text-muted-foreground leading-relaxed border-t pt-4">
									<pre class="whitespace-pre-wrap font-sans">{r.body}</pre>
								</div>
							{/if}

							<!-- Asset links -->
							{#if r.assets.length > 0}
								<div class="border-t pt-4">
									<p class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Assets</p>
									<div class="flex flex-wrap gap-2">
										{#each r.assets as asset}
											<a
												href={asset.downloadUrl}
												class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-muted hover:bg-muted/80 transition-colors font-mono"
												title="{(asset.size / 1024 / 1024).toFixed(1)} MB"
											>
												<Download class="size-3" />{asset.name}
											</a>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		{/if}
	{:catch}
		<div class="p-8 rounded-2xl bg-destructive/10 border border-destructive/20 text-center">
			<p class="text-destructive font-medium">Could not load releases from GitHub.</p>
			<Button href="https://github.com/mudiageo/clinic-flow/releases" variant="outline" class="mt-4">
				View on GitHub instead
			</Button>
		</div>
	{/await}
</div>
