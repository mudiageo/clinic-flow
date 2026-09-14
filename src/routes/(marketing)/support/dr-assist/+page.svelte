<script lang="ts">
	import SupportArticle from '$lib/components/ui/support-article.svelte';
	import AiDisclaimer from '$lib/components/ui/ai-disclaimer.svelte';
	import { ShieldCheck, AlertTriangle } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Using Dr. Assist — ClinicFlow Support</title>
</svelte:head>

<SupportArticle>
	<h1>How to use Dr. Assist (AI Clinical Decision Support)</h1>
	<p class="lead">Dr. Assist is an experimental AI tool designed to provide a "second opinion" on differential diagnoses, tests, and treatments.</p>
	
	<div class="my-6">
		<AiDisclaimer />
	</div>
	
	<h2>Getting Started</h2>
	<p>When you open a patient consultation, you will notice a new <strong>Dr. Assist</strong> tab in your workspace alongside Clinical Notes and Prescriptions. The first time you use this feature, you will be required to read and accept a <strong>Safety & Liability Waiver</strong>.</p>

	<h2>How it Works</h2>
	<ol>
		<li><strong>Record Patient Data:</strong> Ensure that the patient's vitals are entered and that you have written a detailed Chief Complaint and clinical history in the <em>Clinical Notes</em> tab. The AI relies heavily on this information to generate accurate suggestions.</li>
		<li><strong>Run Analysis:</strong> Switch to the <strong>Dr. Assist</strong> tab and click the "Run AI Analysis" button. The system will securely process the data against WHO primary care guidelines.</li>
		<li><strong>Review Suggestions:</strong> The AI will return structured suggestions organized into:
			<ul>
				<li><strong>Differentials:</strong> A list of suspected conditions with high/medium/low probability ratings.</li>
				<li><strong>Suggested Tests:</strong> Recommended laboratory investigations.</li>
				<li><strong>Treatment Plan:</strong> Suggested management steps.</li>
			</ul>
		</li>
		<li><strong>Take Action:</strong> Use the "Copy to Lab" or "Insert to Notes" buttons to move the AI's suggestions into your actual workflow. <em>Note: The AI never modifies the patient's record automatically. You are entirely in control.</em></li>
	</ol>

	<h2>AI Voice Dictation & SOAP Note Generation</h2>
	<p>ClinicFlow provides two AI tools directly within the <strong>Clinical Notes</strong> tab to speed up your documentation:</p>
	<ul>
		<li><strong>Voice Dictation:</strong> Press and hold the "Hold to Dictate" button to speak your notes (supports English and Nigerian Pidgin). The AI will structure your voice input into a clean transcript.</li>
		<li><strong>Generate SOAP Note 🪄:</strong> Click this button above your text area. The AI will read your raw notes, the patient's vitals, and automatically format them into a standard Subjective, Objective, Assessment, and Plan format. <em>Important: The AI is restricted from hallucinating physical exam findings. If you did not dictate an exam, you must manually fill in the "Objective" section.</em></li>
	</ul>

	<h2>🚨 Red Flags & Emergency Protocols</h2>
	<p>Dr. Assist is programmed to prioritize patient safety. If the AI detects symptoms indicative of a medical emergency (e.g., severe hemorrhage, signs of shock, cardiac events), it will abort generating a standard diagnosis and instead flash a <strong>Critical Red Flag</strong> warning advising immediate escalation to a secondary or tertiary facility.</p>
	
	<div class="p-4 bg-muted border rounded-xl mt-8">
		<h3 class="flex items-center gap-2 font-semibold text-sm m-0">
			<ShieldCheck class="size-4 text-primary" /> Who can use this?
		</h3>
		<p class="text-xs text-muted-foreground mt-2 mb-0">
			This feature requires the <code>view:medical_records</code> permission (typically granted to Doctors). Your PHC Admin or a platform Superadmin has the authority to disable this feature globally if they determine it is not suitable for your specific clinic.
		</p>
	</div>
</SupportArticle>
