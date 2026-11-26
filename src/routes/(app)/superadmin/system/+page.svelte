<script lang="ts">
	import { getServerStatus } from '#lib/remote/server-status.remote.ts';
	import { Database, RefreshCw, Users, Clock } from '@lucide/svelte';

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

<div class="space-y-6 max-w-6xl mx-auto">
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Infrastructure
		</p>
		<h1 class="text-2xl font-bold text-foreground tracking-tight">System Health</h1>
		<p class="text-muted-foreground text-sm mt-0.5">Server status and infrastructure metrics</p>
	</div>

	{#if !status}
		<div
			class="rounded-xl border border-triage-amber/40 border-l-4 border-l-triage-amber bg-triage-amber/10 p-4 text-sm text-foreground"
		>
			<p class="font-semibold">Status unavailable</p>
			<p class="mt-0.5 text-xs text-muted-foreground">
				No server metrics could be loaded for this account. Values below are unavailable rather than
				live.
			</p>
		</div>
	{/if}

	<!-- Ruled Infrastructure Strip -->
	<div
		class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border rounded-xl border border-border bg-card"
	>
		<div class="p-5 space-y-2">
			<div class="flex items-center justify-between">
				<Database class="size-4 text-triage-green" />
				{#if status}
					<span
						class="text-[11px] font-mono font-semibold text-triage-green bg-triage-green/12 px-2 py-0.5 rounded-full"
					>
						Online
					</span>
				{/if}
			</div>
			<p class="text-xs text-muted-foreground">
				{#if status}
					{status.isMasterServer ? 'Local SQLite (libSQL)' : 'PostgreSQL Database'}
				{:else}
					Database (unavailable)
				{/if}
			</p>
			<p class="text-xl font-bold text-foreground">{status ? 'Connected' : '—'}</p>
		</div>

		<div class="p-5 space-y-2">
			<div class="flex items-center justify-between">
				<RefreshCw class="size-4 text-primary" />
				<span class="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
					Snapshot
				</span>
			</div>
			<p class="text-xs text-muted-foreground">Active Devices</p>
			<p class="text-2xl font-bold font-mono tabular-nums text-foreground">
				{status ? status.activeDevices : '—'}
			</p>
		</div>

		<div class="p-5 space-y-2">
			<div class="flex items-center justify-between">
				<Users class="size-4 text-primary" />
				{#if status && status.pendingDevices > 0}
					<span
						class="text-[11px] font-mono font-semibold text-amber-700 dark:text-triage-amber bg-triage-amber/15 px-2 py-0.5 rounded-full"
					>
						Approval required
					</span>
				{/if}
			</div>
			<p class="text-xs text-muted-foreground">Pending Devices</p>
			<p class="text-2xl font-bold font-mono tabular-nums text-foreground">
				{status ? status.pendingDevices : '—'}
			</p>
		</div>

		<div class="p-5 space-y-2">
			<div class="flex items-center justify-between">
				<Clock class="size-4 text-triage-amber" />
			</div>
			<p class="text-xs text-muted-foreground">Server Uptime</p>
			<p class="text-xl font-bold font-mono tabular-nums text-foreground">
				{status ? formatUptime(status.uptimeSeconds) : '—'}
			</p>
			{#if status}
				<p class="text-xs font-mono text-muted-foreground">
					{status.nodeVersion} · {status.memoryMb} MB RSS
				</p>
			{/if}
		</div>
	</div>

	<p class="text-xs text-muted-foreground">
		Metrics are a point-in-time server snapshot. Reload this page to refresh.
	</p>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="px-5 py-3.5 border-b border-border bg-muted/20">
			<h2 class="text-base font-semibold">Recent Error Logs</h2>
			<p class="text-xs text-muted-foreground">No live log stream is configured.</p>
		</div>
		<div class="p-5">
			<div
				class="flex items-center justify-center rounded-lg bg-muted/40 border border-dashed border-border p-6 text-sm text-muted-foreground"
			>
				No live log stream is configured.
			</div>
		</div>
	</section>
</div>
