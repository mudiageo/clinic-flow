<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { HeartPulse, WifiOff, CloudSync, ArrowRight, ArrowLeft } from '@lucide/svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';

	let currentSlide = $state(0);

	const slides = [
		{
			title: 'Welcome to ClinicFlow',
			description: 'The modern, resilient operating system for Primary Healthcare Centers.',
			icon: HeartPulse,
			color: 'bg-primary/10 text-primary',
			bgGradient: 'from-primary/20 to-transparent'
		},
		{
			title: '100% Offline Resilience',
			description: 'No internet? No problem. Register patients, manage queues, and dispense drugs entirely offline.',
			icon: WifiOff,
			color: 'bg-accent/10 text-accent-foreground',
			bgGradient: 'from-accent/20 to-transparent'
		},
		{
			title: 'Seamless Synchronization',
			description: 'When connectivity returns, your data automatically syncs to the cloud securely in the background.',
			icon: CloudSync,
			color: 'bg-emerald-500/10 text-emerald-500',
			bgGradient: 'from-emerald-500/20 to-transparent'
		}
	];

	function nextSlide() {
		if (currentSlide < slides.length - 1) {
			currentSlide++;
		}
	}

	function prevSlide() {
		if (currentSlide > 0) {
			currentSlide--;
		}
	}

	function finishWelcome() {
		goto('/connect');
	}
</script>

<svelte:head>
	<title>Welcome - ClinicFlow</title>
</svelte:head>

<div class="fixed inset-0 flex flex-col bg-background overflow-hidden selection:bg-primary/30">
	<!-- Dynamic Background Gradient -->
	<div 
		class="absolute inset-0 bg-gradient-to-br opacity-50 transition-colors duration-700 ease-in-out {slides[currentSlide].bgGradient}"
	></div>

	<!-- Main Content Area -->
	<main class="flex-1 relative flex flex-col justify-center items-center p-6 sm:p-12 z-10">
		
		{#each slides as slide, i}
			{#if currentSlide === i}
				<div 
					class="absolute w-full max-w-md flex flex-col items-center text-center space-y-8"
					in:fly={{ x: 50, duration: 400, delay: 100 }}
					out:fly={{ x: -50, duration: 400 }}
				>
					<!-- Illustration / Icon -->
					<div class="relative group">
						<div class="absolute inset-0 bg-background/50 blur-2xl rounded-full scale-150 group-hover:scale-175 transition-transform duration-700"></div>
						<div class="relative size-40 sm:size-56 rounded-full {slide.color} flex items-center justify-center shadow-2xl border-4 border-background overflow-hidden">
							<slide.icon class="size-20 sm:size-28 opacity-90 drop-shadow-md transition-transform duration-500 group-hover:scale-110" />
						</div>
					</div>

					<!-- Text Content -->
					<div class="space-y-4 px-4">
						<h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
							{slide.title}
						</h1>
						<p class="text-lg text-muted-foreground font-medium leading-relaxed">
							{slide.description}
						</p>
					</div>
				</div>
			{/if}
		{/each}
	</main>

	<!-- Footer Controls -->
	<footer class="relative z-10 w-full p-6 sm:px-12 sm:pb-12 flex flex-col gap-8 bg-gradient-to-t from-background via-background to-transparent pt-20">
		<!-- Progress Indicators -->
		<div class="flex justify-center gap-3">
			{#each slides as _, i}
				<button 
					class="h-2.5 rounded-full transition-all duration-300 {currentSlide === i ? 'w-8 bg-primary' : 'w-2.5 bg-primary/20 hover:bg-primary/40'}"
					onclick={() => currentSlide = i}
					aria-label="Go to slide {i + 1}"
				></button>
			{/each}
		</div>

		<!-- Action Buttons -->
		<div class="flex items-center justify-between max-w-md w-full mx-auto">
			<Button 
				variant="ghost" 
				size="lg"
				class="text-muted-foreground hover:text-foreground font-medium {currentSlide === 0 ? 'invisible' : ''}"
				onclick={prevSlide}
			>
				<ArrowLeft class="size-5 mr-2" />
				Back
			</Button>

			{#if currentSlide === slides.length - 1}
				<Button 
					size="lg" 
					class="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 h-14 rounded-full shadow-xl shadow-primary/25 btn-press"
					onclick={finishWelcome}
				>
					Get Started
					<ArrowRight class="size-5 ml-2" />
				</Button>
			{:else}
				<Button 
					variant="ghost" 
					size="lg" 
					class="font-medium hover:bg-primary/5"
					onclick={nextSlide}
				>
					Next
					<ArrowRight class="size-5 ml-2" />
				</Button>
			{/if}
		</div>
	</footer>
</div>

<style>
	.btn-press:active {
		transform: scale(0.96);
	}
</style>
