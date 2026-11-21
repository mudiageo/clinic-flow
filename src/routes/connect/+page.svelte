<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import QrScanner from '#lib/components/QrScanner.svelte';
	import {
		Cloud,
		Server,
		QrCode,
		ArrowRight,
		Loader2,
		Link2,
		HardDrive,
		Database,
		Wifi,
		ShieldCheck,
		Smartphone
	} from '@lucide/svelte';
	import { slide, fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { checkServerStatus } from '#lib/remote/setup.remote.ts';
	import { validatePairingToken } from '#lib/remote/server-status.remote.ts';
	import { getServerUrl } from '#lib/utils/server-url.ts';

	type PairingTarget = { token: string; serverUrl: string };
	type PairingResult = { deviceId: string; status: string; phcId: string };

	let connectionMode = $state<'select' | 'local' | 'cloud' | 'master_setup'>('select');
	let localIp = $state('');
	let cloudUrl = $state('');
	let isConnecting = $state(false);

	let scannerOpen = $state(false);
	let pendingPairing = $state<PairingTarget | null>(null);
	let deviceName = $state('');
	let isPairing = $state(false);
	let pairedResult = $state<PairingResult | null>(null);

	/** A stable, user-confirmable name derived from a persisted local device id. */
	function deterministicDeviceName(): string {
		let deviceId = localStorage.getItem('clinicflow_device_id');
		if (!deviceId) {
			deviceId = crypto.randomUUID().slice(0, 8).toUpperCase();
			localStorage.setItem('clinicflow_device_id', deviceId);
		}
		const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
		return `${isMobile ? 'Tablet' : 'Device'}-${deviceId}`;
	}

	function preparePairing(target: PairingTarget) {
		pendingPairing = target;
		deviceName = deterministicDeviceName();
	}

	function handleScanResult(text: string) {
		scannerOpen = false;
		try {
			const scanned = new URL(text);
			const token = scanned.searchParams.get('token');
			if (scanned.pathname.replace(/\/$/, '') !== '/connect' || !token) {
				toast.error('That QR code is not a ClinicFlow pairing code.');
				return;
			}
			// The admin-generated QR is `${origin}/connect?token=...`, so its origin is the server URL.
			preparePairing({ token, serverUrl: scanned.origin });
		} catch {
			toast.error('Could not read the pairing QR code.');
		}
	}

	async function confirmPairing() {
		if (!pendingPairing) return;
		const name = deviceName.trim();
		if (name.length < 2) {
			toast.error('Enter a device name of at least 2 characters.');
			return;
		}

		isPairing = true;
		try {
			localStorage.setItem('clinicflow_server_url', pendingPairing.serverUrl);
			if ('caches' in window) {
				const cache = await caches.open('clinicflow-config');
				await cache.put('/server-url', new Response(pendingPairing.serverUrl));
			}

			const res = await validatePairingToken({
				token: pendingPairing.token,
				deviceName: name,
				role: 'kiosk'
			});
			localStorage.setItem('clinicflow_phc_id', res.phcId);
			pairedResult = { deviceId: res.deviceId, status: res.status, phcId: res.phcId };
			pendingPairing = null;
			history.replaceState(history.state, '', '/connect');
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Invalid or expired pairing token.';
			toast.error(message);
			localStorage.removeItem('clinicflow_server_url');
			if ('caches' in window) {
				try {
					const cache = await caches.open('clinicflow-config');
					await cache.delete('/server-url');
				} catch {
					// Cache cleanup is best-effort; the rejected token is never reused.
				}
			}
			pendingPairing = null;
			history.replaceState(history.state, '', '/connect');
		} finally {
			isPairing = false;
		}
	}

	async function connectToServer(url: string) {
		isConnecting = true;

		try {
			localStorage.setItem('clinicflow_server_url', url);

			const status = await checkServerStatus();

			if (!status.isConfigured) {
				toast.info('No clinic found on this server. Proceeding to registration.');
				goto('/onboarding');
			} else {
				toast.success('Connected to server successfully!');
				goto('/login');
			}
		} catch (error) {
			console.error(error);
			const errStr =
				error instanceof Error
					? error.message
					: typeof error === 'object'
						? JSON.stringify(error)
						: String(error);
			toast.error(`Connection Error: ${errStr}`, { duration: 10000 });

			localStorage.removeItem('clinicflow_server_url');
		} finally {
			isConnecting = false;
		}
	}

	function handleConnectCloudUrl() {
		if (!cloudUrl) {
			toast.error('Please enter a valid Cloud URL');
			return;
		}
		const url = cloudUrl.startsWith('http') ? cloudUrl : `https://${cloudUrl}`;
		connectToServer(url);
	}

	function handleConnectLocal() {
		if (!localIp) {
			toast.error('Please enter a valid IP address');
			return;
		}
		const url = localIp.startsWith('http') ? localIp : `http://${localIp}`;
		connectToServer(url);
	}

	async function handleAutoDetect() {
		isConnecting = true;
		// Include standard dev ports, plus unique ClinicFlow production ports (27341, 27342)
		const ports = ['27341', '27342', '5173', '3000', '8080', '80', '4173'];
		let foundUrl = '';

		toast.loading('Scanning local network for Master Server...', { id: 'autodetect' });

		for (const port of ports) {
			const url = `http://clinicflow.local:${port}`;
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 1500); // Fast timeout for scanning

				// Ping a static asset to bypass Service Worker routing logic safely
				const res = await fetch(`${url}/favicon.svg`, {
					signal: controller.signal,
					mode: 'no-cors'
				});
				clearTimeout(timeoutId);

				foundUrl = url;
				break;
			} catch (e) {
				// Failed to connect on this port, continue
			}
		}

		if (foundUrl) {
			toast.success(`Found server at ${foundUrl}`, { id: 'autodetect' });
			// Connect using the found URL
			await connectToServer(foundUrl);
		} else {
			isConnecting = false;
			toast.error(
				'Auto-detect failed. Your router might block mDNS. Please enter the IP manually.',
				{ id: 'autodetect' }
			);
		}
	}

	function handleInitMasterServer() {
		localStorage.setItem('clinicflow_is_master', 'true');
		goto('/onboarding');
	}

	onMount(() => {
		const token = page.url.searchParams.get('token');
		if (token) {
			// The pairing QR links to the issuing server's own /connect route, so the
			// current origin is the server to contact. No separate serverUrl param is
			// generated by the admin UI, and pairing is never automatic.
			preparePairing({ token, serverUrl: window.location.origin });
		}
	});
