<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Activity, Plus, Check } from '@lucide/svelte';

	let { open = $bindable(false), patientId } = $props();

	type PartogramEntry = {
		time: number;
		cervicalDilation: number; // 0-10 cm
		fetalHeartRate: number; // bpm
		contractions: number; // per 10 mins
	};

	// Local state for the prototype
	let entries = $state<PartogramEntry[]>([]);
	
	let newDilation = $state<number | ''>('');
	let newFhr = $state<number | ''>('');
	let newContractions = $state<number | ''>('');

	function handleAddEntry() {
		if (newDilation !== '' && newFhr !== '' && newContractions !== '') {
			entries = [...entries, {
				time: Date.now(),
				cervicalDilation: Number(newDilation),
				fetalHeartRate: Number(newFhr),
				contractions: Number(newContractions)
			}];
			newDilation = '';
			newFhr = '';
			newContractions = '';
		}
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-2xl max-h-[85vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2 text-triage-amber">
				<Activity class="size-5" />
				Active Labor Partogram
			</DialogTitle>
			<DialogDescription>
				Track cervical dilation, fetal heart rate, and contractions during active labor.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-6 py-4">
			<!-- Chart/Table Area -->
			<div class="border rounded-lg overflow-hidden">
				<table class="w-full text-sm text-left">
					<thead class="bg-muted text-muted-foreground">
						<tr>
							<th class="px-4 py-3 font-medium">Time</th>
							<th class="px-4 py-3 font-medium">Cervical Dilation (cm)</th>
							<th class="px-4 py-3 font-medium">Fetal Heart Rate (bpm)</th>
							<th class="px-4 py-3 font-medium">Contractions (/10 mins)</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#if entries.length === 0}
							<tr>
								<td colspan="4" class="px-4 py-8 text-center text-muted-foreground">
									No entries yet. Labor has not started or not logged.
								</td>
							</tr>
						{:else}
							{#each entries as entry}
								<tr class="bg-background">
									<td class="px-4 py-3 font-medium">{new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											<div class="w-full bg-muted rounded-full h-2 max-w-[100px]">
												<div class="bg-triage-amber h-2 rounded-full" style="width: {(entry.cervicalDilation / 10) * 100}%"></div>
											</div>
											<span class="w-8 text-right">{entry.cervicalDilation}cm</span>
										</div>
									</td>
									<td class="px-4 py-3 {entry.fetalHeartRate < 110 || entry.fetalHeartRate > 160 ? 'text-triage-red font-bold' : 'text-triage-green'}">
										{entry.fetalHeartRate} bpm
									</td>
									<td class="px-4 py-3">
										{entry.contractions}
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>

			<!-- New Entry Form -->
			<div class="bg-muted/30 p-4 rounded-lg border border-border">
				<h4 class="font-medium text-sm mb-4">Log New Observation</h4>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="space-y-2">
						<Label>Cervical Dilation (0-10 cm)</Label>
						<Input type="number" min="0" max="10" bind:value={newDilation} />
					</div>
					<div class="space-y-2">
						<Label>Fetal Heart Rate (bpm)</Label>
						<Input type="number" min="50" max="250" bind:value={newFhr} />
					</div>
					<div class="space-y-2">
						<Label>Contractions (per 10m)</Label>
						<Input type="number" min="0" max="10" bind:value={newContractions} />
					</div>
				</div>
				<div class="mt-4 flex justify-end">
					<Button onclick={handleAddEntry} disabled={newDilation === '' || newFhr === '' || newContractions === ''}>
						<Plus class="size-4 mr-2" />
						Add to Partogram
					</Button>
				</div>
			</div>
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={() => open = false}>Close</Button>
			<Button onclick={() => open = false} class="bg-triage-amber hover:bg-triage-amber/90 text-triage-amber-foreground">
				<Check class="size-4 mr-2" />
				Finalize Labor
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
