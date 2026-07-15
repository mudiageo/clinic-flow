<script lang="ts">
	import QrScanner from 'qr-scanner';
	import { onMount, onDestroy } from 'svelte';

	let { onResult }: { onResult: (text: string) => void } = $props();
	let videoEl = $state<HTMLVideoElement | null>(null);
	let stream = $state<MediaStream | null>(null);
	let isScanning = $state(false);
	let hasCamera = $state(true);
	let qrScannerFallback = $state<QrScanner | null>(null);

	async function startScanner() {
		try {
			const hasWebCam = await QrScanner.hasCamera();
			if (!hasWebCam) {
				hasCamera = false;
				return;
			}

			// Try BarcodeDetector first
			if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
				stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: 'environment' }
				});
				if (videoEl) {
					videoEl.srcObject = stream;
					await videoEl.play();
					isScanning = true;
					scanLoopNative();
				}
			} else {
				// Fallback to qr-scanner library
				if (videoEl) {
					qrScannerFallback = new QrScanner(
						videoEl,
						(result) => {
							if (result.data) {
								onResult(result.data);
								stopScanner();
							}
						},
						{
							highlightScanRegion: true,
							highlightCodeOutline: true
						}
					);
					await qrScannerFallback.start();
				}
			}
		} catch (err) {
			console.error('Camera error:', err);
			hasCamera = false;
		}
	}

	async function scanLoopNative() {
		if (!isScanning || !videoEl) return;

		try {
			// @ts-ignore - BarcodeDetector is a modern web API
			const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
			const barcodes = await barcodeDetector.detect(videoEl);
			if (barcodes.length > 0) {
				onResult(barcodes[0].rawValue);
				stopScanner();
				return;
			}
		} catch (err) {
			// Ignore detection errors during active scan
		}

		if (isScanning) {
			requestAnimationFrame(scanLoopNative);
		}
	}

	function stopScanner() {
		isScanning = false;
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
		if (qrScannerFallback) {
			qrScannerFallback.destroy();
			qrScannerFallback = null;
		}
	}

	onMount(() => {
		startScanner();
	});

	onDestroy(() => {
		stopScanner();
	});
</script>

<div class="flex flex-col items-center gap-4 w-full">
	{#if hasCamera}
		<div
			class="relative aspect-video w-full max-w-md rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl"
		>
			<!-- svelte-ignore a11y_media_has_caption -->
			<video bind:this={videoEl} class="w-full h-full object-cover" playsinline></video>
			<div
				class="absolute inset-0 border-2 border-dashed border-teal-500/50 pointer-events-none rounded-2xl margin-4"
			></div>
		</div>
	{:else}
		<div class="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
			No camera found or access not granted.
		</div>
	{/if}
</div>
