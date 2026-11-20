<script lang="ts">
	import { getReleases, publishAppRelease } from '#lib/remote/releases.remote.ts';
	import { formatDate, formatDateTime } from '#lib/utils/date.ts';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '#lib/components/ui/card/index.ts';
	import { Alert, AlertDescription, AlertTitle } from '#lib/components/ui/alert/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.ts';
	import { Checkbox } from '#lib/components/ui/checkbox/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import {
		Download,
		Monitor,
		Smartphone,
		Apple,
		Tag,
		History,
		ExternalLink,
		AlertTriangle,
		RefreshCw
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	const releasesQuery = getReleases();

	type Release = NonNullable<typeof releasesQuery.current>['all'][number];
	type PlatformRow = {
		key: string;
		label: string;
		icon: typeof Monitor;
		url: string;
	};

	const emptyReleases = {
		latest: null as Release | null,
		latestBeta: null as Release | null,
		latestAlpha: null as Release | null,
		latestNightly: null as Release | null,
		all: [] as Release[],
		error: undefined as string | undefined
	};

	const releases = $derived(releasesQuery.current ?? emptyReleases);
	const currentRelease = $derived(releases.latest ?? releases.all[0] ?? null);
	const releaseNotes = $derived(releases.all.slice(0, 4));
	const releaseHistory = $derived(releases.all.slice(0, 8));
	const errorMessage = $derived(
		releasesQuery.error ?? ('error' in releases ? releases.error : undefined)
	);

	const platformRows = $derived.by(() => {
		const downloads = currentRelease?.downloads;
		if (!downloads) return [];

		const rows: PlatformRow[] = [];
		if (downloads.windows?.x64) {
			rows.push({
				key: 'windows-x64',
				label: 'Windows x64',
				icon: Monitor,
				url: downloads.windows.x64
			});
		}
		if (downloads.macos?.arm64) {
			rows.push({
				key: 'macos-arm64',
				label: 'macOS arm64',
				icon: Apple,
				url: downloads.macos.arm64
			});
		}
		if (downloads.macos?.x64) {
			rows.push({ key: 'macos-x64', label: 'macOS x64', icon: Apple, url: downloads.macos.x64 });
		}
		if (downloads.linux?.amd64) {
			rows.push({
				key: 'linux-amd64',
				label: 'Linux amd64',
				icon: Monitor,
				url: downloads.linux.amd64
			});
		}
		if (downloads.linux?.arm64) {
			rows.push({
				key: 'linux-arm64',
				label: 'Linux arm64',
				icon: Monitor,
				url: downloads.linux.arm64
			});
		}
		if (downloads.android?.arm64) {
			rows.push({
				key: 'android-arm64',
				label: 'Android arm64',
				icon: Smartphone,
				url: downloads.android.arm64
			});
		}
		if (downloads.android?.arm32) {
			rows.push({
				key: 'android-arm32',
				label: 'Android arm32',
				icon: Smartphone,
				url: downloads.android.arm32
			});
		}
		if (downloads.android?.x86_64) {
			rows.push({
				key: 'android-x86-64',
				label: 'Android x86_64',
				icon: Smartphone,
				url: downloads.android.x86_64
			});
		}
		return rows;
	});

	let publishDialogOpen = $state(false);
	let publishing = $state(false);
	let releaseTag = $state('');
	let releaseName = $state('');
	let releaseBody = $state('');
	let prerelease = $state(false);
	let draft = $state(false);
	let lastPublishMode = $state<'live' | 'console' | null>(null);
	let lastPublishReference = $state<string | null>(null);

	function errorText(value: unknown): string {
		if (value instanceof Error) return value.message;
		return typeof value === 'string' && value ? value : 'Unable to load releases.';
	}

	function channelVariant(channel: Release['channel']): 'default' | 'secondary' | 'outline' {
		if (channel === 'stable') return 'default';
		if (channel === 'beta') return 'secondary';
		return 'outline';
	}

	function resetReleaseForm(): void {
		releaseTag = '';
		releaseName = '';
		releaseBody = '';
		prerelease = false;
		draft = false;
	}

	async function handlePublish(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (publishing) return;
		if (!releaseTag.trim() || !releaseName.trim()) {
			toast.error('A tag and release name are required.');
			return;
		}

		publishing = true;
		try {
			const result = await publishAppRelease({
				tag: releaseTag.trim(),
				name: releaseName.trim(),
				body: releaseBody,
				prerelease,
				draft
			});
			lastPublishMode = result.mode;
			lastPublishReference = result.reference;

			if (result.mode === 'console') {
				toast.warning('Console mode — release not published. Payload logged to server console.', {
					description: `Reference: ${result.reference}${result.reason ? ` — ${result.reason}` : ''}`
				});
			} else {
				toast.success(`Release ${result.tag} published.`, {
					description: result.url ?? undefined
				});
			}

			publishDialogOpen = false;
			resetReleaseForm();
			await releasesQuery.refresh();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Unable to publish release.');
		} finally {
			publishing = false;
		}
	}
</script>

