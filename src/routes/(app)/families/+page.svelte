<script lang="ts">
	import { familyStore } from '#lib/state/families.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
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
	import { ArrowRight, Home, MapPin, Search, UserPlus, Users } from '@lucide/svelte';

	let searchTerm = $state('');
	const phcId = $derived(sessionStore.activePhcId);
	const scopedFamilies = $derived(familyStore.forPhc(phcId));
	const rows = $derived.by(() => {
		const term = searchTerm.trim().toLowerCase();
		return scopedFamilies
			.map((family) => {
				const members = patientStore.familyMembers(family.id);
				return { family, members };
			})
			.filter(({ family, members }) => {
				if (!term) return true;
				return (
					family.householdName?.toLowerCase().includes(term) ||
					family.community?.toLowerCase().includes(term) ||
					members.some((member) => member.name.toLowerCase().includes(term))
				);
			});
	});
	const totalMembers = $derived(
		scopedFamilies.reduce(
			(total, family) => total + patientStore.familyMembers(family.id).length,
			0
		)
	);
	const communities = $derived(
		new Set(scopedFamilies.map((family) => family.community).filter(Boolean)).size
	);
</script>

<svelte:head>
	<title>Family Health — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<!-- Page Header -->
	<div
		class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Community Records
			</p>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Family Health</h1>
			<p class="mt-0.5 text-sm text-muted-foreground">
				Households and linked patient records for this PHC
			</p>
		</div>

		<div class="relative w-full md:w-80">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
			<Input
				bind:value={searchTerm}
				placeholder="Search household, community or member..."
				class="h-11 pl-9 bg-card"
			/>
		</div>
	</div>

	<!-- Compact Ruled Summary Strip -->
	<div class="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card">
		<div class="px-4 py-3 flex items-center justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
					Households
				</p>
				<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{scopedFamilies.length}</p>
			</div>
			<Home class="size-4 text-primary shrink-0" />
		</div>
		<div class="px-4 py-3 flex items-center justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Members</p>
				<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{totalMembers}</p>
			</div>
			<Users class="size-4 text-primary shrink-0" />
		</div>
		<div class="px-4 py-3 flex items-center justify-between gap-2">
			<div>
				<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
					Communities
				</p>
				<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{communities}</p>
			</div>
			<MapPin class="size-4 text-primary shrink-0" />
		</div>
	</div>

	<!-- Household Ledger -->
	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="px-5 py-3.5 border-b border-border bg-muted/20">
			<h2 class="text-base font-semibold text-foreground">Registered Households</h2>
			<p class="text-xs text-muted-foreground">
				Offline-ready family groups synchronized with this clinic
			</p>
		</div>
		<Table>
			<TableHeader>
				<TableRow class="hover:bg-transparent">
					<TableHead class="px-5 font-mono text-xs uppercase tracking-wider">Household</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Community</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Members</TableHead>
					<TableHead class="font-mono text-xs uppercase tracking-wider">Sync</TableHead>
					<TableHead class="w-24 text-right"></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each rows as { family, members }, idx (family.id)}
					<TableRow class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}>
						<TableCell class="px-5 font-semibold text-foreground">
							{family.householdName || 'Unnamed household'}
						</TableCell>
						<TableCell class="text-sm text-muted-foreground">
							{family.community || 'Not recorded'}
						</TableCell>
						<TableCell class="font-mono tabular-nums">{members.length}</TableCell>
						<TableCell>
							<Badge variant={family.syncStatus === 'conflict' ? 'destructive' : 'outline'}>
								{family.syncStatus}
							</Badge>
						</TableCell>
						<TableCell class="text-right">
							<Button variant="ghost" size="sm" class="h-9" href={`/families/${family.id}`}>
								Open <ArrowRight class="ml-1 size-4" />
							</Button>
						</TableCell>
					</TableRow>
				{:else}
					<TableRow>
						<TableCell colspan={5} class="h-52 text-center">
							<div class="flex flex-col items-center gap-3 text-muted-foreground">
								<Users class="size-8 opacity-40" />
								<p class="text-sm">
									{searchTerm ? 'No matching households found.' : 'No households registered yet.'}
								</p>
								{#if !searchTerm}
									<Button variant="outline" href="/nurse/register">
										<UserPlus class="mr-2 size-4" /> Register a patient
									</Button>
								{/if}
							</div>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</section>
</div>
