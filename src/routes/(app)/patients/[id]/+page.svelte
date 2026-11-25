<script lang="ts">
	import { page } from '$app/state';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { ArrowLeft, Users, Calendar, Phone, MapPin } from '@lucide/svelte';
	import AncTracker from '#lib/components/maternal/anc-tracker.svelte';
	import ImmunizationCard from '#lib/components/pediatrics/immunization-card.svelte';
	import { settingsStore } from '#lib/state/settings.svelte.ts';
	import LinkFamilyDialog from '#lib/components/link-family-dialog.svelte';

	let clinicId = $derived(page.params.id);
	let patient = $derived(clinicId ? patientStore.findByClinicId(clinicId) : null);

	let isLinkFamilyOpen = $state(false);

	let familyMembers = $derived(
		patient?.familyId
			? patientStore.familyMembers(patient.familyId).filter((p) => p.id !== patient?.id)
			: []
	);

	function goBack() {
		history.back();
	}
</script>

<svelte:head>
	<title>{patient ? patient.name : 'Patient Profile'} — ClinicFlow</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
	<!-- Patient Folder Header Band -->
	<div class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="bg-primary text-primary-foreground px-5 py-4 flex items-center gap-3">
			<Button
				variant="ghost"
				size="icon"
				onclick={goBack}
				aria-label="Go back"
				class="text-primary-foreground hover:bg-primary-foreground/15 shrink-0"
			>
				<ArrowLeft class="size-5" />
			</Button>
			<div class="min-w-0 flex-1">
				<p class="text-[11px] font-mono uppercase tracking-widest opacity-80">Patient Folder</p>
				<h1 class="text-xl sm:text-2xl font-bold tracking-tight truncate">
					{patient?.name || 'Patient Not Found'}
				</h1>
			</div>
			{#if patient}
				<span
					class="font-mono text-xs sm:text-sm bg-primary-foreground/15 px-3 py-1 rounded-lg shrink-0"
				>
					{patient.clinicId}
				</span>
			{/if}
		</div>
	</div>

	{#if patient}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Demographics Ledger -->
			<section class="md:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
				<h2 class="text-base font-semibold text-foreground pb-2 border-b border-border">
					Patient Details
				</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
					<div>
						<span class="text-xs text-muted-foreground block mb-1">Date of Birth</span>
						<div class="flex items-center gap-2 font-mono">
							<Calendar class="size-4 text-primary shrink-0" />
							<span>{patient.dob ? new Date(patient.dob).toLocaleDateString() : 'Unknown'}</span>
						</div>
					</div>
					<div>
						<span class="text-xs text-muted-foreground block mb-1">Sex</span>
						<span class="capitalize font-medium">{patient.sex}</span>
					</div>
					<div>
						<span class="text-xs text-muted-foreground block mb-1">Insurance</span>
						<Badge variant={patient.isNhis ? 'default' : 'secondary'} class="font-medium text-xs">
							{patient.isNhis ? 'NHIS Enrollee' : 'None'}
						</Badge>
					</div>
					<div>
						<span class="text-xs text-muted-foreground block mb-1">Phone Number</span>
						<div class="flex items-center gap-2 font-mono">
							<Phone class="size-4 text-primary shrink-0" />
							<span>{patient.phone || 'N/A'}</span>
						</div>
					</div>
					<div class="sm:col-span-2">
						<span class="text-xs text-muted-foreground block mb-1">Community / Address</span>
						<div class="flex items-center gap-2">
							<MapPin class="size-4 text-primary shrink-0" />
							<span>{patient.community || patient.address || 'N/A'}</span>
						</div>
					</div>
				</div>
			</section>

			<!-- Family Panel -->
			<section class="rounded-xl border border-border bg-card p-5 space-y-4">
				<div class="flex items-center justify-between gap-2 pb-2 border-b border-border">
					<h2 class="text-base font-semibold flex items-center gap-2">
						<Users class="size-4 text-primary" />
						Family Group
					</h2>
					{#if patient.familyId}
						<Button variant="outline" size="sm" href={`/families/${patient.familyId}`}>
							Dashboard
						</Button>
					{:else}
						<Button variant="outline" size="sm" onclick={() => (isLinkFamilyOpen = true)}>
							Link Family
						</Button>
					{/if}
				</div>

				{#if familyMembers.length > 0}
					<div class="divide-y divide-border border border-border rounded-lg">
						{#each familyMembers as relative (relative.id)}
							<a
								href="/patients/{relative.clinicId}"
								class="flex flex-col gap-1 px-3 py-2.5 hover:bg-muted/40 transition-colors"
							>
								<span class="text-sm font-medium text-foreground">{relative.name}</span>
								<div class="flex items-center justify-between text-xs text-muted-foreground">
									<span class="font-mono">{relative.clinicId}</span>
									<Badge variant="secondary" class="h-5 text-[10px]">Relative</Badge>
								</div>
							</a>
						{/each}
					</div>
				{:else}
					<div class="text-center py-6 text-muted-foreground text-xs">
						No family members linked.
					</div>
				{/if}
			</section>
		</div>

		{#if patient.sex === 'female' && settingsStore.current.maternalHealthEnabled}
			<AncTracker patientId={patient.id} />
		{/if}

		{#if settingsStore.current.immunizationEnabled}
			<ImmunizationCard patientId={patient.id} />
		{/if}
	{:else}
		<div
			class="p-12 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card/50"
		>
			Patient record not found locally. Please ensure you are synced.
		</div>
	{/if}
</div>

{#if patient}
	<LinkFamilyDialog bind:open={isLinkFamilyOpen} {patient} />
{/if}
