<script lang="ts">
	import { page } from '$app/state';
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { vitalsStore } from '#lib/state/vitals.svelte.ts';
	import { encounterStore } from '#lib/state/encounters.svelte.ts';
	import { labRequestStore } from '#lib/state/lab-requests.svelte.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '#lib/components/ui/tabs/index.ts';
	import { ChevronLeft, User, Activity, FileText, FlaskConical, Clock } from '@lucide/svelte';
	import Sparkline from '#lib/components/Sparkline.svelte';
	import { formatDate, formatDateTime } from '#lib/utils/date.ts';

	const patientId = page.params.id as string;
	const patient = $derived(patientStore.get(patientId));

	const vitalsHistory = $derived(vitalsStore.forPatient(patientId));
	const chronoVitals = $derived([...vitalsHistory].reverse());

	const encounters = $derived(encounterStore.sortedItems.filter((e) => e.patientId === patientId));
	const labs = $derived(labRequestStore.sortedItems.filter((l) => l.patientId === patientId));

	const tempTrend = $derived(
		chronoVitals.map((v) => v.temperatureCelsius).filter((v) => v !== null) as number[]
	);
	const bpSysTrend = $derived(
		chronoVitals.map((v) => v.systolicBp).filter((v) => v !== null) as number[]
	);
	const pulseTrend = $derived(
		chronoVitals.map((v) => v.pulseBpm).filter((v) => v !== null) as number[]
	);
	const weightTrend = $derived(
		chronoVitals.map((v) => v.weightKg).filter((v) => v !== null) as number[]
	);
</script>

