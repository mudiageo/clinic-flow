<script lang="ts">
	import { outreachStore } from '#lib/state/outreach.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import {
		OUTREACH_ACTIVITY_LABELS,
		OUTREACH_ACTIVITY_TYPES,
		isOutreachActivityType,
		type OutreachActivityType
	} from '#lib/outreach/types.ts';
	import { formatDate } from '#lib/utils/date.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '#lib/components/ui/select/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import {
		ArrowLeft,
		Home,
		MapPin,
		PackageCheck,
		Plus,
		ShieldAlert,
		Syringe,
		Users
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let dialogOpen = $state(false);
	let activityType = $state<OutreachActivityType>('household_visit');
	let community = $state('');
	let occurredOn = $state(new Date().toISOString().slice(0, 10));
	let householdsVisited = $state<number | ''>(0);
	let peopleReached = $state<number | ''>(0);
	let immunizationsGiven = $state<number | ''>(0);
	let bednetsDistributed = $state<number | ''>(0);
	let notes = $state('');
	let isSaving = $state(false);

	const phcId = $derived(sessionStore.activePhcId);
	const canManageOutreach = $derived(sessionStore.can('manage:outreach'));
	const records = $derived(outreachStore.forPhc(phcId));
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const todayRecords = $derived(records.filter((record) => record.occurredAt >= todayStart));
	const todayPeople = $derived(
		todayRecords.reduce((total, record) => total + record.peopleReached, 0)
	);
	const todayHouseholds = $derived(
		todayRecords.reduce((total, record) => total + record.householdsVisited, 0)
	);
	const pendingCount = $derived(records.filter((record) => record.syncStatus === 'pending').length);

	function setActivityType(value: string) {
		if (isOutreachActivityType(value)) activityType = value;
	}

	function count(value: number | ''): number {
		return value === '' ? 0 : Math.max(0, Math.trunc(value));
	}

	function resetForm() {
		activityType = 'household_visit';
		community = '';
		occurredOn = new Date().toISOString().slice(0, 10);
		householdsVisited = 0;
		peopleReached = 0;
		immunizationsGiven = 0;
		bednetsDistributed = 0;
		notes = '';
	}

	async function saveOutreachRecord() {
		const trimmedCommunity = community.trim();
		const occurredAt = new Date(`${occurredOn}T12:00:00`).getTime();
		const aggregateTotal =
			count(householdsVisited) +
			count(peopleReached) +
			count(immunizationsGiven) +
			count(bednetsDistributed);

		if (!trimmedCommunity || !Number.isFinite(occurredAt)) {
			toast.error('Enter a community and valid activity date.');
			return;
		}
		if (aggregateTotal === 0) {
			toast.error('Record at least one aggregate outreach count.');
			return;
		}

		isSaving = true;
		try {
			await outreachStore.log({
				activityType,
				community: trimmedCommunity,
				occurredAt,
				householdsVisited: count(householdsVisited),
				peopleReached: count(peopleReached),
				immunizationsGiven: count(immunizationsGiven),
				bednetsDistributed: count(bednetsDistributed),
				notes: notes.trim() || null
			});
			toast.success('Outreach activity saved to the offline sync queue.');
			resetForm();
			dialogOpen = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Unable to save outreach activity.');
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Outreach Log — ClinicFlow</title>
</svelte:head>

{#if canManageOutreach}
	<div class="space-y-8 animate-fade-in">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div class="flex items-start gap-3">
				<Button variant="ghost" size="icon" href="/field" aria-label="Back to Field Mode">
					<ArrowLeft class="size-5" />
				</Button>
				<div class="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
					<MapPin class="size-6" />
				</div>
				<div>
					<h1 class="text-2xl font-bold tracking-tight">Outreach Log</h1>
					<p class="mt-0.5 text-sm font-medium text-muted-foreground">
						Offline-ready aggregate community activity records
					</p>
				</div>
			</div>
			<Button onclick={() => (dialogOpen = true)}>
				<Plus class="mr-2 size-4" /> Log Activity
			</Button>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<Card>
				<CardContent class="flex items-center justify-between p-5">
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Today
						</p>
						<p class="mt-1 text-2xl font-bold tabular-nums">{todayRecords.length}</p>
					</div>
					<MapPin class="size-5 text-indigo-600" />
				</CardContent>
			</Card>
			<Card>
				<CardContent class="flex items-center justify-between p-5">
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							People Reached
						</p>
						<p class="mt-1 text-2xl font-bold tabular-nums">{todayPeople}</p>
					</div>
					<Users class="size-5 text-indigo-600" />
				</CardContent>
			</Card>
			<Card>
				<CardContent class="flex items-center justify-between p-5">
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Households
						</p>
						<p class="mt-1 text-2xl font-bold tabular-nums">{todayHouseholds}</p>
					</div>
					<Home class="size-5 text-indigo-600" />
				</CardContent>
			</Card>
			<Card>
				<CardContent class="flex items-center justify-between p-5">
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Pending Sync
						</p>
						<p class="mt-1 text-2xl font-bold tabular-nums">{pendingCount}</p>
					</div>
					<PackageCheck class="size-5 text-indigo-600" />
				</CardContent>
			</Card>
		</div>

		<div class="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
			<ShieldAlert class="mt-0.5 size-5 shrink-0 text-red-700" />
			<div>
				<p class="text-sm font-semibold">Aggregate reporting only</p>
				<p class="mt-1 text-xs leading-relaxed">
					Do not enter patient names, clinic IDs, phone numbers, or clinical histories. Urgent
					findings require immediate referral and documentation in the patient's clinical record.
				</p>
			</div>
		</div>

		<Card class="overflow-hidden">
			<CardHeader class="border-b bg-muted/20">
				<CardTitle class="text-base">Recorded Activities</CardTitle>
				<CardDescription>Records from this PHC, newest first</CardDescription>
			</CardHeader>
			<CardContent class="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead class="px-6">Activity</TableHead>
							<TableHead>Community</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>People</TableHead>
							<TableHead>Households</TableHead>
							<TableHead>Services</TableHead>
							<TableHead>Sync</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each records as record (record.id)}
							<TableRow>
								<TableCell class="px-6 font-medium">
									{OUTREACH_ACTIVITY_LABELS[record.activityType]}
								</TableCell>
								<TableCell>{record.community}</TableCell>
								<TableCell>{formatDate(record.occurredAt)}</TableCell>
								<TableCell>{record.peopleReached}</TableCell>
								<TableCell>{record.householdsVisited}</TableCell>
								<TableCell>
									{record.immunizationsGiven} vaccines · {record.bednetsDistributed} bednets
								</TableCell>
								<TableCell>
									<Badge variant={record.syncStatus === 'conflict' ? 'destructive' : 'outline'}>
										{record.syncStatus}
									</Badge>
								</TableCell>
							</TableRow>
						{:else}
							<TableRow>
								<TableCell colspan={7} class="h-56 text-center text-muted-foreground">
									No outreach activities recorded for this PHC.
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	</div>

	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
			<Dialog.Header>
				<Dialog.Title>Log Outreach Activity</Dialog.Title>
				<Dialog.Description>
					Enter aggregate counts only. This record is saved locally first and synchronized when a
					connection is available.
				</Dialog.Description>
			</Dialog.Header>

			<div class="grid gap-5 py-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="outreach-activity">Activity</Label>
					<Select type="single" value={activityType} onValueChange={setActivityType}>
						<SelectTrigger id="outreach-activity">
							{OUTREACH_ACTIVITY_LABELS[activityType]}
						</SelectTrigger>
						<SelectContent>
							{#each OUTREACH_ACTIVITY_TYPES as type (type)}
								<SelectItem value={type}>{OUTREACH_ACTIVITY_LABELS[type]}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-2">
					<Label for="outreach-date">Activity date</Label>
					<Input
						id="outreach-date"
						type="date"
						bind:value={occurredOn}
						max={new Date().toISOString().slice(0, 10)}
					/>
				</div>
				<div class="space-y-2 sm:col-span-2">
					<Label for="outreach-community">Community</Label>
					<Input
						id="outreach-community"
						bind:value={community}
						maxlength={160}
						placeholder="Community or settlement name"
					/>
				</div>
				<div class="space-y-2">
					<Label for="outreach-households">Households visited</Label>
					<Input id="outreach-households" type="number" min="0" bind:value={householdsVisited} />
				</div>
				<div class="space-y-2">
					<Label for="outreach-people">People reached</Label>
					<Input id="outreach-people" type="number" min="0" bind:value={peopleReached} />
				</div>
				<div class="space-y-2">
					<Label for="outreach-vaccines">Immunizations given</Label>
					<div class="relative">
						<Syringe class="absolute left-3 top-3 size-4 text-muted-foreground" />
						<Input
							id="outreach-vaccines"
							type="number"
							min="0"
							class="pl-9"
							bind:value={immunizationsGiven}
						/>
					</div>
				</div>
				<div class="space-y-2">
					<Label for="outreach-bednets">Bednets distributed</Label>
					<Input id="outreach-bednets" type="number" min="0" bind:value={bednetsDistributed} />
				</div>
				<div class="space-y-2 sm:col-span-2">
					<Label for="outreach-notes">Non-identifying notes (optional)</Label>
					<Textarea
						id="outreach-notes"
						bind:value={notes}
						maxlength={500}
						placeholder="Example: Health talk delivered at the community hall. Do not enter patient details."
					/>
				</div>
			</div>

			<Dialog.Footer>
				<Button variant="outline" onclick={() => (dialogOpen = false)} disabled={isSaving}>
					Cancel
				</Button>
				<Button onclick={saveOutreachRecord} disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save Activity'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Card class="mx-auto max-w-xl">
		<CardHeader>
			<CardTitle>Outreach access required</CardTitle>
			<CardDescription>
				Your account does not have the Manage Outreach permission. Contact your PHC administrator.
			</CardDescription>
		</CardHeader>
	</Card>
{/if}
