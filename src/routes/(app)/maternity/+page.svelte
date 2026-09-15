<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		Heart, 
		Baby, 
		Clock, 
		Activity, 
		Plus,
		Waves
	} from '@lucide/svelte';

	// Mock active admissions
	const admissions = [
		{ name: 'Amina Yusuf', age: 24, gravida: 2, para: 1, admittedAt: '2 hours ago', stage: 'Active Labor', dilation: '6cm', fhr: '142 bpm' },
		{ name: 'Blessing Okoro', age: 29, gravida: 4, para: 3, admittedAt: '5 hours ago', stage: 'Latent Phase', dilation: '3cm', fhr: '138 bpm' }
	];
</script>

<svelte:head>
	<title>Maternity Ward — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-pink-100 text-pink-600">
				<Heart class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Maternity Ward</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Active admissions and labour monitoring
				</p>
			</div>
		</div>
		<Button class="bg-pink-600 hover:bg-pink-700 text-white">
			<Plus class="size-4 mr-2" />
			Admit Patient
		</Button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each admissions as patient}
			<Card class="overflow-hidden card-hover border-pink-100">
				<CardHeader class="border-b bg-pink-50/50 pb-4">
					<div class="flex items-start justify-between">
						<div>
							<CardTitle class="text-lg">{patient.name}</CardTitle>
							<p class="text-xs text-muted-foreground mt-1 font-medium">
								{patient.age} yrs · G{patient.gravida}P{patient.para}
							</p>
						</div>
						<Badge variant="outline" class="bg-white text-pink-700 border-pink-200">
							{patient.stage}
						</Badge>
					</div>
				</CardHeader>
				<CardContent class="p-0">
					<div class="grid grid-cols-2 divide-x divide-y border-b text-sm">
						<div class="p-3 flex items-center gap-2">
							<Clock class="size-4 text-muted-foreground" />
							<div class="leading-tight">
								<p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Admitted</p>
								<p class="font-medium">{patient.admittedAt}</p>
							</div>
						</div>
						<div class="p-3 flex items-center gap-2">
							<Waves class="size-4 text-pink-500" />
							<div class="leading-tight">
								<p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Dilation</p>
								<p class="font-medium">{patient.dilation}</p>
							</div>
						</div>
						<div class="p-3 flex items-center gap-2 col-span-2">
							<Activity class="size-4 text-rose-500" />
							<div class="leading-tight">
								<p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fetal Heart Rate</p>
								<p class="font-medium">{patient.fhr}</p>
							</div>
						</div>
					</div>
					<div class="p-3 bg-muted/20 flex gap-2">
						<Button variant="outline" class="w-full text-xs h-8">Vitals</Button>
						<Button class="w-full text-xs h-8 bg-pink-600 hover:bg-pink-700">Open Partograph</Button>
					</div>
				</CardContent>
			</Card>
		{/each}
		
		<!-- Empty Slot -->
		<button class="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl h-[280px] text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/50 transition-colors">
			<Baby class="size-8 opacity-40" />
			<span class="font-medium text-sm">Admit New Patient</span>
		</button>
	</div>
</div>
