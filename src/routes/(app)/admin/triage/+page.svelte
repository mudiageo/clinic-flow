<script lang="ts">
  import { triageRuleStore } from '$lib/state/triage-rules.svelte';
  import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { toast } from 'svelte-sonner';

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

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-extrabold text-white tracking-tight">Triage Rules Engine Config</h1>
    <p class="text-slate-400 mt-1">Configure clinical thresholds for automatic triage flagging</p>
  </div>

  <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
    <CardHeader>
      <CardTitle class="text-white text-lg">Active Thresholds</CardTitle>
      <CardDescription class="text-slate-400">Rules are evaluated from top to bottom on every vitals entry.</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader class="bg-slate-950/40">
          <TableRow>
            <TableHead class="text-slate-400 font-semibold px-4 py-2">Rule Field</TableHead>
            <TableHead class="text-slate-400 font-semibold px-4 py-2">Condition</TableHead>
            <TableHead class="text-slate-400 font-semibold px-4 py-2">Threshold</TableHead>
            <TableHead class="text-slate-400 font-semibold px-4 py-2">Urgency</TableHead>
            <TableHead class="text-slate-400 font-semibold px-4 py-2 text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each rules as rule}
            <TableRow class="border-b border-slate-900/60">
              <TableCell class="text-white font-medium px-4 py-2">
                {rule.field}
                {#if rule.requiresPregnant}
                  <Badge variant="outline" class="ml-2 text-xs border-amber-500/30 text-amber-400">Pregnant Only</Badge>
                {/if}
              </TableCell>
              <TableCell class="text-slate-300 px-4 py-2 uppercase font-mono text-sm">{rule.operator}</TableCell>
              <TableCell class="px-4 py-2">
                {#if editingId === rule.id}
                  <div class="flex items-center gap-2">
                    <Input type="number" bind:value={editThreshold} class="w-20 h-8 bg-slate-950 border-slate-700 text-white" />
                    <Button size="sm" class="h-8 bg-teal-600 hover:bg-teal-500 text-white" onclick={() => saveEdit(rule.id)}>Save</Button>
                    <Button size="sm" variant="ghost" class="h-8 text-slate-400 hover:text-white" onclick={() => editingId = null}>Cancel</Button>
                  </div>
                {:else}
                  <span class="text-white font-bold">{rule.threshold}</span>
                  <button class="ml-3 text-slate-500 hover:text-white text-xs underline" onclick={() => startEdit(rule)}>Edit</button>
                {/if}
              </TableCell>
              <TableCell class="px-4 py-2">
                {#if rule.resultingLevel === 'red'}
                  <Badge class="bg-rose-500/10 text-rose-400 border border-rose-500/20">RED</Badge>
                {:else if rule.resultingLevel === 'amber'}
                  <Badge class="bg-amber-500/10 text-amber-400 border border-amber-500/20">AMBER</Badge>
                {:else}
                  <Badge class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">GREEN</Badge>
                {/if}
              </TableCell>
              <TableCell class="px-4 py-2 text-right">
                <button 
                  aria-label="Toggle rule active status"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-950 {rule.active ? 'bg-teal-500' : 'bg-slate-700'}"
                  onclick={() => toggleRule(rule.id, rule.active)}
                >
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {rule.active ? 'translate-x-6' : 'translate-x-1'}"></span>
                </button>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