</script>

<svelte:head>
	<title>Connect to Server - ClinicFlow</title>
</svelte:head>

<div
	class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-8"
>
	<div class="w-full max-w-lg" in:fade={{ duration: 400 }}>
		<div class="text-center mb-8">
			<div
				class="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-2xl mb-4"
			>
				<Link2 class="size-8" />
			</div>
			<h1 class="text-3xl font-extrabold tracking-tight text-foreground">Connect Device</h1>
			<p class="text-muted-foreground mt-2">Link this device to your clinic's database network.</p>
		</div>

		<Card class="shadow-xl border-border/50 overflow-hidden">
			{#if connectionMode === 'select'}
				<div class="p-6 space-y-4" in:slide={{ duration: 300 }}>
					<button
						class="w-full flex items-start gap-4 p-5 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-left group"
						onclick={() => {
							const defaultUrl = getServerUrl();
							cloudUrl = defaultUrl || '';
							connectionMode = 'cloud';
						}}
					>
						<div
							class="p-3 bg-blue-500/10 text-blue-500 rounded-lg group-hover:scale-110 transition-transform"
						>
							<Cloud class="size-6" />
						</div>
						<div class="flex-1">
							<h3 class="font-bold text-foreground">Cloud Server</h3>
							<p class="text-sm text-muted-foreground leading-relaxed mt-1">
								Connect to the managed ClinicFlow cloud. Requires stable internet.
							</p>
						</div>
						<ArrowRight
							class="size-5 text-muted-foreground group-hover:text-primary mt-3 transition-colors"
						/>
					</button>

					<button
						class="w-full flex items-start gap-4 p-5 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-left group"
						onclick={() => (connectionMode = 'local')}
					>
						<div
							class="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover:scale-110 transition-transform"
						>
							<Server class="size-6" />
						</div>
						<div class="flex-1">
							<h3 class="font-bold text-foreground">Local Network Server</h3>
							<p class="text-sm text-muted-foreground leading-relaxed mt-1">
								Connect to a computer in this clinic via Wi-Fi. No internet required.
							</p>
						</div>
						<ArrowRight
							class="size-5 text-muted-foreground group-hover:text-primary mt-3 transition-colors"
						/>
					</button>
				</div>
			{:else if connectionMode === 'local'}
				<div class="p-6" in:slide={{ duration: 300 }}>
					<button
						class="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center transition-colors"
						onclick={() => (connectionMode = 'select')}
					>
						← Back to options
					</button>

					<div class="space-y-6">
						<div class="space-y-3">
							<Label class="text-base">Server IP Address</Label>
							<Input
								bind:value={localIp}
								placeholder="e.g. 192.168.1.100:5173"
								class="h-14 text-lg font-mono"
								onkeydown={(e) => e.key === 'Enter' && handleConnectLocal()}
							/>
							<p class="text-sm text-muted-foreground">
								Find this IP address on the main computer's dashboard.
							</p>
						</div>

						<div class="flex items-center gap-4">
							<div class="h-px bg-border flex-1"></div>
							<span class="text-xs font-semibold text-muted-foreground uppercase tracking-widest"
								>OR</span
							>
							<div class="h-px bg-border flex-1"></div>
						</div>

						<Button
							variant="outline"
							class="w-full h-14 border-primary/20 text-primary hover:bg-primary/5"
							disabled={isConnecting}
							onclick={handleAutoDetect}
						>
							<Wifi class="size-5 mr-2" />
							Auto-Detect Network Server
						</Button>

						<Button
							variant="outline"
							class="w-full h-14 border-border text-foreground hover:bg-muted mt-3"
							onclick={() => (scannerOpen = true)}
						>
							<QrCode class="size-4 mr-2" />
							Scan QR Code
						</Button>

						<Button
							class="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
							disabled={isConnecting}
							onclick={handleConnectLocal}
						>
							{#if isConnecting}
								<Loader2 class="size-5 mr-2 animate-spin" /> Connecting...
							{:else}
								Connect <ArrowRight class="size-5 ml-2" />
							{/if}
						</Button>
					</div>
				</div>
			{:else if connectionMode === 'cloud'}
				<div class="p-6" in:slide={{ duration: 300 }}>
					<button
						class="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center transition-colors"
						onclick={() => (connectionMode = 'select')}
					>
						← Back to options
					</button>

					<div class="space-y-6">
						<div class="space-y-3">
							<Label class="text-base">Cloud Server URL</Label>
							<Input
								bind:value={cloudUrl}
								placeholder="e.g. https://clinic.clinicflow.org"
								class="h-14 text-lg font-mono"
								onkeydown={(e) => e.key === 'Enter' && handleConnectCloudUrl()}
							/>
							<p class="text-sm text-muted-foreground">
								Admins can connect directly to their cloud clinic. Kiosks and staff tablets should
								use a secure Pairing Link instead.
							</p>
						</div>

						<Button
							class="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
							disabled={isConnecting}
							onclick={handleConnectCloudUrl}
						>
							{#if isConnecting}
								<Loader2 class="size-5 mr-2 animate-spin" /> Connecting...
							{:else}
								Connect to Cloud <ArrowRight class="size-5 ml-2" />
							{/if}
						</Button>
					</div>
				</div>
			{/if}
		</Card>

		{#if connectionMode === 'select'}
			<div class="mt-8 pt-8 border-t border-border/50 text-center relative">
				<span
					class="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-50 dark:bg-slate-950 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest"
					>Admin Setup</span
				>
				<Button
					variant="ghost"
					class="text-muted-foreground hover:text-foreground"
					onclick={() => (connectionMode = 'master_setup')}
				>
					<HardDrive class="size-4 mr-2" />
					Initialize as Master Server
				</Button>
			</div>
		{/if}

		{#if connectionMode === 'master_setup'}
			<div
				class="mt-6 p-6 bg-card rounded-2xl shadow-xl border border-primary/20"
				in:slide={{ duration: 400 }}
			>
				<div class="flex flex-col items-center text-center space-y-4">
					<div class="p-4 bg-primary/10 rounded-2xl text-primary">
						<HardDrive class="size-8" />
					</div>
					<div>
						<h3 class="text-2xl font-bold">Master Server Setup</h3>
						<p class="text-muted-foreground mt-2">
							Configure this computer as the central offline sync hub for your clinic.
						</p>
					</div>

					<div class="w-full space-y-4 text-left my-4">
						<div class="flex gap-4">
							<Database class="size-6 text-primary shrink-0" />
							<div>
								<h4 class="font-semibold">Local Offline Database</h4>
								<p class="text-sm text-muted-foreground">
									Creates a fast database directly on this computer's hard drive.
								</p>
							</div>
						</div>
						<div class="flex gap-4">
							<Wifi class="size-6 text-primary shrink-0" />
							<div>
								<h4 class="font-semibold">Automatic Network Broadcasting</h4>
								<p class="text-sm text-muted-foreground">
									Tablets on the same Wi-Fi will find this server automatically via mDNS.
								</p>
							</div>
						</div>
						<div class="flex gap-4">
							<ShieldCheck class="size-6 text-primary shrink-0" />
							<div>
								<h4 class="font-semibold">Secure Device Pairing</h4>
								<p class="text-sm text-muted-foreground">
									Generates a one-time QR code for tablets to scan and authenticate.
								</p>
							</div>
						</div>
					</div>

					<div class="flex w-full gap-4 pt-4">
						<Button variant="ghost" class="flex-1" onclick={() => (connectionMode = 'select')}
							>Cancel</Button
						>
						<Button class="flex-1" onclick={handleInitMasterServer}>Start Setup Wizard</Button>
					</div>
				</div>
			</div>
		{/if}

		<!-- QR scanner: mounted only while open so the camera is released on close -->
		<Dialog.Root bind:open={scannerOpen}>
			<Dialog.Content class="sm:max-w-lg">
				<Dialog.Header>
					<Dialog.Title>Scan pairing QR code</Dialog.Title>
					<Dialog.Description>
						Point the camera at the QR code shown by your clinic administrator.
					</Dialog.Description>
				</Dialog.Header>
				{#if scannerOpen}
					<QrScanner onResult={handleScanResult} />
				{/if}
			</Dialog.Content>
		</Dialog.Root>

		<!-- Explicit pairing confirmation: no device is registered until confirmed -->
		<Dialog.Root
			open={!!pendingPairing}
			onOpenChange={(open) => {
				if (!open && !isPairing) pendingPairing = null;
			}}
		>
			<Dialog.Content class="sm:max-w-md">
				<Dialog.Header>
					<Dialog.Title class="flex items-center gap-2">
						<Smartphone class="size-5" /> Confirm device pairing
					</Dialog.Title>
					<Dialog.Description>
						This device will be registered as <strong>pending</strong>. An administrator must
						approve it before it can be used.
					</Dialog.Description>
				</Dialog.Header>
				{#if pendingPairing}
					<div class="space-y-4 py-2">
						<div class="space-y-2">
							<Label for="pairing-device-name">Device name</Label>
							<Input
								id="pairing-device-name"
								bind:value={deviceName}
								disabled={isPairing}
								placeholder="e.g. Tablet-1A2B3C4D"
							/>
							<p class="text-sm text-muted-foreground">
								Pairing with {pendingPairing.serverUrl}
							</p>
						</div>
					</div>
				{/if}
				<Dialog.Footer>
					<Button variant="outline" disabled={isPairing} onclick={() => (pendingPairing = null)}
						>Cancel</Button
					>
					<Button disabled={isPairing} onclick={confirmPairing}>
						{#if isPairing}
							<Loader2 class="size-4 mr-2 animate-spin" /> Pairing...
						{:else}
							Confirm pairing
						{/if}
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>

		<!-- Real status returned by validatePairingToken; never claims approval -->
		{#if pairedResult}
			<Card class="shadow-xl border-border/50 mt-6">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<ShieldCheck class="size-5 text-amber-500" /> Device registered
					</CardTitle>
					<CardDescription>
						An administrator must approve this device before it can be used.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-2 text-sm">
					<p><span class="font-medium">Status:</span> {pairedResult.status}</p>
					<p><span class="font-medium">Device:</span> {deviceName || pairedResult.deviceId}</p>
					<p class="text-muted-foreground break-all">Device ID: {pairedResult.deviceId}</p>
					<Button class="w-full mt-4" onclick={() => goto('/login')}>Continue to login</Button>
				</CardContent>
			</Card>
		{/if}

		<!-- Loader Overlay -->
		{#if isConnecting && connectionMode === 'select'}
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
				in:fade
			>
				<div
					class="flex flex-col items-center gap-4 p-8 bg-card rounded-2xl shadow-2xl border border-border"
				>
					<Loader2 class="size-12 animate-spin text-primary" />
					<p class="font-bold text-lg animate-pulse">Contacting Server...</p>
				</div>
			</div>
		{/if}
	</div>
</div>
