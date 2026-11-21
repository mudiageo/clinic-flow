<script lang="ts">
	import { page } from '$app/state';
	import { familyStore } from '#lib/state/families.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { reminderStore } from '#lib/state/reminders.svelte.ts';
	import { appointmentStore } from '#lib/state/appointments.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import { formatDateTime } from '#lib/utils/date.ts';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '#lib/components/ui/card/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import * as Select from '#lib/components/ui/select/index.ts';
	import {
		Users,
		Bell,
		CalendarClock,
		ArrowLeft,
		Baby,
		UserPlus,
		Link2,
		Search
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let familyId = $derived(page.params.id);
	let family = $derived.by(() => {
		const record = familyId ? familyStore.get(familyId) : undefined;
		return record?.phcId === sessionStore.activePhcId ? record : undefined;
	});

	// Never render members from a family outside the active PHC, including stale
	// records that may remain in the offline cache after switching clinics.
	let members = $derived(
		family
			? patientStore.items.filter(
					(patient) => patient.familyId === family.id && patient.phcId === family.phcId
				)
			: []
	);

	let memberIds = $derived(members.map((m) => m.id));

	// Fetch reminders for all family members
	let familyReminders = $derived(
		reminderStore.pendingReminders.filter((r) => memberIds.includes(r.patientId))
	);
	let familyAppointments = $derived(
		appointmentStore.upcoming
			.filter((appointment) => memberIds.includes(appointment.patientId))
			.sort((a, b) => a.scheduledAt - b.scheduledAt)
	);

	function getMemberName(id: string) {
		return members.find((m) => m.id === id)?.name || 'Unknown';
	}

	type RelativeMode = 'new' | 'link';
	type Sex = 'female' | 'male' | 'other';

	let newbornOpen = $state(false);
	let relativeOpen = $state(false);
	let relativeMode = $state<RelativeMode>('new');
	let submitting = $state(false);

	let newbornForm = $state({ name: '', sex: 'female' as Sex, dob: '', motherId: '' });
	let relativeForm = $state({ name: '', sex: 'female' as Sex, dob: '', phone: '' });
	let linkSearch = $state('');

	let linkablePatients = $derived(
		patientStore.items
			.filter(
				(patient) =>
					patient.phcId === sessionStore.activePhcId &&
					!patient.familyId &&
					patient.name.toLowerCase().includes(linkSearch.trim().toLowerCase())
			)
			.slice(0, 20)
	);

	function openNewborn() {
		if (!family || members.length === 0) {
			toast.error('Register at least one adult family member before adding a newborn.');
			return;
		}
		newbornForm = {
			name: '',
			sex: 'female',
			dob: '',
			motherId: members.find((member) => member.sex === 'female')?.id ?? ''
		};
		newbornOpen = true;
	}

	function openRelative() {
		relativeMode = 'new';
		relativeForm = { name: '', sex: 'female', dob: '', phone: '' };
		linkSearch = '';
		relativeOpen = true;
	}

	async function saveNewborn() {
		if (!family || submitting) return;
		if (!newbornForm.name.trim()) return toast.error('Baby name is required');
		if (!newbornForm.dob) return toast.error('Date of birth is required');
		const mother = members.find((member) => member.id === newbornForm.motherId);
		if (!mother) return toast.error('Select the mother from this household');

		submitting = true;
		try {
			// Deterministic, collision-aware clinic ID — never a random one.
			const clinicId = patientStore.allocateClinicId('BB');
			await patientStore.create({
				clinicId,
				phcId: family.phcId,
				familyId: family.id,
				guardianId: mother.id,
				name: newbornForm.name.trim(),
				phone: mother.phone,
				dob: newbornForm.dob,
				sex: newbornForm.sex,
				address: mother.address,
				community: mother.community,
				nextOfKinPhone: mother.nextOfKinPhone,
				nextOfKinName: mother.nextOfKinName ?? mother.name,
				isPregnant: false,
				isNhis: false,
				serverUpdatedAt: null,
				deleted: false
			});
			newbornOpen = false;
			toast.success(`Newborn registered as ${clinicId} and linked to ${mother.name}.`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not register newborn');
		} finally {
			submitting = false;
		}
	}

	async function saveRelative() {
		if (!family || submitting) return;
		if (!relativeForm.name.trim()) return toast.error('Relative name is required');

		submitting = true;
		try {
			const clinicId = patientStore.allocateClinicId('FR');
			await patientStore.create({
				clinicId,
				phcId: family.phcId,
				familyId: family.id,
				guardianId: null,
				name: relativeForm.name.trim(),
				phone: relativeForm.phone.trim() || null,
				dob: relativeForm.dob || null,
				sex: relativeForm.sex,
				address: family.community ?? null,
				community: family.community ?? null,
				nextOfKinPhone: null,
				nextOfKinName: null,
				isPregnant: false,
				isNhis: false,
				serverUpdatedAt: null,
				deleted: false
			});
			relativeOpen = false;
			toast.success(`Relative registered as ${clinicId}.`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not add relative');
		} finally {
			submitting = false;
		}
	}

	async function linkPatient(patientId: string) {
		if (!family || submitting) return;
		submitting = true;
		try {
			await patientStore.update(patientId, { familyId: family.id });
			toast.success('Patient linked to this household.');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not link patient');
		} finally {
			submitting = false;
		}
	}

	function goBack() {
		history.back();
	}
</script>

<svelte:head>
	<title>Family Dashboard — ClinicFlow</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" onclick={goBack} aria-label="Go back">
				<ArrowLeft class="size-5" />
			</Button>
			<div>
				<h1 class="text-2xl font-bold tracking-tight flex items-center gap-2">
					<Users class="size-6 text-primary" />
					{family?.householdName || 'Family Health Dashboard'}
				</h1>
				<p class="text-muted-foreground mt-1 text-sm">
					{family?.community || 'Community not recorded'} ·
					<span class="font-mono">{familyId}</span>
				</p>
			</div>
		</div>
		<div class="flex gap-3">
			<Button variant="outline" onclick={openRelative} disabled={!family}>
				<UserPlus class="size-4 mr-2" /> Add Relative
			</Button>
			<Button onclick={openNewborn} class="bg-primary hover:bg-primary/90" disabled={!family}>
				<Baby class="size-4 mr-2" /> Register Newborn
			</Button>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- Household Members -->
		<Card class="md:col-span-2">
			<CardHeader>
				<CardTitle>Household Members</CardTitle>
				<CardDescription>All registered patients linked to this family group</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{#each members as member (member.id)}
						<a
							href={`/patients/${member.clinicId}`}
							class="block p-4 border rounded-xl hover:border-primary/50 transition-colors bg-card shadow-sm hover:shadow-md"
						>
							<div class="flex justify-between items-start mb-2">
								<h3 class="font-bold text-base truncate pr-2">{member.name}</h3>
								<Badge variant="outline" class="font-mono text-[10px] shrink-0"
									>{member.clinicId}</Badge
								>
							</div>
							<div class="text-sm text-muted-foreground space-y-1">
								<p>
									Age: {member.dob
										? new Date().getFullYear() - new Date(member.dob).getFullYear()
										: 'Unknown'}
								</p>
								<p class="capitalize">Sex: {member.sex}</p>
								{#if member.isPregnant}
									<Badge
										class="mt-2 bg-pink-500/10 text-pink-600 border-pink-500/20 hover:bg-pink-500/20"
										>Pregnant (ANC Active)</Badge
									>
								{/if}
							</div>
						</a>
					{:else}
						<div class="col-span-full py-10 text-center text-muted-foreground">
							No members found for this family group.
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Right Column -->
		<div class="space-y-6">
			<!-- Family Reminders -->
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="text-lg flex items-center gap-2">
						<Bell class="size-4 text-primary" /> Active Reminders
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each familyReminders as reminder (reminder.id)}
							<div class="flex flex-col p-3 rounded-lg bg-muted/40 border border-border">
								<div class="flex items-center justify-between mb-1">
									<Badge variant="secondary" class="text-xs uppercase"
										>{reminder.type.replace('_', ' ')}</Badge
									>
									<span
										class="text-xs font-medium {new Date(reminder.dueDate) < new Date()
											? 'text-destructive'
											: 'text-muted-foreground'}"
									>
										{new Date(reminder.dueDate).toLocaleDateString()}
									</span>
								</div>
								<p class="text-sm font-semibold text-foreground mt-1">{reminder.label}</p>
								<p class="text-xs text-muted-foreground mt-0.5">
									For: {getMemberName(reminder.patientId)}
								</p>
							</div>
						{:else}
							<div class="text-sm text-muted-foreground text-center py-4">
								No active reminders for this household.
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>

			<!-- Family Appointments -->
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="text-lg flex items-center gap-2">
						<CalendarClock class="size-4 text-primary" /> Upcoming Visits
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each familyAppointments as appointment (appointment.id)}
							<div class="rounded-lg border bg-muted/20 p-3">
								<div class="flex items-center justify-between gap-2">
									<p class="text-sm font-semibold">{getMemberName(appointment.patientId)}</p>
									<Badge variant="outline" class="capitalize">{appointment.type}</Badge>
								</div>
								<p class="mt-1 text-xs text-muted-foreground">
									{formatDateTime(appointment.scheduledAt)}
								</p>
							</div>
						{:else}
							<div
								class="rounded-lg border-2 border-dashed bg-muted/20 py-4 text-center text-sm text-muted-foreground"
							>
								No upcoming visits scheduled for this family.
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>

<Dialog.Root bind:open={newbornOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Baby class="size-5" /> Register newborn
			</Dialog.Title>
			<Dialog.Description>
				Creates a patient record linked to this household and to the selected mother. Only enter
				details you have actually confirmed.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-2">
			<div class="space-y-2">
				<Label for="newborn-name">Baby's name</Label>
				<Input id="newborn-name" bind:value={newbornForm.name} placeholder="Full name" />
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="newborn-dob">Date of birth</Label>
					<Input id="newborn-dob" type="date" bind:value={newbornForm.dob} />
				</div>
				<div class="space-y-2">
					<Label for="newborn-sex">Sex</Label>
					<Select.Root
						type="single"
						value={newbornForm.sex}
						onValueChange={(value) => (newbornForm.sex = value as Sex)}
					>
						<Select.Trigger id="newborn-sex" class="w-full capitalize">
							{newbornForm.sex}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="female">Female</Select.Item>
							<Select.Item value="male">Male</Select.Item>
							<Select.Item value="other">Other</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<div class="space-y-2">
				<Label for="newborn-mother">Mother (household member)</Label>
				<Select.Root
					type="single"
					value={newbornForm.motherId || undefined}
					onValueChange={(value) => (newbornForm.motherId = value)}
				>
					<Select.Trigger id="newborn-mother" class="w-full">
						{members.find((member) => member.id === newbornForm.motherId)?.name ??
							'Select the mother'}
					</Select.Trigger>
					<Select.Content>
						{#each members as member (member.id)}
							<Select.Item value={member.id}>{member.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" disabled={submitting} onclick={() => (newbornOpen = false)}>
				Cancel
			</Button>
			<Button disabled={submitting} onclick={saveNewborn}>
				{submitting ? 'Registering…' : 'Register newborn'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={relativeOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<UserPlus class="size-5" /> Add relative
			</Dialog.Title>
			<Dialog.Description>
				Register a new family member, or link a patient who is already registered at this PHC but
				not yet in a household.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-2">
			<div class="flex gap-2">
				<Button
					size="sm"
					variant={relativeMode === 'new' ? 'default' : 'outline'}
					onclick={() => (relativeMode = 'new')}
				>
					Register new
				</Button>
				<Button
					size="sm"
					variant={relativeMode === 'link' ? 'default' : 'outline'}
					onclick={() => (relativeMode = 'link')}
				>
					<Link2 class="size-4 mr-1" /> Link existing
				</Button>
			</div>

			{#if relativeMode === 'new'}
				<div class="space-y-2">
					<Label for="relative-name">Full name</Label>
					<Input id="relative-name" bind:value={relativeForm.name} placeholder="Full name" />
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="relative-dob">Date of birth (if known)</Label>
						<Input id="relative-dob" type="date" bind:value={relativeForm.dob} />
					</div>
					<div class="space-y-2">
						<Label for="relative-sex">Sex</Label>
						<Select.Root
							type="single"
							value={relativeForm.sex}
							onValueChange={(value) => (relativeForm.sex = value as Sex)}
						>
							<Select.Trigger id="relative-sex" class="w-full capitalize">
								{relativeForm.sex}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="female">Female</Select.Item>
								<Select.Item value="male">Male</Select.Item>
								<Select.Item value="other">Other</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<div class="space-y-2">
					<Label for="relative-phone">Phone (optional)</Label>
					<Input id="relative-phone" bind:value={relativeForm.phone} placeholder="Phone number" />
				</div>
			{:else}
				<div class="space-y-2">
					<Label for="link-search">Search unlinked patients</Label>
					<div class="relative">
						<Search class="size-4 absolute left-3 top-3 text-muted-foreground" />
						<Input
							id="link-search"
							bind:value={linkSearch}
							placeholder="Search by name"
							class="pl-9"
						/>
					</div>
				</div>
				<div class="max-h-52 overflow-y-auto space-y-2">
					{#each linkablePatients as patient (patient.id)}
						<div class="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm">
							<div class="min-w-0">
								<p class="font-medium truncate">{patient.name}</p>
								<p class="font-mono text-xs text-muted-foreground">{patient.clinicId}</p>
							</div>
							<Button
								size="sm"
								variant="outline"
								disabled={submitting}
								onclick={() => linkPatient(patient.id)}
							>
								Link
							</Button>
						</div>
					{:else}
						<p class="py-4 text-center text-sm text-muted-foreground">
							No unlinked patients found for this search.
						</p>
					{/each}
				</div>
			{/if}
		</div>
		<Dialog.Footer>
			<Button variant="outline" disabled={submitting} onclick={() => (relativeOpen = false)}>
				Close
			</Button>
			{#if relativeMode === 'new'}
				<Button disabled={submitting} onclick={saveRelative}>
					{submitting ? 'Registering…' : 'Register relative'}
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
