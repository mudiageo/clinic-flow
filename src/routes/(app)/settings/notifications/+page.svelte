<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { BellRing, Mail, Smartphone, RefreshCw, Save } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let isSaving = $state(false);

	let prefs = $state({
		emailAlerts: true,
		smsAlerts: false,
		inAppUrgent: true,
		inAppRoutine: true,
		syncUpdates: false
	});

	async function savePreferences() {
		isSaving = true;
		// Simulated remote call
		await new Promise(r => setTimeout(r, 600));
		toast.success('Notification preferences updated');
		isSaving = false;
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Notifications</h2>
		<p class="text-muted-foreground mt-1">Control how and when you are notified.</p>
	</div>

	<Card>
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
					<p class="text-sm text-muted-foreground">Receive daily summaries and critical alerts via email.</p>
				</div>
				<Switch bind:checked={prefs.emailAlerts} />
			</div>
			
			<div class="flex items-center justify-between">
				<div class="space-y-0.5">
					<Label class="text-base text-muted-foreground">SMS Notifications (Coming Soon)</Label>
					<p class="text-sm text-muted-foreground">Get text messages for urgent triage assignments.</p>
				</div>
				<Switch disabled checked={prefs.smsAlerts} />
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
					<p class="text-sm text-muted-foreground">Critical triage patients, stockouts, or lab results.</p>
				</div>
				<Switch bind:checked={prefs.inAppUrgent} />
			</div>
			
			<div class="flex items-center justify-between">
				<div class="space-y-0.5">
					<Label class="text-base">Routine Updates</Label>
					<p class="text-sm text-muted-foreground">New appointments, patient check-ins, staff messages.</p>
				</div>
				<Switch bind:checked={prefs.inAppRoutine} />
			</div>

			<div class="flex items-center justify-between">
				<div class="space-y-0.5">
					<Label class="text-base flex items-center gap-2">
						<RefreshCw class="size-4 text-muted-foreground" />
						Sync Status Events
					</Label>
					<p class="text-sm text-muted-foreground">Notify me when background sync completes successfully.</p>
				</div>
				<Switch bind:checked={prefs.syncUpdates} />
			</div>
		</CardContent>
	</Card>

	<div class="flex justify-end pt-4">
		<Button onclick={savePreferences} disabled={isSaving} class="h-11 px-8">
			{#if isSaving}
				<div class="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
				Saving...
			{:else}
				<Save class="size-4 mr-2" />
				Save Preferences
			{/if}
		</Button>
	</div>
</div>
