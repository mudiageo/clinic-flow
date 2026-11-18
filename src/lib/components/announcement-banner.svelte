<script lang="ts">
	import { Alert, AlertDescription, AlertTitle } from '#lib/components/ui/alert/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { announcementStore } from '#lib/state/announcements.svelte.ts';
	import { AlertTriangle, ExternalLink, WifiOff } from '@lucide/svelte';

	let acknowledging = $state(false);
	const announcement = $derived(announcementStore.criticalAnnouncements[0] ?? null);
	const remaining = $derived(Math.max(0, announcementStore.criticalAnnouncements.length - 1));
	const stale = $derived(
		announcementStore.connectionState === 'offline' ||
			announcementStore.connectionState === 'stale' ||
			announcementStore.connectionState === 'error'
	);

	async function acknowledge(): Promise<void> {
		if (!announcement || acknowledging) return;
		acknowledging = true;
		try {
			await announcementStore.acknowledge(announcement.announcementId);
		} finally {
			acknowledging = false;
		}
	}
</script>

{#if announcement}
	<div class="shrink-0 border-b border-destructive/30 bg-destructive/5 px-4 py-3 md:px-6">
		<Alert variant="destructive" class="mx-auto max-w-6xl bg-background">
			<AlertTriangle class="size-4" />
			<AlertTitle class="flex flex-wrap items-center gap-2 pr-2">
				{announcement.title}
				<Badge variant="destructive">Critical announcement</Badge>
				{#if remaining > 0}
					<Badge variant="outline">+{remaining} more</Badge>
				{/if}
				{#if stale}
					<Badge variant="outline" class="gap-1">
						<WifiOff class="size-3" /> Cached
					</Badge>
				{/if}
			</AlertTitle>
			<AlertDescription
				class="mt-2 flex flex-col gap-3 text-foreground sm:flex-row sm:items-end sm:justify-between"
			>
				<p class="max-w-3xl whitespace-pre-wrap">{announcement.body}</p>
				<div class="flex shrink-0 gap-2">
					{#if announcement.actionUrl}
						<Button
							variant="outline"
							size="sm"
							onclick={() => announcementStore.open(announcement)}
						>
							{announcement.actionLabel || 'View details'}
							<ExternalLink class="ml-1 size-3.5" />
						</Button>
					{/if}
					<Button size="sm" variant="destructive" disabled={acknowledging} onclick={acknowledge}>
						{acknowledging ? 'Saving…' : 'Acknowledge'}
					</Button>
				</div>
			</AlertDescription>
		</Alert>
	</div>
{/if}