<svelte:head>
	<title>App Releases — Superadmin</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-6xl mx-auto">
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
				{#if lastPublishMode === 'console'}
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<Badge variant="destructive">Console mode — not published</Badge>
						<span class="text-xs text-muted-foreground font-mono">
							{lastPublishReference ?? '—'}
						</span>
					</div>
				{/if}
			</div>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				disabled={releasesQuery.loading}
				onclick={() => releasesQuery.refresh()}
			>
				<RefreshCw class="size-4 mr-2 {releasesQuery.loading ? 'animate-spin' : ''}" />
				Refresh
			</Button>
			<Button onclick={() => (publishDialogOpen = true)}>
				<Tag class="size-4 mr-2" />
				Publish New Release
			</Button>
		</div>
	</div>

	{#if errorMessage}
		<div
			class="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
		>
			{errorText(errorMessage)}
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="md:col-span-2 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Current Versions</CardTitle>
					<CardDescription
						>Latest published releases across all supported platforms.</CardDescription
					>
				</CardHeader>
				<CardContent>
					{#if releasesQuery.loading && !currentRelease}
						<p class="py-8 text-center text-sm text-muted-foreground">Loading releases…</p>
					{:else if platformRows.length === 0}
						<div class="py-8 text-center">
							<Download class="mx-auto mb-3 size-8 text-muted-foreground/40" />
							<p class="text-sm font-medium">No published release assets found.</p>
							<p class="mt-1 text-sm text-muted-foreground">
								<a href="/releases" class="underline underline-offset-2">View releases</a> for available
								downloads.
							</p>
						</div>
					{:else}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{#each platformRows as row (row.key)}
								{@const Icon = row.icon}
								<div
									class="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
								>
									<div class="flex items-center gap-3">
										<div class="p-2 bg-primary/10 text-primary rounded-md">
											<Icon class="size-5" />
										</div>
										<div>
											<p class="font-medium text-sm">{row.label}</p>
											<p class="text-xs text-muted-foreground">
												Published {currentRelease?.publishedAt
													? formatDateTime(currentRelease.publishedAt)
													: '—'}
											</p>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<span class="text-xs font-mono bg-muted px-2 py-1 rounded">
											{currentRelease?.version ?? '—'}
										</span>
										<a
											href={row.url}
											target="_blank"
											rel="noopener noreferrer"
											aria-label={`Download ${row.label}`}
											class={buttonVariants({ variant: 'ghost', size: 'icon', class: 'size-8' })}
										>
											<ExternalLink class="size-4" />
										</a>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Release Notes</CardTitle>
					<CardDescription>Notes from the most recent published releases.</CardDescription>
				</CardHeader>
				<CardContent>
					{#if releaseNotes.length === 0}
						<div class="py-8 text-center">
							<Tag class="mx-auto mb-3 size-8 text-muted-foreground/40" />
							<p class="text-sm font-medium">No published release notes found.</p>
							<p class="mt-1 text-sm text-muted-foreground">
								<a href="/releases" class="underline underline-offset-2">View releases</a> for details.
							</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each releaseNotes as note (note.id)}
								<div class="rounded-lg border p-4">
									<div class="flex flex-wrap items-center gap-2">
										<p class="text-sm font-medium">{note.tag}</p>
										<Badge variant={channelVariant(note.channel)} class="capitalize">
											{note.channel}
										</Badge>
									</div>
									<p class="mt-1 text-xs text-muted-foreground">{formatDate(note.publishedAt)}</p>
									<p class="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
										{note.body || 'No release notes provided.'}
									</p>
								</div>
							{/each}
						</div>
					{/if}
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
					{#if releaseHistory.length === 0}
						<p class="py-8 text-center text-sm text-muted-foreground">
							No release history available.
						</p>
					{:else}
						<div class="relative border-l ml-3 pl-5 space-y-6 py-2">
							{#each releaseHistory as release (release.id)}
								<div class="relative">
									<div
										class="absolute -left-[27px] bg-primary size-3 rounded-full border-[3px] border-background"
									></div>
									<p class="text-sm font-medium">
										{release.tag}
										<span class="text-muted-foreground font-normal ml-2">
											{formatDate(release.publishedAt)}
										</span>
									</p>
									<p class="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">
										{release.body || 'No release notes provided.'}
									</p>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>
</div>

<Dialog.Root bind:open={publishDialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Publish New Release</Dialog.Title>
			<Dialog.Description>
				Create a GitHub release through the configured adapter. Console-mode submissions are not
				real releases.
			</Dialog.Description>
		</Dialog.Header>

		<Alert class="my-4">
			<AlertTriangle class="size-4" />
			<AlertTitle>Console mode warning</AlertTitle>
			<AlertDescription>
				When <code class="font-mono">GITHUB_TOKEN</code> is not configured, the adapter runs in
				console mode. It logs the payload to the server console and does <strong>not</strong> create a
				real GitHub release.
			</AlertDescription>
		</Alert>

		<form class="space-y-4" onsubmit={handlePublish}>
			<div class="space-y-2">
				<Label for="release-tag">Tag</Label>
				<Input
					id="release-tag"
					bind:value={releaseTag}
					placeholder="vX.Y.Z"
					required
					maxlength={80}
				/>
			</div>
			<div class="space-y-2">
				<Label for="release-name">Name</Label>
				<Input
					id="release-name"
					bind:value={releaseName}
					placeholder="Release name"
					required
					maxlength={120}
				/>
			</div>
			<div class="space-y-2">
				<Label for="release-body">Release notes</Label>
				<Textarea
					id="release-body"
					bind:value={releaseBody}
					placeholder="Describe what changed in this release."
					maxlength={5000}
					class="min-h-32"
				/>
			</div>
			<div class="flex flex-wrap items-center gap-6">
				<div class="flex items-center gap-2">
					<Checkbox id="release-prerelease" bind:checked={prerelease} />
					<Label for="release-prerelease">Prerelease</Label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox id="release-draft" bind:checked={draft} />
					<Label for="release-draft">Draft</Label>
				</div>
			</div>
			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					disabled={publishing}
					onclick={() => (publishDialogOpen = false)}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={publishing}>
					{publishing ? 'Publishing…' : 'Publish Release'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
