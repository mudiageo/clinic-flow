<script lang="ts">
	import SectionHeader from '#lib/components/marketing/section-header.svelte';
</script>

<svelte:head>
	<title>Privacy Policy — ClinicFlow</title>
	<meta name="description" content="How ClinicFlow collects, uses, and protects patient and clinic data under the Nigeria Data Protection Act 2023." />
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-3xl py-16 md:py-24">
	<div class="mb-12">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Legal</p>
		<h1 class="text-4xl font-extrabold tracking-tight text-foreground mb-4">Privacy Policy</h1>
		<p class="text-muted-foreground">
			Effective date: <strong>1 November 2026</strong> · Version 1.0<br />
			Operated by <strong>Mudiageo Technologies</strong> (trading as ClinicFlow) — a business name registered with the Corporate Affairs Commission of Nigeria.
		</p>
	</div>

	<div class="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-10">

		<section>
			<h2>1. Who this policy covers</h2>
			<p>This policy applies to:</p>
			<ul>
				<li><strong>Clinic administrators and staff</strong> who register and use ClinicFlow on behalf of a healthcare facility.</li>
				<li><strong>Patients</strong> whose health information is recorded in ClinicFlow by authorised clinic staff.</li>
			</ul>
			<p>Patient data is entered by clinic staff; patients do not interact directly with ClinicFlow's web interface.</p>
		</section>

		<section>
			<h2>2. What data we collect</h2>
			<h3>Patient data (collected by clinic staff on your behalf)</h3>
			<ul>
				<li>Demographics: name, date of birth, sex, contact number, address, next of kin</li>
				<li>Clinical records: vitals (blood pressure, temperature, SpO₂, weight), triage level, consultation notes, diagnoses, prescriptions, immunisation records, ANC/maternity records</li>
				<li>Identifiers: patient registration number (auto-generated; no national ID stored)</li>
			</ul>
			<h3>Staff and facility data</h3>
			<ul>
				<li>Staff name, role, login credentials (password stored as a salted hash — never in plaintext)</li>
				<li>Facility name, LGA, state, contact details</li>
				<li>Audit logs: which staff member performed which action and when</li>
			</ul>
			<h3>Technical data</h3>
			<ul>
				<li>Device type and operating system (for crash reporting)</li>
				<li>App version and sync timestamps</li>
				<li>No IP addresses are logged beyond what your hosting provider retains by default</li>
			</ul>
		</section>

		<section>
			<h2>3. How and where data is stored</h2>
			<p>ClinicFlow uses a <strong>local-first architecture</strong>:</p>
			<ul>
				<li><strong>On-device (IndexedDB / SQLite):</strong> All clinical records are stored locally on clinic tablets and workstations first. The app functions fully without internet.</li>
				<li><strong>Cloud backup (PostgreSQL):</strong> When an internet connection is available, records are encrypted in transit (TLS 1.3) and synchronised to a cloud database hosted by a certified provider. Only authorised clinic staff and Mudiageo Technologies support personnel (under strict access controls) can access this data.</li>
				<li><strong>No data is sold, shared with advertisers, or transferred to third parties</strong> for commercial purposes.</li>
			</ul>
		</section>

		<section>
			<h2>4. AI features and third-party data processing</h2>
			<p>ClinicFlow includes AI-powered clinical decision support features (Dr. Assist, RxBrain, Outbreak Radar). These features may send anonymised clinical text to the <strong>Google Gemini API</strong> for processing.</p>
			<ul>
				<li>No patient names, national IDs, or directly identifying information are included in AI requests.</li>
				<li>Symptom descriptions and drug names may be transmitted to Gemini's servers, which are operated by Google LLC and subject to Google's data processing terms.</li>
				<li>Clinic staff are notified when an AI feature is active. AI outputs are advisory only and must be reviewed by a qualified health worker before clinical action is taken.</li>
				<li>A <strong>local WebLLM fallback</strong> is available for facilities that require fully on-device AI inference with zero cloud dependency.</li>
			</ul>
		</section>

		<section>
			<h2>5. Legal basis for processing (NDPA 2023)</h2>
			<p>Under the Nigeria Data Protection Act 2023, we process personal data on the following lawful bases:</p>
			<ul>
				<li><strong>Performance of a contract:</strong> Processing staff and facility data to deliver the ClinicFlow service.</li>
				<li><strong>Public interest / vital interests:</strong> Processing patient health data to support delivery of primary healthcare services.</li>
				<li><strong>Legitimate interests:</strong> Security logging, crash reporting, and product improvement analytics (aggregated, non-identifiable).</li>
			</ul>
		</section>

		<section>
			<h2>6. Your rights under NDPA 2023</h2>
			<p>Data subjects (patients and staff) have the right to:</p>
			<ul>
				<li><strong>Access</strong> their personal data held by ClinicFlow</li>
				<li><strong>Correct</strong> inaccurate or incomplete data</li>
				<li><strong>Erasure</strong> of their data (subject to legal health record retention obligations)</li>
				<li><strong>Restrict</strong> processing in certain circumstances</li>
				<li><strong>Object</strong> to processing based on legitimate interests</li>
				<li><strong>Data portability</strong> — receive their data in a machine-readable format</li>
			</ul>
			<p>To exercise any of these rights, contact us at <a href="mailto:privacy@mudiageotech.com" class="text-primary hover:underline">privacy@mudiageotech.com</a>. We will respond within 30 days.</p>
		</section>

		<section>
			<h2>7. Data retention</h2>
			<ul>
				<li><strong>Patient clinical records:</strong> Retained for a minimum of 6 years from the date of last encounter, in line with Nigerian health record guidelines. Facilities may request earlier deletion subject to applicable law.</li>
				<li><strong>Staff accounts:</strong> Retained for 90 days after account deactivation, then deleted.</li>
				<li><strong>Audit logs:</strong> Retained for 3 years.</li>
			</ul>
		</section>

		<section>
			<h2>8. Security</h2>
			<p>See our <a href="/security" class="text-primary hover:underline">Security page</a> for a full description of technical and organisational measures. In summary: data is encrypted at rest and in transit, access is role-based, and all sensitive actions are audit-logged.</p>
		</section>

		<section>
			<h2>9. Children's data</h2>
			<p>ClinicFlow records paediatric patient data as part of routine PHC services (immunisation, growth monitoring). This data is handled with the same protections as adult data. Parental or guardian consent is obtained by clinic staff at the point of registration, in line with standard PHC admission procedures.</p>
		</section>

		<section>
			<h2>10. Changes to this policy</h2>
			<p>We will notify registered clinic administrators of material changes to this policy via the in-app notification system at least 14 days before changes take effect. The current version is always available at <a href="/privacy" class="text-primary hover:underline">clinicflow.app/privacy</a>.</p>
		</section>

		<section>
			<h2>11. Contact</h2>
			<p>
				<strong>Data Controller:</strong> Mudiageo Technologies<br />
				<strong>Email:</strong> <a href="mailto:privacy@mudiageotech.com" class="text-primary hover:underline">privacy@mudiageotech.com</a><br />
				<strong>Address:</strong> Benin City, Edo State, Nigeria
			</p>
		</section>
	</div>
</div>
