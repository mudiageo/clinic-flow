<script lang="ts">
  import { db } from '$lib/local-db/db';
  import { syncStore } from '$lib/state/sync.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
  import { onMount } from 'svelte';
  import { AlertTriangle, CheckCircle, RefreshCcw, Wifi, WifiOff } from 'lucide-svelte';
  
  let conflicts = $state<{ table: string, id: string, record: any }[]>([]);
  let refreshing = $state(false);

  async function loadConflicts() {
    refreshing = true;
    const tables = ['patients', 'queueTickets', 'vitalsRecords', 'pharmacyInventory', 'reminders', 'triageRules', 'prescriptions'];
    const found: any[] = [];
    
    for (const t of tables) {
      const tableObj = (db as any)[t];
      if (tableObj) {
        const records = await tableObj.where('syncStatus').equals('conflict').toArray();
        for (const r of records) {
           found.push({ table: t, id: r.id, record: r });
        }
      }
    }
    
    conflicts = found;
    refreshing = false;
  }

  onMount(() => {
    loadConflicts();
    const interval = setInterval(loadConflicts, 5000);
    return () => clearInterval(interval);
  });

  async function forceLocal(table: string, id: string, record: any) {
    const tableObj = (db as any)[table];
    
    // Write a new sync log entry to override the server
    await db.syncLog.add({
      entityType: table,
      entityId: id,
      operation: 'update',
      payload: record,
      timestamp: Date.now(),
      synced: 0
    });
    
    // Update local status back to pending so it pushes
    await tableObj.update(id, { syncStatus: 'pending', updatedAt: Date.now() });
    
    // Flush immediately
    await syncStore.flush();
    loadConflicts();
  }

  async function forceRemote(table: string, id: string) {
    // To force remote, we simply delete the local conflict marker and pull again.
    // However, if the server won, the server state might not have downloaded yet.
    // For now, setting status to 'synced' will let the next pull overwrite it if the timestamp is newer.
    const tableObj = (db as any)[table];
    await tableObj.update(id, { syncStatus: 'synced' });
    await syncStore.flush();
    loadConflicts();
  }

</script>

<div class="space-y-6">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Sync Engine</h1>
    <p class="text-muted-foreground">Monitor local-first synchronization and resolve conflicts.</p>
  </div>

  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Connectivity</CardTitle>
        {#if syncStore.online}
          <Wifi class="h-4 w-4 text-emerald-500" />
        {:else}
          <WifiOff class="h-4 w-4 text-rose-500" />
        {/if}
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">
          {syncStore.online ? 'Online' : 'Offline'}
        </div>
        <p class="text-xs text-muted-foreground mt-1">
          {syncStore.online ? 'Actively syncing with Postgres' : 'Operating fully locally in Dexie'}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Pending Changes</CardTitle>
        <RefreshCcw class="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">
          {syncStore.pendingCount}
        </div>
        <p class="text-xs text-muted-foreground mt-1">
          Mutations waiting to push to server
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Last Synced</CardTitle>
        <CheckCircle class="h-4 w-4 text-teal-500" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">
          {#if syncStore.lastSyncedAt}
            {new Date(syncStore.lastSyncedAt).toLocaleTimeString()}
          {:else}
            Never
          {/if}
        </div>
        <p class="text-xs text-muted-foreground mt-1">
          Time of last successful push/pull
        </p>
      </CardContent>
    </Card>
  </div>

  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>Sync Conflicts</CardTitle>
          <CardDescription>Records that could not be automatically merged using LWW rules.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onclick={loadConflicts} disabled={refreshing}>
          <RefreshCcw class="h-4 w-4 mr-2 {refreshing ? 'animate-spin' : ''}" /> Refresh
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      {#if conflicts.length === 0}
        <div class="text-center py-12 border-2 border-dashed rounded-lg">
          <CheckCircle class="h-12 w-12 text-emerald-500/50 mx-auto mb-4" />
          <h3 class="text-lg font-medium">No Conflicts</h3>
          <p class="text-slate-500 text-sm">All local records are smoothly synced.</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each conflicts as conflict}
            <div class="p-4 border rounded-lg bg-rose-500/5 flex items-start justify-between">
              <div class="flex items-start gap-4">
                <AlertTriangle class="h-5 w-5 text-rose-500 mt-0.5" />
                <div>
                  <div class="font-bold text-rose-700 dark:text-rose-400 capitalize">{conflict.table} Record</div>
                  <div class="text-sm font-mono text-slate-500 mt-1">ID: {conflict.id}</div>
                  <div class="mt-3 bg-white dark:bg-slate-950 p-3 rounded text-xs font-mono border overflow-x-auto">
                    {JSON.stringify(conflict.record, null, 2)}
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-2 min-w-[140px]">
                <Button variant="default" size="sm" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onclick={() => forceLocal(conflict.table, conflict.id, conflict.record)}>
                  Force Local Win
                </Button>
                <Button variant="outline" size="sm" class="w-full" onclick={() => forceRemote(conflict.table, conflict.id)}>
                  Discard Local
                </Button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
