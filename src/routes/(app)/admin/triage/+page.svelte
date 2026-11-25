<script lang="ts">
	import { triageRuleStore } from '#lib/state/triage-rules.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import type { LocalTriageRule } from '#lib/local-db/db.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.ts';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogTrigger
	} from '#lib/components/ui/dialog/index.ts';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { toast } from 'svelte-sonner';
	import { Edit2, Plus } from '@lucide/svelte';

	const rules = $derived(triageRuleStore.items);

	async function toggleRule(ruleId: string, currentState: boolean) {
		try {
			await triageRuleStore.update(ruleId, { active: !currentState });
			toast.success(`Rule ${!currentState ? 'activated' : 'deactivated'}`);
		} catch (e) {
			toast.error('Failed to update rule');
		}
	}

	let isAddDialogOpen = $state(false);
	let newRule = $state({
		field: 'temperatureCelsius',
		operator: '>',
		threshold: 37.5,
		resultingLevel: 'amber' as 'red' | 'amber' | 'green',
		requiresPregnant: false,
		reasonTemplate: ''
	});

	let editingRule = $state<LocalTriageRule | null>(null);
	let isEditDialogOpen = $state(false);

	function startEditFull(rule: LocalTriageRule) {
		editingRule = { ...rule };
		isEditDialogOpen = true;
	}

	async function saveEditFull() {
		if (!editingRule) return;
		try {
			await triageRuleStore.update(editingRule.id, {
				field: editingRule.field,
				operator: editingRule.operator,
				threshold: editingRule.threshold,
				resultingLevel: editingRule.resultingLevel,
				requiresPregnant: editingRule.requiresPregnant,
				reasonTemplate: editingRule.reasonTemplate,
				version: Date.now()
			});
			isEditDialogOpen = false;
			editingRule = null;
			toast.success('Rule updated successfully');
		} catch (e) {
			toast.error('Failed to update rule');
		}
	}

	async function handleAddRule(e: Event) {
		e.preventDefault();
		try {
			await triageRuleStore.create({
				...newRule,
				phcId: sessionStore.activePhcId,
				active: true,
				version: Date.now()
			});
			isAddDialogOpen = false;
			toast.success('Rule added successfully');
			newRule = {
				field: 'temperatureCelsius',
				operator: '>',
				threshold: 37.5,
				resultingLevel: 'amber',
				requiresPregnant: false,
				reasonTemplate: ''
			};
		} catch (error) {
			toast.error('Failed to add rule');
		}
	}
</script>

