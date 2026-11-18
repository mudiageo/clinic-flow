<script lang="ts">
	import { getPhcList } from '#lib/remote/superadmin.remote.ts';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '#lib/components/ui/card/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import { Building2, Activity, Users, MapPin, ExternalLink } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import NumberTicker from '#lib/components/ui/number-ticker/number-ticker.svelte';
	import { formatDate } from '#lib/utils/date.ts';
</script>

<svelte:head>
	<title>Makers Dashboard — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in max-w-6xl mx-auto py-8">
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<Activity class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Software Makers Dashboard</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Overview of all registered Primary Healthcare Centers
			</p>
		</div>
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
		<div class="grid grid-cols-1 md:grid-cols-4 gap-5">
			<Card>
				<CardContent class="p-6 flex items-center justify-between">
					<div>
						<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
							Total PHCs
						</p>
						<NumberTicker value={totalPhcs} class="text-3xl font-bold mt-1 block" />
					</div>
					<div
						class="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"
					>
						<Building2 class="size-5" />
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-6 flex items-center justify-between">
					<div>
						<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
							Total Staff
						</p>
						<NumberTicker value={totalStaff} class="text-3xl font-bold mt-1 block" />
					</div>
					<div
						class="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"
					>
						<Users class="size-5" />
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-6 flex items-center justify-between">
					<div>
						<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
							Total Patients
						</p>
						<NumberTicker value={totalPatients} class="text-3xl font-bold mt-1 block" />
					</div>
					<div
						class="size-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500"
					>
						<Activity class="size-5" />
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-6 flex items-center justify-between">
					<div>
						<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
							States Covered
						</p>
						<NumberTicker value={statesCovered} class="text-3xl font-bold mt-1 block" />
					</div>
					<div
						class="size-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500"
					>
						<MapPin class="size-5" />
					</div>
				</CardContent>
			</Card>
		</div>

		<Card>
			<CardHeader>
				<CardTitle>Registered Clinics</CardTitle>
				<CardDescription>All PHCs currently active on the ClinicFlow network</CardDescription>
			</CardHeader>
			<CardContent class="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Clinic Name</TableHead>
							<TableHead>Location</TableHead>
							<TableHead class="text-right">Staff</TableHead>
							<TableHead class="text-right">Patients</TableHead>
							<TableHead class="text-right">Registered</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each phcs as phc (phc.id)}
							<TableRow>
								<TableCell class="font-medium">
									<a
										href={`/superadmin/phcs/${phc.id}`}
										class="hover:underline text-primary flex items-center gap-1"
									>
										{phc.name}
										<ExternalLink class="size-3" />
									</a>
								</TableCell>
								<TableCell>{phc.lga}, {phc.state}</TableCell>
								<TableCell class="text-right">
									<Badge variant="outline">{phc.staffCount}</Badge>
								</TableCell>
								<TableCell class="text-right font-mono">{phc.patientCount}</TableCell>
								<TableCell class="text-right text-muted-foreground">
									{formatDate(phc.createdAt)}
								</TableCell>
							</TableRow>
						{:else}
							<TableRow>
								<TableCell colspan={5} class="text-center py-8 text-muted-foreground"
									>No PHCs registered yet.</TableCell
								>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	{/await}
</div>
