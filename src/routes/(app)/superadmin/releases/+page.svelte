<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Download, Monitor, Smartphone, Apple, Tag, History, ExternalLink } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	const releases = [
		{ platform: 'Windows', version: 'v1.2.4', date: 'Oct 28, 2023', icon: Monitor },
		{ platform: 'macOS', version: 'v1.2.4', date: 'Oct 28, 2023', icon: Apple },
		{ platform: 'Linux', version: 'v1.2.4', date: 'Oct 28, 2023', icon: Monitor },
		{ platform: 'Android', version: 'v1.1.0', date: 'Oct 15, 2023', icon: Smartphone },
		{ platform: 'iOS', version: 'v1.1.0', date: 'Oct 15, 2023', icon: Smartphone },
	];
</script>

<svelte:head>
	<title>App Releases — Superadmin</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-6xl mx-auto py-8">
	<div class="flex items-start justify-between">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<Download class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">App Releases</h1>
				<p class="text-muted-foreground text-sm mt-0.5">
					Manage and monitor desktop and mobile app versions.
				</p>
			</div>
		</div>
		<Button>
			<Tag class="size-4 mr-2" />
			Publish New Release
		</Button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="md:col-span-2 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Current Versions</CardTitle>
					<CardDescription>Latest stable releases across all supported platforms.</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{#each releases as release}
							{@const Icon = release.icon}
							<div class="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
								<div class="flex items-center gap-3">
									<div class="p-2 bg-primary/10 text-primary rounded-md">
										<Icon class="size-5" />
									</div>
									<div>
										<p class="font-medium text-sm">{release.platform}</p>
										<p class="text-xs text-muted-foreground">Updated {release.date}</p>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-xs font-mono bg-muted px-2 py-1 rounded">{release.version}</span>
									<Button variant="ghost" size="icon" class="size-8">
										<ExternalLink class="size-4" />
									</Button>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Product Demo Video</CardTitle>
					<CardDescription>Latest walk-through video shown to new clinics.</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="aspect-video w-full rounded-lg bg-muted flex items-center justify-center border border-dashed">
						<!-- In a real app, this would be an iframe embed -->
						<div class="text-center space-y-2">
							<Monitor class="size-12 text-muted-foreground mx-auto opacity-20" />
							<p class="text-sm text-muted-foreground">Demo Video Player Placeholder</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<div>
			<Card class="h-full">
				<CardHeader class="pb-3">
					<CardTitle class="text-base flex items-center gap-2">
						<History class="size-4 text-muted-foreground" />
						Release History
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="relative border-l ml-3 pl-5 space-y-6 py-2">
						<div class="relative">
							<div class="absolute -left-[27px] bg-primary size-3 rounded-full border-[3px] border-background"></div>
							<p class="text-sm font-medium">v1.2.4 <span class="text-muted-foreground font-normal ml-2">Oct 28, 2023</span></p>
							<p class="text-xs text-muted-foreground mt-1">Added offline sync improvements and resolved a bug in the triage queue.</p>
						</div>
						<div class="relative">
							<div class="absolute -left-[27px] bg-muted-foreground/30 size-3 rounded-full border-[3px] border-background"></div>
							<p class="text-sm font-medium">v1.2.3 <span class="text-muted-foreground font-normal ml-2">Oct 10, 2023</span></p>
							<p class="text-xs text-muted-foreground mt-1">Introduced the new Pharmacy dashboard.</p>
						</div>
						<div class="relative">
							<div class="absolute -left-[27px] bg-muted-foreground/30 size-3 rounded-full border-[3px] border-background"></div>
							<p class="text-sm font-medium">v1.1.0 <span class="text-muted-foreground font-normal ml-2">Sep 15, 2023</span></p>
							<p class="text-xs text-muted-foreground mt-1">Initial mobile release for Android and iOS.</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
