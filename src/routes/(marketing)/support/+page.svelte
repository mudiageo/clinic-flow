<script lang="ts">
	import SupportArticle from '#lib/components/ui/support-article.svelte';
	import { BookOpen, MonitorCog, Stethoscope, Pill, Users } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Support Center — ClinicFlow</title>
</svelte:head>

<SupportArticle>
	<h1>Welcome to ClinicFlow Support</h1>
	<p class="lead">
		Everything you need to master your Primary Health Centre workflow, from registration to
		dispensation.
	</p>

	<div class="not-prose grid gap-4 md:grid-cols-2 mt-8">
		<a
			href="/support/getting-started"
			class="group relative rounded-lg border border-border p-6 hover:bg-muted/30 transition-colors"
		>
			<div class="mb-3 rounded-md bg-primary/10 w-fit p-2.5 text-primary">
				<BookOpen class="size-5" />
			</div>
			<h3 class="font-bold text-foreground mb-1.5">Quick Start Guide</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Learn how to configure your PHC server, go offline, and invite staff.
			</p>
		</a>
		<a
			href="/support/dr-assist"
			class="group relative rounded-lg border border-border p-6 hover:bg-muted/30 transition-colors"
		>
			<div class="mb-3 rounded-md bg-primary/10 w-fit p-2.5 text-primary">
				<Stethoscope class="size-5" />
			</div>
			<h3 class="font-bold text-foreground mb-1.5">Dr. Assist (AI Guide)</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Master the consultation interface, voice dictation, and AI decision support.
			</p>
		</a>
		<a
			href="/support/rxbrain"
			class="group relative rounded-lg border border-border p-6 hover:bg-muted/30 transition-colors"
		>
			<div class="mb-3 rounded-md bg-primary/10 w-fit p-2.5 text-primary">
				<Pill class="size-5" />
			</div>
			<h3 class="font-bold text-foreground mb-1.5">RxBrain (Smart Pharmacy)</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Learn how to use our AI pharmacy assistant to prevent dangerous drug interactions.
			</p>
		</a>
		<a
			href="/support/outbreak-radar"
			class="group relative rounded-lg border border-border p-6 hover:bg-muted/30 transition-colors"
		>
			<div
				class="mb-3 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-400 w-fit p-2.5"
			>
				<Users class="size-5" />
			</div>
			<h3 class="font-bold text-foreground mb-1.5">Outbreak Radar</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Understand multi-signal epidemiology forecasting and automated IDSR reporting.
			</p>
		</a>
		<a
			href="/support/admin-operations"
			class="group relative rounded-lg border border-border p-6 hover:bg-muted/30 transition-colors"
		>
			<div class="mb-3 rounded-md bg-primary/10 w-fit p-2.5 text-primary">
				<MonitorCog class="size-5" />
			</div>
			<h3 class="font-bold text-foreground mb-1.5">Admin &amp; Superadmin Operations</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				Publish releases, review real sync health, and register devices without demo data.
			</p>
		</a>
	</div>
</SupportArticle>
