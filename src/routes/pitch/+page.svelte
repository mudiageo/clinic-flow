<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide, fly, scale } from 'svelte/transition';
	import { 
		HeartPulse, 
		FileSignature, 
		WifiOff, 
		Activity, 
		ShieldCheck, 
		Radar, 
		Database, 
		ChevronRight, 
		ChevronLeft,
		Users,
		Clock,
		Zap
	} from '@lucide/svelte';

	let currentSlide = $state(0);
	const totalSlides = 5;

	function nextSlide() {
		if (currentSlide < totalSlides - 1) currentSlide++;
	}

	function prevSlide() {
		if (currentSlide > 0) currentSlide--;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight' || event.key === 'Space') {
			nextSlide();
		} else if (event.key === 'ArrowLeft') {
			prevSlide();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<svelte:head>
	<title>ClinicFlow Pitch Deck</title>
</svelte:head>

<div class="h-[100dvh] w-full overflow-hidden flex flex-col relative font-sans transition-colors duration-1000 ease-in-out
	{currentSlide === 0 ? 'bg-slate-950 text-white' : ''}
	{currentSlide === 1 ? 'bg-rose-950 text-rose-50' : ''}
	{currentSlide === 2 ? 'bg-indigo-950 text-indigo-50' : ''}
	{currentSlide === 3 ? 'bg-emerald-950 text-emerald-50' : ''}
	{currentSlide === 4 ? 'bg-slate-900 text-white' : ''}
">
	
	<!-- Progress Bar -->
	<div class="absolute top-0 left-0 h-1.5 transition-all duration-500 ease-out z-50
		{currentSlide === 0 ? 'bg-indigo-500' : ''}
		{currentSlide === 1 ? 'bg-rose-500' : ''}
		{currentSlide === 2 ? 'bg-indigo-400' : ''}
		{currentSlide === 3 ? 'bg-emerald-400' : ''}
		{currentSlide === 4 ? 'bg-cyan-500' : ''}
	" style="width: {((currentSlide + 1) / totalSlides) * 100}%"></div>

	<!-- Dynamic Background Textures -->
	{#if currentSlide === 0}
		<div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/40 via-slate-950 to-slate-950"></div>
	{/if}
	{#if currentSlide === 1}
		<div class="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjZmZmIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIG9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIvPjwvZz48L3N2Zz4=')]"></div>
	{/if}
	{#if currentSlide === 3}
		<div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/30 via-emerald-950 to-emerald-950"></div>
	{/if}

	<!-- Slide Container -->
	<div class="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 w-full h-full overflow-y-auto overflow-x-hidden break-words">
		
		{#if currentSlide === 0}
			<!-- SLIDE 1: TITLE -->
			<div in:fly={{ y: 50, duration: 800, delay: 200 }} out:fade={{ duration: 300 }} class="text-center max-w-4xl absolute w-full px-4">
				<div class="flex justify-center mb-6 md:mb-10">
					<div class="p-4 md:p-8 rounded-3xl md:rounded-[2rem] bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30 backdrop-blur-xl shadow-2xl shadow-indigo-500/20">
						<HeartPulse class="size-16 md:size-28" />
					</div>
				</div>
				<h1 class="text-5xl md:text-[5.5rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 via-white to-cyan-300 mb-6 md:mb-8 leading-none drop-shadow-sm">
					ClinicFlow
				</h1>
				<p class="text-xl md:text-3xl text-slate-300 font-light leading-relaxed mb-8 md:mb-10">
					An offline-first, AI-powered workflow <br class="hidden md:block">and surveillance engine for Nigeria’s PHCs.
				</p>
				<div class="inline-flex items-center gap-3 md:gap-4 px-6 md:px-8 py-3 md:py-4 rounded-full bg-slate-800/80 border border-slate-700/50 text-slate-300 text-sm md:text-lg tracking-widest uppercase font-bold shadow-xl backdrop-blur-md">
					<span>3MTT <span class="hidden md:inline">x IdentArk.io</span></span>
					<span class="w-2 h-2 rounded-full bg-indigo-500"></span>
					<span class="text-indigo-300">Build AI. Solve Local.</span>
				</div>
			</div>
		{/if}

		{#if currentSlide === 1}
			<!-- SLIDE 2: THE PROBLEM -->
			<div in:fly={{ x: 100, duration: 600, delay: 200 }} out:fade={{ duration: 300 }} class="w-full max-w-6xl absolute px-4 mt-12 md:mt-0">
				<div class="flex items-center gap-2 md:gap-4 mb-8 md:mb-16 justify-center">
					<div class="w-8 md:w-16 h-1 bg-rose-500 rounded-full"></div>
					<h2 class="text-3xl md:text-5xl font-black uppercase tracking-tight text-white text-center">The Broken Backbone</h2>
					<div class="w-8 md:w-16 h-1 bg-rose-500 rounded-full"></div>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 pb-20 md:pb-0">
					<!-- Stat 1 -->
					<div class="bg-rose-900/40 border border-rose-500/20 p-6 md:p-10 rounded-3xl relative overflow-hidden backdrop-blur-sm shadow-xl">
						<div class="absolute -top-4 -right-4 md:-top-6 md:-right-6 p-4 opacity-[0.03] transform rotate-12"><Users class="size-24 md:size-48" /></div>
						<div class="text-5xl md:text-7xl font-black text-rose-300 mb-4 md:mb-6 drop-shadow-md">97%</div>
						<h3 class="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-white">Staffing Deficit</h3>
						<p class="text-rose-200/80 text-base md:text-lg leading-relaxed relative z-10">
							Of PHCs fail to meet minimum staffing standards. Junior staff are profoundly overwhelmed by patient volume.
						</p>
					</div>
					
					<!-- Stat 2 -->
					<div class="bg-rose-900/40 border border-rose-500/20 p-6 md:p-10 rounded-3xl relative overflow-hidden backdrop-blur-sm shadow-xl">
						<div class="absolute -top-4 -right-4 md:-top-6 md:-right-6 p-4 opacity-[0.03] transform -rotate-12"><Clock class="size-24 md:size-48" /></div>
						<div class="text-5xl md:text-7xl font-black text-rose-300 mb-4 md:mb-6 drop-shadow-md">70%</div>
						<h3 class="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-white">Time Wasted</h3>
						<p class="text-rose-200/80 text-base md:text-lg leading-relaxed relative z-10">
							Clinicians spend the vast majority of their time writing in redundant, massive paper registers rather than treating patients.
						</p>
					</div>

					<!-- Stat 3 -->
					<div class="bg-rose-900/40 border border-rose-500/20 p-6 md:p-10 rounded-3xl relative overflow-hidden backdrop-blur-sm shadow-xl">
						<div class="absolute -top-4 -right-4 md:-top-6 md:-right-6 p-4 opacity-[0.03] transform rotate-6"><WifiOff class="size-24 md:size-48" /></div>
						<div class="text-5xl md:text-7xl font-black text-rose-300 mb-4 md:mb-6 drop-shadow-md">Lags</div>
						<h3 class="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-white">The "Double-Entry" Trap</h3>
						<p class="text-rose-200/80 text-base md:text-lg leading-relaxed relative z-10">
							No power/internet forces a hybrid system: paper first, then manual transcription to DHIS2 weeks later, causing dangerous blindspots.
						</p>
					</div>
				</div>
			</div>
		{/if}

		{#if currentSlide === 2}
			<!-- SLIDE 3: THE SOLUTION -->
			<div in:scale={{ start: 0.9, duration: 600, delay: 200 }} out:fade={{ duration: 300 }} class="w-full max-w-6xl absolute px-4 mt-20 md:mt-0">
				<div class="text-center mb-8 md:mb-16">
					<h2 class="text-3xl md:text-5xl font-black mb-4 md:mb-6 text-white tracking-tight">AI-Powered Workflow Optimization</h2>
					<p class="text-lg md:text-2xl text-indigo-300/80 font-light max-w-3xl mx-auto">Replacing administrative burden with intelligent, offline-capable automation.</p>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pb-24 md:pb-0">
					<div class="flex gap-4 md:gap-6 items-start bg-indigo-900/30 border border-indigo-500/20 p-5 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-md shadow-2xl hover:bg-indigo-900/40 transition-colors">
						<div class="p-3 md:p-4 bg-indigo-500/20 text-indigo-300 rounded-xl md:rounded-2xl shrink-0"><WifiOff class="size-6 md:size-8" /></div>
						<div>
							<h3 class="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-white">Resilient Architecture</h3>
							<p class="text-indigo-200/80 text-sm md:text-lg leading-relaxed">A Progressive Web App that runs 100% offline via local IndexedDB. It automatically syncs when cellular data is restored, perfect for rural outreach.</p>
						</div>
					</div>

					<div class="flex gap-4 md:gap-6 items-start bg-indigo-900/30 border border-indigo-500/20 p-5 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-md shadow-2xl hover:bg-indigo-900/40 transition-colors">
						<div class="p-3 md:p-4 bg-cyan-500/20 text-cyan-300 rounded-xl md:rounded-2xl shrink-0"><FileSignature class="size-6 md:size-8" /></div>
						<div>
							<h3 class="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-white">AI Auto-Scribe</h3>
							<p class="text-indigo-200/80 text-sm md:text-lg leading-relaxed">Doctors type quick shorthand (e.g., "fever 3 days"). The AI expands it into a fully formatted, professional SOAP note in milliseconds.</p>
						</div>
					</div>

					<div class="flex gap-4 md:gap-6 items-start bg-indigo-900/30 border border-indigo-500/20 p-5 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-md shadow-2xl hover:bg-indigo-900/40 transition-colors">
						<div class="p-3 md:p-4 bg-rose-500/20 text-rose-300 rounded-xl md:rounded-2xl shrink-0"><ShieldCheck class="size-6 md:size-8" /></div>
						<div>
							<h3 class="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-white">RxBrain Safety Nets</h3>
							<p class="text-indigo-200/80 text-sm md:text-lg leading-relaxed">Automatically cross-references prescriptions against patient demographics (age, pregnancy) to prevent critical dispensing errors.</p>
						</div>
					</div>

					<div class="flex gap-4 md:gap-6 items-start bg-indigo-900/30 border border-indigo-500/20 p-5 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-md shadow-2xl hover:bg-indigo-900/40 transition-colors">
						<div class="p-3 md:p-4 bg-emerald-500/20 text-emerald-300 rounded-xl md:rounded-2xl shrink-0"><Zap class="size-6 md:size-8" /></div>
						<div>
							<h3 class="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-white">Instant Data Triage</h3>
							<p class="text-indigo-200/80 text-sm md:text-lg leading-relaxed">Smart queues prioritize patients in the waiting room based on vitals, ensuring critical cases aren't lost in the administrative chaos.</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if currentSlide === 3}
			<!-- SLIDE 4: EPIDEMIOLOGY -->
			<div in:fly={{ y: -50, duration: 600, delay: 200 }} out:fade={{ duration: 300 }} class="w-full max-w-6xl absolute px-4 mt-12 md:mt-0">
				<h2 class="text-3xl md:text-[3.5rem] font-black mb-8 md:mb-16 text-center text-white tracking-tight leading-tight">From Local Care to National Surveillance</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 pb-20 md:pb-0">
					<div class="bg-emerald-900/30 border border-emerald-500/30 p-8 md:p-12 rounded-3xl md:rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl backdrop-blur-md relative overflow-hidden">
						<div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjMTRiOGE2IiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIG9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTAgNjBoNjBWMEgweiIvPjwvZz48L3N2Zz4=')] opacity-50"></div>
						<div class="relative z-10">
							<Radar class="size-16 md:size-20 text-emerald-300 mb-6 md:mb-8 mx-auto" />
							<h3 class="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">AI Outbreak Radar</h3>
							<p class="text-emerald-100/90 text-base md:text-xl leading-relaxed">
								Continuously scans local digitized complaints to detect disease clusters (e.g., Cholera) weeks before manual paper reports hit the LGA level.
							</p>
						</div>
					</div>

					<div class="bg-emerald-900/30 border border-emerald-500/30 p-8 md:p-12 rounded-3xl md:rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl backdrop-blur-md relative overflow-hidden">
						<div class="absolute top-0 right-0 p-4 md:p-8 opacity-10"><Database class="size-32 md:size-64" /></div>
						<div class="relative z-10">
							<Database class="size-16 md:size-20 text-cyan-300 mb-6 md:mb-8 mx-auto" />
							<h3 class="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">Deterministic DHIS2 Bridge</h3>
							<p class="text-emerald-100/90 text-base md:text-xl leading-relaxed">
								Aggregates clinic data into strict JSON payloads. Complies perfectly with FMOH mandates for age/sex disaggregation. Zero AI hallucinations in records.
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if currentSlide === 4}
			<!-- SLIDE 5: IMPACT -->
			<div in:scale={{ start: 0.95, duration: 800, delay: 200 }} out:fade={{ duration: 300 }} class="text-center max-w-4xl absolute w-full px-4">
				<div class="flex justify-center mb-8 md:mb-12">
					<div class="p-6 md:p-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 shadow-[0_0_60px_-15px_rgba(6,182,212,0.6)]">
						<Activity class="size-16 md:size-24 text-white" />
					</div>
				</div>
				<h2 class="text-4xl md:text-7xl font-black mb-6 md:mb-10 tracking-tighter text-white">Empowering the Frontline</h2>
				<p class="text-xl md:text-3xl text-slate-300 font-light leading-relaxed mb-10 md:mb-16 max-w-3xl mx-auto">
					We aren't trying to replace doctors or teach medicine.<br> 
					<span class="font-medium text-white">We are optimizing workflows and safeguarding data, giving health workers their time back to do what they do best: care for patients.</span>
				</p>
				<p class="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase tracking-widest mt-4 md:mt-8">
					Thank You
				</p>
			</div>
		{/if}

	</div>

	<!-- Controls -->
	<div class="absolute bottom-6 md:bottom-8 left-0 right-0 flex justify-between items-center px-6 md:px-16 z-50 bg-gradient-to-t from-black/50 to-transparent pt-10 pb-4 md:bg-none md:p-0">
		<button onclick={prevSlide} disabled={currentSlide === 0} class="p-3 md:p-4 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-0 transition-all border border-white/20 backdrop-blur-md">
			<ChevronLeft class="size-6 md:size-8 text-white/90" />
		</button>
		<div class="text-xs md:text-sm font-mono text-white/70 tracking-widest font-bold bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
			0{currentSlide + 1} / 0{totalSlides}
		</div>
		<button onclick={nextSlide} disabled={currentSlide === totalSlides - 1} class="p-3 md:p-4 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-0 transition-all border border-white/20 backdrop-blur-md">
			<ChevronRight class="size-6 md:size-8 text-white/90" />
		</button>
	</div>
</div>
