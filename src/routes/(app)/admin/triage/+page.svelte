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
	import { toast } from 'svelte-sonner';
	import { Settings, Edit2, Check, X, ShieldAlert, AlertTriangle } from '@lucide/svelte';

	const rules = $derived(triageRuleStore.items);

	async function toggleRule(ruleId: string, currentState: boolean) {
		try {
			await triageRuleStore.update(ruleId, { active: !currentState });
			toast.success(`Rule ${!currentState ? 'activated' : 'deactivated'}`);
		} catch (e: any) {
			toast.error('Failed to update rule');
		}
	}

	let editingId = $state<string | null>(null);
	let editThreshold = $state<number>(0);

	function startEdit(rule: any) {
		editingId = rule.id;
		editThreshold = rule.threshold;
	}

	async function saveEdit(ruleId: string) {
		try {
			await triageRuleStore.update(ruleId, { threshold: editThreshold, version: Date.now() });
			editingId = null;
			toast.success('Threshold updated');
		} catch (e: any) {
			toast.error('Failed to save threshold');
		}
	}
</script>

<svelte:head>
	<title>Triage Rules Config — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
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
								{#if editingId === rule.id}
									<div class="flex items-center gap-2 animate-fade-in">
										<Input
											type="number"
											bind:value={editThreshold}
											class="w-20 h-8 bg-background border-border text-foreground text-xs"
										/>
										<Button
											size="icon"
											class="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/95 btn-press"
											onclick={() => saveEdit(rule.id)}
										>
											<Check class="size-3.5" />
										</Button>
										<Button
											size="icon"
											variant="ghost"
											class="h-8 w-8 text-muted-foreground hover:text-foreground btn-press"
											onclick={() => (editingId = null)}
										>
											<X class="size-3.5" />
										</Button>
									</div>
								{:else}
									<div class="flex items-center gap-3">
										<span class="text-foreground font-bold text-sm tabular-nums"
											>{rule.threshold}</span
										>
										<Button
											variant="ghost"
											size="icon"
											class="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted btn-press"
											onclick={() => startEdit(rule)}
										>
											<Edit2 class="size-3" />
										</Button>
									</div>
								{/if}
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
</div>
