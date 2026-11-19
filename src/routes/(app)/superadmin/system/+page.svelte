<script lang="ts">
	import { getServerStatus } from '#lib/remote/server-status.remote.ts';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '#lib/components/ui/card/index.ts';
	import { ServerCrash, Database, RefreshCw, Users, Clock } from '@lucide/svelte';

	// Point-in-time snapshot from the server. No fabricated or random metrics.
	const status = await getServerStatus();

	function formatUptime(totalSeconds: number): string {
		const days = Math.floor(totalSeconds / 86_400);
		const hours = Math.floor((totalSeconds % 86_400) / 3_600);
		const minutes = Math.floor((totalSeconds % 3_600) / 60);
		const parts: string[] = [];
		if (days > 0) parts.push(`${days}d`);
		if (hours > 0) parts.push(`${hours}h`);
		if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
		return parts.join(' ');
	}
</script>

<svelte:head>
	<title>System Health — Superadmin</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-6xl mx-auto">
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<ServerCrash class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">System Health</h1>
			<p class="text-muted-foreground text-sm mt-0.5">Server status and infrastructure metrics.</p>
		</div>
	</div>

	{#if !status}
		<div
			class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
		>
			<p class="font-semibold">Status unavailable</p>
			<p class="mt-0.5">
				No server metrics could be loaded for this account. Values below are unavailable rather than
				live.
			</p>
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
		<Card>
			<CardContent class="p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="p-2 bg-green-50 text-green-600 rounded-lg">
						<Database class="size-5" />
					</div>
					{#if status}
						<span class="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full"
							>Online</span
						>
					{/if}
				</div>
				<p class="text-sm font-medium text-muted-foreground">
					{#if status}
						{status.isMasterServer ? 'Local SQLite (libSQL)' : 'PostgreSQL Database'}
					{:else}
						Database (unavailable)
					{/if}
				</p>
				<p class="text-xl font-bold text-foreground mt-1">{status ? 'Connected' : '—'}</p>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
						<RefreshCw class="size-5" />
					</div>
					<span class="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-full"
						>Snapshot</span
					>
				</div>
				<p class="text-sm font-medium text-muted-foreground">Active Devices</p>
				<p class="text-xl font-bold text-foreground mt-1">
					{status ? status.activeDevices : '—'}
				</p>
				<p class="text-xs text-muted-foreground mt-1">devices active in this PHC</p>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="p-2 bg-purple-50 text-purple-600 rounded-lg">
						<Users class="size-5" />
					</div>
					{#if status && status.pendingDevices > 0}
						<span class="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full"
							>Approval required</span
						>
					{/if}
				</div>
				<p class="text-sm font-medium text-muted-foreground">Pending Devices</p>
				<p class="text-xl font-bold text-foreground mt-1">
					{status ? status.pendingDevices : '—'}
				</p>
				<p class="text-xs text-muted-foreground mt-1">devices pending approval</p>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="p-2 bg-orange-50 text-orange-600 rounded-lg">
						<Clock class="size-5" />
					</div>
				</div>
				<p class="text-sm font-medium text-muted-foreground">Server Uptime</p>
				<p class="text-xl font-bold text-foreground mt-1">
					{status ? formatUptime(status.uptimeSeconds) : '—'}
				</p>
				{#if status}
					<p class="text-xs text-muted-foreground mt-1">
						{status.nodeVersion} · {status.memoryMb} MB RSS
					</p>
				{/if}
			</CardContent>
		</Card>
	</div>

	<p class="text-xs text-muted-foreground">
		Metrics are a point-in-time server snapshot. Reload this page to refresh.
	</p>

	<Card>
		<CardHeader>
			<CardTitle>Recent Error Logs</CardTitle>
			<CardDescription>No live log stream is configured.</CardDescription>
		</CardHeader>
		<CardContent>
			<div
				class="flex items-center justify-center rounded-md bg-muted p-4 text-sm text-muted-foreground min-h-24"
			>
				No live log stream is configured.
			</div>
		</CardContent>
	</Card>
</div>
