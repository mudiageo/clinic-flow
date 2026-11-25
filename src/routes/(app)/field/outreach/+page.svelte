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
	<div class="space-y-6 max-w-6xl mx-auto">
		<div
			class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pb-2 border-b border-border"
		>
			<div class="flex items-center gap-3">
				<Button variant="ghost" size="icon" href="/field" aria-label="Back to Field Mode">
					<ArrowLeft class="size-5" />
				</Button>
				<div>
					<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground">
						Field &amp; Community
					</p>
					<h1 class="text-2xl font-bold tracking-tight text-foreground">Outreach Log</h1>
					<p class="mt-0.5 text-sm text-muted-foreground">
						Offline-ready aggregate community activity records
					</p>
				</div>
			</div>
			<Button class="min-h-11 px-5 font-semibold" onclick={() => (dialogOpen = true)}>
				<Plus class="mr-2 size-4" /> Log Activity
			</Button>
		</div>

		<!-- Ruled Summary Strip -->
		<div
			class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border rounded-xl border border-border bg-card"
		>
			<div class="px-4 py-3 flex items-center justify-between gap-2">
				<div>
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Today</p>
					<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{todayRecords.length}</p>
				</div>
				<MapPin class="size-4 text-primary shrink-0" />
			</div>
			<div class="px-4 py-3 flex items-center justify-between gap-2">
				<div>
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
						People Reached
					</p>
					<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{todayPeople}</p>
				</div>
				<Users class="size-4 text-primary shrink-0" />
			</div>
			<div class="px-4 py-3 flex items-center justify-between gap-2">
				<div>
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
						Households
					</p>
					<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{todayHouseholds}</p>
				</div>
				<Home class="size-4 text-primary shrink-0" />
			</div>
			<div class="px-4 py-3 flex items-center justify-between gap-2">
				<div>
					<p class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
						Pending Sync
					</p>
					<p class="mt-0.5 text-2xl font-bold font-mono tabular-nums">{pendingCount}</p>
				</div>
				<PackageCheck class="size-4 text-primary shrink-0" />
			</div>
		</div>

		<div
			class="flex gap-3 rounded-xl border border-triage-red/30 border-l-4 border-l-triage-red bg-triage-red/8 p-4 text-foreground"
		>
			<ShieldAlert class="mt-0.5 size-5 shrink-0 text-triage-red" />
			<div>
				<p class="text-sm font-semibold text-triage-red">Aggregate reporting only</p>
				<p class="mt-1 text-xs leading-relaxed text-foreground/85">
					Do not enter patient names, clinic IDs, phone numbers, or clinical histories. Urgent
					findings require immediate referral and documentation in the patient's clinical record.
				</p>
			</div>
		</div>

		<section class="rounded-xl border border-border bg-card overflow-hidden">
			<div class="px-5 py-3.5 border-b border-border bg-muted/20">
				<h2 class="text-base font-semibold text-foreground">Recorded Activities</h2>
				<p class="text-xs text-muted-foreground">Records from this PHC, newest first</p>
			</div>
			<Table>
				<TableHeader>
					<TableRow class="hover:bg-transparent">
						<TableHead class="px-5 font-mono text-xs uppercase tracking-wider">Activity</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider">Community</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider">Date</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider">People</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider">Households</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider">Services</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider">Sync</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each records as record, idx (record.id)}
						<TableRow class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}>
							<TableCell class="px-5 font-medium">
								{OUTREACH_ACTIVITY_LABELS[record.activityType]}
							</TableCell>
							<TableCell>{record.community}</TableCell>
							<TableCell class="font-mono text-xs">{formatDate(record.occurredAt)}</TableCell>
							<TableCell class="font-mono tabular-nums">{record.peopleReached}</TableCell>
							<TableCell class="font-mono tabular-nums">{record.householdsVisited}</TableCell>
							<TableCell class="text-xs">
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
							<TableCell colspan={7} class="h-52 text-center text-muted-foreground">
								No outreach activities recorded for this PHC.
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</section>
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
	<div class="mx-auto max-w-xl rounded-xl border border-border bg-card p-6">
		<h2 class="text-base font-semibold">Outreach access required</h2>
		<p class="text-sm text-muted-foreground mt-1">
			Your account does not have the Manage Outreach permission. Contact your PHC administrator.
		</p>
	</div>
{/if}
