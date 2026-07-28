<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Building2, MapPin, Users, Activity, Settings2, Trash2, PowerOff } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';

	let { data } = $props<{ data: { phc: any } }>();
	const phc = $derived(data.phc);
</script>

<svelte:head>
	<title>{phc.name} — Superadmin</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-6xl mx-auto py-8">
	<div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-3 rounded-xl bg-primary/10 text-primary">
				<Building2 class="size-8" />
			</div>
			<div>
				<h1 class="text-3xl font-bold text-foreground tracking-tight">{phc.name}</h1>
				<div class="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
					<MapPin class="size-4" />
					<span>{phc.lga}, {phc.state}</span>
					<span class="mx-2 text-muted-foreground/30">•</span>
					<span>Registered {new Date(phc.createdAt).toLocaleDateString()}</span>
				</div>
			</div>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" class="text-orange-600 border-orange-200 hover:bg-orange-50">
				<PowerOff class="size-4 mr-2" />
				Deactivate
			</Button>
			<Button variant="outline" class="text-destructive border-destructive/30 hover:bg-destructive/10">
				<Trash2 class="size-4 mr-2" />
				Reset Data
			</Button>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
		<Card>
			<CardContent class="p-6 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Staff</p>
					<p class="text-3xl font-bold text-foreground mt-1">{phc.staffCount}</p>
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
					<p class="text-3xl font-bold text-foreground mt-1">{phc.patientCount}</p>
				</div>
				<div class="size-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
					<Activity class="size-5" />
				</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-6 flex items-center justify-between">
				<div>
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sync Status</p>
					<div class="flex items-center gap-2 mt-1">
						<span class="size-2.5 rounded-full bg-green-500"></span>
						<p class="text-xl font-bold text-foreground">Healthy</p>
					</div>
				</div>
				<div class="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
					<Settings2 class="size-5" />
				</div>
			</CardContent>
		</Card>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Staff Members</CardTitle>
			<CardDescription>Personnel registered under this PHC.</CardDescription>
		</CardHeader>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each phc.staff as member}
						<TableRow>
							<TableCell class="font-medium">{member.name}</TableCell>
							<TableCell>
								<Badge variant="secondary" class="capitalize">{member.role}</Badge>
							</TableCell>
							<TableCell>
								{#if member.active}
									<Badge variant="outline" class="text-green-600 border-green-200 bg-green-50">Active</Badge>
								{:else}
									<Badge variant="destructive">Inactive</Badge>
								{/if}
							</TableCell>
						</TableRow>
					{:else}
						<TableRow>
							<TableCell colspan={3} class="text-center py-8 text-muted-foreground">No staff members found.</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
