<svelte:head>
	<title>Cookie & Storage Policy — ClinicFlow</title>
	<meta
		name="description"
		content="Information regarding how ClinicFlow utilizes session cookies and client-side storage technologies."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-3xl py-16 md:py-24">
	<div class="mb-12">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Legal</p>
		<h1 class="text-4xl font-extrabold tracking-tight text-foreground mb-4">Cookie & Storage Policy</h1>
		<p class="text-muted-foreground">
			Effective date: <strong>1 November 2026</strong> · Version 1.0<br />
			Operated by <strong>Mudiageo Technologies</strong>
		</p>
	</div>

	<div class="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-8">
		<section>
			<h2>1. How ClinicFlow Uses Local Storage Technologies</h2>
			<p>
				ClinicFlow is an offline-first clinical application. Unlike standard websites that rely heavily on third-party marketing trackers, our use of browser storage is fundamentally operational and required to maintain clinical functionality during network outages.
			</p>
		</section>

		<section>
			<h2>2. Categorization of Storage Tools</h2>
			<h3>A. Strictly Essential Session Cookies</h3>
			<p>
				These cookies are strictly required to verify staff identity upon login, prevent CSRF attacks, and securely route requests to your assigned Primary Health Centre. Without these cookies, authenticated clinical access cannot function.
			</p>

			<h3>B. IndexedDB Local Clinical Cache</h3>
			<p>
				We use IndexedDB via Dexie to store patient queues, triage alerts, vitals records, and drug inventory directly on your clinic's device. This allows clinical work to proceed when the internet or local power grid is down. This data remains on your hardware until synced and cleared per your facility's retention protocol.
			</p>

			<h3>C. Preference LocalStorage</h3>
			<p>
				Used to preserve non-sensitive interface preferences, such as kiosk display settings, language options, and dark/light color themes.
			</p>
		</section>

		<section>
			<h2>3. Third-Party Advertising and Tracking</h2>
			<p>
				<strong>We do not use advertising or behavioral tracking cookies.</strong> ClinicFlow does not embed third-party advertising trackers, social media retargeting pixels, or data-broker trackers.
			</p>
		</section>

		<section>
			<h2>4. Managing Storage on Clinic Devices</h2>
			<p>
				Because IndexedDB contains clinical information needed during offline periods, clearing browser storage on clinic tablets will reset local un-synced data. Clinic administrators should only clear application caches in coordination with IT support after ensuring all local mutations have synced to the cloud.
			</p>
		</section>

		<section>
			<h2>5. Inquiries</h2>
			<p>
				For questions regarding this policy or our privacy safeguards, contact <a href="mailto:privacy@mudiageotech.com" class="text-primary hover:underline">privacy@mudiageotech.com</a>.
			</p>
		</section>
	</div>
</div>
