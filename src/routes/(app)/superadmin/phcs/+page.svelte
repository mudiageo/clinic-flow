<script lang="ts">
	import { getPhcList } from '#lib/remote/superadmin.remote.ts';
	import { formatDate } from '#lib/utils/date.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { ArrowLeft, ArrowRight, Building2, MapPin, Search, Users } from '@lucide/svelte';

	const phcs = await getPhcList();
	let searchTerm = $state('');
	const filteredPhcs = $derived.by(() => {
		const term = searchTerm.trim().toLowerCase();
		if (!term) return phcs;
		return phcs.filter(
			(phc) =>
				phc.name.toLowerCase().includes(term) ||
				phc.lga.toLowerCase().includes(term) ||
				phc.state.toLowerCase().includes(term)
		);
	});
	const totalStaff = $derived(phcs.reduce((total, phc) => total + phc.staffCount, 0));
	const totalPatients = $derived(phcs.reduce((total, phc) => total + phc.patientCount, 0));
	const stateCount = $derived(new Set(phcs.map((phc) => phc.state)).size);
</script>

<svelte:head>
	<title>PHC Directory — ClinicFlow</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-6">
	<div
		class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pb-2 border-b border-border"
	>
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="icon" href="/superadmin" aria-label="Back to Superadmin">
				<ArrowLeft class="size-5" />
			</Button>
			<div>
				<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground">
					Platform Management
				</p>
				<h1 class="text-2xl font-bold tracking-tight text-foreground">
					Primary Healthcare Centres
				</h1>
				<p class="mt-0.5 text-sm text-muted-foreground">
					Platform-wide directory from the authoritative database
				</p>
			</div>
		</div>

		<div class="relative w-full md:w-80">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
			<Input
				bind:value={searchTerm}
				placeholder="Search clinic, LGA or state..."
				class="h-11 pl-9 bg-card"
			/>
		</div>
	</div>

	<!-- Ruled Network Summary Strip -->
	<div
		class="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border rounded-xl border border-border bg-card"
	>
		<div class="px-4 py-3 flex items-center justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">PHCs</p>
				<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{phcs.length}</p>
			</div>
			<Building2 class="size-4 text-primary shrink-0" />
		</div>
		<div class="px-4 py-3 flex items-center justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Staff</p>
				<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{totalStaff}</p>
			</div>
			<Users class="size-4 text-primary shrink-0" />
		</div>
		<div class="px-4 py-3 flex items-center justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Patients</p>
				<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{totalPatients}</p>
			</div>
			<Users class="size-4 text-triage-green shrink-0" />
		</div>
		<div class="px-4 py-3 flex items-center justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">States</p>
				<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{stateCount}</p>
			</div>
			<MapPin class="size-4 text-triage-amber shrink-0" />
		</div>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
			<div>
				<h2 class="text-base font-semibold">Registered PHCs</h2>
				<p class="text-xs text-muted-foreground">{filteredPhcs.length} matching facilities</p>
			</div>
		</div>

		<Table>
			<TableHeader class="bg-muted/40">
				<TableRow class="hover:bg-transparent">
					<TableHead class="px-5 font-mono text-xs uppercase tracking-wider">Clinic</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Location</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Staff</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Patients</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Registered</TableHead>
					<TableHead class="w-24 text-right"></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each filteredPhcs as phc, idx (phc.id)}
					<TableRow class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}>
						<TableCell class="px-5 font-semibold">{phc.name}</TableCell>
						<TableCell class="text-sm">{phc.lga}, {phc.state}</TableCell>
						<TableCell>
							<Badge variant="outline" class="font-mono tabular-nums">{phc.staffCount}</Badge>
						</TableCell>
						<TableCell class="font-mono tabular-nums">{phc.patientCount}</TableCell>
						<TableCell class="text-muted-foreground font-mono text-xs">
							{formatDate(phc.createdAt)}
						</TableCell>
						<TableCell class="text-right">
							<Button variant="ghost" size="sm" href={`/superadmin/phcs/${phc.id}`}>
								Open <ArrowRight class="ml-1 size-4" />
							</Button>
						</TableCell>
					</TableRow>
				{:else}
					<TableRow>
						<TableCell colspan={6} class="h-52 text-center text-muted-foreground">
							No PHCs match this search.
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</section>
</div>
