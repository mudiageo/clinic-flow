<script lang="ts">
	import { onMount } from 'svelte';
	import {
		archiveAnnouncement,
		getAnnouncementReach,
		publishAnnouncement,
		watchPlatformAnnouncements
	} from '#lib/remote/announcements.remote.ts';
	import { getPhcList } from '#lib/remote/superadmin.remote.ts';
	import type {
		AnnouncementAudience,
		AnnouncementSeverity,
		PlatformAnnouncementView
	} from '#lib/types/announcements.ts';
	import { formatDateTime } from '#lib/utils/date.ts';
	import { Alert, AlertDescription, AlertTitle } from '#lib/components/ui/alert/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import * as Select from '#lib/components/ui/select/index.ts';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import {
		AlertTriangle,
		Archive,
		CalendarClock,
		CheckCheck,
		Megaphone,
		RefreshCw,
		Send,
		ShieldAlert,
		Users
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	const historyQuery = watchPlatformAnnouncements();
	const phcsQuery = getPhcList();
	const announcements = $derived(historyQuery.current ?? []);
	const phcs = $derived(phcsQuery.current ?? []);

	let title = $state('');
	let body = $state('');
	let severity = $state<AnnouncementSeverity>('info');
	let audience = $state<AnnouncementAudience>('all');
	let targetPhcId = $state<string | null>(null);
	let requiresAcknowledgement = $state(false);
	let actionLabel = $state('');
	let actionUrl = $state('');
	let scheduledFor = $state('');
	let expiresAt = $state('');
	let reach = $state<number | null>(null);
	let reachLoading = $state(false);
	let publishDialogOpen = $state(false);
	let publishing = $state(false);
	let archivingId = $state<string | null>(null);

	const targetLabel = $derived.by(() => {
		if (audience === 'all') return 'All active staff';
		if (audience === 'admins') return 'Clinic Admins and Officers in Charge';
		return phcs.find((phc) => phc.id === targetPhcId)?.name ?? 'Select a PHC';
	});

	onMount(() => {
		void updateReach();
	});

	async function updateReach(
		nextAudience: AnnouncementAudience = audience,
		nextPhcId: string | null = targetPhcId
	): Promise<void> {
		if (nextAudience === 'phc' && !nextPhcId) {
			reach = null;
			return;
		}

		reachLoading = true;
		try {
			reach = await getAnnouncementReach({
				audience: nextAudience,
				targetPhcId: nextAudience === 'phc' ? nextPhcId : null
			});
		} catch {
			reach = null;
		} finally {
			reachLoading = false;
		}
	}

	function changeAudience(value: string | undefined): void {
		if (value !== 'all' && value !== 'admins' && value !== 'phc') return;
		audience = value;
		if (audience !== 'phc') targetPhcId = null;
		void updateReach(audience, targetPhcId);
	}

	function changeTargetPhc(value: string | undefined): void {
		targetPhcId = value || null;
		void updateReach('phc', targetPhcId);
	}

	function changeSeverity(value: string | undefined): void {
		if (value !== 'info' && value !== 'warning' && value !== 'critical') return;
		severity = value;
		if (severity === 'critical') requiresAcknowledgement = true;
	}

	function validateComposer(): boolean {
		if (title.trim().length < 3 || body.trim().length < 3) {
			toast.error('Enter a subject and message before publishing.');
			return false;
		}
		if (audience === 'phc' && !targetPhcId) {
			toast.error('Select the PHC that should receive this announcement.');
			return false;
		}
		if (reach === null || reach === 0) {
			toast.error('The selected audience has no active recipients.');
			return false;
		}
		if (scheduledFor && expiresAt && new Date(expiresAt) <= new Date(scheduledFor)) {
			toast.error('Expiry must be after the scheduled publication time.');
			return false;
		}
		return true;
	}

	function preparePublish(): void {
		if (validateComposer()) publishDialogOpen = true;
	}

	async function publish(): Promise<void> {
		if (!validateComposer() || publishing) return;
		publishing = true;
		try {
			const result = await publishAnnouncement({
				title,
				body,
				severity,
				audience,
				targetPhcId: audience === 'phc' ? targetPhcId : null,
				requiresAcknowledgement,
				actionLabel: actionLabel || null,
				actionUrl: actionUrl || null,
				scheduledFor: scheduledFor ? new Date(scheduledFor).getTime() : null,
				expiresAt: expiresAt ? new Date(expiresAt).getTime() : null
			});

			toast.success(
				result.status === 'scheduled'
					? `Announcement scheduled for ${result.estimatedRecipients} recipients.`
					: `Announcement published to ${result.estimatedRecipients} recipients.`
			);
			publishDialogOpen = false;
			resetComposer();
			await historyQuery.reconnect();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Unable to publish announcement.');
		} finally {
			publishing = false;
		}
	}

	function resetComposer(): void {
		title = '';
		body = '';
		severity = 'info';
		audience = 'all';
		targetPhcId = null;
		requiresAcknowledgement = false;
		actionLabel = '';
		actionUrl = '';
		scheduledFor = '';
		expiresAt = '';
		void updateReach('all', null);
	}

	async function archive(item: PlatformAnnouncementView): Promise<void> {
		if (archivingId) return;
		archivingId = item.id;
		try {
			await archiveAnnouncement(item.id);
			toast.success('Announcement archived.');
			await historyQuery.reconnect();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Unable to archive announcement.');
		} finally {
			archivingId = null;
		}
	}

	function statusLabel(item: PlatformAnnouncementView): string {
		if (item.status === 'scheduled' && item.scheduledFor && item.scheduledFor <= Date.now()) {
			return 'Published';
		}
		return item.status.charAt(0).toUpperCase() + item.status.slice(1);
	}

	function audienceLabel(item: PlatformAnnouncementView): string {
		if (item.audience === 'all') return 'All staff';
		if (item.audience === 'admins') return 'Clinic admins';
		return item.targetPhcName ?? 'Specific PHC';
	}
