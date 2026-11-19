<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '#lib/components/ui/card/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Heart, Baby, Clock, Activity, Plus, Waves } from '@lucide/svelte';
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

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-pink-100 text-pink-600">
				<Heart class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Maternity Ward</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Active admissions and labour monitoring
				</p>
			</div>
		</div>
		<Button
			class="bg-pink-600 hover:bg-pink-700 text-white"
			title={admitTitle}
			onclick={() => goto('/doctor/patients')}
		>
			<Plus class="size-4 mr-2" />
			Admit Patient
		</Button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#if activePregnancies.length === 0}
			<Card class="card-hover md:col-span-2 lg:col-span-3">
				<CardContent class="p-8 text-center text-muted-foreground">
					No active pregnancies recorded.
				</CardContent>
			</Card>
		{/if}

		{#each activePregnancies as { record, patient } (record.id)}
			{@const age = ageFromDob(patient.dob)}
			<Card class="overflow-hidden card-hover border-pink-100">
				<CardHeader class="border-b bg-pink-50/50 pb-4">
					<div class="flex items-start justify-between">
						<div>
							<CardTitle class="text-lg">{patient.name}</CardTitle>
							<p class="text-xs text-muted-foreground mt-1 font-medium">
								{age === '—' ? '—' : `${age} yrs`} · G{record.gravida ?? '—'}P{record.parity ?? '—'}
							</p>
						</div>
						<Badge variant="outline" class="bg-white text-pink-700 border-pink-200">
							Active pregnancy
						</Badge>
					</div>
				</CardHeader>
				<CardContent class="p-0">
					<div class="grid grid-cols-2 divide-x divide-y border-b text-sm">
						<div class="p-3 flex items-center gap-2">
							<Clock class="size-4 text-muted-foreground" />
							<div class="leading-tight">
								<p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
									Gestational Age
								</p>
								<p class="font-medium">{gestationalAge(record.lmpDate)}</p>
							</div>
						</div>
						<div class="p-3 flex items-center gap-2">
							<Waves class="size-4 text-pink-500" />
							<div class="leading-tight">
								<p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
									LMP
								</p>
								<p class="font-medium">
									{record.lmpDate ? formatDate(record.lmpDate) : '—'}
								</p>
							</div>
						</div>
						<div class="p-3 flex items-center gap-2 col-span-2">
							<Activity class="size-4 text-rose-500" />
							<div class="leading-tight">
								<p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
									Expected Delivery (EDD)
								</p>
								<p class="font-medium">
									{record.eddDate ? formatDate(record.eddDate) : '—'}
								</p>
							</div>
						</div>
						<div class="p-3 flex items-center gap-2 col-span-2">
							<Clock class="size-4 text-muted-foreground" />
							<div class="leading-tight">
								<p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
									Registered
								</p>
								<p class="font-medium">{formatDistanceToNow(record.createdAt)}</p>
							</div>
						</div>
					</div>
					<div class="p-3 bg-muted/20 flex gap-2">
						<Button
							variant="outline"
							class="w-full text-xs h-8"
							onclick={() => goto(`/nurse/vitals?patient=${record.patientId}`)}>Vitals</Button
						>
						<Button
							class="w-full text-xs h-8 bg-pink-600 hover:bg-pink-700"
							onclick={() => openPartograph(record.patientId)}>Open Partograph</Button
						>
					</div>
				</CardContent>
			</Card>
		{/each}

		<!-- Empty Slot -->
		<button
			type="button"
			class="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl h-[280px] text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/50 transition-colors"
			title={admitTitle}
			onclick={() => goto('/doctor/patients')}
		>
			<Baby class="size-8 opacity-40" />
			<span class="font-medium text-sm">Admit New Patient</span>
		</button>
	</div>
</div>

{#if partogramPatientId}
	<PartogramDialog bind:open={partogramOpen} patientId={partogramPatientId} />
{/if}
