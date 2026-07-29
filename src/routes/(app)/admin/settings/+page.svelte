<script lang="ts">
	import { updatePhcSettings } from '$lib/remote/admin.remote';
	import { db } from '$lib/local-db/db';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription,
		CardFooter
	} from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { toast } from 'svelte-sonner';
	import { Settings, Save, Smartphone, RotateCcw, AlertOctagon, TestTube2, CloudCog, LayoutDashboard } from '@lucide/svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { settingsStore } from '$lib/state/settings.svelte';

	let { data } = $props<{ data: { settings: any } }>();

	let phcName = $state('');
	let phcState = $state('');
	let phcLga = $state('');
	let termiiApiKey = $state('');
	let syncPollInterval = $state(15);
	
	let maternalHealthEnabled = $state(true);
	let immunizationEnabled = $state(true);
	let aiVoiceEnabled = $state(true);
	let outbreakDetectionEnabled = $state(true);
	let twoWaySmsEnabled = $state(true);
	let referralsEnabled = $state(true);
	let familyHealthEnabled = $state(true);
	let realTimeNotificationsEnabled = $state(true);
	let nhisTrackingEnabled = $state(true);

	let isSaving = $state(false);
	let isResetting = $state(false);

	$effect(() => {
		if (data.settings) {
			phcName = data.settings.name || '';
			phcState = data.settings.state || '';
			phcLga = data.settings.lga || '';
			termiiApiKey = data.settings.termiiApiKey || '';
			syncPollInterval = data.settings.syncPollInterval || 15;
			
			maternalHealthEnabled = data.settings.maternalHealthEnabled ?? true;
			immunizationEnabled = data.settings.immunizationEnabled ?? true;
			aiVoiceEnabled = data.settings.aiVoiceEnabled ?? true;
			outbreakDetectionEnabled = data.settings.outbreakDetectionEnabled ?? true;
			twoWaySmsEnabled = data.settings.twoWaySmsEnabled ?? true;
			referralsEnabled = data.settings.referralsEnabled ?? true;
			familyHealthEnabled = data.settings.familyHealthEnabled ?? true;
			realTimeNotificationsEnabled = data.settings.realTimeNotificationsEnabled ?? true;
			nhisTrackingEnabled = data.settings.nhisTrackingEnabled ?? true;
		}
	});

	async function saveSettings(e: Event) {
		e.preventDefault();
		isSaving = true;
		try {
			const res = await updatePhcSettings({
				name: phcName,
				state: phcState,
				lga: phcLga,
				termiiApiKey,
				syncPollInterval: Number(syncPollInterval),
				maternalHealthEnabled,
				immunizationEnabled,
				aiVoiceEnabled,
				outbreakDetectionEnabled,
				twoWaySmsEnabled,
				referralsEnabled,
				familyHealthEnabled,
				realTimeNotificationsEnabled,
				nhisTrackingEnabled
			});
			if (res?.success) {
				toast.success('Settings saved successfully');
				
				// Update local reactive store
				settingsStore.updateLocal({
					maternalHealthEnabled,
					immunizationEnabled,
					aiVoiceEnabled,
					outbreakDetectionEnabled,
					twoWaySmsEnabled,
					referralsEnabled,
					familyHealthEnabled,
					realTimeNotificationsEnabled,
					nhisTrackingEnabled
				});
			} else {
				toast.error('Failed to save settings');
			}
		} catch (err) {
			toast.error('An error occurred');
		} finally {
			isSaving = false;
		}
	}
	
	async function testSms() {
		if (!termiiApiKey) {
			toast.error('Please enter and save an API key first');
			return;
		}
		// Simulate SMS test
		toast.info('Sending test SMS via Termii...');
		setTimeout(() => {
			toast.success('Test SMS successfully delivered (simulated)');
		}, 1500);
	}

	async function resetDemoData() {
		isResetting = true;
		try {
			await db.delete();
			toast.success('Local database cleared. Reloading app...');
			setTimeout(() => {
				window.location.href = '/login';
			}, 1000);
		} catch (e) {
			toast.error('Failed to clear local database');
			isResetting = false;
		}
	}
</script>

