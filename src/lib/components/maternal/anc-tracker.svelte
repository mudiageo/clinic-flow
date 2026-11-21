<script lang="ts">
	import { pregnancyStore } from '#lib/state/pregnancy.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import { settingsStore } from '#lib/state/settings.svelte.ts';
	import { ancVisitsStore } from '#lib/state/anc-visits.svelte.ts';
	import { formatDate } from '#lib/utils/date.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '#lib/components/ui/card/index.ts';
	import { Baby, CalendarPlus, Activity, Plus } from '@lucide/svelte';
	import PartogramDialog from './partogram-dialog.svelte';
	import DeliveryDialog from './delivery-dialog.svelte';
	import AncVisitDialog from './anc-visit-dialog.svelte';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';

	let { patientId }: { patientId: string } = $props();

	let activePregnancy = $derived(pregnancyStore.getActiveRecordForPatient(patientId));
	let patient = $derived(patientStore.get(patientId));

	let showNewPregnancyForm = $state(false);
	let lmpDateStr = $state('');
	let eddDateStr = $state('');
	let gravida = $state<number>(1);
	let parity = $state<number>(0);

	let partogramOpen = $state(false);
	let deliveryOpen = $state(false);
	let ancVisitOpen = $state(false);

	// ANC visit logging is available only when the feature and permission are both enabled.
	let canLogAncVisit = $derived(
		sessionStore.can('manage:anc') && settingsStore.current.maternalHealthEnabled
	);
	let ancVisitBlockedReason = $derived(
		!sessionStore.can('manage:anc')
			? 'You do not have permission to manage ANC visits.'
			: 'Maternal health is disabled for this PHC.'
	);

	// Reactive read of the local ANC visit store; no direct database access in the component.
	let recentAncVisits = $derived(
		activePregnancy ? ancVisitsStore.forPregnancy(activePregnancy.id) : []
	);

	// Calculate EDD based on LMP (Naegele's rule)
	function calculateEDD() {
		if (lmpDateStr) {
			const lmp = new Date(lmpDateStr);
			const edd = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000); // 40 weeks
			eddDateStr = edd.toISOString().split('T')[0];
		}
	}

	function calculateGestationalAge(lmp: number) {
		const now = Date.now();
		const diffMs = now - lmp;
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		const weeks = Math.floor(diffDays / 7);
		const days = diffDays % 7;
		return `${weeks} weeks, ${days} days`;
	}

	async function handleSavePregnancy() {
		if (!lmpDateStr || !eddDateStr) return;

		const lmp = new Date(lmpDateStr).getTime();
		const edd = new Date(eddDateStr).getTime();

		await pregnancyStore.createRecord(patientId, lmp, edd, gravida, parity);

		// Ensure patient is marked as pregnant for triage rules
		if (!patient?.isPregnant) {
			await patientStore.update(patientId, { isPregnant: true });
		}

		showNewPregnancyForm = false;
	}

	function handleDeliver() {
		deliveryOpen = true;
	}
</script>

