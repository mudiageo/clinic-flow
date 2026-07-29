<script lang="ts">
	import { encounterStore } from '$lib/state/encounters.svelte';
	import { patientStore } from '$lib/state/patients.svelte';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { FileText, Send, CheckCircle2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	const claims = $derived(encounterStore.items.filter(e => e.isNhisBillable));

	function submitClaim(id: string) {
		toast.success(`Claim for encounter ${id.substring(0,8)} submitted to NHIS API (simulated)`);
	}
</script>

<svelte:head>
	<title>NHIS Claims — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-5xl mx-auto py-8">
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
			<FileText class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">NHIS / HMO Claims</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Manage and submit billable encounters to insurance providers.
			</p>
		</div>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Pending Encounter Claims</CardTitle>
			<CardDescription>Encounters flagged by doctors as NHIS-billable.</CardDescription>
		</CardHeader>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Date</TableHead>
						<TableHead>Patient</TableHead>
						<TableHead>Enrollee ID</TableHead>
						<TableHead>Status</TableHead>
						<TableHead class="text-right">Action</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each claims as claim}
						{@const pt = patientStore.get(claim.patientId)}
						<TableRow>
							<TableCell class="font-medium">
								{new Date(claim.visitDate).toLocaleDateString()}
							</TableCell>
							<TableCell>{pt?.name || 'Unknown'}</TableCell>
							<TableCell class="font-mono text-xs">{pt?.clinicId || 'N/A'}</TableCell>
							<TableCell>
								<Badge variant="outline" class="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending Submission</Badge>
							</TableCell>
							<TableCell class="text-right">
								<Button size="sm" variant="outline" onclick={() => submitClaim(claim.id)}>
									<Send class="size-3 mr-2" /> Submit
								</Button>
							</TableCell>
						</TableRow>
					{:else}
						<TableRow>
							<TableCell colspan="5" class="h-32 text-center text-muted-foreground">
								No billable NHIS claims pending.
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
