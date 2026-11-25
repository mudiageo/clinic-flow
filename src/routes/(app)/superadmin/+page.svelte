<script lang="ts">
	import { getPhcList } from '#lib/remote/superadmin.remote.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { Building2, Activity, Users, MapPin, ExternalLink } from '@lucide/svelte';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { formatDate } from '#lib/utils/date.ts';
</script>

<svelte:head>
	<title>Platform Overview — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Platform Management
		</p>
		<h1 class="text-2xl font-bold text-foreground tracking-tight">Software Makers Dashboard</h1>
		<p class="text-muted-foreground text-sm mt-0.5">
			Overview of all registered Primary Healthcare Centers
		</p>
	</div>

	{#await getPhcList()}
		<div class="flex items-center justify-center py-20 text-muted-foreground animate-pulse">
			Loading PHC directory...
		</div>
	{:then phcs}
		{@const totalPhcs = phcs.length}
		{@const totalStaff = phcs.reduce((total, phc) => total + phc.staffCount, 0)}
		{@const totalPatients = phcs.reduce((total, phc) => total + phc.patientCount, 0)}
		{@const statesCovered = new Set(phcs.map((phc) => phc.state)).size}

		<!-- Ruled Network Summary Strip -->
		<div
			class="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border rounded-xl border border-border bg-card"
		>
			<div class="px-5 py-4 flex items-center justify-between gap-2">
				<div>
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
						Total PHCs
					</p>
					<p class="text-3xl font-bold font-mono tabular-nums mt-1">{totalPhcs}</p>
				</div>
				<Building2 class="size-5 text-primary shrink-0" />
			</div>
			<div class="px-5 py-4 flex items-center justify-between gap-2">
				<div>
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
						Total Staff
					</p>
					<p class="text-3xl font-bold font-mono tabular-nums mt-1">{totalStaff}</p>
				</div>
				<Users class="size-5 text-primary shrink-0" />
			</div>
			<div class="px-5 py-4 flex items-center justify-between gap-2">
				<div>
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
						Total Patients
					</p>
					<p class="text-3xl font-bold font-mono tabular-nums mt-1">{totalPatients}</p>
				</div>
				<Activity class="size-5 text-triage-green shrink-0" />
			</div>
			<div class="px-5 py-4 flex items-center justify-between gap-2">
				<div>
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
						States Covered
					</p>
					<p class="text-3xl font-bold font-mono tabular-nums mt-1">{statesCovered}</p>
				</div>
				<MapPin class="size-5 text-triage-amber shrink-0" />
			</div>
		</div>

		<section class="rounded-xl border border-border bg-card overflow-hidden">
			<div class="px-5 py-3.5 border-b border-border bg-muted/20">
				<h2 class="text-base font-semibold">Registered Clinics</h2>
				<p class="text-xs text-muted-foreground">
					All PHCs currently active on the ClinicFlow network
				</p>
			</div>
			<Table>
				<TableHeader class="bg-muted/40">
					<TableRow class="hover:bg-transparent">
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5"
							>Clinic Name</TableHead
						>
						<TableHead class="font-mono text-xs uppercase tracking-wider">Location</TableHead>
						<TableHead class="text-right font-mono text-xs uppercase tracking-wider"
							>Staff</TableHead
						>
						<TableHead class="text-right font-mono text-xs uppercase tracking-wider"
							>Patients</TableHead
						>
						<TableHead class="text-right font-mono text-xs uppercase tracking-wider px-5"
							>Registered</TableHead
						>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each phcs as phc, idx (phc.id)}
						<TableRow class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}>
							<TableCell class="font-medium px-5">
								<a
									href={`/superadmin/phcs/${phc.id}`}
									class="hover:underline text-primary inline-flex items-center gap-1.5"
								>
									{phc.name}
									<ExternalLink class="size-3" />
								</a>
							</TableCell>
							<TableCell class="text-sm">{phc.lga}, {phc.state}</TableCell>
							<TableCell class="text-right">
								<Badge variant="outline" class="font-mono tabular-nums">{phc.staffCount}</Badge>
							</TableCell>
							<TableCell class="text-right font-mono tabular-nums">{phc.patientCount}</TableCell>
							<TableCell class="text-right font-mono text-xs text-muted-foreground px-5">
								{formatDate(phc.createdAt)}
							</TableCell>
						</TableRow>
					{:else}
						<TableRow>
							<TableCell colspan={5} class="text-center py-10 text-muted-foreground">
								No PHCs registered yet.
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</section>
	{/await}
</div>
