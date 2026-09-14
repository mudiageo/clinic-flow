<script lang="ts">
	import { page } from '$app/state';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	
	let { children } = $props();

	const supportLinks = [
		{
			title: 'Getting Started',
			links: [
				{ title: 'Introduction', href: '/support' },
				{ title: 'Quick Start Guide', href: '/support/getting-started' }
			]
		},
		{
			title: 'Role Guides',
			links: [
				{ title: 'Nurse Workflow', href: '/support/nurse-queue' },
				{ title: 'Doctor Consultation', href: '/support/dr-assist' },
				{ title: 'Pharmacy Inventory', href: '/support/pharmacy' }
			]
		}
	];
</script>

<div class="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 px-4 md:px-8">
	<aside class="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block border-r pr-4">
		<ScrollArea class="h-full py-6 pr-6 lg:py-8">
			<div class="w-full">
				{#each supportLinks as group}
					<div class="pb-4">
						<h4 class="mb-1 rounded-md px-2 py-1 text-sm font-semibold">{group.title}</h4>
						<div class="grid grid-flow-row auto-rows-max text-sm">
							{#each group.links as link}
								<a
									href={link.href}
									class="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground {page.url.pathname === link.href ? 'text-foreground font-medium' : ''}"
								>
									{link.title}
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</ScrollArea>
	</aside>
	<main class="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
		<div class="mx-auto w-full min-w-0">
			{@render children()}
		</div>
	</main>
</div>
