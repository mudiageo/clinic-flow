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
	import { Users, Bell, CalendarClock, ArrowLeft, Baby, UserPlus } from '@lucide/svelte';
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

	function handleRegisterNewborn() {
		toast.success('Newborn registration form (linked to mother) will open here.');
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
			<Button variant="outline" onclick={() => toast.success('Add relative modal open')}>
				<UserPlus class="size-4 mr-2" /> Add Relative
			</Button>
			<Button onclick={handleRegisterNewborn} class="bg-primary hover:bg-primary/90">
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
