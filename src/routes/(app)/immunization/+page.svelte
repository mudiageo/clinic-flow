<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { 
		Syringe, 
		Search, 
		Baby,
		CheckCircle2,
		CalendarDays
	} from '@lucide/svelte';

	// Mock EPI roster
	const infants = [
		{ name: 'Musa Ibrahim', age: '6 weeks', nextDue: 'Today', status: 'due', vaccines: ['OPV1', 'Penta1', 'PCV1', 'Rota1'] },
		{ name: 'Chidera Okafor', age: '14 weeks', nextDue: 'Tomorrow', status: 'upcoming', vaccines: ['OPV3', 'Penta3', 'PCV3'] },
		{ name: 'Fatima Sani', age: '9 months', nextDue: 'Overdue (3 days)', status: 'overdue', vaccines: ['Measles1', 'Yellow Fever'] },
		{ name: 'David Mark', age: '10 weeks', nextDue: 'Completed 10-wk', status: 'completed', vaccines: [] },
	];
</script>

<svelte:head>
	<title>Immunization (EPI) — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-teal-100 text-teal-600">
				<Syringe class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Immunization (EPI)</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Track infant vaccination schedules and defaulters
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2 w-full md:w-auto">
			<div class="relative w-full md:w-64">
				<Search class="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
				<Input placeholder="Search child or mother..." class="pl-9 h-10 w-full" />
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-3">
		{#each infants as infant}
			<Card class="card-hover border-l-4 {infant.status === 'due' ? 'border-l-amber-500' : infant.status === 'overdue' ? 'border-l-red-500' : infant.status === 'completed' ? 'border-l-emerald-500' : 'border-l-sky-500'}">
				<CardContent class="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
					<div class="flex items-start sm:items-center gap-4">
						<div class="p-3 rounded-full bg-muted/30 text-muted-foreground shrink-0">
							<Baby class="size-6" />
						</div>
						<div>
							<h3 class="text-lg font-bold">{infant.name}</h3>
							<p class="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
								<span class="font-medium text-foreground">{infant.age}</span>
								<span>·</span>
								<span class="flex items-center gap-1 {infant.status === 'overdue' ? 'text-red-600 font-semibold' : infant.status === 'due' ? 'text-amber-600 font-semibold' : ''}">
									<CalendarDays class="size-3.5" />
									{infant.nextDue}
								</span>
							</p>
						</div>
					</div>
					
					<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
						{#if infant.vaccines.length > 0}
							<div class="flex flex-wrap gap-1.5">
								{#each infant.vaccines as v}
									<Badge variant="secondary" class="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200">
										{v}
									</Badge>
								{/each}
							</div>
							<Button size="sm" class="w-full sm:w-auto bg-teal-600 hover:bg-teal-700">
								Record
							</Button>
						{:else}
							<div class="flex items-center gap-2 text-emerald-600 font-medium text-sm bg-emerald-50 px-3 py-1.5 rounded-full">
								<CheckCircle2 class="size-4" />
								Up to date
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>
</div>
