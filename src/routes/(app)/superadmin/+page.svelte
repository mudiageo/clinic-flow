<script lang="ts">
	import { getPhcList } from '$lib/remote/superadmin.remote';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Building2, Activity, Users, ServerCrash, ExternalLink } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
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
		{@const totalStaff = phcs.reduce((acc: any, phc: any) => acc + phc.staffCount, 0)}
		{@const totalPatients = phcs.reduce((acc: any, phc: any) => acc + phc.patientCount, 0)}
		<div class="grid grid-cols-1 md:grid-cols-4 gap-5">
			
			<Card>
				<CardContent class="p-6 flex items-center justify-between">
					<div>
						<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total PHCs</p>
						<p class="text-3xl font-bold text-foreground mt-1">{totalPhcs}</p>
					</div>
					<div class="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
						<Building2 class="size-5" />
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-6 flex items-center justify-between">
					<div>
						<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Staff</p>
						<p class="text-3xl font-bold text-foreground mt-1">{totalStaff}</p>
					</div>
					<div class="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
						<Users class="size-5" />
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-6 flex items-center justify-between">
					<div>
						<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Patients</p>
						<p class="text-3xl font-bold text-foreground mt-1">{totalPatients}</p>
					</div>
					<div class="size-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
						<Activity class="size-5" />
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-6 flex items-center justify-between">
					<div>
						<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Today</p>
						<p class="text-3xl font-bold text-foreground mt-1">124</p>
					</div>
					<div class="size-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
						<ServerCrash class="size-5" />
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
						{#each phcs as phc}
							<TableRow>
								<TableCell class="font-medium">
									<a href={`/superadmin/phcs/${phc.id}`} class="hover:underline text-primary flex items-center gap-1">
										{phc.name}
										<ExternalLink class="size-3" />
									</a>
								</TableCell>
								<TableCell>{phc.lga}, {phc.state}</TableCell>
								<TableCell class="text-right">
									<Badge variant="outline">{phc.staffCount}</Badge>
								</TableCell>
								<TableCell class="text-right font-mono">{phc.patientCount}</TableCell>
								<TableCell class="text-right text-muted-foreground"
									>{new Date(phc.createdAt).toLocaleDateString()}</TableCell
								>
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
