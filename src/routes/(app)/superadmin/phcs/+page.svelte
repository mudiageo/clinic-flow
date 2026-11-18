<script lang="ts">
	import { getPhcList } from '#lib/remote/superadmin.remote.ts';
	import { formatDate } from '#lib/utils/date.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.ts';
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

<div class="mx-auto max-w-6xl space-y-8 py-8 animate-fade-in">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="flex items-start gap-3">
			<Button variant="ghost" size="icon" href="/superadmin" aria-label="Back to Superadmin">
				<ArrowLeft class="size-5" />
			</Button>
			<div class="rounded-xl bg-primary/10 p-2.5 text-primary">
				<Building2 class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Primary Healthcare Centres</h1>
				<p class="mt-0.5 text-sm font-medium text-muted-foreground">
					Platform-wide directory from the authoritative database
				</p>
			</div>
		</div>

		<div class="relative w-full md:w-80">
			<Search class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
			<Input
				bind:value={searchTerm}
				placeholder="Search clinic, LGA or state..."
				class="h-11 pl-9"
			/>
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card>
			<CardContent class="flex items-center justify-between p-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PHCs</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">{phcs.length}</p>
				</div>
				<Building2 class="size-5 text-primary" />
			</CardContent>
		</Card>
		<Card>
			<CardContent class="flex items-center justify-between p-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Staff</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">{totalStaff}</p>
				</div>
				<Users class="size-5 text-blue-600" />
			</CardContent>
		</Card>
		<Card>
			<CardContent class="flex items-center justify-between p-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Patients
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">{totalPatients}</p>
				</div>
				<Users class="size-5 text-emerald-600" />
			</CardContent>
		</Card>
		<Card>
			<CardContent class="flex items-center justify-between p-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">States</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">{stateCount}</p>
				</div>
				<MapPin class="size-5 text-orange-600" />
			</CardContent>
		</Card>
	</div>

	<Card class="overflow-hidden">
		<CardHeader class="border-b bg-muted/20">
			<CardTitle class="text-base">Registered PHCs</CardTitle>
			<CardDescription>{filteredPhcs.length} matching facilities</CardDescription>
		</CardHeader>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-6">Clinic</TableHead>
						<TableHead>Location</TableHead>
						<TableHead>Staff</TableHead>
						<TableHead>Patients</TableHead>
						<TableHead>Registered</TableHead>
						<TableHead class="w-24 text-right"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each filteredPhcs as phc (phc.id)}
						<TableRow>
							<TableCell class="px-6 font-semibold">{phc.name}</TableCell>
							<TableCell>{phc.lga}, {phc.state}</TableCell>
							<TableCell><Badge variant="outline">{phc.staffCount}</Badge></TableCell>
							<TableCell class="tabular-nums">{phc.patientCount}</TableCell>
							<TableCell class="text-muted-foreground">{formatDate(phc.createdAt)}</TableCell>
							<TableCell class="text-right">
								<Button variant="ghost" size="sm" href={`/superadmin/phcs/${phc.id}`}>
									Open <ArrowRight class="ml-1 size-4" />
								</Button>
							</TableCell>
						</TableRow>
					{:else}
						<TableRow>
							<TableCell colspan={6} class="h-56 text-center text-muted-foreground">
								No PHCs match this search.
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
