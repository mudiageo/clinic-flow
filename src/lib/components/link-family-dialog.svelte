<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { patientStore } from '$lib/state/patients.svelte';
	import { familyStore } from '$lib/state/families.svelte';
	import { toast } from 'svelte-sonner';
	import type { LocalPatient, LocalFamily } from '$lib/local-db/db';

	let {
		open = $bindable(false),
		patient
	}: {
		open: boolean;
		patient: LocalPatient;
	} = $props();

	let searchQuery = $state('');
	let isCreatingNew = $state(false);
	let newFamilyName = $state('');

	// A simple search over existing families based on patient names
	const matchedFamilies = $derived.by(() => {
		if (!searchQuery || searchQuery.length < 2) return [];
		
		// Find patients whose names match
		const matchingPatients = patientStore.items.filter(p => 
			p.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
			p.familyId !== null && 
			p.id !== patient.id
		);

		// Extract unique families
		const familyIds = [...new Set(matchingPatients.map(p => p.familyId))];
		return familyIds
			.map(id => familyStore.items.find(f => f.id === id))
			.filter(Boolean) as LocalFamily[];
	});

	async function createAndLinkFamily() {
		if (!newFamilyName) return;
		try {
			const familyId = crypto.randomUUID();
			await familyStore.create({
				id: familyId,
				householdName: newFamilyName,
				community: patient.community,
				syncStatus: 'pending',
				updatedAt: Date.now()
			});
			
			await patientStore.update(patient.id, { familyId, updatedAt: Date.now() });
			toast.success('New family group created and linked.');
			open = false;
		} catch (e) {
			toast.error('Failed to create family group.');
		}
	}

	async function linkToExisting(familyId: string) {
		try {
			await patientStore.update(patient.id, { familyId, updatedAt: Date.now() });
			toast.success('Patient linked to family successfully.');
			open = false;
		} catch (e) {
			toast.error('Failed to link family.');
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Family Grouping</Dialog.Title>
			<Dialog.Description>
				Link {patient.name} to a family group to share clinical history, appointments, and household analytics.
			</Dialog.Description>
		</Dialog.Header>

		{#if isCreatingNew}
			<div class="space-y-4 py-4">
				<div class="space-y-2">
					<Label for="family-name">Household Name (e.g. "The Adeleke Family")</Label>
					<Input id="family-name" bind:value={newFamilyName} placeholder="Enter household name..." />
				</div>
				<div class="flex items-center justify-end gap-3 pt-4">
					<Button variant="ghost" onclick={() => isCreatingNew = false}>Back to Search</Button>
					<Button onclick={createAndLinkFamily} disabled={!newFamilyName}>Create & Link</Button>
				</div>
			</div>
		{:else}
			<div class="space-y-4 py-4">
				<div class="space-y-2">
					<Label for="search-family">Search by Relative's Name</Label>
					<Input id="search-family" bind:value={searchQuery} placeholder="Search relative..." />
				</div>

				<div class="max-h-60 overflow-y-auto space-y-2 pt-2">
					{#if searchQuery.length >= 2}
						{#each matchedFamilies as family (family.id)}
							<div class="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors">
								<div>
									<h4 class="font-medium text-sm">{family.householdName || 'Unknown Household'}</h4>
									<p class="text-xs text-muted-foreground">{family.community || 'Unknown Community'}</p>
								</div>
								<Button size="sm" variant="secondary" onclick={() => linkToExisting(family.id)}>Link</Button>
							</div>
						{:else}
							<div class="text-sm text-muted-foreground text-center py-4">No matching families found.</div>
						{/each}
					{:else}
						<div class="text-sm text-muted-foreground text-center py-4">Type at least 2 characters to search.</div>
					{/if}
				</div>

				<div class="border-t pt-4 flex flex-col gap-3">
					<Button variant="outline" class="w-full" onclick={() => isCreatingNew = true}>
						Create New Family Group
					</Button>
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