<svelte:head>
	<title>Triage Rules Config — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<div
		class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Clinical Thresholds
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Triage Rules Config</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Configure vital-sign thresholds for automatic triage flagging
			</p>
		</div>

		<Dialog bind:open={isAddDialogOpen}>
			<DialogTrigger
				class="inline-flex items-center justify-center rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 min-h-10 px-4"
			>
				<Plus class="size-4 mr-2" />
				Add Rule
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Triage Rule</DialogTitle>
					<DialogDescription>
						Define a new condition that will automatically flag a patient's vitals.
					</DialogDescription>
				</DialogHeader>
				<form onsubmit={handleAddRule} class="space-y-4 py-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="field">Field</Label>
							<select
								id="field"
								bind:value={newRule.field}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								<option value="temperatureCelsius">Temperature</option>
								<option value="systolicBp">Systolic BP</option>
								<option value="diastolicBp">Diastolic BP</option>
								<option value="heartRateBpm">Heart Rate</option>
								<option value="respiratoryRateBpm">Resp. Rate</option>
								<option value="oxygenSaturationPercent">SpO2 %</option>
							</select>
						</div>
						<div class="space-y-2">
							<Label for="operator">Operator</Label>
							<select
								id="operator"
								bind:value={newRule.operator}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								<option value=">">Greater than (&gt;)</option>
								<option value="<">Less than (&lt;)</option>
								<option value=">=">Greater or eq (&gt;=)</option>
								<option value="<=">Less or eq (&lt;=)</option>
								<option value="==">Equals (==)</option>
							</select>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="threshold">Threshold</Label>
							<Input
								id="threshold"
								type="number"
								step="0.1"
								bind:value={newRule.threshold}
								required
							/>
						</div>
						<div class="space-y-2">
							<Label for="level">Result Level</Label>
							<select
								id="level"
								bind:value={newRule.resultingLevel}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								<option value="red">RED (Emergency)</option>
								<option value="amber">AMBER (Priority)</option>
								<option value="green">GREEN (Standard)</option>
							</select>
						</div>
					</div>
					<div class="space-y-2">
						<Label for="reason">Clinical Reason (Optional)</Label>
						<Input
							id="reason"
							bind:value={newRule.reasonTemplate}
							placeholder="e.g. Fever indicator"
						/>
					</div>
					<div class="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border">
						<Switch id="pregnant" bind:checked={newRule.requiresPregnant} />
						<Label for="pregnant" class="font-medium cursor-pointer">Requires Pregnancy</Label>
					</div>
					<div class="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onclick={() => (isAddDialogOpen = false)}>
							Cancel
						</Button>
						<Button type="submit">Add Rule</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="border-b border-border bg-muted/20 px-5 py-3.5">
			<h2 class="text-base font-semibold">Active Thresholds</h2>
			<p class="text-xs text-muted-foreground">
				Rules are evaluated sequentially on every vitals record entry.
			</p>
		</div>
		<ScrollArea class="h-[520px] w-full">
			<Table>
				<TableHeader class="bg-muted/40 sticky top-0 z-10">
					<TableRow class="hover:bg-transparent">
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 py-3"
							>Rule Field</TableHead
						>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 py-3"
							>Condition</TableHead
						>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 py-3"
							>Threshold</TableHead
						>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 py-3"
							>Urgency</TableHead
						>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 py-3 text-right w-32">
							Status
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each rules as rule, idx (rule.id)}
						<TableRow class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}>
							<TableCell class="font-semibold text-foreground px-5 py-3.5 text-sm">
								<span class="capitalize">
									{rule.field
										.replace('Celsius', ' (°C)')
										.replace('Bp', ' BP')
										.replace('Percent', ' (%)')
										.replace('Bpm', ' (BPM)')
										.replace('Kg', ' (kg)')}
								</span>
								{#if rule.requiresPregnant}
									<Badge
										variant="outline"
										class="ml-2 border-triage-amber/40 text-amber-700 dark:text-triage-amber bg-triage-amber/10 text-[10px] font-mono uppercase px-1.5 py-0"
									>
										Pregnant Only
									</Badge>
								{/if}
							</TableCell>
							<TableCell
								class="text-muted-foreground px-5 py-3.5 font-mono text-xs uppercase font-bold"
							>
								{rule.operator}
							</TableCell>
							<TableCell class="px-5 py-3.5">
								<div class="flex items-center gap-2">
									<span class="text-foreground font-bold font-mono text-sm tabular-nums">
										{rule.threshold}
									</span>
									<Button
										variant="ghost"
										size="icon"
										class="size-8 text-muted-foreground hover:text-foreground"
										onclick={() => startEditFull(rule)}
									>
										<Edit2 class="size-3.5" />
									</Button>
								</div>
							</TableCell>
							<TableCell class="px-5 py-3.5">
								{#if rule.resultingLevel === 'red'}
									<Badge
										class="bg-triage-red/15 text-triage-red border-triage-red/30 font-mono text-[10px] uppercase"
									>
										RED
									</Badge>
								{:else if rule.resultingLevel === 'amber'}
									<Badge
										class="bg-triage-amber/15 text-foreground border-triage-amber/40 font-mono text-[10px] uppercase"
									>
										AMBER
									</Badge>
								{:else}
									<Badge
										class="bg-triage-green/15 text-triage-green border-triage-green/30 font-mono text-[10px] uppercase"
									>
										GREEN
									</Badge>
								{/if}
							</TableCell>
							<TableCell class="px-5 py-3.5 text-right">
								<Switch
									checked={rule.active}
									onCheckedChange={() => toggleRule(rule.id, rule.active)}
									aria-label="Toggle rule active status"
								/>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</ScrollArea>
	</section>

	<Dialog bind:open={isEditDialogOpen}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Edit Triage Rule</DialogTitle>
			</DialogHeader>
			{#if editingRule}
				<div class="space-y-4 py-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="edit-field">Field</Label>
							<select
								id="edit-field"
								bind:value={editingRule.field}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								<option value="temperatureCelsius">Temperature</option>
								<option value="systolicBp">Systolic BP</option>
								<option value="diastolicBp">Diastolic BP</option>
								<option value="heartRateBpm">Heart Rate</option>
								<option value="respiratoryRateBpm">Resp. Rate</option>
								<option value="oxygenSaturationPercent">SpO2 %</option>
							</select>
						</div>
						<div class="space-y-2">
							<Label for="edit-operator">Operator</Label>
							<select
								id="edit-operator"
								bind:value={editingRule.operator}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								<option value=">">Greater than (&gt;)</option>
								<option value="<">Less than (&lt;)</option>
								<option value=">=">Greater or eq (&gt;=)</option>
								<option value="<=">Less or eq (&lt;=)</option>
								<option value="==">Equals (==)</option>
							</select>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="edit-threshold">Threshold</Label>
							<Input
								id="edit-threshold"
								type="number"
								step="0.1"
								bind:value={editingRule.threshold}
								required
							/>
						</div>
						<div class="space-y-2">
							<Label for="edit-level">Result Level</Label>
							<select
								id="edit-level"
								bind:value={editingRule.resultingLevel}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								<option value="red">RED (Emergency)</option>
								<option value="amber">AMBER (Priority)</option>
								<option value="green">GREEN (Standard)</option>
							</select>
						</div>
					</div>
					<div class="space-y-2">
						<Label for="edit-reason">Clinical Reason (Optional)</Label>
						<Input
							id="edit-reason"
							bind:value={editingRule.reasonTemplate}
							placeholder="e.g. Fever indicator"
						/>
					</div>
					<div class="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border">
						<Switch id="edit-pregnant" bind:checked={editingRule.requiresPregnant} />
						<Label for="edit-pregnant" class="font-medium cursor-pointer">Requires Pregnancy</Label>
					</div>
					<div class="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onclick={() => (isEditDialogOpen = false)}>
							Cancel
						</Button>
						<Button type="button" onclick={saveEditFull}>Save Changes</Button>
					</div>
				</div>
			{/if}
		</DialogContent>
	</Dialog>
</div>
