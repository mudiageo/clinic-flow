<script lang="ts">
	import { familyStore } from '#lib/state/families.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
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

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="flex items-start gap-3">
			<div class="rounded-xl bg-primary/10 p-2.5 text-primary">
				<Home class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Family Health</h1>
				<p class="mt-0.5 text-sm font-medium text-muted-foreground">
					Households and linked patient records for this PHC
				</p>
			</div>
		</div>

		<div class="relative w-full md:w-80">
			<Search class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
			<Input
				bind:value={searchTerm}
				placeholder="Search household, community or member..."
				class="h-11 pl-9"
			/>
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		<Card>
			<CardContent class="flex items-center justify-between p-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Households
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">{scopedFamilies.length}</p>
				</div>
				<Home class="size-5 text-primary" />
			</CardContent>
		</Card>
		<Card>
			<CardContent class="flex items-center justify-between p-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Members
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">{totalMembers}</p>
				</div>
				<Users class="size-5 text-primary" />
			</CardContent>
		</Card>
		<Card>
			<CardContent class="flex items-center justify-between p-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Communities
					</p>
					<p class="mt-1 text-2xl font-bold tabular-nums">{communities}</p>
				</div>
				<MapPin class="size-5 text-primary" />
			</CardContent>
		</Card>
	</div>

	<Card class="overflow-hidden">
		<CardHeader class="border-b bg-muted/20">
			<CardTitle class="text-base">Registered Households</CardTitle>
			<CardDescription>Offline-ready family groups synchronized with this clinic</CardDescription>
		</CardHeader>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-6">Household</TableHead>
						<TableHead>Community</TableHead>
						<TableHead>Members</TableHead>
						<TableHead>Sync</TableHead>
						<TableHead class="w-24 text-right"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each rows as { family, members } (family.id)}
						<TableRow>
							<TableCell class="px-6 font-semibold">
								{family.householdName || 'Unnamed household'}
							</TableCell>
							<TableCell>{family.community || 'Not recorded'}</TableCell>
							<TableCell>{members.length}</TableCell>
							<TableCell>
								<Badge variant={family.syncStatus === 'conflict' ? 'destructive' : 'outline'}>
									{family.syncStatus}
								</Badge>
							</TableCell>
							<TableCell class="text-right">
								<Button variant="ghost" size="sm" href={`/families/${family.id}`}>
									Open <ArrowRight class="ml-1 size-4" />
								</Button>
							</TableCell>
						</TableRow>
					{:else}
						<TableRow>
							<TableCell colspan={5} class="h-56 text-center">
								<div class="flex flex-col items-center gap-3 text-muted-foreground">
									<Users class="size-8 opacity-50" />
									<p>
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
		</CardContent>
	</Card>
</div>
