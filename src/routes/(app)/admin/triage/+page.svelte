<script lang="ts">
	import { triageRuleStore } from '$lib/state/triage-rules.svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { Settings, Edit2, Check, X, ShieldAlert, AlertTriangle, Plus } from '@lucide/svelte';

	const rules = $derived(triageRuleStore.items);

	async function toggleRule(ruleId: string, currentState: boolean) {
		try {
			await triageRuleStore.update(ruleId, { active: !currentState });
			toast.success(`Rule ${!currentState ? 'activated' : 'deactivated'}`);
		} catch (e: any) {
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

	let editingRule = $state<any>(null);
	let isEditDialogOpen = $state(false);

	function startEditFull(rule: any) {
		editingRule = { ...rule };
		isEditDialogOpen = true;
	}

	async function saveEditFull() {
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
		} catch (e: any) {
			toast.error('Failed to update rule');
		}
	}

	async function handleAddRule(e: Event) {
		e.preventDefault();
		try {
			await triageRuleStore.create({
				...newRule,
				phcId: 'demo-phc-1',
				active: true,
				version: Date.now()
			});
			isAddDialogOpen = false;
			toast.success('Rule added successfully');
			// Reset form
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

<div class="space-y-8 animate-fade-in">
	<div class="flex items-start justify-between gap-3">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<Settings class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Triage Rules Config</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Configure clinical thresholds for automatic triage flagging
				</p>
			</div>
		</div>
		
		<Dialog bind:open={isAddDialogOpen}>
			<DialogTrigger class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
				<Plus class="size-4 mr-2" />
				Add Rule
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Triage Rule</DialogTitle>
					<DialogDescription>Define a new condition that will automatically flag a patient's vitals.</DialogDescription>
				</DialogHeader>
				<form onsubmit={handleAddRule} class="space-y-4 py-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="field">Field</Label>
							<select id="field" bind:value={newRule.field} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
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
							<select id="operator" bind:value={newRule.operator} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
								<option value=">">Greater than (>)</option>
								<option value="<">Less than (&lt;)</option>
								<option value=">=">Greater or eq (>=)</option>
								<option value="<=">Less or eq (&lt;=)</option>
								<option value="==">Equals (==)</option>
							</select>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="threshold">Threshold</Label>
							<Input id="threshold" type="number" step="0.1" bind:value={newRule.threshold} required />
						</div>
						<div class="space-y-2">
							<Label for="level">Result Level</Label>
							<select id="level" bind:value={newRule.resultingLevel} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
								<option value="red">RED (Emergency)</option>
								<option value="amber">AMBER (Priority)</option>
								<option value="green">GREEN (Standard)</option>
							</select>
						</div>
					</div>
					<div class="space-y-2">
						<Label for="reason">Clinical Reason (Optional)</Label>
						<Input id="reason" bind:value={newRule.reasonTemplate} placeholder="e.g. Fever indicator" />
					</div>
					<div class="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border">
						<Switch id="pregnant" bind:checked={newRule.requiresPregnant} />
						<Label for="pregnant" class="font-medium cursor-pointer">Requires Pregnancy</Label>
					</div>
					<div class="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onclick={() => isAddDialogOpen = false}>Cancel</Button>
						<Button type="submit">Add Rule</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	</div>

	<Card class="overflow-hidden card-hover bg-card/60">
		<CardHeader class="border-b border-border/60 bg-muted/20 px-6 py-4">
			<CardTitle class="text-base font-semibold">Active Thresholds</CardTitle>
			<CardDescription
				>Rules are evaluated sequentially on every vitals record entry.</CardDescription
			>
		</CardHeader>
		<ScrollArea class="h-[500px] w-full">
			<Table>
				<TableHeader class="bg-muted/40 sticky top-0 z-10">
					<TableRow class="hover:bg-transparent">
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider"
							>Rule Field</TableHead
						>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider"
							>Condition</TableHead
						>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider"
							>Threshold</TableHead
						>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider"
							>Urgency</TableHead
						>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-right w-32 text-xs uppercase tracking-wider"
							>Status</TableHead
						>
					</TableRow>
				</TableHeader>
				<TableBody class="animate-stagger">
					{#each rules as rule}
						<TableRow class="border-border hover:bg-muted/40 transition-colors">
							<TableCell class="font-semibold text-foreground px-6 py-4 text-sm">
								<span class="capitalize"
									>{rule.field
										.replace('Celsius', ' (°C)')
										.replace('Bp', ' BP')
										.replace('Percent', ' (%)')
										.replace('Bpm', ' (BPM)')
										.replace('Kg', ' (kg)')}</span
								>
								{#if rule.requiresPregnant}
									<Badge
										variant="outline"
										class="ml-2 border-triage-amber/35 text-triage-amber bg-triage-amber/5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0"
										>Pregnant Only</Badge
									>
								{/if}
							</TableCell>
							<TableCell
								class="text-muted-foreground px-6 py-4 font-mono text-xs uppercase font-bold"
								>{rule.operator}</TableCell
							>
							<TableCell class="px-6 py-4">
								<div class="flex items-center gap-3">
									<span class="text-foreground font-bold text-sm tabular-nums"
										>{rule.threshold}</span
									>
									<Button
										variant="ghost"
										size="icon"
										class="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted btn-press"
										onclick={() => startEditFull(rule)}
									>
										<Edit2 class="size-3" />
									</Button>
								</div>
							</TableCell>
							<TableCell class="px-6 py-4">
								{#if rule.resultingLevel === 'red'}
									<Badge
										class="bg-triage-red/15 text-triage-red border-triage-red/25 hover:bg-triage-red/15 font-semibold text-[10px] tracking-wider uppercase"
										>RED</Badge
									>
								{:else if rule.resultingLevel === 'amber'}
									<Badge
										class="bg-triage-amber/15 text-triage-amber border-triage-amber/25 hover:bg-triage-amber/15 font-semibold text-[10px] tracking-wider uppercase"
										>AMBER</Badge
									>
								{:else}
									<Badge
										class="bg-triage-green/15 text-triage-green border-triage-green/25 hover:bg-triage-green/15 font-semibold text-[10px] tracking-wider uppercase"
										>GREEN</Badge
									>
								{/if}
							</TableCell>
							<TableCell class="px-6 py-4 text-right">
								<button
									aria-label="Toggle rule active status"
									class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-primary/20
                    {rule.active ? 'bg-primary' : 'bg-muted border border-border'}"
									onclick={() => toggleRule(rule.id, rule.active)}
								>
									<span
										class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200
                    {rule.active ? 'translate-x-4.5' : 'translate-x-0.5'}"
									></span>
								</button>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</ScrollArea>
	</Card>

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
							<select id="edit-field" bind:value={editingRule.field} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
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
							<select id="edit-operator" bind:value={editingRule.operator} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
								<option value=">">Greater than (>)</option>
								<option value="<">Less than (&lt;)</option>
								<option value=">=">Greater or eq (>=)</option>
								<option value="<=">Less or eq (&lt;=)</option>
								<option value="==">Equals (==)</option>
							</select>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="edit-threshold">Threshold</Label>
							<Input id="edit-threshold" type="number" step="0.1" bind:value={editingRule.threshold} required />
						</div>
						<div class="space-y-2">
							<Label for="edit-level">Result Level</Label>
							<select id="edit-level" bind:value={editingRule.resultingLevel} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
								<option value="red">RED (Emergency)</option>
								<option value="amber">AMBER (Priority)</option>
								<option value="green">GREEN (Standard)</option>
							</select>
						</div>
					</div>
					<div class="space-y-2">
						<Label for="edit-reason">Clinical Reason (Optional)</Label>
						<Input id="edit-reason" bind:value={editingRule.reasonTemplate} placeholder="e.g. Fever indicator" />
					</div>
					<div class="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border">
						<Switch id="edit-pregnant" bind:checked={editingRule.requiresPregnant} />
						<Label for="edit-pregnant" class="font-medium cursor-pointer">Requires Pregnancy</Label>
					</div>
					<div class="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onclick={() => isEditDialogOpen = false}>Cancel</Button>
						<Button type="button" onclick={saveEditFull}>Save Changes</Button>
					</div>
				</div>
			{/if}
		</DialogContent>
	</Dialog>
</div>
