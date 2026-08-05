<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import { Monitor, Smartphone, Download, HardDrive, Cpu, ShieldCheck } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Download ClinicFlow</title>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-16 animate-fade-in flex-1">
	<div class="text-center mb-16">
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
			Download ClinicFlow
		</h1>
		<p class="mt-4 text-xl text-muted-foreground">
			Get the standalone kiosk app for your clinic hardware.
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<!-- Windows -->
		<Card class="bg-card/60 card-hover overflow-hidden border-border/80">
			<div class="h-2 w-full bg-blue-500"></div>
			<CardHeader>
				<div
					class="size-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4"
				>
					<Monitor class="size-6" />
				</div>
				<CardTitle class="text-2xl">Windows (64-bit)</CardTitle>
				<CardDescription>Recommended for Reception and Doctor Desks.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<ul class="space-y-2 text-sm text-muted-foreground">
					<li class="flex items-center gap-2"><Cpu class="size-4" /> Windows 10 or 11 (64-bit)</li>
					<li class="flex items-center gap-2"><HardDrive class="size-4" /> 4GB RAM minimum</li>
					<li class="flex items-center gap-2">
						<ShieldCheck class="size-4" /> Auto-updates enabled
					</li>
				</ul>
				<Button
					href="/api/download?os=windows&arch=x64"
					class="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white btn-press"
				>
					<Download class="mr-2 size-5" />
					Download .exe (64-bit)
				</Button>
			</CardContent>
		</Card>

		<!-- Android -->
		<Card class="bg-card/60 card-hover overflow-hidden border-border/80">
			<div class="h-2 w-full bg-emerald-500"></div>
			<CardHeader>
				<div
					class="size-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4"
				>
					<Smartphone class="size-6" />
				</div>
				<CardTitle class="text-2xl">Android Tablet</CardTitle>
				<CardDescription>Recommended for Nurse Triage Stations.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<ul class="space-y-2 text-sm text-muted-foreground">
					<li class="flex items-center gap-2"><Cpu class="size-4" /> Android 10.0 or higher</li>
					<li class="flex items-center gap-2"><HardDrive class="size-4" /> 3GB RAM minimum</li>
					<li class="flex items-center gap-2">
						<ShieldCheck class="size-4" /> Sideloading must be enabled
					</li>
				</ul>
				<div class="flex flex-col gap-2">
					<Button
						href="/api/download?os=android&arch=aarch64"
						class="w-full h-10 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white btn-press"
					>
						<Download class="mr-2 size-4" />
						Download APK (ARM64)
					</Button>
					<Button
						href="/api/download?os=android&arch=armv7"
						variant="outline"
						class="w-full h-10 text-sm font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 btn-press"
					>
						<Download class="mr-2 size-4" />
						Download APK (ARM32)
					</Button>
				</div>
			</CardContent>
		</Card>
		<!-- macOS -->
		<Card class="bg-card/60 card-hover overflow-hidden border-border/80">
			<div class="h-2 w-full bg-slate-500"></div>
			<CardHeader>
				<div
					class="size-12 rounded-xl bg-slate-500/10 text-slate-500 flex items-center justify-center mb-4"
				>
					<Monitor class="size-6" />
				</div>
				<CardTitle class="text-2xl">macOS (Apple Silicon / Intel)</CardTitle>
				<CardDescription>Recommended for Admin and Pharmacy Desks.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<ul class="space-y-2 text-sm text-muted-foreground">
					<li class="flex items-center gap-2"><Cpu class="size-4" /> macOS 11.0 or higher</li>
					<li class="flex items-center gap-2"><HardDrive class="size-4" /> 4GB RAM minimum</li>
					<li class="flex items-center gap-2">
						<ShieldCheck class="size-4" /> Auto-updates enabled
					</li>
				</ul>
				<div class="flex flex-col gap-2">
					<Button
						href="/api/download?os=macos&arch=aarch64"
						class="w-full h-10 text-sm font-bold bg-slate-600 hover:bg-slate-700 text-white btn-press"
					>
						<Download class="mr-2 size-4" />
						Apple Silicon (M1/M2/M3)
					</Button>
					<Button
						href="/api/download?os=macos&arch=x64"
						variant="outline"
						class="w-full h-10 text-sm font-bold text-slate-600 border-slate-200 hover:bg-slate-50 btn-press"
					>
						<Download class="mr-2 size-4" />
						Intel Mac
					</Button>
				</div>
			</CardContent>
		</Card>

		<!-- Linux -->
		<Card class="bg-card/60 card-hover overflow-hidden border-border/80">
			<div class="h-2 w-full bg-orange-500"></div>
			<CardHeader>
				<div
					class="size-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4"
				>
					<Monitor class="size-6" />
				</div>
				<CardTitle class="text-2xl">Linux (Debian/Ubuntu)</CardTitle>
				<CardDescription>Recommended for affordable open-source setups.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<ul class="space-y-2 text-sm text-muted-foreground">
					<li class="flex items-center gap-2"><Cpu class="size-4" /> Ubuntu 20.04+ or Debian 11+</li>
					<li class="flex items-center gap-2"><HardDrive class="size-4" /> 4GB RAM minimum</li>
					<li class="flex items-center gap-2">
						<ShieldCheck class="size-4" /> dpkg installation required
					</li>
				</ul>
				<div class="flex flex-col gap-2">
					<Button
						href="/api/download?os=linux&arch=x64"
						class="w-full h-10 text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white btn-press"
					>
						<Download class="mr-2 size-4" />
						Download .deb (AMD64)
					</Button>
					<Button
						href="/api/download?os=linux&arch=aarch64"
						variant="outline"
						class="w-full h-10 text-sm font-bold text-orange-600 border-orange-200 hover:bg-orange-50 btn-press"
					>
						<Download class="mr-2 size-4" />
						Download .deb (ARM64)
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Installation Guide -->
	<div class="mt-20">
		<h2 class="text-3xl font-bold tracking-tight text-foreground text-center mb-8">
			Installation Guide
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<Card class="bg-card/40 border-border shadow-sm">
				<CardHeader>
					<div class="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-2">1</div>
					<CardTitle>Download & Install</CardTitle>
				</CardHeader>
				<CardContent class="text-muted-foreground text-sm">
					Choose the correct installer for your operating system above. Run the installer and follow the on-screen instructions.
				</CardContent>
			</Card>
			<Card class="bg-card/40 border-border shadow-sm">
				<CardHeader>
					<div class="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-2">2</div>
					<CardTitle>First Launch</CardTitle>
				</CardHeader>
				<CardContent class="text-muted-foreground text-sm">
					Open the ClinicFlow app. You will need an active internet connection on the first launch to perform the initial database pull.
				</CardContent>
			</Card>
			<Card class="bg-card/40 border-border shadow-sm">
				<CardHeader>
					<div class="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-2">3</div>
					<CardTitle>Go Offline</CardTitle>
				</CardHeader>
				<CardContent class="text-muted-foreground text-sm">
					Once synchronized, the app operates 100% locally. You can disconnect from the internet and continue registering patients and dispensing drugs.
				</CardContent>
			</Card>
		</div>
	</div>
</div>
