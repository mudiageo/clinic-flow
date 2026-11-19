<script lang="ts">
	import { Syringe, Stethoscope, Building2, Baby, ArrowRight, CheckCircle2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	const useCases = [
		{
			title: 'Immunisation Clinic Day',
			icon: Syringe,
			color: 'bg-emerald-500/10 text-emerald-600',
			summary: 'Managing hundreds of mothers and infants in a single morning without paper register logjams.',
			problem: 'On high-volume immunization mornings, nurses spend more time searching through heavy paper register books and manually writing vaccine cards than actually examining babies.',
			solution: 'ClinicFlow enables rapid QR or name lookup. Nurses log administered doses (BCG, Pentavalent, Measles) in seconds, and family records automatically flag upcoming doses or missed intervals.'
		},
		{
			title: 'Rural Health Post (CHEW-Led)',
			icon: Stethoscope,
			color: 'bg-primary/10 text-primary',
			summary: 'Empowering Community Health Extension Workers where attending doctors are rarely present.',
			problem: 'In deep rural communities, a solo CHEW often manages triage, diagnosis, and prescription alone, without real-time peer consultation or doctor supervision.',
			solution: 'Built-in automated triage rules and Dr. Assist decision support guide the health worker through standardized clinical danger signs, ensuring critically ill patients are immediately identified for transfer.'
		},
		{
			title: 'High-Volume Urban PHC',
			icon: Building2,
			color: 'bg-blue-500/10 text-blue-600',
			summary: 'Eliminating waiting-room gridlock and lost card jackets in dense peri-urban centres.',
			problem: 'Facilities in high-density LGAs see 100+ outpatient visits daily. Paper folders get misplaced, queues become chaotic, and patients wait 4+ hours for basic primary care.',
			solution: 'Digital queues sync between triage, doctors, and pharmacy in real-time across local clinic Wi-Fi. Average patient turnaround is cut by over 50%.'
		},
		{
			title: 'Antenatal & Maternity Night Shifts',
			icon: Baby,
			color: 'bg-violet-500/10 text-violet-600',
			summary: 'Resilient tracking during grid blackouts and emergency labor admissions.',
			problem: 'When grid power drops at 2 AM, medical staff are left recording maternal observations by flashlight or phone screens, with no access to past pregnancy notes.',
			solution: 'ClinicFlow runs on battery-powered Android tablets in kiosk mode. Full maternal history, previous blood pressures, and lab flags remain accessible 100% offline.'
		}
	];
</script>

<svelte:head>
	<title>Clinical Use Cases & Field Scenarios — ClinicFlow</title>
	<meta
		name="description"
		content="Explore how ClinicFlow transforms frontline primary care during immunization days, rural CHEW consultations, and high-volume outpatient clinics."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-4xl py-16 md:py-24 space-y-16">
	<div class="text-center max-w-2xl mx-auto space-y-4">
		<div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
			Frontline Field Scenarios
		</div>
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
			Engineered for real clinic days.
		</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			See how ClinicFlow solves the exact bottlenecks Nigerian nurses, CHEWs, and doctors encounter every morning.
		</p>
	</div>

	<!-- Use case cards -->
	<div class="space-y-8">
		{#each useCases as uc}
			<article class="rounded-3xl border border-border bg-card p-8 md:p-10 space-y-6 shadow-sm">
				<div class="flex items-center gap-4">
					<div class="size-12 rounded-2xl {uc.color} flex items-center justify-center shrink-0">
						<uc.icon class="size-6" />
					</div>
					<div>
						<h2 class="text-2xl font-bold text-foreground">{uc.title}</h2>
						<p class="text-sm text-muted-foreground">{uc.summary}</p>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/60">
					<div class="space-y-2">
						<h3 class="text-xs font-bold uppercase tracking-widest text-destructive">The Paper Reality</h3>
						<p class="text-sm text-muted-foreground leading-relaxed">{uc.problem}</p>
					</div>
					<div class="space-y-2">
						<h3 class="text-xs font-bold uppercase tracking-widest text-primary">The ClinicFlow Difference</h3>
						<p class="text-sm text-foreground leading-relaxed">{uc.solution}</p>
					</div>
				</div>
			</article>
		{/each}
	</div>

	<!-- CTA -->
	<div class="rounded-3xl border border-primary/20 bg-primary/5 p-8 md:p-10 text-center space-y-4">
		<h3 class="text-2xl font-bold text-foreground">Have a similar workflow challenge at your clinic?</h3>
		<p class="text-sm text-muted-foreground max-w-md mx-auto">
			We can configure ClinicFlow’s modules to match your facility’s specific staffing and patient volume.
		</p>
		<Button href="/demo" class="rounded-full px-8 font-bold bg-primary text-primary-foreground">
			Request a Custom Demo <ArrowRight class="ml-2 size-4" />
		</Button>
	</div>
</div>
