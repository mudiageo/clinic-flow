<script lang="ts">
	import { Activity, AlertTriangle, Info, CheckCircle2, Siren, FileText, Send, Printer, Copy } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
</script>

<svelte:head>
	<title>Outbreak Radar Guide — ClinicFlow Support</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
	<!-- Header -->
	<div class="space-y-4">
		<a href="/support" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
			&larr; Back to Support Center
		</a>
		<div class="flex items-center gap-3">
			<div class="p-2.5 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
				<Activity class="size-6" />
			</div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Understanding Outbreak Radar</h1>
		</div>
		<p class="text-lg text-muted-foreground leading-relaxed">
			A complete guide to using ClinicFlow's AI-powered epidemiological forecasting and early warning system for your Primary Health Centre.
		</p>
	</div>

	<!-- AI Disclaimer -->
	<div class="bg-blue-50/80 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50 p-5 rounded-xl flex gap-4">
		<Info class="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
		<div class="space-y-1">
			<h3 class="font-semibold text-blue-900 dark:text-blue-100">AI-Assisted Analysis</h3>
			<p class="text-sm text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
				Outbreak Radar uses Google Gemini 2.5 Pro to analyse multi-signal data. It is an advisory tool designed to assist PHC Admins and Local Government Area (LGA) Disease Surveillance Officers. <strong>It does not replace clinical judgment.</strong> All data sent to the AI is strictly de-identified to comply with NDPR.
			</p>
		</div>
	</div>

	<div class="prose prose-slate dark:prose-invert max-w-none">
		<h2>How It Works: The Two Layers</h2>
		<p>Outbreak Radar operates using two distinct systems to ensure you never miss a critical health threat:</p>
		
		<div class="grid md:grid-cols-2 gap-6 not-prose my-6">
			<div class="bg-card border border-border p-5 rounded-xl shadow-sm">
				<div class="flex items-center gap-2 mb-3 text-destructive">
					<Siren class="size-5" />
					<h3 class="font-bold">1. Rule-Based Thresholds</h3>
				</div>
				<p class="text-sm text-muted-foreground leading-relaxed">
					This system runs locally on your device at all times. It strictly monitors the NPHCDA standard: <strong>if 5 cases of a specific disease occur in the same community within 7 days</strong>, it triggers an immediate red alert. This layer does not rely on AI and works completely offline.
				</p>
			</div>
			
			<div class="bg-card border border-purple-200/50 dark:border-purple-900/30 p-5 rounded-xl shadow-sm bg-gradient-to-br from-card to-purple-50/30 dark:to-purple-950/10">
				<div class="flex items-center gap-2 mb-3 text-purple-600 dark:text-purple-400">
					<Activity class="size-5" />
					<h3 class="font-bold">2. AI-Assisted Analysis</h3>
				</div>
				<p class="text-sm text-muted-foreground leading-relaxed">
					This is a deeper, on-demand analysis. When you click <em>Run AI Analysis</em>, ClinicFlow aggregates vitals, lab results, prescriptions, and chief complaints. The AI looks for exponential growth, cross-references seasonal baselines, and forecasts next week's caseload.
				</p>
			</div>
		</div>

		<h2>Understanding Severity Levels</h2>
		<p>When the AI detects a disease cluster, it categorises it into one of four levels:</p>
		<ul class="not-prose space-y-3 my-6">
			<li class="flex items-start gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
				<Badge variant="destructive" class="mt-0.5">Critical</Badge>
				<div>
					<p class="text-sm font-bold text-foreground">Immediate action required.</p>
					<p class="text-sm text-muted-foreground">High caseload, rapid spread, or highly fatal diseases (e.g. Cholera, Lassa Fever). Immediate LGA notification is recommended.</p>
				</div>
			</li>
			<li class="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
				<Badge variant="outline" class="mt-0.5 border-amber-500 text-amber-700 dark:text-amber-400">Warning</Badge>
				<div>
					<p class="text-sm font-bold text-foreground">Increased monitoring required.</p>
					<p class="text-sm text-muted-foreground">Threshold crossed, but spread is contained or disease is highly seasonal (e.g. expected Malaria spike).</p>
				</div>
			</li>
			<li class="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
				<Badge variant="outline" class="mt-0.5">Watch</Badge>
				<div>
					<p class="text-sm font-bold text-foreground">Notable but contained.</p>
					<p class="text-sm text-muted-foreground">Cases are present but stable or falling. Review interventions and maintain routine surveillance.</p>
				</div>
			</li>
			<li class="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
				<Badge variant="secondary" class="mt-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Pre-Alert</Badge>
				<div>
					<p class="text-sm font-bold text-foreground">Early Warning Signal.</p>
					<p class="text-sm text-muted-foreground">The 5-case threshold has <em>not</em> been crossed yet, but the AI detects an exponential doubling pattern indicating an outbreak is likely forming.</p>
				</div>
			</li>
		</ul>

		<h2>Using the Stock Impact Forecast</h2>
		<p>
			Outbreak Radar cross-references its 7-day epidemiological forecast with your current Pharmacy inventory. 
			If the AI forecasts 15 new Malaria cases next week, but you only have 10 courses of Artemether-Lumefantrine left, the <strong>Stock Depletion Risk</strong> panel will warn you.
		</p>
		<p>
			Use this intelligence to preemptively submit Restock Requests to the LGA before the outbreak exhausts your supplies.
		</p>

		<h2>Generating and Submitting IDSR Reports</h2>
		<div class="flex items-start gap-4 not-prose my-6 p-4 border border-border rounded-lg bg-card">
			<FileText class="size-8 text-muted-foreground shrink-0 mt-1" />
			<div>
				<h3 class="font-bold mb-1">IDSR Weekly Reporting</h3>
				<p class="text-sm text-muted-foreground mb-3">
					The AI automatically formats the week's data into the Nigerian Integrated Disease Surveillance and Response (IDSR) format, including suspected vs confirmed cases and a narrative summary.
				</p>
				<div class="flex gap-2">
					<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-muted text-foreground border border-border">
						<Copy class="size-3" /> Copy as Text
					</span>
					<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-muted text-foreground border border-border">
						<Printer class="size-3" /> Print PDF
					</span>
				</div>
			</div>
		</div>

		<h2>Escalating to the LGA DSO</h2>
		<p>
			When a critical outbreak is detected, you should immediately notify your Local Government Area Disease Surveillance Officer (DSO).
		</p>
		<ol>
			<li>Ensure the DSO's phone number is saved in <strong>Admin &rarr; Settings &rarr; Clinic Profile</strong>.</li>
			<li>On the Outbreak Radar page, locate the <strong>Escalate to LGA DSO</strong> panel on the right.</li>
			<li>The AI will have pre-written a concise summary suitable for SMS.</li>
			<li>Click the Send button. ClinicFlow will securely deliver the SMS via the Termii integration.</li>
		</ol>

		<div class="mt-12 p-5 bg-destructive/10 border-l-4 border-destructive rounded-r-lg">
			<h3 class="text-destructive font-bold flex items-center gap-2 mt-0">
				<AlertTriangle class="size-5" />
				When to Call the State Epidemiologist Directly
			</h3>
			<p class="text-sm text-foreground/80 mt-2 mb-0">
				Do not rely solely on the SMS escalation for highly fatal diseases. If you detect any suspected cases of <strong>Lassa Fever</strong>, <strong>Cholera</strong>, <strong>Yellow Fever</strong>, or <strong>Acute Flaccid Paralysis (Polio)</strong>, you must immediately call the LGA DSO and the State Epidemiologist by phone.
			</p>
		</div>
	</div>
</div>
