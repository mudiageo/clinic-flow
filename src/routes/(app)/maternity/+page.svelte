<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Baby, Clock, Activity, Plus, Waves } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { pregnancyStore } from '#lib/state/pregnancy.svelte.ts';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import PartogramDialog from '#lib/components/maternal/partogram-dialog.svelte';
	import { formatDate, formatDistanceToNow } from '#lib/utils/date.ts';

	const admitTitle = 'Select a patient, then register an active pregnancy from their ANC record';

	const activePregnancies = $derived(
		pregnancyStore.items
			.filter((record) => record.status === 'active')
			.flatMap((record) => {
				const patient = patientStore.get(record.patientId);
				return patient ? [{ record, patient }] : [];
			})
	);

	let partogramPatientId = $state<string | null>(null);
	let partogramOpen = $state(false);

	function ageFromDob(dob: string | null): string {
		if (!dob) return '—';
		const birth = new Date(dob);
		if (Number.isNaN(birth.getTime())) return '—';

		const now = new Date();
		let years = now.getFullYear() - birth.getFullYear();
		const monthDiff = now.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years -= 1;
		return years >= 0 ? String(years) : '—';
	}

	function gestationalAge(lmpDate: number | null): string {
		if (!lmpDate) return '—';
		const days = Math.floor((Date.now() - lmpDate) / 86_400_000);
		if (days < 0) return '—';
		return `${Math.floor(days / 7)}w ${days % 7}d`;
	}

	function openPartograph(patientId: string) {
		partogramPatientId = patientId;
		partogramOpen = true;
	}
</script>

<svelte:head>
	<title>Maternity Ward — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<!-- Page Header -->
	<div
		class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Maternal Health
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Maternity Ward</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Active admissions and labour monitoring ({activePregnancies.length} active)
			</p>
		</div>
		<Button
			class="min-h-11 px-5 font-semibold w-full sm:w-auto"
			title={admitTitle}
			onclick={() => goto('/doctor/patients')}
		>
			<Plus class="size-4 mr-2" />
			Admit Patient
		</Button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#if activePregnancies.length === 0}
			<div
				class="md:col-span-2 lg:col-span-3 p-10 text-center text-muted-foreground rounded-xl border border-dashed border-border bg-card/50"
			>
				No active pregnancies recorded.
			</div>
		{/if}

		{#each activePregnancies as { record, patient } (record.id)}
			{@const age = ageFromDob(patient.dob)}
			<article
				class="rounded-xl border border-border border-l-4 border-l-primary bg-card overflow-hidden flex flex-col"
			>
				<div
					class="px-4 py-3.5 border-b border-dashed border-border bg-muted/20 flex items-start justify-between gap-2"
				>
					<div class="min-w-0">
						<h2 class="text-base font-bold text-foreground truncate">{patient.name}</h2>
						<p class="text-xs font-mono text-muted-foreground mt-0.5 tabular-nums">
							{age === '—' ? '—' : `${age} yrs`} · G{record.gravida ?? '—'}P{record.parity ?? '—'}
						</p>
					</div>
					<Badge variant="secondary" class="text-[11px] font-medium shrink-0">Active</Badge>
				</div>

				<div class="grid grid-cols-2 divide-x divide-y divide-border text-sm flex-1">
					<div class="p-3.5 flex items-center gap-2.5">
						<Clock class="size-4 text-muted-foreground shrink-0" />
						<div class="min-w-0">
							<p class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
								Gestational Age
							</p>
							<p class="font-semibold font-mono tabular-nums">{gestationalAge(record.lmpDate)}</p>
						</div>
					</div>
					<div class="p-3.5 flex items-center gap-2.5">
						<Waves class="size-4 text-primary shrink-0" />
						<div class="min-w-0">
							<p class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
								LMP
							</p>
							<p class="font-semibold font-mono tabular-nums">
								{record.lmpDate ? formatDate(record.lmpDate) : '—'}
							</p>
						</div>
					</div>
					<div class="p-3.5 flex items-center gap-2.5 col-span-2">
						<Activity class="size-4 text-triage-red shrink-0" />
						<div class="min-w-0">
							<p class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
								Expected Delivery (EDD)
							</p>
							<p class="font-semibold font-mono tabular-nums">
								{record.eddDate ? formatDate(record.eddDate) : '—'}
							</p>
						</div>
					</div>
					<div class="p-3.5 flex items-center gap-2.5 col-span-2">
						<Clock class="size-4 text-muted-foreground shrink-0" />
						<div class="min-w-0">
							<p class="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
								Registered
							</p>
							<p class="font-medium text-xs">{formatDistanceToNow(record.createdAt)}</p>
						</div>
					</div>
				</div>

				<div class="p-3 border-t border-border bg-muted/15 flex gap-2">
					<Button
						variant="outline"
						class="flex-1 text-xs min-h-10"
						onclick={() => goto(`/nurse/vitals?patient=${record.patientId}`)}
					>
						Vitals
					</Button>
					<Button
						class="flex-1 text-xs min-h-10 font-semibold"
						onclick={() => openPartograph(record.patientId)}
					>
						Open Partograph
					</Button>
				</div>
			</article>
		{/each}

		<!-- Empty Admission Slot -->
		<button
			type="button"
			class="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl min-h-[260px] text-muted-foreground hover:bg-muted/40 hover:border-primary/40 transition-colors"
			title={admitTitle}
			onclick={() => goto('/doctor/patients')}
		>
			<Baby class="size-8 opacity-40" />
			<span class="font-medium text-sm text-foreground">Admit New Patient</span>
		</button>
	</div>
</div>

{#if partogramPatientId}
	<PartogramDialog bind:open={partogramOpen} patientId={partogramPatientId} />
{/if}