<svelte:head>
	<title>{patient?.name ?? 'Patient Profile'} — ClinicFlow</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6 pb-10">
	<!-- Patient Folder Header Band -->
	<div class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="bg-primary text-primary-foreground px-5 py-4 flex items-center gap-3">
			<Button
				variant="ghost"
				size="icon"
				href="/doctor/patients"
				aria-label="Back to Patient Directory"
				class="text-primary-foreground hover:bg-primary-foreground/15 shrink-0"
			>
				<ChevronLeft class="size-5" />
			</Button>
			<div class="min-w-0 flex-1">
				<p class="text-[11px] font-mono uppercase tracking-widest opacity-80">
					Comprehensive Clinical Record
				</p>
				<h1 class="text-xl sm:text-2xl font-bold tracking-tight truncate">
					{patient?.name ?? 'Loading...'}
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
			<!-- Left Column: Demographics & Vitals Trends -->
			<div class="space-y-6">
				<section class="rounded-xl border border-border bg-card p-5 space-y-4">
					<h2 class="text-base font-semibold flex items-center gap-2 pb-2 border-b border-border">
						<User class="size-4 text-primary" /> Demographics
					</h2>
					<div class="grid grid-cols-2 gap-y-4 gap-x-3 text-sm">
						<div>
							<p class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
								Clinic ID
							</p>
							<p class="font-mono text-sm mt-0.5">{patient.clinicId}</p>
						</div>
						<div>
							<p class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
								Sex
							</p>
							<p class="capitalize text-sm mt-0.5">{patient.sex}</p>
						</div>
						<div>
							<p class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
								DOB / Age
							</p>
							<p class="text-sm mt-0.5 font-mono">
								{patient.dob ? formatDate(patient.dob) : 'Unknown'}
								{#if patient.dob}
									<span class="text-muted-foreground">
										({new Date().getFullYear() - new Date(patient.dob).getFullYear()}y)
									</span>
								{/if}
							</p>
						</div>
						<div>
							<p class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
								Phone
							</p>
							<p class="text-sm font-mono mt-0.5">{patient.phone || 'N/A'}</p>
						</div>
						<div class="col-span-2">
							<p class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
								Address
							</p>
							<p class="text-sm mt-0.5">{patient.address || 'N/A'}</p>
						</div>
					</div>
				</section>

				<section class="rounded-xl border border-border bg-card p-5 space-y-4">
					<h2 class="text-base font-semibold flex items-center gap-2 pb-2 border-b border-border">
						<Activity class="size-4 text-primary" /> Vitals Trends
					</h2>
					{#if vitalsHistory.length === 0}
						<div class="text-center py-6 text-muted-foreground text-sm">
							No vitals recorded yet.
						</div>
					{:else}
						<div class="space-y-4">
							<div>
								<div class="flex justify-between items-end mb-1">
									<p class="text-xs font-medium text-muted-foreground">Temperature (°C)</p>
									<span class="text-sm font-bold font-mono tabular-nums">
										{vitalsHistory[0].temperatureCelsius ?? '—'}
									</span>
								</div>
								{#if tempTrend.length > 1}
									<Sparkline data={tempTrend} width={100} height={30} color="var(--primary)" />
								{/if}
							</div>

							<div>
								<div class="flex justify-between items-end mb-1">
									<p class="text-xs font-medium text-muted-foreground">Blood Pressure</p>
									<span class="text-sm font-bold font-mono tabular-nums">
										{vitalsHistory[0].systolicBp ?? '—'}/{vitalsHistory[0].diastolicBp ?? '—'}
									</span>
								</div>
								{#if bpSysTrend.length > 1}
									<Sparkline data={bpSysTrend} width={100} height={30} color="var(--primary)" />
								{/if}
							</div>

							<div>
								<div class="flex justify-between items-end mb-1">
									<p class="text-xs font-medium text-muted-foreground">Heart Rate (BPM)</p>
									<span class="text-sm font-bold font-mono tabular-nums">
										{vitalsHistory[0].pulseBpm ?? '—'}
									</span>
								</div>
								{#if pulseTrend.length > 1}
									<Sparkline data={pulseTrend} width={100} height={30} color="var(--destructive)" />
								{/if}
							</div>

							<div>
								<div class="flex justify-between items-end mb-1">
									<p class="text-xs font-medium text-muted-foreground">Weight (kg)</p>
									<span class="text-sm font-bold font-mono tabular-nums">
										{vitalsHistory[0].weightKg ?? '—'}
									</span>
								</div>
								{#if weightTrend.length > 1}
									<Sparkline
										data={weightTrend}
										width={100}
										height={30}
										color="var(--triage-amber)"
									/>
								{/if}
							</div>
						</div>
					{/if}
				</section>
			</div>

			<!-- Right Column: Timeline / History Tabs -->
			<div class="md:col-span-2">
				<section
					class="rounded-xl border border-border bg-card h-full min-h-[560px] flex flex-col overflow-hidden"
				>
					<Tabs value="encounters" class="h-full flex flex-col">
						<div class="border-b border-border bg-muted/20 px-5 pt-3">
							<TabsList class="bg-transparent h-auto p-0 gap-4">
								<TabsTrigger
									value="encounters"
									class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-2.5 text-sm font-medium"
								>
									<FileText class="size-4 mr-2" /> Encounters ({encounters.length})
								</TabsTrigger>
								<TabsTrigger
									value="labs"
									class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-2.5 text-sm font-medium"
								>
									<FlaskConical class="size-4 mr-2" /> Labs ({labs.length})
								</TabsTrigger>
							</TabsList>
						</div>

						<div class="p-5 flex-1 overflow-y-auto">
							<TabsContent value="encounters" class="m-0 space-y-4">
								{#if encounters.length === 0}
									<div
										class="py-16 text-center text-muted-foreground flex flex-col items-center border border-dashed border-border rounded-xl bg-muted/15"
									>
										<FileText class="size-9 mb-2 opacity-25" />
										<p class="text-sm">No past encounters found for this patient.</p>
									</div>
								{:else}
									<div class="relative border-l-2 border-border ml-3 space-y-6 pb-2">
										{#each encounters as enc}
											<div class="relative pl-6">
												<div
													class="absolute -left-[9px] top-1 size-4 rounded-full bg-card border-2 border-primary"
												></div>

												<div class="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
													<h3
														class="font-semibold text-foreground text-xs font-mono flex items-center gap-2"
													>
														<Clock class="size-3.5 text-muted-foreground" />
														{formatDateTime(enc.visitDate)}
													</h3>
													{#if enc.chiefComplaint}
														<div>
															<span
																class="text-[11px] font-mono font-semibold text-muted-foreground uppercase"
															>
																Chief Complaint
															</span>
															<p class="text-sm mt-0.5">{enc.chiefComplaint}</p>
														</div>
													{/if}
													{#if enc.doctorNotes}
														<div
															class="bg-card border border-border rounded-lg p-3 text-sm text-foreground/90 whitespace-pre-wrap"
														>
															<span
																class="text-[11px] font-mono font-semibold text-muted-foreground uppercase block mb-1"
															>
																Clinical Notes
															</span>
															{enc.doctorNotes}
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</TabsContent>

							<TabsContent value="labs" class="m-0 space-y-3">
								{#if labs.length === 0}
									<div
										class="py-16 text-center text-muted-foreground flex flex-col items-center border border-dashed border-border rounded-xl bg-muted/15"
									>
										<FlaskConical class="size-9 mb-2 opacity-25" />
										<p class="text-sm">No lab requests found for this patient.</p>
									</div>
								{:else}
									{#each labs as lab}
										<div class="border border-border rounded-xl p-4 bg-card space-y-2">
											<div class="flex justify-between items-start gap-2">
												<div>
													<h3 class="font-semibold text-sm">{lab.testType}</h3>
													<p class="text-xs font-mono text-muted-foreground mt-0.5">
														{formatDateTime(lab.createdAt)}
													</p>
												</div>
												<div class="flex gap-1.5">
													<Badge
														variant={lab.status === 'completed' ? 'default' : 'secondary'}
														class={lab.status === 'completed'
															? 'bg-triage-green/15 text-triage-green border-triage-green/30'
															: ''}
													>
														{lab.status}
													</Badge>
													<Badge variant="outline" class="uppercase text-[10px]">
														{lab.urgency}
													</Badge>
												</div>
											</div>
											{#if lab.notes}
												<p class="text-xs text-muted-foreground">
													<span class="font-semibold">Notes:</span>
													{lab.notes}
												</p>
											{/if}
											{#if lab.result}
												<div class="p-3 bg-muted/30 border border-border rounded-lg">
													<p
														class="text-[11px] font-mono font-semibold text-foreground uppercase tracking-wider mb-1"
													>
														Result
													</p>
													<p class="text-sm font-mono whitespace-pre-wrap">{lab.result}</p>
												</div>
											{/if}
										</div>
									{/each}
								{/if}
							</TabsContent>
						</div>
					</Tabs>
				</section>
			</div>
		</div>
	{/if}
</div>
