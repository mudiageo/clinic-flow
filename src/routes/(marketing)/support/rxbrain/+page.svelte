<script lang="ts">
	import SupportArticle from '$lib/components/ui/support-article.svelte';
	import AiDisclaimer from '$lib/components/ui/ai-disclaimer.svelte';
	import { Brain, ShieldAlert, Pill } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Using RxBrain — ClinicFlow Support</title>
</svelte:head>

<SupportArticle>
	<h1>How to use RxBrain (Smart Pharmacy & Drug Interactions)</h1>
	<p class="lead">RxBrain is a built-in safety net for pharmacists, designed to cross-reference pending prescriptions against patient data to prevent adverse drug events.</p>
	
	<div class="my-6">
		<AiDisclaimer />
	</div>
	
	<h2>Getting Started</h2>
	<p>When you navigate to the <strong>Dispense Queue</strong> in the Pharmacy module, you will see a list of patients waiting for their medications. At the top of each patient's queue, there is a new button: <strong>RxBrain Check <Brain class="inline size-4 text-indigo-600" /></strong>.</p>

	<h2>How it Works</h2>
	<ol>
		<li><strong>Trigger Analysis:</strong> Click "RxBrain Check" before dispensing. The AI will securely process the patient's vitals, age, biological sex, pregnancy status, and the list of prescribed medications.</li>
		<li><strong>Review the Safety Report:</strong> Within seconds, an advisory panel will appear detailing:
			<ul>
				<li><strong>Drug Interactions:</strong> Potential conflicts between the medications prescribed.</li>
				<li><strong>Contraindications:</strong> Flags indicating if a drug is unsafe for the specific patient (e.g., teratogenic drugs for pregnant patients).</li>
				<li><strong>Dosage Warnings:</strong> Alerts if a dosage seems atypically high or low based on the patient's age (e.g., pediatric vs. adult dosing).</li>
			</ul>
		</li>
		<li><strong>Dispense Decision:</strong> RxBrain is purely advisory. It will <em>never</em> disable the "Dispense" button. You, the licensed pharmacist, retain ultimate authority and clinical judgment.</li>
	</ol>

	<h2>🚨 Clinical Reliability & Formularies</h2>
	<p>RxBrain is strictly constrained to standard formularies, specifically referencing the <strong>WHO Model List of Essential Medicines</strong>. It is engineered to minimize "hallucinations," but as an AI, it is not infallible. Always trust your professional training over the AI's suggestions.</p>
	
	<div class="p-4 bg-muted border rounded-xl mt-8">
		<h3 class="flex items-center gap-2 font-semibold text-sm m-0">
			<ShieldAlert class="size-4 text-primary" /> Who can use this?
		</h3>
		<p class="text-xs text-muted-foreground mt-2 mb-0">
			This feature requires the <code>pharmacy</code> or <code>dispense:medication</code> permission. Your PHC Admin or a platform Superadmin has the authority to disable this feature globally.
		</p>
	</div>
</SupportArticle>
