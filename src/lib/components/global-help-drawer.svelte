<script lang="ts">
	import { page } from '$app/state';
	import * as Sheet from '$lib/components/ui/sheet';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { ExternalLink, BookOpen, Lightbulb, Activity, ArrowRight } from '@lucide/svelte';

	let { open = $bindable(false) } = $props();

	// Contextual help based on route
	const getHelpContext = (path: string) => {
		if (path.includes('/nurse/vitals')) {
			return {
				title: 'Vitals & Triage',
				description: 'Enter patient vitals to automatically calculate their triage priority.',
				tips: [
					'Ensure accurate temperature and BP readings.',
					'Red alert patients are pushed to the top of the doctor\'s queue.'
				],
				links: [{ title: 'Understanding Triage Rules', url: '/support/triage-rules' }]
			};
		}
		if (path.includes('/nurse')) {
			return {
				title: 'Nurse Queue',
				description: 'Manage incoming patients and triage workflow.',
				tips: [
					'Click "Call Next Patient" to bring in the highest priority patient.',
					'Use the QR scanner for fast registration.'
				],
				links: [{ title: 'Queue Management Guide', url: '/support/nurse-queue' }]
			};
		}
		if (path.includes('/doctor/consult')) {
			return {
				title: 'Doctor Consultation',
				description: 'Record notes, request labs, and prescribe medication.',
				tips: [
					'Use the Voice Input button to dictate notes.',
					'AI Assist can suggest differential diagnoses based on vitals.'
				],
				links: [{ title: 'Using AI Dr. Assist', url: '/support/dr-assist' }]
			};
		}
		// Default
		return {
			title: 'Help Center',
			description: 'Need assistance with ClinicFlow?',
			tips: [
				'Check your connection status in the sidebar if data isn\'t syncing.',
				'Contact your PHC Admin for permission issues.'
			],
			links: [
				{ title: 'Getting Started Guide', url: '/support/getting-started' },
				{ title: 'Video Tutorials', url: '/support' }
			]
		};
	};

	let context = $derived(getHelpContext(page.url.pathname));
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-[300px] sm:w-[400px]">
		<Sheet.Header class="text-left">
			<div class="flex items-center gap-2">
				<div class="p-1.5 rounded-md bg-primary/10 text-primary">
					<BookOpen class="size-4" />
				</div>
				<Sheet.Title>{context.title}</Sheet.Title>
			</div>
			<Sheet.Description>{context.description}</Sheet.Description>
		</Sheet.Header>

		<ScrollArea class="h-full mt-6 pr-4 -mr-4 pb-12">
			<div class="space-y-6">
				<!-- Quick Tips -->
				<div>
					<h3 class="text-sm font-semibold flex items-center gap-2 mb-3">
						<Lightbulb class="size-4 text-amber-500" />
						Quick Tips
					</h3>
					<ul class="space-y-3">
						{#each context.tips as tip}
							<li class="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
								<Activity class="size-4 shrink-0 text-primary mt-0.5" />
								<span>{tip}</span>
							</li>
						{/each}
					</ul>
				</div>

				<Separator />

				<!-- Related Articles -->
				<div>
					<h3 class="text-sm font-semibold mb-3">Related Articles</h3>
					<div class="space-y-2">
						{#each context.links as link}
							<a href={link.url} class="group flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium">
								{link.title}
								<ExternalLink class="size-3.5 opacity-50 group-hover:opacity-100" />
							</a>
						{/each}
					</div>
				</div>
				
				<!-- Global Link -->
				<div class="pt-2">
					<a href="/support" class="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1">
						Visit Full Help Center <ArrowRight class="size-3" />
					</a>
				</div>
			</div>
		</ScrollArea>
	</Sheet.Content>
</Sheet.Root>
