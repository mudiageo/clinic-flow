<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		UserPlus, 
		Activity, 
		Home, 
		MapPin, 
		WifiOff,
		CloudUpload,
		Syringe
	} from '@lucide/svelte';
	
	// Mock offline stats
	let pendingSyncs = $state(0);
	
	const ACTIONS = [
		{ label: 'Register Patient', icon: UserPlus, href: '/nurse/register', color: 'text-blue-600 bg-blue-50 border-blue-100' },
		{ label: 'Log Household Visit', icon: Home, href: '#', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
		{ label: 'Record Vitals', icon: Activity, href: '/nurse/vitals', color: 'text-rose-600 bg-rose-50 border-rose-100' },
		{ label: 'Immunization (EPI)', icon: Syringe, href: '/immunization', color: 'text-teal-600 bg-teal-50 border-teal-100' }
	];
</script>

<svelte:head>
	<title>Field Outreach — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-md mx-auto animate-fade-in pb-24">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="p-3 rounded-2xl bg-primary text-primary-foreground shadow-md">
				<MapPin class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-foreground leading-tight">Field Mode</h1>
				<p class="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
					<WifiOff class="size-3.5" />
					Offline Ready
				</p>
			</div>
		</div>
		
		<Button 
			variant="outline" 
			size="sm" 
			class="h-10 rounded-xl {pendingSyncs > 0 ? 'border-amber-200 text-amber-700 bg-amber-50' : 'text-muted-foreground'}"
		>
			<CloudUpload class="size-4 mr-2" />
			Sync ({pendingSyncs})
		</Button>
	</div>

	<!-- Big Actions -->
	<div class="grid grid-cols-2 gap-4">
		{#each ACTIONS as action}
			<a 
				href={action.href}
				class="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border bg-card text-center transition-all active:scale-95 shadow-sm"
			>
				<div class="p-3 rounded-xl border {action.color}">
					<action.icon class="size-7" />
				</div>
				<span class="text-sm font-bold text-foreground leading-tight">{action.label}</span>
			</a>
		{/each}
	</div>

	<!-- Recent Activity (Offline Cache) -->
	<div class="space-y-3">
		<h2 class="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
			Recent Activity (Local)
			<div class="h-px flex-1 bg-border/60"></div>
		</h2>
		
		<Card class="border-dashed bg-muted/10 shadow-none">
			<CardContent class="p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
				<Activity class="size-8 opacity-20 mb-2" />
				<p class="text-sm font-medium">No recent offline activity</p>
				<p class="text-xs mt-1 max-w-[200px]">Patients registered in field mode will appear here until synced.</p>
			</CardContent>
		</Card>
	</div>
</div>
