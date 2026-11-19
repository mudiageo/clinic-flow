<script lang="ts">
	import SectionHeader from '#lib/components/marketing/section-header.svelte';
	import { HelpCircle, ArrowRight } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button';

	const faqCategories = [
		{
			title: 'Clinical Operations & Daily Workflow',
			items: [
				{
					q: 'Can our clinic continue treating patients if the internet goes down for 3 weeks?',
					a: 'Yes, 100%. ClinicFlow stores patient records, vitals, consultation notes, and pharmacy inventory locally in the device’s secure offline storage. All devices communicate over the local Wi-Fi router without needing an active data plan or internet bundle.'
				},
				{
					q: 'How does automated triage work for Community Health Extension Workers (CHEWs)?',
					a: 'When vitals (temperature, blood pressure, SpO₂, respiratory rate) are saved, our built-in rules engine instantly assigns an emergency color tag (Red, Amber, Green) according to standard triage guidelines. Red-flagged patients automatically jump to the top of the consultation queue.'
				},
				{
					q: 'What is RxBrain and how does it prevent medication errors?',
					a: 'RxBrain checks prescribed medications against known adverse interaction matrices before dispensing. If a dangerous combination is detected, it alerts the clinician with clinical notes, serving as a critical safety net where medical doctors are not always on site.'
				}
			]
		},
		{
			title: 'Hardware & Connectivity',
			items: [
				{
					q: 'What tablets or computers do we need to buy?',
					a: 'Standard low-cost Android tablets (Android 8.0 or newer with at least 3GB RAM) for mobile triage, and any basic Windows 10/11 laptop or desktop for reception and consultation desks.'
				},
				{
					q: 'Does each tablet need its own SIM card or data subscription?',
					a: 'No. Tablets connect to a central local Wi-Fi router at the facility. Only the central sync server or gateway needs intermittent internet (e.g. an inexpensive monthly data SIM or mobile hotspot) to upload daily encrypted backups to the cloud.'
				},
				{
					q: 'How do tablets find each other on the local clinic Wi-Fi?',
					a: 'Through built-in mDNS zero-configuration discovery (clinicflow.local). Staff simply open the application and it automatically links to the local database without configuring static IP addresses or network settings.'
				}
			]
		},
		{
			title: 'Governance, Privacy & State Procurement',
			items: [
				{
					q: 'Who legally owns the medical records stored in ClinicFlow?',
					a: 'The Primary Health Centre and the managing State Primary Health Care Development Agency retain 100% legal ownership of their clinical data. Mudiageo Technologies does not sell, license, or monetize health data.'
				},
				{
					q: 'How does pricing work for state-wide deployment across multiple LGAs?',
					a: 'Public PHCs are billed on an institutional annual service contract basis (standard benchmark: ₦30,000 per facility/month) covering software licenses, continuous software upgrades, and cloud synchronization. Approved pilot PHCs pay ₦0 during the pilot grant phase.'
				},
				{
					q: 'How does ClinicFlow align with DHIS2 national reporting?',
					a: 'ClinicFlow aggregates routine patient encounters into national NHMIS summary indicators, allowing administrators to review and export monthly figures instead of spending 10+ hours reconciling paper tally sheets.'
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Frequently Asked Questions (FAQ) — ClinicFlow</title>
	<meta
		name="description"
		content="Detailed answers to questions about ClinicFlow’s offline architecture, triage engine, hardware requirements, and state agency procurement."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-4xl py-16 md:py-24 space-y-16">
	<div class="text-center max-w-2xl mx-auto space-y-4">
		<div
			class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary"
		>
			Knowledge Base
		</div>
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
			Frequently Asked Questions
		</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			Everything you need to know about implementing ClinicFlow in rural and urban Primary Health
			Centres.
		</p>
	</div>

	<div class="space-y-12">
		{#each faqCategories as category}
			<section class="space-y-6">
				<h2 class="text-2xl font-bold text-foreground border-b border-border/60 pb-3">
					{category.title}
				</h2>
				<div class="space-y-4">
					{#each category.items as item}
						<div class="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-3 shadow-sm">
							<h3 class="text-lg font-bold text-foreground flex items-center gap-2.5">
								<HelpCircle class="size-5 text-primary shrink-0" />
								{item.q}
							</h3>
							<p class="text-muted-foreground leading-relaxed text-sm md:text-base pl-7">
								{item.a}
							</p>
						</div>
					{/each}
				</div>
			</section>
		{/each}
	</div>

	<!-- Still have questions -->
	<div class="rounded-3xl border border-border bg-muted/30 p-8 md:p-10 text-center space-y-4">
		<h3 class="text-2xl font-bold text-foreground">Have more questions about your clinic setup?</h3>
		<p class="text-sm text-muted-foreground max-w-md mx-auto">
			Our deployment engineers are happy to walk through your clinic’s power, tablet, and staffing
			setup.
		</p>
		<div class="flex justify-center gap-3 pt-2">
			<Button
				href="/contact"
				class="rounded-full px-6 font-bold bg-primary text-primary-foreground"
			>
				Speak with Our Team <ArrowRight class="ml-2 size-4" />
			</Button>
			<Button href="/support" variant="outline" class="rounded-full font-semibold">
				Visit Support Guides
			</Button>
		</div>
	</div>
</div>
