<script lang="ts">
  import QrScanner from 'qr-scanner';
  import { onMount, onDestroy } from 'svelte';
  import { Button } from '$lib/components/ui/button';

  let { onResult }: { onResult: (text: string) => void } = $props();
  let videoEl = $state<HTMLVideoElement | null>(null);
  let scanner = $state<QrScanner | null>(null);
  let hasCamera = $state(false);

  onMount(async () => {
    hasCamera = await QrScanner.hasCamera();
    if (hasCamera && videoEl) {
      scanner = new QrScanner(
        videoEl,
        (result) => {
          if (result.data) {
            onResult(result.data);
            scanner?.stop();
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      try {
        await scanner.start();
      } catch (err) {
        console.error('Failed to start scanner:', err);
      }
    }
  });

  onDestroy(() => {
    scanner?.destroy();
    scanner = null;
  });
</script>

<div class="flex flex-col items-center gap-4 w-full">
  {#if hasCamera}
    <div class="relative aspect-video w-full max-w-md rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      <video bind:this={videoEl} class="w-full h-full object-cover"></video>
      <div class="absolute inset-0 border-2 border-dashed border-teal-500/50 pointer-events-none rounded-2xl margin-4"></div>
    </div>
  {:else}
    <div class="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
      No camera found or access not granted.
    </div>
  {/if}
</div>
