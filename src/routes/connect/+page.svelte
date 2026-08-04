<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Cloud, Server, QrCode, ArrowRight, Loader2, Link2, HardDrive, Database, Wifi, ShieldCheck } from '@lucide/svelte';
	import { slide, fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { checkServerStatus } from '$lib/remote/setup.remote';
	import { getServerUrl } from '$lib/utils/server';

	let connectionMode = $state<'select' | 'local' | 'scanning' | 'master_setup'>('select');
	let localIp = $state('');
	let isConnecting = $state(false);

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
			toast.error('Failed to connect to the server. Please check the address and try again.');
			localStorage.removeItem('clinicflow_server_url');
		} finally {
			isConnecting = false;
		}
	}

	function handleConnectCloud() {
		const url = getServerUrl();
		if (!url) {
			toast.error('Cloud server URL is not configured.');
			return;
		}
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

	function handleInitMasterServer() {
		localStorage.setItem('clinicflow_is_master', 'true');
		goto('/onboarding');
	}
</script>

<svelte:head>
	<title>Connect to Server - ClinicFlow</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-8">
	
	<div class="w-full max-w-lg" in:fade={{ duration: 400 }}>
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-2xl mb-4">
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
						onclick={handleConnectCloud}
					>
						<div class="p-3 bg-blue-500/10 text-blue-500 rounded-lg group-hover:scale-110 transition-transform">
							<Cloud class="size-6" />
						</div>
						<div class="flex-1">
							<h3 class="font-bold text-foreground">Cloud Server</h3>
							<p class="text-sm text-muted-foreground leading-relaxed mt-1">Connect to the managed ClinicFlow cloud. Requires stable internet.</p>
						</div>
						<ArrowRight class="size-5 text-muted-foreground group-hover:text-primary mt-3 transition-colors" />
					</button>

					<button 
						class="w-full flex items-start gap-4 p-5 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-left group"
						onclick={() => connectionMode = 'local'}
					>
						<div class="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover:scale-110 transition-transform">
							<Server class="size-6" />
						</div>
						<div class="flex-1">
							<h3 class="font-bold text-foreground">Local Network Server</h3>
							<p class="text-sm text-muted-foreground leading-relaxed mt-1">Connect to a computer in this clinic via Wi-Fi. No internet required.</p>
						</div>
						<ArrowRight class="size-5 text-muted-foreground group-hover:text-primary mt-3 transition-colors" />
					</button>
				</div>
			
			{:else if connectionMode === 'local'}
				<div class="p-6" in:slide={{ duration: 300 }}>
					<button 
						class="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center transition-colors"
						onclick={() => connectionMode = 'select'}
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
							<p class="text-sm text-muted-foreground">Find this IP address on the main computer's dashboard.</p>
						</div>

						<div class="flex items-center gap-4">
							<div class="h-px bg-border flex-1"></div>
							<span class="text-xs font-semibold text-muted-foreground uppercase tracking-widest">OR</span>
							<div class="h-px bg-border flex-1"></div>
						</div>

						<Button 
							variant="outline" 
							class="w-full h-14 border-primary/20 text-primary hover:bg-primary/5"
							onclick={() => toast.info('QR Scanner component not implemented yet!')}
						>
							<QrCode class="size-5 mr-2" />
							Scan QR Code from Main Computer
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
			{/if}
		</Card>

		{#if connectionMode === 'select'}
			<div class="mt-8 pt-8 border-t border-border/50 text-center relative">
				<span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-50 dark:bg-slate-950 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Admin Setup</span>
				<Button variant="ghost" class="text-muted-foreground hover:text-foreground" onclick={() => connectionMode = 'master_setup'}>
					<HardDrive class="size-4 mr-2" />
					Initialize as Master Server
				</Button>
			</div>
		{/if}

		{#if connectionMode === 'master_setup'}
			<div class="mt-6 p-6 bg-card rounded-2xl shadow-xl border border-primary/20" in:slide={{ duration: 400 }}>
				<div class="flex flex-col items-center text-center space-y-4">
					<div class="p-4 bg-primary/10 rounded-2xl text-primary">
						<HardDrive class="size-8" />
					</div>
					<div>
						<h3 class="text-2xl font-bold">Master Server Setup</h3>
						<p class="text-muted-foreground mt-2">Configure this computer as the central offline sync hub for your clinic.</p>
					</div>
					
					<div class="w-full space-y-4 text-left my-4">
						<div class="flex gap-4">
							<Database class="size-6 text-primary shrink-0" />
							<div>
								<h4 class="font-semibold">Local Offline Database</h4>
								<p class="text-sm text-muted-foreground">Creates a fast database directly on this computer's hard drive.</p>
							</div>
						</div>
						<div class="flex gap-4">
							<Wifi class="size-6 text-primary shrink-0" />
							<div>
								<h4 class="font-semibold">Automatic Network Broadcasting</h4>
								<p class="text-sm text-muted-foreground">Tablets on the same Wi-Fi will find this server automatically via mDNS.</p>
							</div>
						</div>
						<div class="flex gap-4">
							<ShieldCheck class="size-6 text-primary shrink-0" />
							<div>
								<h4 class="font-semibold">Secure Device Pairing</h4>
								<p class="text-sm text-muted-foreground">Generates a one-time QR code for tablets to scan and authenticate.</p>
							</div>
						</div>
					</div>

					<div class="flex w-full gap-4 pt-4">
						<Button variant="ghost" class="flex-1" onclick={() => connectionMode = 'select'}>Cancel</Button>
						<Button class="flex-1" onclick={handleInitMasterServer}>Start Setup Wizard</Button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Loader Overlay -->
		{#if isConnecting && connectionMode === 'select'}
			<div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" in:fade>
				<div class="flex flex-col items-center gap-4 p-8 bg-card rounded-2xl shadow-2xl border border-border">
					<Loader2 class="size-12 animate-spin text-primary" />
					<p class="font-bold text-lg animate-pulse">Contacting Server...</p>
				</div>
			</div>
		{/if}
	</div>
</div>
