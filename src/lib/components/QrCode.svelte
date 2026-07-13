<script lang="ts">
  import QRCode from 'qrcode';
  import { onMount } from 'svelte';

  let { value, size = 180 }: { value: string; size?: number } = $props();
  let canvas: HTMLCanvasElement;

  onMount(() => {
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a', // Slate 900
        light: '#ffffff'
      }
    }, (error) => {
      if (error) console.error('Error generating QR code:', error);
    });
  });
</script>

<div class="inline-block p-2 bg-white rounded-xl shadow-md border border-slate-100">
  <canvas bind:this={canvas}></canvas>
</div>
