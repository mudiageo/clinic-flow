<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { 
		Thermometer, 
		ThermometerSnowflake, 
		AlertTriangle, 
		CheckCircle2,
		Activity
	} from '@lucide/svelte';

	// Mock data
	const fridgeTemp = 4.2; // Celsius
	const status = fridgeTemp >= 2 && fridgeTemp <= 8 ? 'optimal' : 'warning';
	
	const vaccines = [
		{ name: 'BCG', stock: 120, expires: 'Oct 2026', type: 'Live Attenuated' },
		{ name: 'OPV (Polio)', stock: 350, expires: 'Dec 2026', type: 'Live Attenuated' },
		{ name: 'Pentavalent', stock: 45, expires: 'Next Month', type: 'Inactivated', warning: true },
		{ name: 'Measles', stock: 80, expires: 'Jan 2027', type: 'Live Attenuated' },
	];
</script>

<svelte:head>
	<title>Cold Chain — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-sky-100 text-sky-600">
				<ThermometerSnowflake class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Cold Chain Tracker</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Monitor vaccine temperatures and sensitive stock
				</p>
			</div>
		</div>
		<Button variant="outline">
			<Activity class="size-4 mr-2" />
			Log Temperature
		</Button>
	</div>

	<!-- Fridge Status -->
	<Card class="overflow-hidden border-sky-100 bg-sky-50/30">
		<CardContent class="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
			<div class="flex items-center gap-6">
				<div class="relative">
					<div class="size-20 rounded-full border-4 flex items-center justify-center {status === 'optimal' ? 'border-sky-500 text-sky-600' : 'border-amber-500 text-amber-600'}">
						<span class="text-2xl font-bold">{fridgeTemp}°</span>
					</div>
					<div class="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-white shadow-sm {status === 'optimal' ? 'text-emerald-500' : 'text-amber-500'}">
						{#if status === 'optimal'}
							<CheckCircle2 class="size-5" />
						{:else}
							<AlertTriangle class="size-5" />
						{/if}
					</div>
				</div>
				<div>
					<h3 class="text-lg font-bold">Solar Direct Drive Refrigerator</h3>
					<p class="text-sm text-muted-foreground flex items-center gap-2 mt-1">
						Status: 
						<Badge variant={status === 'optimal' ? 'outline' : 'destructive'} class={status === 'optimal' ? 'border-sky-200 text-sky-700 bg-white' : ''}>
							{status === 'optimal' ? 'Optimal Range (2-8°C)' : 'Check Required'}
						</Badge>
					</p>
				</div>
			</div>
			<div class="text-right hidden md:block">
				<p class="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Last Logged</p>
				<p class="font-medium text-sm">Today, 08:00 AM</p>
				<p class="text-xs text-muted-foreground">by Nurse Joy</p>
			</div>
		</CardContent>
	</Card>

	<!-- Vaccine Inventory -->
	<div class="space-y-4">
		<h2 class="text-lg font-bold tracking-tight">Sensitive Stock</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each vaccines as v}
				<Card class="card-hover {v.warning ? 'border-amber-200 bg-amber-50/30' : ''}">
					<CardContent class="p-5 flex flex-col h-full">
						<div class="flex justify-between items-start mb-4">
							<Badge variant="outline" class="text-[10px] uppercase font-bold tracking-wider {v.type === 'Live Attenuated' ? 'text-rose-600 border-rose-200 bg-rose-50' : 'text-sky-600 border-sky-200 bg-sky-50'}">
								{v.type}
							</Badge>
							{#if v.warning}
								<AlertTriangle class="size-4 text-amber-500" />
							{/if}
						</div>
						
						<h3 class="text-xl font-bold mb-1">{v.name}</h3>
						
						<div class="mt-auto pt-4 space-y-2">
							<div class="flex justify-between items-end">
								<span class="text-xs text-muted-foreground">Stock</span>
								<span class="font-bold {v.stock < 50 ? 'text-red-600' : ''}">{v.stock} vials</span>
							</div>
							<div class="flex justify-between items-end">
								<span class="text-xs text-muted-foreground">Expires</span>
								<span class="text-sm font-medium {v.warning ? 'text-amber-600' : ''}">{v.expires}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	</div>
</div>
