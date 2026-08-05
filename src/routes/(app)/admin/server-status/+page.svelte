<script lang="ts">
	import { getServerStatus, generatePairingToken } from '$lib/remote/server-status.remote';
	import { getDevices } from '$lib/remote/devices.remote';
	import { getUplinkConfig, saveUplinkConfig, testUplinkConnection, removeUplinkConfig } from '$lib/remote/cloud-uplink.remote';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Server,
		Wifi,
		Cpu,
		Tablet,
		Clock,
		RefreshCw,
		QrCode,
		ShieldCheck,
		CloudUpload,
		AlertTriangle,
		CheckCircle2,
		HardDrive,
		Activity,
		Timer,
		Link2,
		Unlink,
		Loader2
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { onMount, onDestroy } from 'svelte';

	// Remote data
	let status = $state<Awaited<ReturnType<typeof getServerStatus>>>(null);
	let devices = $state<Awaited<ReturnType<typeof getDevices>>>([]);
	let uplinkCfg = $state<Awaited<ReturnType<typeof getUplinkConfig>>>(null);
	let uplinkConnected = $state<boolean | null>(null);
	let pairingToken = $state<{ token: string; expiresAt: number } | null>(null);
	let showQr = $state(false);
	let qrDataUrl = $state('');
	let tokenCountdown = $state(0);
	let countdownInterval: ReturnType<typeof setInterval>;
	let refreshInterval: ReturnType<typeof setInterval>;
	let isGenerating = $state(false);

	// Cloud uplink form
	let showUplinkForm = $state(false);
	let uplinkKeyInput = $state('');
	let saPasswordInput = $state('');
	let isSavingUplink = $state(false);
	let isTestingUplink = $state(false);

	// Format uptime nicely
	function formatUptime(seconds: number) {
		const d = Math.floor(seconds / 86400);
		const h = Math.floor((seconds % 86400) / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		if (d > 0) return `${d}d ${h}h ${m}m`;
		if (h > 0) return `${h}h ${m}m`;
		return `${m}m ${Math.floor(seconds % 60)}s`;
	}

	async function refresh() {
		[status, devices, uplinkCfg] = await Promise.all([
			getServerStatus(),
			getDevices(),
			getUplinkConfig()
		]);
	}

	async function handleTestUplink() {
		isTestingUplink = true;
		try {
			const result = await testUplinkConnection();
			uplinkConnected = result.connected;
			if (result.connected) toast.success('Cloud connection successful!');
			else toast.error(`Connection failed: ${result.reason ?? 'Unknown error'}`);
		} finally {
			isTestingUplink = false;
		}
	}

	// Form handlers are now managed by enhance actions directly in the markup for saveUplinkConfig and removeUplinkConfig



	async function handleGeneratePairingCode() {
		isGenerating = true;
		try {
			const result = await generatePairingToken();
			if (!result) return toast.error('Not authorized to generate pairing codes.');

			pairingToken = result;
			tokenCountdown = Math.round((result.expiresAt - Date.now()) / 1000);

			// Generate QR code URL
			const pairingUrl = `${window.location.origin}/connect?token=${result.token}`;
			const { default: QRCode } = await import('qrcode');
			qrDataUrl = await QRCode.toDataURL(pairingUrl, { width: 280, margin: 2, color: { dark: '#0f172a', light: '#f8fafc' } });

			showQr = true;

			// Countdown timer
			clearInterval(countdownInterval);
			countdownInterval = setInterval(() => {
				tokenCountdown--;
				if (tokenCountdown <= 0) {
					clearInterval(countdownInterval);
					showQr = false;
					pairingToken = null;
					qrDataUrl = '';
				}
			}, 1000);
		} catch (e) {
			toast.error('Failed to generate pairing code.');
		} finally {
			isGenerating = false;
		}
	}

	onMount(async () => {
		await refresh();
		refreshInterval = setInterval(refresh, 15_000); // refresh every 15s
	});

	onDestroy(() => {
		clearInterval(refreshInterval);
		clearInterval(countdownInterval);
	});
</script>

<svelte:head>
	<title>Server Status - ClinicFlow Admin</title>
</svelte:head>

<div class="p-6 space-y-6 max-w-5xl mx-auto">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10">
				<Server class="size-6 text-primary" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Server Status</h1>
				<p class="text-sm text-muted-foreground">Real-time monitoring of the local master server</p>
			</div>
		</div>
		<Button variant="outline" size="sm" onclick={refresh} class="gap-2">
			<RefreshCw class="size-4" />
			Refresh
		</Button>
	</div>

	{#if !status}
		<Card class="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
			<CardContent class="flex items-center gap-3 py-4">
				<AlertTriangle class="size-5 text-amber-500" />
				<p class="text-sm text-amber-700 dark:text-amber-400">
					Server status is only available on the local Master Server. This feature requires <code class="font-mono">DATABASE_URL</code> to point to a local SQLite database.
				</p>
			</CardContent>
		</Card>
	{:else}
		<!-- Status Cards -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<Card class="border-border/50">
				<CardContent class="pt-5">
					<div class="flex items-center gap-2 text-muted-foreground mb-1">
						<Timer class="size-4" />
						<span class="text-xs font-medium uppercase tracking-wide">Uptime</span>
					</div>
					<p class="text-2xl font-bold text-foreground">{formatUptime(status.uptimeSeconds)}</p>
				</CardContent>
			</Card>

			<Card class="border-border/50">
				<CardContent class="pt-5">
					<div class="flex items-center gap-2 text-muted-foreground mb-1">
						<Cpu class="size-4" />
						<span class="text-xs font-medium uppercase tracking-wide">Memory</span>
					</div>
					<p class="text-2xl font-bold text-foreground">{status.memoryMb} <span class="text-base font-normal text-muted-foreground">MB</span></p>
				</CardContent>
			</Card>

			<Card class="border-border/50">
				<CardContent class="pt-5">
					<div class="flex items-center gap-2 text-muted-foreground mb-1">
						<Tablet class="size-4" />
						<span class="text-xs font-medium uppercase tracking-wide">Active Devices</span>
					</div>
					<p class="text-2xl font-bold text-foreground">{status.activeDevices}</p>
				</CardContent>
			</Card>

			<Card class="border-border/50">
				<CardContent class="pt-5">
					<div class="flex items-center gap-2 text-muted-foreground mb-1">
						<Activity class="size-4" />
						<span class="text-xs font-medium uppercase tracking-wide">Node</span>
					</div>
					<p class="text-2xl font-bold text-foreground">{status.nodeVersion}</p>
				</CardContent>
			</Card>
		</div>

		<!-- Network & mDNS -->
		<Card class="border-border/50">
			<CardHeader class="pb-3">
				<div class="flex items-center gap-2">
					<Wifi class="size-5 text-primary" />
					<CardTitle class="text-base">Network Broadcasting</CardTitle>
				</div>
				<CardDescription>Tablets on the same Wi-Fi automatically discover this server.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-3">
				<div class="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
					<CheckCircle2 class="size-5 text-emerald-500 shrink-0" />
					<div>
						<p class="text-sm font-semibold text-foreground">mDNS Active</p>
						<p class="text-xs text-muted-foreground font-mono">clinicflow-server.local</p>
					</div>
					<Badge variant="outline" class="ml-auto border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Broadcasting</Badge>
				</div>
			</CardContent>
		</Card>

		<!-- Device Pairing -->
		<Card class="border-border/50">
			<CardHeader class="pb-3">
				<div class="flex items-center gap-2">
					<ShieldCheck class="size-5 text-primary" />
					<CardTitle class="text-base">Secure Device Pairing</CardTitle>
				</div>
				<CardDescription>Generate a one-time QR code for a tablet to scan and pair with this server.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				{#if status.pendingDevices > 0}
					<div class="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
						<AlertTriangle class="size-4 text-amber-500 shrink-0" />
						<span class="text-amber-700 dark:text-amber-400"><strong>{status.pendingDevices}</strong> device(s) waiting for approval in <a href="/admin/devices" class="underline">Device Manager</a>.</span>
					</div>
				{/if}

				{#if showQr && qrDataUrl}
					<div class="flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-xl border border-border/50">
						<img src={qrDataUrl} alt="Pairing QR Code" class="rounded-xl shadow-lg" width="200" height="200" />
						<div class="text-center space-y-1">
							<p class="text-sm font-semibold">Scan with a tablet to pair it</p>
							<p class="text-xs text-muted-foreground font-mono tracking-widest">{pairingToken?.token}</p>
							<div class="flex items-center justify-center gap-1.5 text-xs mt-2"
								class:text-emerald-500={tokenCountdown > 60}
								class:text-amber-500={tokenCountdown <= 60 && tokenCountdown > 20}
								class:text-red-500={tokenCountdown <= 20}
							>
								<Clock class="size-3" />
								<span>Expires in {tokenCountdown}s</span>
							</div>
						</div>
						<Button variant="outline" size="sm" onclick={handleGeneratePairingCode}>Regenerate</Button>
					</div>
				{:else}
					<Button onclick={handleGeneratePairingCode} disabled={isGenerating} class="w-full h-12 gap-2">
						<QrCode class="size-5" />
						{isGenerating ? 'Generating...' : 'Generate Pairing QR Code'}
					</Button>
				{/if}
			</CardContent>
		</Card>

		<!-- Cloud Uplink -->
		<Card class="border-border/50">
			<CardHeader class="pb-3">
				<div class="flex items-center gap-2">
					<CloudUpload class="size-5 text-primary" />
					<CardTitle class="text-base">Cloud Uplink</CardTitle>
				</div>
				<CardDescription>Sync this server's data to the central ClinicFlow cloud when internet is available.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				{#if uplinkCfg?.isConfigured}
					<!-- Connected state -->
					<div class="space-y-3">
						<div class="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
							<CheckCircle2 class="size-5 text-emerald-500 shrink-0" />
							<div class="flex-1 min-w-0">
								<p class="text-sm font-semibold">Uplink Configured</p>
								<p class="text-xs text-muted-foreground font-mono truncate">{uplinkCfg.cloudUrl}</p>
							</div>
							{#if uplinkConnected === true}
								<Badge class="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Online</Badge>
							{:else if uplinkConnected === false}
								<Badge variant="destructive">Offline</Badge>
							{/if}
						</div>
						<div class="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">
							<ShieldCheck class="size-4 text-primary shrink-0" />
							<div>
								<p class="font-medium">SuperAdmin Mirrored</p>
								<p class="text-xs text-muted-foreground">{uplinkCfg.superAdminEmail} can log in offline.</p>
							</div>
						</div>
						<div class="flex gap-2">
							<Button variant="outline" size="sm" class="flex-1 gap-2" onclick={handleTestUplink} disabled={isTestingUplink}>
								{#if isTestingUplink}<Loader2 class="size-4 animate-spin" />{:else}<Link2 class="size-4" />{/if}
								Test Connection
							</Button>
							<form {...removeUplinkConfig.enhance(async (form) => {
								await form.submit();
								uplinkCfg = null;
								uplinkConnected = null;
								toast.info('Cloud uplink removed.');
							})}>
								<Button type="submit" variant="outline" size="sm" class="gap-2 text-destructive hover:text-destructive w-full">
									<Unlink class="size-4" />
									Remove
								</Button>
							</form>
						</div>
					</div>
				{:else if showUplinkForm}
					<!-- Config form -->
					<form 
						class="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50"
						{...saveUplinkConfig.enhance(async (form) => {
							isSavingUplink = true;
							try {
								if (await form.submit()) {
									if (saveUplinkConfig.result) {
										toast.success(`Connected to ${saveUplinkConfig.result.cloudUrl}. SuperAdmin credentials mirrored for offline access.`);
										showUplinkForm = false;
										await refresh();
									}
								}
							} catch (e: any) {
								toast.error(e.message ?? 'Failed to save uplink config.');
							} finally {
								isSavingUplink = false;
							}
						})}
					>
						<div class="space-y-2">
							<Label for="uplink-key">Cloud Uplink Key</Label>
							<Input
								{...saveUplinkConfig.fields.uplinkKeyBase64.as('text')}
								placeholder="Paste your base64 uplink key from the cloud dashboard"
								class="font-mono text-xs"
							/>
							<p class="text-xs text-muted-foreground">Generate this key in your ClinicFlow Cloud Admin → PHC Management → Generate Uplink Key.</p>
						</div>
						<div class="space-y-2">
							<Label for="sa-password">SuperAdmin Password</Label>
							<Input
								{...saveUplinkConfig.fields.superAdminPassword.as('password')}
								placeholder="Enter the cloud SuperAdmin password"
							/>
							<p class="text-xs text-muted-foreground">Used once to create an offline login hash. Never stored in plaintext.</p>
						</div>
						<div class="flex gap-2">
							<Button variant="ghost" class="flex-1" onclick={() => showUplinkForm = false}>Cancel</Button>
							<Button type="submit" class="flex-1 gap-2" disabled={isSavingUplink}>
								{#if isSavingUplink}<Loader2 class="size-4 animate-spin" />{:else}<CloudUpload class="size-4" />{/if}
								Connect to Cloud
							</Button>
						</div>
					</form>
				{:else}
					<!-- Not configured -->
					<div class="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
						<HardDrive class="size-5 text-muted-foreground shrink-0" />
						<div class="flex-1">
							<p class="text-sm font-medium">Not configured</p>
							<p class="text-xs text-muted-foreground">Connect to the cloud to enable sync and SuperAdmin offline access.</p>
						</div>
						<Button variant="outline" size="sm" onclick={() => showUplinkForm = true}>Configure</Button>
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
