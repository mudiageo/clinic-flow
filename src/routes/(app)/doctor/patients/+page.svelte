<script lang="ts">
	import { patientStore } from '$lib/state/patients.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Search, User, FileText, Activity } from '@lucide/svelte';

	let searchQuery = $state('');

	const filteredPatients = $derived(
		patientStore.sortedItems.filter(p => {
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				p.name.toLowerCase().includes(q) ||
				p.clinicId.toLowerCase().includes(q) ||
				(p.phone && p.phone.includes(q))
			);
		}).slice(0, 50) // Limit to 50 for performance
	);
</script>

<svelte:head>
	<title>Patient Directory — ClinicFlow</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-8 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Patient Directory</h1>
			<p class="text-muted-foreground text-sm">Search and view complete patient clinical records.</p>
		</div>
	</div>

	<div class="relative">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
		<Input
			bind:value={searchQuery}
			placeholder="Search by name, Clinic ID, or phone number..."
			class="pl-10 h-12 text-base rounded-xl bg-card border-border shadow-sm focus-visible:ring-primary/20"
		/>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each filteredPatients as p (p.id)}
			<a href={`/doctor/patients/${p.id}`} class="block group">
				<Card class="h-full bg-card/50 hover:bg-card/80 transition-all border-border/50 hover:border-primary/30 card-hover">
					<CardContent class="p-5 flex items-start gap-4">
						<div class="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
							<User class="size-5" />
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-foreground truncate">{p.name}</h3>
							<div class="flex items-center gap-2 mt-1">
								<Badge variant="secondary" class="font-mono text-[10px] uppercase bg-muted text-muted-foreground">{p.clinicId}</Badge>
							</div>
							<div class="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
								<span class="flex items-center gap-1"><Activity class="size-3" /> Vitals</span>
								<span class="flex items-center gap-1"><FileText class="size-3" /> History</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</a>
		{/each}
		{#if filteredPatients.length === 0}
			<div class="col-span-full py-20 text-center text-muted-foreground border border-dashed rounded-xl bg-card/30">
				<Search class="size-10 mx-auto opacity-20 mb-3" />
				<p>No patients found matching "{searchQuery}"</p>
			</div>
		{/if}
	</div>
</div>
