<script lang="ts">
	import SupportArticle from '$lib/components/ui/support-article.svelte';
	import { ArrowRight, BookOpen, Stethoscope, Pill, Users } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Support Center — ClinicFlow</title>
</svelte:head>

<SupportArticle>
	<h1>Welcome to ClinicFlow Support</h1>
	<p class="lead">Everything you need to master your Primary Health Centre workflow, from registration to dispensation.</p>
	
	<div class="not-prose grid gap-4 md:grid-cols-2 mt-8">
		<a href="/support/getting-started" class="group relative rounded-lg border p-6 hover:bg-muted transition-colors">
			<div class="mb-3 rounded-full bg-primary/10 w-fit p-2.5 text-primary">
				<BookOpen class="size-5" />
			</div>
			<h3 class="font-semibold mb-2">Quick Start Guide</h3>
			<p class="text-sm text-muted-foreground">Learn how to configure your PHC server, go offline, and invite staff.</p>
		</a>
		<a href="/support/dr-assist" class="group relative rounded-lg border p-6 hover:bg-muted transition-colors">
			<div class="mb-3 rounded-full bg-primary/10 w-fit p-2.5 text-primary">
				<Stethoscope class="size-5" />
			</div>
			<h3 class="font-semibold mb-2">Dr. Assist (AI Guide)</h3>
			<p class="text-sm text-muted-foreground">Master the consultation interface, voice dictation, and AI decision support.</p>
		</a>
		<a href="/support/rxbrain" class="group relative rounded-lg border p-6 hover:bg-muted transition-colors">
			<div class="mb-3 rounded-full bg-primary/10 w-fit p-2.5 text-primary">
				<Pill class="size-5" />
			</div>
			<h3 class="font-semibold mb-2">RxBrain (Smart Pharmacy)</h3>
			<p class="text-sm text-muted-foreground">Learn how to use our AI pharmacy assistant to prevent dangerous drug interactions.</p>
		</a>
	</div>
</SupportArticle>
