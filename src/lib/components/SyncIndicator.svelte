<script lang="ts">
  import { syncStore } from '$lib/state/sync.svelte';
  import { Badge } from '$lib/components/ui/badge';
</script>

<div class="flex items-center gap-2">
  {#if syncStore.online}
    <Badge variant="outline" class="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 px-2.5 py-1">
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      Connected
    </Badge>
  {:else}
    <Badge variant="outline" class="bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1.5 px-2.5 py-1">
      <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
      Offline ({syncStore.pendingCount} pending)
    </Badge>
  {/if}
</div>