<Card class="mt-6 border-triage-amber/20 overflow-hidden">
	<CardHeader class="bg-triage-amber/5 pb-4">
		<div class="flex items-center justify-between">
			<CardTitle class="text-lg flex items-center gap-2 text-triage-amber">
				<Baby class="size-5" />
				Maternal Health & ANC
			</CardTitle>
			{#if activePregnancy}
				<Badge variant="outline" class="border-triage-amber text-triage-amber bg-triage-amber/10"
					>Active Pregnancy</Badge
				>
			{/if}
		</div>
	</CardHeader>
	<CardContent class="pt-6">
		{#if activePregnancy}
			<div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
				<div>
					<span class="text-muted-foreground text-sm block mb-1">Last Menstrual Period (LMP)</span>
					<div class="font-medium">
						{activePregnancy.lmpDate
							? new Date(activePregnancy.lmpDate).toLocaleDateString()
							: 'Unknown'}
					</div>
				</div>
				<div>
					<span class="text-muted-foreground text-sm block mb-1">Estimated Delivery (EDD)</span>
					<div class="font-medium text-triage-amber">
						{activePregnancy.eddDate
							? new Date(activePregnancy.eddDate).toLocaleDateString()
							: 'Unknown'}
					</div>
				</div>
				<div>
					<span class="text-muted-foreground text-sm block mb-1">Gestational Age</span>
					<div class="font-bold">
						{activePregnancy.lmpDate ? calculateGestationalAge(activePregnancy.lmpDate) : 'Unknown'}
					</div>
				</div>
				<div>
					<span class="text-muted-foreground text-sm block mb-1">Gravida / Parity</span>
					<div class="font-medium">
						G{activePregnancy.gravida || 1} P{activePregnancy.parity || 0}
					</div>
				</div>
			</div>

			<div class="flex gap-3 pt-4 border-t border-border">
				<Button
					variant="outline"
					class="w-full"
					onclick={() => (ancVisitOpen = true)}
					disabled={!canLogAncVisit}
					title={canLogAncVisit ? 'Log an antenatal visit' : ancVisitBlockedReason}
				>
					<Activity class="size-4 mr-2" />
					Log ANC Visit
				</Button>
				<Button variant="outline" class="w-full" onclick={() => (partogramOpen = true)}>
					<Activity class="size-4 mr-2" />
					Start Partogram (Labor)
				</Button>
				<Button variant="default" class="w-full" onclick={handleDeliver}>Mark as Delivered</Button>
			</div>

			<div class="mt-6 pt-4 border-t border-border">
				<h4 class="text-sm font-semibold mb-3">Recent ANC visits</h4>
				{#if recentAncVisits.length === 0}
					<p class="text-sm text-muted-foreground">No ANC visits recorded yet.</p>
				{:else}
					<ul class="space-y-2">
						{#each recentAncVisits as visit (visit.id)}
							<li class="rounded-md border border-border bg-muted/20 p-3 text-sm">
								<div class="flex flex-wrap items-center justify-between gap-2">
									<span class="font-medium">
										{formatDate(visit.visitDate)}{visit.visitNumber
											? ` · Visit ${visit.visitNumber}`
											: ''}
									</span>
									<span class="text-xs text-muted-foreground">
										{visit.syncStatus === 'pending'
											? 'Pending sync'
											: visit.syncStatus === 'conflict'
												? 'Sync conflict'
												: 'Synced'}
									</span>
								</div>
								<div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
									{#if visit.systolicBp != null && visit.diastolicBp != null}
										<span>BP {visit.systolicBp}/{visit.diastolicBp} mmHg</span>
									{/if}
									{#if visit.fetalHeartRateBpm != null}
										<span>FHR {visit.fetalHeartRateBpm} bpm</span>
									{/if}
									{#if visit.weightKg != null}
										<span>Weight {visit.weightKg} kg</span>
									{/if}
									{#if visit.fundalHeightCm != null}
										<span>Fundal height {visit.fundalHeightCm} cm</span>
									{/if}
								</div>
								{#if visit.notes}
									<p class="mt-1 text-xs text-muted-foreground">{visit.notes}</p>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{:else}
			{#if showNewPregnancyForm}
				<div class="space-y-4 max-w-md mx-auto">
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label>LMP Date</Label>
							<Input type="date" bind:value={lmpDateStr} onchange={calculateEDD} />
						</div>
						<div class="space-y-2">
							<Label>EDD Date (Auto-calc)</Label>
							<Input type="date" bind:value={eddDateStr} />
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label>Gravida (Total Pregnancies)</Label>
							<Input type="number" bind:value={gravida} min="1" />
						</div>
						<div class="space-y-2">
							<Label>Parity (Previous Births)</Label>
							<Input type="number" bind:value={parity} min="0" />
						</div>
					</div>
					<div class="flex gap-3 justify-end pt-4">
						<Button variant="ghost" onclick={() => (showNewPregnancyForm = false)}>Cancel</Button>
						<Button onclick={handleSavePregnancy} disabled={!lmpDateStr || !eddDateStr}
							>Start ANC Tracking</Button
						>
					</div>
				</div>
			{:else}
				<div class="text-center py-6">
					<div class="inline-flex size-12 rounded-full bg-muted items-center justify-center mb-4">
						<Baby class="size-6 text-muted-foreground" />
					</div>
					<h3 class="font-semibold text-lg mb-1">No Active Pregnancy</h3>
					<p class="text-muted-foreground text-sm mb-4">
						Log a new pregnancy to start tracking ANC visits and EDD.
					</p>
					<Button onclick={() => (showNewPregnancyForm = true)}>
						<CalendarPlus class="size-4 mr-2" />
						Log New Pregnancy
					</Button>
				</div>
			{/if}
		{/if}
	</CardContent>
</Card>

<PartogramDialog bind:open={partogramOpen} {patientId} />
{#if activePregnancy}
	<DeliveryDialog bind:open={deliveryOpen} {patientId} pregnancyRecordId={activePregnancy.id} />
	<AncVisitDialog
		bind:open={ancVisitOpen}
		{patientId}
		pregnancyRecordId={activePregnancy.id}
		onComplete={() => (ancVisitOpen = false)}
	/>
{/if}
