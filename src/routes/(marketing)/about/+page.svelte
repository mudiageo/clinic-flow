<script lang="ts">
	import AwardBadge from '#lib/components/marketing/award-badge.svelte';
	import { MapPin, GraduationCap, GitBranch, ExternalLink, ArrowRight } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button';
</script>

<svelte:head>
	<title>About — ClinicFlow by Mudiageo Technologies</title>
	<meta
		name="description"
		content="ClinicFlow is built by Mudiageo Technologies, a software company based in Benin City, Nigeria. Learn about our mission and the problem we're solving."
	/>
</svelte:head>

<div class="space-y-16 py-12 md:py-16">
	<!-- Page Header (Editorial Left-Aligned) -->
	<section class="border-b border-border bg-background pb-12">
		<div class="container mx-auto px-4 md:px-8 max-w-5xl">
			<div class="max-w-3xl space-y-4">
				<p class="text-xs font-mono font-semibold tracking-wider text-primary">MISSION & ORIGIN</p>
				<h1
					class="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]"
				>
					Software engineered for how frontline healthcare actually operates.
				</h1>
				<p class="text-base sm:text-lg text-muted-foreground leading-relaxed pt-1">
					ClinicFlow exists because Nigeria's 30,000 public Primary Health Centres deserve digital
					systems engineered for their operational reality — not cloud software designed for
					tertiary teaching hospitals with dedicated server rooms and continuous fiber internet.
				</p>
			</div>
		</div>
	</section>

	<div class="container mx-auto px-4 md:px-8 max-w-5xl space-y-14">
		<!-- The problem context -->
		<section class="rounded-lg border border-border bg-muted/30 p-7 md:p-9 space-y-4">
			<p class="text-xs font-mono font-semibold tracking-wider text-primary uppercase">
				Ground Truth
			</p>
			<h2 class="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
				The documentation bottleneck
			</h2>
			<div class="space-y-3 text-sm text-muted-foreground leading-relaxed">
				<p>
					A 2020 peer-reviewed study evaluated public Primary Health Centres in Egor LGA, Benin City
					— the geographic cluster where ClinicFlow's pilot cohort is planned. The investigation
					found that
					<strong class="text-foreground font-semibold"
						>none of the 10 facilities had a medical records officer</strong
					>, only one had a resident medical officer, and zero facilities operated 24-hour
					diagnostic coverage. Every single interaction was logged by hand across dozens of physical
					paper registers.
				</p>
				<p>
					This is a systemic structural gap across Nigeria. 76% of frontline health workers report
					electrical and internet outages as primary operational obstacles. Health extension workers
					must record patient encounters manually on paper, then spend 10+ hours per month
					re-entering the data into DHIS2.
				</p>
				<p class="text-xs text-muted-foreground/80 pt-2 border-t border-border">
					Reference: Adam & Nwaogwugwu (2020) · <em>Annals of Clinical and Biomedical Research</em>
					· DOI:
					<a
						href="https://doi.org/10.4081/acbr.2020.111"
						target="_blank"
						rel="noopener"
						class="text-primary hover:underline font-mono"
					>
						10.4081/acbr.2020.111
					</a>
				</p>
			</div>
		</section>

		<!-- Founder profile -->
		<section class="grid md:grid-cols-12 gap-8 items-start border-t border-border pt-12">
			<div class="md:col-span-7 space-y-4">
				<p class="text-xs font-mono font-semibold tracking-wider text-primary uppercase">
					Engineering
				</p>
				<h2 class="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
					Built by Mudiaga Arharhire
				</h2>
				<p class="text-sm text-muted-foreground leading-relaxed">
					ClinicFlow was designed and developed by <strong class="text-foreground"
						>Mudiaga Arharhire</strong
					>, a 500-level Computer Engineering scholar at the University of Benin (UNIBEN).
				</p>
				<p class="text-sm text-muted-foreground leading-relaxed">
					The local-first sync architecture, Svelte 5 frontend, embedded SQLite engine,
					Android/Windows packaging, and CI pipeline were engineered to prove that low-cost,
					offline-first digital infrastructure can transform public health records without waiting
					for massive government telecom overhauls.
				</p>
				<div class="flex flex-wrap gap-2 pt-2">
					<AwardBadge label="NextGen Knowledge Showcase" sublabel="Top 5 Finalist" variant="gold" />
					<AwardBadge label="3MTT × IdentArk.io" sublabel="2nd Place" variant="silver" />
				</div>
			</div>

			<div
				class="md:col-span-5 rounded-lg border border-border bg-card p-6 space-y-3.5 text-xs text-muted-foreground"
			>
				<div class="flex items-center gap-3">
					<GraduationCap class="size-4 text-primary shrink-0" />
					<span>Computer Engineering (500L) · University of Benin</span>
				</div>
				<div class="flex items-center gap-3">
					<MapPin class="size-4 text-primary shrink-0" />
					<span>Benin City, Edo State, Nigeria</span>
				</div>
				<div class="flex items-center gap-3">
					<GitBranch class="size-4 text-primary shrink-0" />
					<a
						href="https://github.com/mudiageo"
						target="_blank"
						rel="noopener"
						class="text-foreground font-mono hover:text-primary transition-colors"
					>
						github.com/mudiageo
					</a>
				</div>
			</div>
		</section>

		<!-- Company info -->
		<section class="rounded-lg border border-border bg-card p-7 md:p-9 space-y-4">
			<p class="text-xs font-mono font-semibold tracking-wider text-primary uppercase">
				Corporate Entity
			</p>
			<h2 class="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
				Mudiageo Technologies
			</h2>
			<div class="space-y-3 text-sm text-muted-foreground leading-relaxed">
				<p>
					ClinicFlow is developed and supported by <strong class="text-foreground"
						>Mudiageo Technologies</strong
					>, a Nigerian technology enterprise registered with the Corporate Affairs Commission (CAC
					BN 3514781, established October 2021).
				</p>
				<p>
					Mudiageo Technologies builds local-first, dependable software systems for African
					institutions, providing tools engineered for real-world environmental and infrastructural
					realities.
				</p>
			</div>
			<div class="pt-2">
				<Button
					href="https://mudiageotech.com"
					target="_blank"
					rel="noopener"
					variant="outline"
					class="rounded-md text-xs font-semibold h-9 border-border"
				>
					Mudiageo Technologies Website <ExternalLink class="ml-1.5 size-3.5" />
				</Button>
			</div>
		</section>

		<!-- Contact Section -->
		<section class="border-t border-border pt-12">
			<div
				class="rounded-lg border border-border bg-muted/40 p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
			>
				<div class="space-y-1 text-left">
					<h3 class="text-lg font-bold text-foreground">Interested in partnering?</h3>
					<p class="text-xs sm:text-sm text-muted-foreground">
						We are actively scheduling pilot onboarding for LGA Primary Health Care Authorities and
						mission facilities.
					</p>
				</div>
				<div class="flex items-center gap-3 shrink-0">
					<Button
						href="/contact"
						class="rounded-md px-4 h-9 font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90"
					>
						Contact Team
					</Button>
					<Button
						href="/demo"
						variant="outline"
						class="rounded-md px-4 h-9 font-semibold text-xs border-border"
					>
						Request Demo
					</Button>
				</div>
			</div>
		</section>
	</div>
</div>
