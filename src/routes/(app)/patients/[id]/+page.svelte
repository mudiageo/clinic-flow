<script lang="ts">
	import { page } from '$app/stores';
	import { patientStore } from '$lib/state/patients.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ArrowLeft, Users, Calendar, Phone, MapPin } from '@lucide/svelte';

	let clinicId = $derived($page.params.id);
	let patient = $derived(clinicId ? patientStore.findByClinicId(clinicId) : null);

	// Find family members (excluding self)
	let familyMembers = $derived(
		patient?.familyId
			? patientStore.familyMembers(patient.familyId).filter((p) => p.id !== patient?.id)
			: []
	);

	// Link a new family member (Mock UI for now)
	function handleLinkFamily() {
		alert(
			'Family linking UI would open here to link this patient to another family or add a new family member.'
		);
	}
</script>

<svelte:head>
	<title>{patient ? patient.name : 'Patient Profile'} — ClinicFlow</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6 animate-fade-in">
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href="javascript:history.back()">
			<ArrowLeft class="size-5" />
		</Button>
		<div>
			<h1 class="text-2xl font-bold tracking-tight">{patient?.name || 'Patient Not Found'}</h1>
			{#if patient}
				<p class="text-muted-foreground font-mono">{patient.clinicId}</p>
			{/if}
		</div>
	</div>

	{#if patient}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Profile Card -->
			<Card class="md:col-span-2">
				<CardHeader>
					<CardTitle>Patient Details</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="text-muted-foreground block mb-1">Date of Birth / Age</span>
							<div class="flex items-center gap-2">
								<Calendar class="size-4 text-primary/70" />
								<span>{patient.dob ? new Date(patient.dob).toLocaleDateString() : 'Unknown'}</span>
							</div>
						</div>
						<div>
							<span class="text-muted-foreground block mb-1">Sex</span>
							<span class="capitalize">{patient.sex}</span>
						</div>
						<div>
							<span class="text-muted-foreground block mb-1">Phone Number</span>
							<div class="flex items-center gap-2">
								<Phone class="size-4 text-primary/70" />
								<span>{patient.phone || 'N/A'}</span>
							</div>
						</div>
						<div>
							<span class="text-muted-foreground block mb-1">Community / Address</span>
							<div class="flex items-center gap-2">
								<MapPin class="size-4 text-primary/70" />
								<span>{patient.community || patient.address || 'N/A'}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Family Panel -->
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-lg flex items-center gap-2">
						<Users class="size-5 text-primary" />
						Family Group
					</CardTitle>
					<Button variant="outline" size="sm" onclick={handleLinkFamily}>Link</Button>
				</CardHeader>
				<CardContent>
					{#if familyMembers.length > 0}
						<div class="space-y-3 mt-4">
							{#each familyMembers as relative}
								<div class="flex flex-col gap-1 p-2 rounded-lg bg-muted/40 border border-border">
									<a
										href="/patients/{relative.clinicId}"
										class="text-sm font-medium hover:underline text-foreground"
									>
										{relative.name}
									</a>
									<div class="flex items-center justify-between text-xs text-muted-foreground">
										<span class="font-mono">{relative.clinicId}</span>
										<Badge variant="secondary" class="h-5 text-[10px]">Relative</Badge>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-6 text-muted-foreground text-sm">
							<p>No family members linked.</p>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	{:else}
		<div class="p-12 text-center text-muted-foreground">
			Patient record not found locally. Please ensure you are synced.
		</div>
	{/if}
</div>
