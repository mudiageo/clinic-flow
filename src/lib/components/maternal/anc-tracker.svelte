<script lang="ts">
	import { pregnancyStore } from '$lib/state/pregnancy.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Baby, CalendarPlus, Activity, Plus } from '@lucide/svelte';
	import PartogramDialog from './partogram-dialog.svelte';
	import DeliveryDialog from './delivery-dialog.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { patientId }: { patientId: string } = $props();

	let activePregnancy = $derived(pregnancyStore.getActiveRecordForPatient(patientId));
	let patient = $derived(patientStore.findById(patientId));

	let showNewPregnancyForm = $state(false);
	let lmpDateStr = $state('');
	let eddDateStr = $state('');
	let gravida = $state<number>(1);
	let parity = $state<number>(0);
	
	let partogramOpen = $state(false);
	let deliveryOpen = $state(false);

	// Calculate EDD based on LMP (Naegele's rule)
	function calculateEDD() {
		if (lmpDateStr) {
			const lmp = new Date(lmpDateStr);
			const edd = new Date(lmp);
			edd.setDate(edd.getDate() + 280); // 40 weeks
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
			await patientStore.update(patientId, { isPregnant: true, updatedAt: Date.now() });
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
				<Badge variant="outline" class="border-triage-amber text-triage-amber bg-triage-amber/10">Active Pregnancy</Badge>
			{/if}
		</div>
	</CardHeader>
	<CardContent class="pt-6">
		{#if activePregnancy}
			<div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
				<div>
					<span class="text-muted-foreground text-sm block mb-1">Last Menstrual Period (LMP)</span>
					<div class="font-medium">{activePregnancy.lmpDate ? new Date(activePregnancy.lmpDate).toLocaleDateString() : 'Unknown'}</div>
				</div>
				<div>
					<span class="text-muted-foreground text-sm block mb-1">Estimated Delivery (EDD)</span>
					<div class="font-medium text-triage-amber">{activePregnancy.eddDate ? new Date(activePregnancy.eddDate).toLocaleDateString() : 'Unknown'}</div>
				</div>
				<div>
					<span class="text-muted-foreground text-sm block mb-1">Gestational Age</span>
					<div class="font-bold">{activePregnancy.lmpDate ? calculateGestationalAge(activePregnancy.lmpDate) : 'Unknown'}</div>
				</div>
				<div>
					<span class="text-muted-foreground text-sm block mb-1">Gravida / Parity</span>
					<div class="font-medium">G{activePregnancy.gravida || 1} P{activePregnancy.parity || 0}</div>
				</div>
			</div>
			
			<div class="flex gap-3 pt-4 border-t border-border">
				<Button variant="outline" class="w-full">
					<Activity class="size-4 mr-2" />
					Log ANC Visit
				</Button>
				<Button variant="outline" class="w-full" onclick={() => partogramOpen = true}>
					<Activity class="size-4 mr-2" />
					Start Partogram (Labor)
				</Button>
				<Button variant="default" class="w-full" onclick={handleDeliver}>
					Mark as Delivered
				</Button>
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
						<Button variant="ghost" onclick={() => showNewPregnancyForm = false}>Cancel</Button>
						<Button onclick={handleSavePregnancy} disabled={!lmpDateStr || !eddDateStr}>Start ANC Tracking</Button>
					</div>
				</div>
			{:else}
				<div class="text-center py-6">
					<div class="inline-flex size-12 rounded-full bg-muted items-center justify-center mb-4">
						<Baby class="size-6 text-muted-foreground" />
					</div>
					<h3 class="font-semibold text-lg mb-1">No Active Pregnancy</h3>
					<p class="text-muted-foreground text-sm mb-4">Log a new pregnancy to start tracking ANC visits and EDD.</p>
					<Button onclick={() => showNewPregnancyForm = true}>
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
{/if}
