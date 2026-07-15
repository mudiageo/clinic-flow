<script lang="ts">
	import { page } from '$app/state';
	import { patientStore } from '$lib/state/patients.svelte';
	import { vitalsStore } from '$lib/state/vitals.svelte';
	import { encounterStore } from '$lib/state/encounters.svelte';
	import { labRequestStore } from '$lib/state/lab-requests.svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { ChevronLeft, User, Activity, FileText, FlaskConical, Clock } from '@lucide/svelte';
	import Sparkline from '$lib/components/Sparkline.svelte';
	import { formatDate, formatDateTime } from '$lib/utils/date';

	const patientId = page.params.id;
	const patient = $derived(patientStore.get(patientId));
	
	const vitalsHistory = $derived(vitalsStore.forPatient(patientId));
	const chronoVitals = $derived([...vitalsHistory].reverse());
	
	const encounters = $derived(encounterStore.sortedItems.filter(e => e.patientId === patientId));
	const labs = $derived(labRequestStore.sortedItems.filter(l => l.patientId === patientId));

	// Trend data
	const tempTrend = $derived(chronoVitals.map((v) => v.temperatureCelsius).filter((v) => v !== null) as number[]);
	const bpSysTrend = $derived(chronoVitals.map((v) => v.systolicBp).filter((v) => v !== null) as number[]);
	const pulseTrend = $derived(chronoVitals.map((v) => v.pulseBpm).filter((v) => v !== null) as number[]);
	const weightTrend = $derived(chronoVitals.map((v) => v.weightKg).filter((v) => v !== null) as number[]);
</script>

