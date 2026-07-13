<script lang="ts">
  import { reminderStore } from '$lib/state/reminders.svelte';
  import { patientStore } from '$lib/state/patients.svelte';
  import { dispatchReminders } from '../../../sms/sms.remote';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { toast } from 'svelte-sonner';

  const reminders = $derived(reminderStore.sortedItems);
  let isDispatching = $state(false);

  async function handleDispatchPending() {
    const pending = reminderStore.pendingReminders;
    if (pending.length === 0) {
      toast.info('No pending reminders to dispatch.');
      return;
    }

    isDispatching = true;
    try {
      const batch = pending.map(r => ({
        id: r.id,
        phone: r.recipientPhone,
        message: `ClinicFlow Reminder: ${r.label}`
      }));
      
      toast.info(`Dispatching ${batch.length} reminders via SMS...`);
      const results = await dispatchReminders(batch);
      
      let successCount = 0;
      for (const res of results) {
        if (res.success) {
          await reminderStore.update(res.id, {
            status: 'sent',
            sentAt: Date.now(),
            provider: 'termii_sandbox',
            providerMessageId: res.providerMessageId
          } as any);
          successCount++;
        }
      }
      
      toast.success(`Successfully dispatched ${successCount} reminders.`);
    } catch (err: any) {
      toast.error(`SMS dispatch failed: ${err.message}`);
    } finally {
      isDispatching = false;
    }
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>SMS Reminders — ClinicFlow</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-extrabold text-white tracking-tight">SMS Reminders</h1>
      <p class="text-slate-400 mt-1">Manage automated SMS notifications to patients</p>
    </div>
    <Button 
      onclick={handleDispatchPending} 
      disabled={isDispatching}
      class="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
    >
      {#if isDispatching}
        <span class="animate-spin mr-2">⏳</span> Sending...
      {:else}
        📡 Dispatch Pending SMS Now
      {/if}
    </Button>
  </div>

  <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
    <CardHeader>
      <CardTitle class="text-white text-lg">Reminder Log</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader class="bg-slate-950/40">
          <TableRow>
            <TableHead class="text-slate-400 font-semibold px-4 py-2">Patient</TableHead>
            <TableHead class="text-slate-400 font-semibold px-4 py-2">Type</TableHead>
            <TableHead class="text-slate-400 font-semibold px-4 py-2">Message</TableHead>
            <TableHead class="text-slate-400 font-semibold px-4 py-2">Due Date</TableHead>
            <TableHead class="text-slate-400 font-semibold px-4 py-2">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#if reminders.length === 0}
            <TableRow>
              <TableCell colspan={5} class="text-center text-slate-500 py-8">No reminders scheduled.</TableCell>
            </TableRow>
          {:else}
            {#each reminders as r}
              {@const p = patientStore.get(r.patientId)}
              <TableRow class="border-b border-slate-900/60">
                <TableCell class="px-4 py-2">
                  <div class="text-white font-medium">{p?.name || 'Unknown'}</div>
                  <div class="text-slate-500 text-xs font-mono mt-0.5">{r.recipientPhone}</div>
                </TableCell>
                <TableCell class="px-4 py-2">
                  <Badge variant="outline" class="border-slate-700 text-slate-300 capitalize">{r.type.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell class="text-slate-300 px-4 py-2">{r.label}</TableCell>
                <TableCell class="text-slate-300 px-4 py-2 whitespace-nowrap">{formatDate(r.dueDate)}</TableCell>
                <TableCell class="px-4 py-2">
                  {#if r.status === 'scheduled'}
                    <Badge class="bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</Badge>
                  {:else if r.status === 'sent'}
                    <Badge class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sent</Badge>
                  {:else}
                    <Badge class="bg-slate-500/10 text-slate-400 border border-slate-500/20 capitalize">{r.status}</Badge>
                  {/if}
                </TableCell>
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
