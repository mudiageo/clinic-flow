<script lang="ts">
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Search, User, FileText, Activity } from '@lucide/svelte';

	let searchQuery = $state('');

	const filteredPatients = $derived(
		patientStore.sortedItems
			.filter((p) => {
				if (!searchQuery.trim()) return true;
				const q = searchQuery.toLowerCase();
				return (
					p.name.toLowerCase().includes(q) ||
					p.clinicId.toLowerCase().includes(q) ||
					(p.phone && p.phone.includes(q))
				);
			})
			.slice(0, 50)
	);
</script>

<svelte:head>
	<title>Patient Directory — ClinicFlow</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Clinical Records
		</p>
		<h1 class="text-2xl font-bold tracking-tight text-foreground">Patient Directory</h1>
		<p class="text-muted-foreground text-sm mt-0.5">Search and open complete patient folders</p>
	</div>

	<div class="relative">
		<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
		<Input
			bind:value={searchQuery}
			placeholder="Search by name, Clinic ID, or phone number..."
			class="pl-10 h-12 text-base rounded-xl bg-card border-border"
		/>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
		{#each filteredPatients as p (p.id)}
			<a
				href={`/doctor/patients/${p.id}`}
				class="group rounded-xl border border-border bg-card p-4 flex items-start gap-3.5 hover:border-primary/45 transition-colors"
			>
				<div
					class="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0"
				>
					<User class="size-5" />
				</div>
				<div class="flex-1 min-w-0">
					<h2
						class="font-semibold text-foreground truncate group-hover:text-primary transition-colors"
					>
						{p.name}
					</h2>
					<div class="flex items-center gap-2 mt-1">
						<Badge variant="secondary" class="font-mono text-[10px] uppercase">
							{p.clinicId}
						</Badge>
					</div>
					<div class="mt-2.5 flex items-center gap-4 text-xs text-muted-foreground">
						<span class="flex items-center gap-1"><Activity class="size-3" /> Vitals</span>
						<span class="flex items-center gap-1"><FileText class="size-3" /> History</span>
					</div>
				</div>
			</a>
		{/each}
		{#if filteredPatients.length === 0}
			<div
				class="col-span-full py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card/50"
			>
				<Search class="size-9 mx-auto opacity-25 mb-2" />
				<p class="text-sm">No patients found matching "{searchQuery}"</p>
			</div>
		{/if}
	</div>
</div>