</script>

<svelte:head>
	<title>Announcements — Superadmin</title>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-6 animate-fade-in">
	<div
		class="pb-2 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Superadmin // Communications
			</p>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Platform Announcements</h1>
			<p class="mt-0.5 text-sm text-muted-foreground">
				Publish durable, realtime notices to staff across ClinicFlow.
			</p>
		</div>
		<Button
			variant="outline"
			size="sm"
			disabled={historyQuery.loading}
			onclick={() => historyQuery.reconnect()}
		>
			<RefreshCw class={historyQuery.loading ? 'mr-2 size-4 animate-spin' : 'mr-2 size-4'} />
			Refresh history
		</Button>
	</div>

	<Alert class="rounded-xl border-triage-amber/30 bg-triage-amber/5">
		<ShieldAlert class="size-4 text-amber-700 dark:text-triage-amber" />
		<AlertTitle>Do not include patient-identifiable information</AlertTitle>
		<AlertDescription>
			Announcements are platform communications visible to multiple staff. Use clinical
			workflows—not announcements—for patient-specific information.
		</AlertDescription>
	</Alert>

	<div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
		<Card>
			<CardHeader>
				<CardTitle>Compose announcement</CardTitle>
				<CardDescription>
					Delivery is in-app and cached for offline access. Email and SMS are not enabled.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-5">
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="audience">Audience</Label>
						<Select.Root type="single" value={audience} onValueChange={changeAudience}>
							<Select.Trigger id="audience" class="w-full">
								{targetLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all">All active staff</Select.Item>
								<Select.Item value="admins">Clinic Admins and OICs</Select.Item>
								<Select.Item value="phc">Specific PHC</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<Label for="severity">Severity</Label>
						<Select.Root type="single" value={severity} onValueChange={changeSeverity}>
							<Select.Trigger id="severity" class="w-full capitalize">
								{severity}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="info">Information</Select.Item>
								<Select.Item value="warning">Warning</Select.Item>
								<Select.Item value="critical">Critical</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				{#if audience === 'phc'}
					<div class="space-y-2">
						<Label for="target-phc">Target PHC</Label>
						<Select.Root
							type="single"
							value={targetPhcId ?? undefined}
							onValueChange={changeTargetPhc}
						>
							<Select.Trigger id="target-phc" class="w-full">
								{targetLabel}
							</Select.Trigger>
							<Select.Content>
								{#each phcs as phc (phc.id)}
									<Select.Item value={phc.id}>{phc.name} — {phc.lga}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="subject">Subject</Label>
					<Input
						id="subject"
						maxlength={160}
						bind:value={title}
						placeholder="Scheduled maintenance notice"
					/>
					<p class="text-right text-xs text-muted-foreground">{title.length}/160</p>
				</div>

				<div class="space-y-2">
					<Label for="message">Message</Label>
					<Textarea
						id="message"
						maxlength={5000}
						bind:value={body}
						placeholder="Write a concise message for staff…"
						class="min-h-40"
					/>
					<p class="text-right text-xs text-muted-foreground">{body.length}/5000</p>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="scheduled-for">Publish time (optional)</Label>
						<Input id="scheduled-for" type="datetime-local" bind:value={scheduledFor} />
					</div>
					<div class="space-y-2">
						<Label for="expires-at">Expiry (optional)</Label>
						<Input id="expires-at" type="datetime-local" bind:value={expiresAt} />
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="action-label">Action label (optional)</Label>
						<Input
							id="action-label"
							maxlength={80}
							bind:value={actionLabel}
							placeholder="View details"
						/>
					</div>
					<div class="space-y-2">
						<Label for="action-url">Action URL (optional)</Label>
						<Input id="action-url" bind:value={actionUrl} placeholder="/support or https://…" />
					</div>
				</div>

				<div class="flex items-center justify-between rounded-lg border p-4">
					<div class="space-y-0.5">
						<Label for="requires-acknowledgement">Require acknowledgement</Label>
						<p class="text-sm text-muted-foreground">
							Critical announcements always require acknowledgement.
						</p>
					</div>
					<Switch
						id="requires-acknowledgement"
						bind:checked={requiresAcknowledgement}
						disabled={severity === 'critical'}
					/>
				</div>
			</CardContent>
			<CardFooter class="flex justify-end border-t bg-muted/20 py-4">
				<Button disabled={reachLoading || reach === 0} onclick={preparePublish}>
					{#if scheduledFor}
						<CalendarClock class="mr-2 size-4" /> Schedule announcement
					{:else}
						<Send class="mr-2 size-4" /> Publish now
					{/if}
				</Button>
			</CardFooter>
		</Card>

		<div class="space-y-6">
			<div class="rounded-xl border border-border bg-card p-5 space-y-2">
				<div
					class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground"
				>
					<Users class="size-3.5" /> Reach Estimate
				</div>
				<div class="text-3xl font-bold font-mono tabular-nums tracking-tight text-foreground">
					{reachLoading ? '…' : (reach ?? '—')}
				</div>
				<p class="text-xs text-muted-foreground">Active staff matching this audience.</p>
			</div>

			<div class="rounded-xl border border-border bg-card overflow-hidden">
				<div class="px-5 py-3.5 border-b border-border bg-muted/20">
					<h2
						class="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold"
					>
						Delivery Behavior
					</h2>
				</div>
				<div class="p-5 space-y-2.5 text-sm text-muted-foreground">
					<p>Connected staff receive a realtime in-app notification.</p>
					<p>Offline devices receive the message after reconnecting.</p>
					<p>Critical messages remain as a banner until acknowledged.</p>
				</div>
			</div>
		</div>
	</div>

	<Card>
		<CardHeader class="flex flex-row items-start justify-between gap-4">
			<div>
				<CardTitle>Publication history</CardTitle>
				<CardDescription>Real delivery, read, and acknowledgement records.</CardDescription>
			</div>
			<Badge variant="outline">{announcements.length} records</Badge>
		</CardHeader>
		<CardContent>
			{#if historyQuery.error}
				<div
					class="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive"
				>
					Unable to load announcement history.
				</div>
			{:else if historyQuery.loading && announcements.length === 0}
				<div class="py-12 text-center text-sm text-muted-foreground">Loading announcements…</div>
			{:else if announcements.length === 0}
				<div class="py-12 text-center">
					<Megaphone class="mx-auto mb-3 size-10 text-muted-foreground/40" />
					<p class="font-medium">No announcements published yet</p>
					<p class="mt-1 text-sm text-muted-foreground">Your first publication will appear here.</p>
				</div>
			{:else}
				<div class="divide-y">
					{#each announcements as item (item.id)}
						<article
							class="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 md:flex-row md:justify-between"
						>
							<div class="min-w-0 flex-1 space-y-2">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="font-semibold">{item.title}</h3>
									<Badge
										variant={item.severity === 'critical'
											? 'destructive'
											: item.severity === 'warning'
												? 'secondary'
												: 'outline'}
										class="capitalize"
									>
										{item.severity}
									</Badge>
									<Badge variant="outline">{statusLabel(item)}</Badge>
								</div>
								<p class="line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
									{item.body}
								</p>
								<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
									<span>{audienceLabel(item)}</span>
									<span>
										{item.scheduledFor
											? `Scheduled ${formatDateTime(item.scheduledFor)}`
											: `Published ${formatDateTime(item.publishedAt ?? item.createdAt)}`}
									</span>
									<span>By {item.createdByName ?? 'System'}</span>
								</div>
							</div>

							<div class="flex shrink-0 items-center gap-4 md:justify-end">
								<div class="text-right text-xs text-muted-foreground">
									<p>
										<strong class="text-foreground">{item.readCount}</strong> / {item.estimatedRecipients}
										read
									</p>
									{#if item.requiresAcknowledgement}
										<p class="mt-1 flex items-center justify-end gap-1">
											<CheckCheck class="size-3.5" />
											{item.acknowledgedCount} acknowledged
										</p>
									{/if}
								</div>
								{#if item.status !== 'archived'}
									<Button
										variant="ghost"
										size="sm"
										disabled={archivingId === item.id}
										onclick={() => archive(item)}
									>
										<Archive class="mr-1 size-4" /> Archive
									</Button>
								{/if}
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

<Dialog.Root bind:open={publishDialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Confirm {scheduledFor ? 'scheduled publication' : 'publication'}</Dialog.Title>
			<Dialog.Description>
				This announcement will be delivered to {reach ?? 0} active recipients in {targetLabel}.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-3 rounded-lg border bg-muted/30 p-4">
			<div class="flex items-center gap-2">
				{#if severity === 'critical'}
					<AlertTriangle class="size-4 text-destructive" />
				{/if}
				<p class="font-semibold">{title}</p>
			</div>
			<p class="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground">
				{body}
			</p>
			{#if requiresAcknowledgement}
				<Badge variant="outline">Acknowledgement required</Badge>
			{/if}
		</div>
		<Dialog.Footer>
			<Button variant="outline" disabled={publishing} onclick={() => (publishDialogOpen = false)}>
				Cancel
			</Button>
			<Button disabled={publishing} onclick={publish}>
				{publishing ? 'Publishing…' : scheduledFor ? 'Confirm schedule' : 'Confirm publication'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
