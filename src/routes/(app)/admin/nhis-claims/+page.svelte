<script lang="ts">
	import {
		getNhisClaims,
		getNhisEncounterOptions,
		createNhisClaim,
		submitNhisClaim,
		updateNhisClaimStatus,
		type NhisClaimRow
	} from '#lib/remote/nhis-claims.remote.ts';
	import { formatDate } from '#lib/utils/date.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription
	} from '#lib/components/ui/card/index.ts';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from '#lib/components/ui/dialog/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import * as Select from '#lib/components/ui/select/index.ts';
	import {
		FileText,
		Send,
		CheckCircle2,
		AlertTriangle,
		ClipboardCheck,
		Plus,
		Loader2
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	const claimsQuery = getNhisClaims();
	const encounterOptionsQuery = getNhisEncounterOptions();
	const claims = $derived(claimsQuery.current ?? []);
	const encounterOptions = $derived(encounterOptionsQuery.current ?? []);

	let prepareDialogOpen = $state(false);
	let selectedEncounterId = $state('');
	let enrolleeNumber = $state('');
	let authorizationCode = $state('');
	let isPreparing = $state(false);

	let submittingId = $state<string | null>(null);

	let reconcileDialogOpen = $state(false);
	let reconcileClaim = $state<NhisClaimRow | null>(null);
	let reconcileStatus = $state<'acknowledged' | 'paid' | 'failed'>('acknowledged');
	let reconcileNote = $state('');
	let isReconciling = $state(false);

	const selectedEncounter = $derived(
		encounterOptions.find((option) => option.id === selectedEncounterId) ?? null
	);

	function errorMessage(error: unknown): string {
		return error instanceof Error ? error.message : 'Unknown error';
	}

	function openPrepareDialog() {
		selectedEncounterId = '';
		enrolleeNumber = '';
		authorizationCode = '';
		prepareDialogOpen = true;
	}

	function chooseEncounter(value: string | undefined) {
		selectedEncounterId = value ?? '';
	}

	async function prepareClaim() {
		if (!selectedEncounterId) {
			toast.error('Select an encounter to prepare a claim.');
			return;
		}
		isPreparing = true;
		try {
			await createNhisClaim({
				encounterId: selectedEncounterId,
				enrolleeNumber: enrolleeNumber.trim() || undefined,
				authorizationCode: authorizationCode.trim() || undefined
			});
			await claimsQuery.refresh();
			prepareDialogOpen = false;
			toast.success('Claim packet prepared from the encounter record. Submit it to the HMO.');
		} catch (error) {
			toast.error('Unable to prepare claim: ' + errorMessage(error));
		} finally {
			isPreparing = false;
		}
	}

	async function submitClaim(claim: NhisClaimRow) {
		if (submittingId) return;
		submittingId = claim.id;
		try {
			const result = await submitNhisClaim({ claimId: claim.id });
			await claimsQuery.refresh();
			if (result.mode === 'console') {
				toast.warning(
					`Console mode — manual submission required. Reference: ${result.reference ?? 'not available'}`
				);
			} else {
				toast.success(`Claim submitted live. Reference: ${result.reference ?? 'not available'}`);
			}
		} catch (error) {
			toast.error('Unable to submit claim: ' + errorMessage(error));
		} finally {
			submittingId = null;
		}
	}

	function openReconcileDialog(claim: NhisClaimRow) {
		reconcileClaim = claim;
		reconcileStatus = 'acknowledged';
		reconcileNote = '';
		reconcileDialogOpen = true;
	}

	function chooseReconcileStatus(value: string | undefined) {
		if (value === 'acknowledged' || value === 'paid' || value === 'failed') {
			reconcileStatus = value;
		}
	}

	async function reconcile() {
		if (!reconcileClaim) return;
		isReconciling = true;
		try {
			await updateNhisClaimStatus({
				claimId: reconcileClaim.id,
				status: reconcileStatus,
				note: reconcileNote.trim() || undefined
			});
			await claimsQuery.refresh();
			reconcileDialogOpen = false;
			reconcileClaim = null;
			toast.success('Claim outcome recorded.');
		} catch (error) {
			toast.error('Unable to record claim outcome: ' + errorMessage(error));
		} finally {
			isReconciling = false;
		}
	}
</script>

<svelte:head>
	<title>NHIS Claims — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-6xl mx-auto">
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
		<CardHeader class="flex flex-row items-start justify-between gap-4">
			<div>
				<CardTitle>NHIS Claim Queue</CardTitle>
				<CardDescription>
					Durable claim packets built from real encounter, patient and vitals records. Provider
					references are shown exactly as returned by the provider.
				</CardDescription>
			</div>
			<Button size="sm" variant="outline" onclick={openPrepareDialog} class="shrink-0">
				<Plus class="size-4 mr-2" />
				Prepare claim
			</Button>
		</CardHeader>
		<CardContent class="p-0">
			{#if claimsQuery.error}
				<p class="p-6 text-sm text-destructive">Unable to load NHIS claims. Please try again.</p>
			{:else}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Visit date</TableHead>
							<TableHead>Patient</TableHead>
							<TableHead>Enrollee ID</TableHead>
							<TableHead>Claim reference</TableHead>
							<TableHead>Provider reference</TableHead>
							<TableHead>Status</TableHead>
							<TableHead class="text-right">Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each claims as claim (claim.id)}
							<TableRow>
								<TableCell class="font-medium whitespace-nowrap">
									{formatDate(claim.visitDate ?? claim.createdAt)}
								</TableCell>
								<TableCell>{claim.patientName}</TableCell>
								<TableCell class="font-mono text-xs">{claim.enrolleeNumber ?? '—'}</TableCell>
								<TableCell class="font-mono text-xs">{claim.claimReference}</TableCell>
								<TableCell class="font-mono text-xs">{claim.providerReference ?? '—'}</TableCell>
								<TableCell>
									<div class="flex flex-col items-start gap-1">
										<Badge variant="outline" class="capitalize">{claim.status}</Badge>
										{#if claim.providerMode === 'console'}
											<Badge
												class="bg-amber-500/15 text-amber-700 border-amber-500/25 whitespace-normal"
											>
												<AlertTriangle class="size-3 mr-1" />
												Console mode — manual submission required
											</Badge>
										{:else if claim.status === 'submitted' && claim.providerMode === 'live'}
											<Badge class="bg-emerald-500/15 text-emerald-700 border-emerald-500/25">
												<CheckCircle2 class="size-3 mr-1" />
												Submitted
											</Badge>
										{/if}
									</div>
								</TableCell>
								<TableCell class="text-right">
									{#if claim.status === 'draft' || claim.status === 'ready' || claim.status === 'failed'}
										<Button
											size="sm"
											variant="outline"
											disabled={submittingId !== null}
											onclick={() => void submitClaim(claim)}
										>
											{#if submittingId === claim.id}
												<Loader2 class="size-3 mr-2 animate-spin" />
											{:else}
												<Send class="size-3 mr-2" />
											{/if}
											Submit
										</Button>
									{:else if claim.status === 'submitted'}
										<Button size="sm" variant="ghost" onclick={() => openReconcileDialog(claim)}>
											<ClipboardCheck class="size-3 mr-2" />
											Reconcile
										</Button>
									{:else}
										<span class="text-xs text-muted-foreground">—</span>
									{/if}
								</TableCell>
							</TableRow>
						{:else}
							<TableRow>
								<TableCell colspan="7" class="h-32 text-center text-muted-foreground">
									No NHIS claims yet. Prepare a claim from a real encounter to get started.
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</CardContent>
	</Card>
</div>

<Dialog bind:open={prepareDialogOpen}>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader>
			<DialogTitle>Prepare NHIS claim</DialogTitle>
			<DialogDescription>
				Build a claim packet from a real encounter. No clinical values are invented; the
				HMO-specific claim file must still be completed by a person.
			</DialogDescription>
		</DialogHeader>
		<div class="space-y-4 py-2">
			<div class="space-y-2">
				<Label for="claim-encounter">Encounter</Label>
				<Select.Root
					type="single"
					value={selectedEncounterId || undefined}
					onValueChange={chooseEncounter}
				>
					<Select.Trigger id="claim-encounter" class="w-full">
						{selectedEncounter
							? `${selectedEncounter.patientName} — ${selectedEncounter.clinicId}`
							: 'Select an encounter'}
					</Select.Trigger>
					<Select.Content>
						{#each encounterOptions as option (option.id)}
							<Select.Item value={option.id}>
								{option.patientName} — {option.clinicId}{#if option.visitDate}
									({formatDate(option.visitDate)}){/if}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="enrollee-number">Enrollee number (optional)</Label>
					<Input id="enrollee-number" bind:value={enrolleeNumber} placeholder="HMO enrollee ID" />
				</div>
				<div class="space-y-2">
					<Label for="authorization-code">Authorization code (optional)</Label>
					<Input
						id="authorization-code"
						bind:value={authorizationCode}
						placeholder="HMO authorization code"
					/>
				</div>
			</div>
		</div>
		<DialogFooter>
			<Button type="button" variant="outline" onclick={() => (prepareDialogOpen = false)}>
				Cancel
			</Button>
			<Button onclick={() => void prepareClaim()} disabled={isPreparing || !selectedEncounterId}>
				{#if isPreparing}
					<Loader2 class="size-4 mr-2 animate-spin" />
				{:else}
					<FileText class="size-4 mr-2" />
				{/if}
				Prepare claim
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<Dialog bind:open={reconcileDialogOpen}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>Reconcile NHIS claim</DialogTitle>
			<DialogDescription>
				Record the outcome reported by the HMO for claim
				<span class="font-mono">{reconcileClaim?.claimReference ?? '—'}</span>.
			</DialogDescription>
		</DialogHeader>
		<div class="space-y-4 py-2">
			<div class="space-y-2">
				<Label for="reconcile-status">Outcome</Label>
				<Select.Root type="single" value={reconcileStatus} onValueChange={chooseReconcileStatus}>
					<Select.Trigger id="reconcile-status" class="w-full capitalize">
						{reconcileStatus}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="acknowledged">Acknowledged</Select.Item>
						<Select.Item value="paid">Paid</Select.Item>
						<Select.Item value="failed">Failed</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-2">
				<Label for="reconcile-note">Note (optional)</Label>
				<Input
					id="reconcile-note"
					bind:value={reconcileNote}
					placeholder="HMO reference or outcome detail"
					maxlength="280"
				/>
			</div>
		</div>
		<DialogFooter>
			<Button type="button" variant="outline" onclick={() => (reconcileDialogOpen = false)}>
				Cancel
			</Button>
			<Button onclick={() => void reconcile()} disabled={isReconciling}>
				{#if isReconciling}
					<Loader2 class="size-4 mr-2 animate-spin" />
				{/if}
				Save outcome
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
