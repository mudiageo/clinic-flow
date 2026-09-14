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
		<a href="/support/nurse-queue" class="group relative rounded-lg border p-6 hover:bg-muted transition-colors">
			<div class="mb-3 rounded-full bg-primary/10 w-fit p-2.5 text-primary">
				<Users class="size-5" />
			</div>
			<h3 class="font-semibold mb-2">Nurse Guides</h3>
			<p class="text-sm text-muted-foreground">Learn how to manage the queue, enter vitals, and handle triage.</p>
		</a>
		<a href="/support/dr-assist" class="group relative rounded-lg border p-6 hover:bg-muted transition-colors">
			<div class="mb-3 rounded-full bg-primary/10 w-fit p-2.5 text-primary">
				<Stethoscope class="size-5" />
			</div>
			<h3 class="font-semibold mb-2">Doctor Guides</h3>
			<p class="text-sm text-muted-foreground">Master the consultation interface, AI Assist, and lab requests.</p>
		</a>
		<a href="/support/pharmacy" class="group relative rounded-lg border p-6 hover:bg-muted transition-colors">
			<div class="mb-3 rounded-full bg-primary/10 w-fit p-2.5 text-primary">
				<Pill class="size-5" />
			</div>
			<h3 class="font-semibold mb-2">Pharmacy Guides</h3>
			<p class="text-sm text-muted-foreground">Manage inventory, handle restock requests, and dispense medication.</p>
		</a>
	</div>
</SupportArticle>
