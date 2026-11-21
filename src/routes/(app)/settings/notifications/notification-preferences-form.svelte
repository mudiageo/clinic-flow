<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.ts';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { BellRing, Mail, RefreshCw, Save, TriangleAlert } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { settingsStore } from '#lib/state/settings.svelte.ts';

	type Preferences = {
		emailAlerts: boolean;
		smsAlerts: boolean;
		inAppUrgent: boolean;
		inAppRoutine: boolean;
		syncUpdates: boolean;
	};

	let {
		preferences,
		onSave
	}: {
		preferences: unknown;
		onSave: (prefs: Preferences) => Promise<void>;
	} = $props();

	const defaults: Preferences = {
		emailAlerts: true,
		smsAlerts: false,
		inAppUrgent: true,
		inAppRoutine: true,
		syncUpdates: false
	};

	// This form only mounts after preferences have loaded, so local editable state
	// can be seeded directly from the prop without an effect that reassigns state.
	let prefs = $state<Preferences>({
		...defaults,
		...(untrack(() => preferences) as Partial<Preferences>)
	});
	let isSaving = $state(false);
	let twoWaySmsEnabled = $derived(settingsStore.current.twoWaySmsEnabled);

	async function savePreferences() {
		isSaving = true;
		await onSave({ ...prefs });
		isSaving = false;
	}
</script>

<Card class="border-none shadow-md overflow-hidden">
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Mail class="size-5 text-muted-foreground" />
			Email & SMS Alerts
		</CardTitle>
		<CardDescription>Receive important updates outside of the app.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-6">
		<div class="flex items-center justify-between">
			<div class="space-y-0.5">
				<Label class="text-base">Email Notifications</Label>
				<p class="text-sm text-muted-foreground">
					Receive daily summaries and critical alerts via email.
				</p>
			</div>
			<Switch bind:checked={prefs.emailAlerts} />
		</div>

		<div class="flex items-center justify-between">
			<div class="space-y-0.5">
				<Label class="text-base">SMS Notifications</Label>
				<p class="text-sm text-muted-foreground">
					Save this preference to receive text messages for urgent triage assignments.
				</p>
				{#if !twoWaySmsEnabled}
					<p class="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-1">
						<TriangleAlert class="size-4 shrink-0" />
						Two-way SMS is not enabled for your PHC, so messages will not be delivered yet.
					</p>
				{/if}
			</div>
			<Switch bind:checked={prefs.smsAlerts} disabled={!twoWaySmsEnabled} />
		</div>
	</CardContent>
</Card>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<BellRing class="size-5 text-muted-foreground" />
			In-App Alerts
		</CardTitle>
		<CardDescription>Control what you see in the sidebar notification bell.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-6">
		<div class="flex items-center justify-between">
			<div class="space-y-0.5">
				<Label class="text-base">Urgent Alerts</Label>
				<p class="text-sm text-muted-foreground">
					Critical triage patients, stockouts, or lab results.
				</p>
			</div>
			<Switch bind:checked={prefs.inAppUrgent} />
		</div>

		<div class="flex items-center justify-between">
			<div class="space-y-0.5">
				<Label class="text-base">Routine Updates</Label>
				<p class="text-sm text-muted-foreground">
					New appointments, patient check-ins, staff messages.
				</p>
			</div>
			<Switch bind:checked={prefs.inAppRoutine} />
		</div>

		<div class="flex items-center justify-between">
			<div class="space-y-0.5">
				<Label class="text-base flex items-center gap-2">
					<RefreshCw class="size-4 text-muted-foreground" />
					Sync Status Events
				</Label>
				<p class="text-sm text-muted-foreground">
					Notify me when background sync completes successfully.
				</p>
			</div>
			<Switch bind:checked={prefs.syncUpdates} />
		</div>
	</CardContent>
</Card>

<div class="flex justify-end pt-4">
	<Button onclick={savePreferences} disabled={isSaving} class="h-11 px-8">
		{#if isSaving}
			<div
				class="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"
			></div>
			Saving...
		{:else}
			<Save class="size-4 mr-2" />
			Save Preferences
		{/if}
	</Button>
</div>
