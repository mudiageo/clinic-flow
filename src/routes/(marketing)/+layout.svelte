<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { HeartPulse } from '@lucide/svelte';

	let { children } = $props();
</script>

<div class="min-h-screen bg-background flex flex-col font-sans">
	<header
		class="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full"
	>
		<div class="container flex h-16 items-center justify-between mx-auto px-4 md:px-8 max-w-7xl">
			<a
				href="/"
				class="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors"
			>
				<HeartPulse class="size-6 text-primary" />
				<span class="tracking-tight">ClinicFlow</span>
			</a>

			<nav class="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
				<a href="#features" class="hover:text-foreground transition-colors">Features</a>
				<a href="/download" class="hover:text-foreground transition-colors">Download Apps</a>
			</nav>

			<div class="flex items-center gap-4">
				<Button
					variant="ghost"
					href="/login"
					class="hidden sm:inline-flex text-sm font-semibold text-muted-foreground hover:text-foreground btn-press"
				>
					Sign In
				</Button>
				<Button
					href="/register"
					class="bg-primary text-primary-foreground hover:bg-primary/90 btn-press rounded-full px-6 font-bold shadow-md shadow-primary/20"
				>
					Register PHC
				</Button>
			</div>
		</div>
	</header>

	<main class="flex-1 flex flex-col">
		{@render children()}
	</main>

	<footer class="border-t border-border/40 bg-muted/20 py-8 md:py-12 mt-auto">
		<div
			class="container mx-auto px-4 md:px-8 max-w-7xl text-center md:text-left text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center"
		>
			<div class="flex items-center gap-2 font-bold text-foreground mb-4 md:mb-0">
				<HeartPulse class="size-5 text-primary" />
				ClinicFlow
			</div>
			<p>&copy; {new Date().getFullYear()} ClinicFlow Open Source Initiative.</p>
		</div>
	</footer>
</div>