<svelte:head>
	<title>PHC Settings — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in max-w-4xl mx-auto">
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<Settings class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">System Settings</h1>
			<p class="text-muted-foreground text-sm mt-0.5 font-medium">
				Configure clinic-wide settings and integrations
			</p>
		</div>
	</div>

	<form onsubmit={saveSettings} class="space-y-6">
		<!-- General Settings -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Settings class="size-4" />
					Clinic Profile
				</CardTitle>
				<CardDescription>Update your Primary Health Centre details</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="name">Facility Name</Label>
					<Input id="name" bind:value={phcName} required />
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="state">State</Label>
						<Input id="state" bind:value={phcState} required />
					</div>
					<div class="space-y-2">
						<Label for="lga">LGA (Local Government Area)</Label>
						<Input id="lga" bind:value={phcLga} required />
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Integration Settings -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Smartphone class="size-4" />
					SMS Notifications (Termii)
				</CardTitle>
				<CardDescription>Configure Termii for appointment reminders and notifications</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="apiKey">Termii API Key</Label>
					<div class="flex gap-2">
						<Input id="apiKey" type="password" bind:value={termiiApiKey} placeholder="TL-XXXXXXXXXXXXXXXXXXXXXXXXX" class="flex-1" />
						<Button type="button" variant="outline" onclick={testSms}>
							<TestTube2 class="size-4 mr-2" />
							Test
						</Button>
					</div>
					<p class="text-xs text-muted-foreground mt-1">Get this from your Termii dashboard.</p>
				</div>
			</CardContent>
		</Card>

		<!-- Feature Modules -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<LayoutDashboard class="size-4" />
					Feature Modules
				</CardTitle>
				<CardDescription>Enable or disable specialized modules for this facility.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label class="text-base">Maternal Health Module</Label>
						<p class="text-sm text-muted-foreground">ANC tracking, EDD calculators, and digital partograms.</p>
					</div>
					<Switch bind:checked={maternalHealthEnabled} />
				</div>
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label class="text-base">Digital Immunizations</Label>
						<p class="text-sm text-muted-foreground">Automated NPI vaccine schedules for infants.</p>
					</div>
					<Switch bind:checked={immunizationEnabled} />
				</div>
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label class="text-base">AI Voice Transcription</Label>
						<p class="text-sm text-muted-foreground">Record chief complaints in local languages (Pidgin, Hausa, etc).</p>
					</div>
					<Switch bind:checked={aiVoiceEnabled} />
				</div>
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label class="text-base">Disease Outbreak Detection</Label>
						<p class="text-sm text-muted-foreground">Automatically detect and flag potential epidemiological outbreaks.</p>
					</div>
					<Switch bind:checked={outbreakDetectionEnabled} />
				</div>
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label class="text-base">Two-Way SMS Confirmations</Label>
						<p class="text-sm text-muted-foreground">Allow patients to reply 'CONFIRM' to SMS reminders.</p>
					</div>
					<Switch bind:checked={twoWaySmsEnabled} />
				</div>
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label class="text-base">External Referrals System</Label>
						<p class="text-sm text-muted-foreground">Generate and print standardized referral letters to secondary facilities.</p>
					</div>
					<Switch bind:checked={referralsEnabled} />
				</div>
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label class="text-base">Family Health Dashboards</Label>
						<p class="text-sm text-muted-foreground">Group patients by households for unified view of appointments and metrics.</p>
					</div>
					<Switch bind:checked={familyHealthEnabled} />
				</div>
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label class="text-base">Real-Time Staff Notifications</Label>
						<p class="text-sm text-muted-foreground">Enable cross-device alerts for queues, lab results, and prescriptions.</p>
					</div>
					<Switch bind:checked={realTimeNotificationsEnabled} />
				</div>
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label class="text-base">NHIS / HMO Tracking</Label>
						<p class="text-sm text-muted-foreground">Flag enrollees and track billable services for health insurance claims.</p>
					</div>
					<Switch bind:checked={nhisTrackingEnabled} />
				</div>
			</CardContent>
		</Card>

		<!-- Advanced Settings -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<CloudCog class="size-4" />
					Sync Configuration
				</CardTitle>
				<CardDescription>Configure offline-first data synchronization</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="pollInterval">Background Sync Interval</Label>
					<select
						id="pollInterval"
						bind:value={syncPollInterval}
						class="flex h-10 w-full md:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<option value="5">Every 5 minutes</option>
						<option value="15">Every 15 minutes</option>
						<option value="30">Every 30 minutes</option>
						<option value="60">Every 1 hour</option>
					</select>
					<p class="text-xs text-muted-foreground mt-1">Shorter intervals use more battery and bandwidth.</p>
				</div>
			</CardContent>
			<CardFooter class="bg-muted/10 border-t flex justify-end p-4">
				<Button type="submit" disabled={isSaving} class="min-w-32">
					{#if isSaving}
						<RotateCcw class="size-4 mr-2 animate-spin" />
						Saving...
					{:else}
						<Save class="size-4 mr-2" />
						Save Settings
					{/if}
				</Button>
			</CardFooter>
		</Card>
	</form>

	<!-- Danger Zone -->
	<Card class="border-destructive/30 shadow-sm">
		<CardHeader>
			<CardTitle class="text-destructive flex items-center gap-2">
				<AlertOctagon class="size-4" />
				Danger Zone
			</CardTitle>
			<CardDescription>Irreversible actions that affect your local data.</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
				<div>
					<h4 class="font-bold text-foreground">Reset Local Database</h4>
					<p class="text-sm text-muted-foreground mt-1">
						Clear all local offline data and log out. Remote data will not be deleted, but unsynced changes will be lost.
					</p>
				</div>
				<Dialog>
					<DialogTrigger class="ml-4 shrink-0 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 h-9 px-4 py-2">
						Reset Data
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle class="text-destructive">Are you absolutely sure?</DialogTitle>
							<DialogDescription>
								This action cannot be undone. This will permanently delete your local offline database and log you out.
								Any data that has not been synchronized to the cloud will be lost forever.
							</DialogDescription>
						</DialogHeader>
						<div class="flex justify-end gap-3 mt-4">
							<DialogTrigger class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
								Cancel
							</DialogTrigger>
							<Button variant="destructive" disabled={isResetting} onclick={resetDemoData}>
								Yes, reset everything
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</CardContent>
	</Card>
</div>