<svelte:head>
	<title>{patient?.name ?? 'Patient Profile'} — ClinicFlow</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
	<div class="flex items-center gap-4">
		<Button variant="outline" size="icon" href="/doctor/patients" class="rounded-xl bg-card border-border shadow-sm">
			<ChevronLeft class="size-5" />
		</Button>
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">{patient?.name ?? 'Loading...'}</h1>
			<p class="text-muted-foreground text-sm font-medium">Comprehensive Clinical Record</p>
		</div>
	</div>

	{#if patient}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Left Column: Demographics & Vitals Overview -->
			<div class="space-y-6">
				<Card class="bg-card shadow-sm border-border">
					<CardHeader class="pb-3 border-b border-border/50">
						<CardTitle class="text-lg flex items-center gap-2"><User class="size-5 text-primary" /> Demographics</CardTitle>
					</CardHeader>
					<CardContent class="p-4 space-y-4">
						<div class="grid grid-cols-2 gap-y-4">
							<div>
								<p class="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Clinic ID</p>
								<p class="font-mono text-sm mt-0.5">{patient.clinicId}</p>
							</div>
							<div>
								<p class="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sex</p>
								<p class="capitalize text-sm mt-0.5">{patient.sex}</p>
							</div>
							<div>
								<p class="text-xs text-muted-foreground uppercase tracking-wider font-semibold">DOB / Age</p>
								<p class="text-sm mt-0.5">
									{patient.dob ? formatDate(patient.dob) : 'Unknown'}
									{#if patient.dob}
										<span class="text-muted-foreground">({new Date().getFullYear() - new Date(patient.dob).getFullYear()}y)</span>
									{/if}
								</p>
							</div>
							<div>
								<p class="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone</p>
								<p class="text-sm mt-0.5">{patient.phone || 'N/A'}</p>
							</div>
							<div class="col-span-2">
								<p class="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Address</p>
								<p class="text-sm mt-0.5">{patient.address || 'N/A'}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card class="bg-card shadow-sm border-border">
					<CardHeader class="pb-3 border-b border-border/50">
						<CardTitle class="text-lg flex items-center gap-2"><Activity class="size-5 text-accent" /> Vitals Trends</CardTitle>
					</CardHeader>
					<CardContent class="p-4 space-y-5">
						{#if vitalsHistory.length === 0}
							<div class="text-center py-6 text-muted-foreground text-sm italic">No vitals recorded yet.</div>
						{:else}
							<div>
								<div class="flex justify-between items-end mb-1">
									<p class="text-xs font-semibold text-muted-foreground">Temperature (°C)</p>
									<span class="text-sm font-bold">{vitalsHistory[0].temperatureCelsius ?? '—'}</span>
								</div>
								{#if tempTrend.length > 1} <Sparkline data={tempTrend} width={100} height={30} color="var(--primary)" /> {/if}
							</div>
							
							<div>
								<div class="flex justify-between items-end mb-1">
									<p class="text-xs font-semibold text-muted-foreground">Blood Pressure</p>
									<span class="text-sm font-bold">{vitalsHistory[0].systolicBp ?? '—'}/{vitalsHistory[0].diastolicBp ?? '—'}</span>
								</div>
								{#if bpSysTrend.length > 1} <Sparkline data={bpSysTrend} width={100} height={30} color="var(--accent)" /> {/if}
							</div>

							<div>
								<div class="flex justify-between items-end mb-1">
									<p class="text-xs font-semibold text-muted-foreground">Heart Rate (BPM)</p>
									<span class="text-sm font-bold">{vitalsHistory[0].pulseBpm ?? '—'}</span>
								</div>
								{#if pulseTrend.length > 1} <Sparkline data={pulseTrend} width={100} height={30} color="var(--destructive)" /> {/if}
							</div>

							<div>
								<div class="flex justify-between items-end mb-1">
									<p class="text-xs font-semibold text-muted-foreground">Weight (kg)</p>
									<span class="text-sm font-bold">{vitalsHistory[0].weightKg ?? '—'}</span>
								</div>
								{#if weightTrend.length > 1} <Sparkline data={weightTrend} width={100} height={30} color="var(--triage-amber)" /> {/if}
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>

			<!-- Right Column: Timeline / History Tabs -->
			<div class="md:col-span-2">
				<Card class="bg-card shadow-sm border-border h-full min-h-[600px]">
					<Tabs value="encounters" class="h-full flex flex-col">
						<CardHeader class="p-0 border-b border-border/50 bg-muted/10">
							<TabsList class="bg-transparent h-auto p-0 gap-6 px-6 pt-4 pb-0">
								<TabsTrigger value="encounters" class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3 text-sm">
									<FileText class="size-4 mr-2" /> Encounters ({encounters.length})
								</TabsTrigger>
								<TabsTrigger value="labs" class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3 text-sm">
									<FlaskConical class="size-4 mr-2" /> Labs ({labs.length})
								</TabsTrigger>
							</TabsList>
						</CardHeader>
						
						<CardContent class="p-6 flex-1 overflow-y-auto">
							<TabsContent value="encounters" class="m-0 space-y-4">
								{#if encounters.length === 0}
									<div class="py-16 text-center text-muted-foreground flex flex-col items-center border border-dashed rounded-xl bg-muted/20">
										<FileText class="size-10 mb-3 opacity-20" />
										<p>No past encounters found for this patient.</p>
									</div>
								{:else}
									<div class="relative border-l-2 border-muted ml-3 space-y-8 pb-4">
										{#each encounters as enc}
											<div class="relative pl-6">
												<!-- Timeline dot -->
												<div class="absolute -left-[9px] top-1 size-4 rounded-full bg-background border-2 border-primary"></div>
												
												<div class="bg-muted/30 border border-border/50 rounded-xl p-4">
													<div class="flex justify-between items-start mb-3">
														<div>
															<h4 class="font-semibold text-foreground text-sm flex items-center gap-2">
																<Clock class="size-3 text-muted-foreground" />
																{formatDateTime(enc.visitDate)}
															</h4>
														</div>
													</div>
													{#if enc.chiefComplaint}
														<div class="mb-3">
															<span class="text-xs font-semibold text-muted-foreground uppercase">Chief Complaint</span>
															<p class="text-sm mt-0.5">{enc.chiefComplaint}</p>
														</div>
													{/if}
													{#if enc.doctorNotes}
														<div class="bg-background border rounded-lg p-3 text-sm text-foreground/90 whitespace-pre-wrap">
															<span class="text-xs font-semibold text-muted-foreground uppercase block mb-1">Clinical Notes</span>
															{enc.doctorNotes}
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</TabsContent>

							<TabsContent value="labs" class="m-0 space-y-4">
								{#if labs.length === 0}
									<div class="py-16 text-center text-muted-foreground flex flex-col items-center border border-dashed rounded-xl bg-muted/20">
										<FlaskConical class="size-10 mb-3 opacity-20" />
										<p>No lab requests found for this patient.</p>
									</div>
								{:else}
									<div class="space-y-3">
										{#each labs as lab}
											<div class="border border-border/60 rounded-xl p-4 bg-card hover:bg-muted/10 transition-colors">
												<div class="flex justify-between items-start mb-2">
													<div>
														<h4 class="font-bold text-sm">{lab.testType}</h4>
														<p class="text-xs text-muted-foreground mt-0.5">{formatDateTime(lab.createdAt)}</p>
													</div>
													<div class="flex gap-2">
														<Badge variant={lab.status === 'completed' ? 'default' : 'secondary'} class={lab.status === 'completed' ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 shadow-none border-none' : ''}>
															{lab.status}
														</Badge>
														<Badge variant="outline" class="uppercase text-[10px]">{lab.urgency}</Badge>
													</div>
												</div>
												{#if lab.notes}
													<p class="text-sm text-muted-foreground mt-2"><span class="font-semibold">Notes:</span> {lab.notes}</p>
												{/if}
												{#if lab.result}
													<div class="mt-3 p-3 bg-muted/30 border rounded-lg">
														<p class="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">Result</p>
														<p class="text-sm whitespace-pre-wrap">{lab.result}</p>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</TabsContent>
						</CardContent>
					</Tabs>
				</Card>
			</div>
		</div>
	{/if}
</div>
