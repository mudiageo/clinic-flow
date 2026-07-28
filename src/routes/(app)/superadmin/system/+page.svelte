<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { ServerCrash, Database, RefreshCw, MessageSquare, Clock } from '@lucide/svelte';

	// Mocking system health data since we don't have real metric collectors in this demo
	let uptime = $state('14 days, 5 hours, 23 minutes');
	let dbStatus = $state('Healthy (34ms ping)');
	let syncPending = $state(42);
	let smsSent = $state(1243);
	let smsFailed = $state(12);

	$effect(() => {
		// Mock live updates
		const interval = setInterval(() => {
			syncPending = Math.max(0, syncPending + Math.floor(Math.random() * 5) - 2);
			if (Math.random() > 0.8) smsSent += 1;
		}, 3000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>System Health — Superadmin</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-6xl mx-auto py-8">
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<ServerCrash class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">System Health</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Real-time telemetry and infrastructure metrics.
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
		<Card>
			<CardContent class="p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="p-2 bg-green-50 text-green-600 rounded-lg">
						<Database class="size-5" />
					</div>
					<span class="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Online</span>
				</div>
				<p class="text-sm font-medium text-muted-foreground">PostgreSQL Database</p>
				<p class="text-xl font-bold text-foreground mt-1">{dbStatus}</p>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
						<RefreshCw class="size-5" />
					</div>
					<span class="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-full">Live</span>
				</div>
				<p class="text-sm font-medium text-muted-foreground">Global Sync Queue</p>
				<p class="text-xl font-bold text-foreground mt-1">{syncPending} pending ops</p>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="p-2 bg-purple-50 text-purple-600 rounded-lg">
						<MessageSquare class="size-5" />
					</div>
					<span class="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">{smsFailed} failed</span>
				</div>
				<p class="text-sm font-medium text-muted-foreground">SMS Gateway (24h)</p>
				<p class="text-xl font-bold text-foreground mt-1">{smsSent.toLocaleString()} sent</p>
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
				<p class="text-xl font-bold text-foreground mt-1">{uptime}</p>
			</CardContent>
		</Card>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Recent Error Logs</CardTitle>
			<CardDescription>Latest unhandled exceptions across all services.</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="rounded-md bg-muted p-4 font-mono text-sm space-y-2 h-64 overflow-y-auto">
				<div class="text-muted-foreground">[2023-11-04 14:32:11] INFO: App started on port 3000</div>
				<div class="text-muted-foreground">[2023-11-04 15:10:02] INFO: Sync worker initialized</div>
				<div class="text-orange-600">[2023-11-04 16:45:33] WARN: Termii API rate limit approached (95%)</div>
				<div class="text-red-600">[2023-11-05 09:12:05] ERROR: Failed to process offline queue from PHC-8821: Invalid payload format</div>
				<div class="text-muted-foreground">[2023-11-05 09:12:10] INFO: Retrying PHC-8821 queue... Success.</div>
				<div class="text-muted-foreground">[2023-11-05 11:30:00] INFO: Daily backup completed successfully.</div>
			</div>
		</CardContent>
	</Card>
</div>
