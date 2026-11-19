<script lang="ts">
	import AwardBadge from '#lib/components/marketing/award-badge.svelte';
	import { MapPin, GraduationCap, GitBranch, ExternalLink } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button';
</script>

<svelte:head>
	<title>About — ClinicFlow by Mudiageo Technologies</title>
	<meta
		name="description"
		content="ClinicFlow is built by Mudiageo Technologies, a software company based in Benin City, Nigeria. Learn about our mission and the problem we're solving."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-4xl py-16 md:py-24 space-y-20">
	<!-- Mission -->
	<section class="text-center max-w-2xl mx-auto">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary mb-4">About</p>
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
			Software built for how Africa actually works
		</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			ClinicFlow exists because Nigeria's 30,000 public Primary Health Centres deserve digital tools
			that work in their reality — not tools designed for hospitals with stable power, fast
			internet, and IT departments.
		</p>
	</section>

	<!-- The problem we're solving -->
	<section class="rounded-2xl border border-border bg-muted/30 p-8 md:p-12 space-y-4">
		<h2 class="text-2xl font-bold text-foreground">The problem</h2>
		<p class="text-muted-foreground leading-relaxed">
			A 2020 peer-reviewed study assessed every public Primary Health Centre in Egor LGA, Benin City
			— the area where ClinicFlow's first pilot is planned. It found that <strong
				class="text-foreground">none of the 10 facilities had a medical records officer</strong
			>, only one had a medical officer, and not a single facility offered 24-hour service. Every
			one of them ran entirely on paper registers.
		</p>
		<p class="text-muted-foreground leading-relaxed">
			This is not an Egor problem. It is a national infrastructure gap. 76% of Nigerian PHC workers
			cite power and internet failures as daily operational barriers. Staff record every patient by
			hand, then re-enter the same data into DHIS2 at the LGA headquarters — sometimes weeks later.
			When the lights go out, the clinic is blind.
		</p>
		<p class="text-sm text-muted-foreground">
			Source: Adam & Nwaogwugwu (2020) · <em>Annals of Clinical and Biomedical Research</em> · DOI:
			<a
				href="https://doi.org/10.4081/acbr.2020.111"
				target="_blank"
				rel="noopener"
				class="text-primary hover:underline">10.4081/acbr.2020.111</a
			>
		</p>
	</section>

	<!-- Founder -->
	<section class="grid md:grid-cols-2 gap-10 items-center">
		<div class="space-y-5">
			<h2 class="text-2xl font-bold text-foreground">Built by one person</h2>
			<p class="text-muted-foreground leading-relaxed">
				ClinicFlow was designed and built entirely by <strong class="text-foreground"
					>Mudiaga Arharhire</strong
				> — a 500-level Computer Engineering student at the University of Benin — over 2.5 months. First
				commit: 13 July 2026.
			</p>
			<p class="text-muted-foreground leading-relaxed">
				Every line of the SvelteKit frontend, the offline sync engine, the AI integration, the
				Android packaging, and the CI/CD pipeline was written by one person. Not because it had to
				be — but because it could be, and it was faster to prove the idea than to assemble a team
				first.
			</p>
			<div class="flex flex-wrap gap-2">
				<AwardBadge label="NextGen Knowledge Showcase" sublabel="Top 5 Finalist" variant="gold" />
				<AwardBadge label="3MTT × IdentArk.io" sublabel="2nd Place" variant="silver" />
			</div>
		</div>
		<div class="space-y-4">
			<div class="flex items-center gap-3 text-sm text-muted-foreground">
				<GraduationCap class="size-5 text-primary shrink-0" />
				<span>Computer Engineering, 500L — University of Benin (UNIBEN), graduating 2027</span>
			</div>
			<div class="flex items-center gap-3 text-sm text-muted-foreground">
				<MapPin class="size-5 text-primary shrink-0" />
				<span>Benin City, Edo State, Nigeria</span>
			</div>
			<div class="flex items-center gap-3 text-sm text-muted-foreground">
				<GitBranch class="size-5 text-primary shrink-0" />
				<a
					href="https://github.com/mudiageo"
					target="_blank"
					rel="noopener"
					class="hover:text-foreground transition-colors"
				>
					github.com/mudiageo
				</a>
			</div>
		</div>
	</section>

	<!-- Mudiageo Technologies -->
	<section class="rounded-2xl border border-border bg-card p-8 md:p-12 space-y-5">
		<h2 class="text-2xl font-bold text-foreground">Mudiageo Technologies</h2>
		<p class="text-muted-foreground leading-relaxed">
			ClinicFlow is a product of <strong class="text-foreground">Mudiageo Technologies</strong>, a
			software company registered with the Corporate Affairs Commission of Nigeria (Business Name,
			October 2021). Mudiageo Technologies builds practical, local-first software for African
			institutions — tools designed around how the continent actually operates, not how Silicon
			Valley assumes it does.
		</p>
		<p class="text-muted-foreground leading-relaxed">
			Beyond ClinicFlow, Mudiageo Technologies maintains open-source developer tooling for the
			SvelteKit ecosystem and contributes to the broader Nigerian tech community through ACES UNIBEN
			and open-source collaboration.
		</p>
		<div class="pt-2">
			<Button
				href="https://mudiageotech.com"
				target="_blank"
				rel="noopener"
				variant="outline"
				class="rounded-full font-semibold"
			>
				Mudiageo Technologies website <ExternalLink class="ml-2 size-4" />
			</Button>
		</div>
	</section>

	<!-- Contact CTA -->
	<section class="text-center space-y-5">
		<h2 class="text-2xl font-bold text-foreground">Get in touch</h2>
		<p class="text-muted-foreground">
			Interested in a pilot partnership, press enquiry, or integration discussion?
		</p>
		<div class="flex flex-col sm:flex-row gap-3 justify-center">
			<Button
				href="/contact"
				class="rounded-full font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20"
			>
				Contact us
			</Button>
			<Button href="/demo" variant="outline" class="rounded-full font-semibold">
				Request a demo
			</Button>
		</div>
	</section>
</div>
