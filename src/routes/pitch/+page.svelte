<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import { 
		HeartPulse, 
		AlertTriangle, 
		FileSignature, 
		WifiOff, 
		Activity, 
		ShieldCheck, 
		Radar, 
		Database, 
		ChevronRight, 
		ChevronLeft,
		Users
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

<div class="h-screen w-screen bg-slate-950 text-slate-50 overflow-hidden flex flex-col relative font-sans">
	<!-- Progress Bar -->
	<div class="absolute top-0 left-0 h-1 bg-indigo-600 transition-all duration-500 ease-out" style="width: {((currentSlide + 1) / totalSlides) * 100}%"></div>

	<!-- Slide Container -->
	<div class="flex-1 flex items-center justify-center p-12 relative">
		
		{#if currentSlide === 0}
			<!-- SLIDE 1: TITLE -->
			<div in:fly={{ y: 50, duration: 500, delay: 200 }} out:fade={{ duration: 200 }} class="text-center max-w-4xl absolute">
				<div class="flex justify-center mb-8">
					<div class="p-6 rounded-3xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50">
						<HeartPulse class="size-24" />
					</div>
				</div>
				<h1 class="text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-6">
					ClinicFlow
				</h1>
				<p class="text-3xl text-slate-300 font-light leading-relaxed mb-8">
					An offline-first, AI-powered safety net for Nigeria’s Primary Health Centres.
				</p>
				<div class="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 text-lg tracking-wide uppercase font-semibold">
					<span>3MTT x IdentArk.io</span>
					<span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
					<span class="text-indigo-400">Build AI. Solve Local.</span>
				</div>
			</div>
		{/if}

		{#if currentSlide === 1}
			<!-- SLIDE 2: THE PROBLEM -->
			<div in:fly={{ x: 100, duration: 500, delay: 200 }} out:fade={{ duration: 200 }} class="w-full max-w-6xl absolute">
				<h2 class="text-5xl font-bold mb-16 text-center">The Broken Backbone of Healthcare</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
					<!-- Stat 1 -->
					<div class="bg-slate-900 border border-slate-800 p-8 rounded-2xl relative overflow-hidden group">
						<div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users class="size-32" /></div>
						<div class="text-6xl font-black text-rose-500 mb-4">97%</div>
						<h3 class="text-2xl font-bold mb-3">Staffing Crisis</h3>
						<p class="text-slate-400 text-lg leading-relaxed">
							Of PHCs fail to meet minimum staffing standards. There is a national deficit of 122,696 health workers, leaving junior staff overwhelmed.
						</p>
						<p class="text-xs text-slate-600 mt-6 uppercase tracking-wider font-semibold">Source: Orodata Science</p>
					</div>
					
					<!-- Stat 2 -->
					<div class="bg-slate-900 border border-slate-800 p-8 rounded-2xl relative overflow-hidden group">
						<div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FileSignature class="size-32" /></div>
						<div class="text-6xl font-black text-amber-500 mb-4">∞</div>
						<h3 class="text-2xl font-bold mb-3">Documentation Burden</h3>
						<p class="text-slate-400 text-lg leading-relaxed">
							Doctors are trapped writing in redundant paper registers (ANC, TB, General). This drives burnout and steals critical time from patient care.
						</p>
					</div>

					<!-- Stat 3 -->
					<div class="bg-slate-900 border border-slate-800 p-8 rounded-2xl relative overflow-hidden group">
						<div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><WifiOff class="size-32" /></div>
						<div class="text-6xl font-black text-indigo-500 mb-4">DHIS2</div>
						<h3 class="text-2xl font-bold mb-3">The "Double-Entry" Trap</h3>
						<p class="text-slate-400 text-lg leading-relaxed">
							No power/internet forces a hybrid system: data is recorded on paper, then manually transcribed to DHIS2 weeks later, causing lag and errors.
						</p>
					</div>
				</div>
			</div>
		{/if}

		{#if currentSlide === 2}
			<!-- SLIDE 3: THE SOLUTION -->
			<div in:fly={{ x: 100, duration: 500, delay: 200 }} out:fade={{ duration: 200 }} class="w-full max-w-6xl absolute">
				<div class="text-center mb-16">
					<h2 class="text-5xl font-bold mb-4">ClinicFlow: Build AI. Solve Local.</h2>
					<p class="text-2xl text-slate-400 font-light">Replacing paperwork with intelligent safety nets.</p>
				</div>
				
				<div class="space-y-6">
					<div class="flex gap-6 items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
						<div class="p-4 bg-emerald-500/20 text-emerald-400 rounded-xl"><WifiOff class="size-10" /></div>
						<div>
							<h3 class="text-2xl font-bold mb-2">Offline-First Resilience</h3>
							<p class="text-slate-300 text-lg">A Progressive Web App that runs 100% offline for rural CHEW outreach via local IndexedDB, auto-syncing when cellular data is restored.</p>
						</div>
					</div>

					<div class="flex gap-6 items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
						<div class="p-4 bg-cyan-500/20 text-cyan-400 rounded-xl"><FileSignature class="size-10" /></div>
						<div>
							<h3 class="text-2xl font-bold mb-2">Dr. Assist (AI Auto-Scribe)</h3>
							<p class="text-slate-300 text-lg">Doctors type shorthand keywords (e.g., "fever 3 days"). The AI expands it into a fully formatted SOAP note and WHO-aligned differential diagnosis.</p>
						</div>
					</div>

					<div class="flex gap-6 items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
						<div class="p-4 bg-rose-500/20 text-rose-400 rounded-xl"><ShieldCheck class="size-10" /></div>
						<div>
							<h3 class="text-2xl font-bold mb-2">RxBrain (AI Safety Checker)</h3>
							<p class="text-slate-300 text-lg">Prevents fatal drug interactions by cross-referencing prescriptions against the patient's age and pregnancy status before dispensing.</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if currentSlide === 3}
			<!-- SLIDE 4: EPIDEMIOLOGY -->
			<div in:fly={{ x: 100, duration: 500, delay: 200 }} out:fade={{ duration: 200 }} class="w-full max-w-6xl absolute">
				<h2 class="text-5xl font-bold mb-16 text-center">From Local Care to National Surveillance</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div class="bg-slate-900 border border-slate-800 p-10 rounded-3xl flex flex-col justify-center">
						<Radar class="size-16 text-indigo-400 mb-6" />
						<h3 class="text-3xl font-bold mb-4">AI Outbreak Radar</h3>
						<p class="text-slate-300 text-xl leading-relaxed">
							Scans digitized chief complaints across all PHCs in real-time to detect disease clusters (e.g., Cholera) weeks before manual paper reports would catch them.
						</p>
					</div>

					<div class="bg-slate-900 border border-slate-800 p-10 rounded-3xl flex flex-col justify-center">
						<Database class="size-16 text-emerald-400 mb-6" />
						<h3 class="text-3xl font-bold mb-4">One-Click DHIS2 Bridge</h3>
						<p class="text-slate-300 text-xl leading-relaxed">
							Aggregates local clinic data into a deterministic JSON payload. Fully compliant with the FMOH's mandate for Sex and Age Disaggregation. Zero AI hallucinations in national records.
						</p>
					</div>
				</div>
			</div>
		{/if}

		{#if currentSlide === 4}
			<!-- SLIDE 5: IMPACT -->
			<div in:fly={{ scale: 0.95, duration: 500, delay: 200 }} out:fade={{ duration: 200 }} class="text-center max-w-4xl absolute">
				<div class="flex justify-center mb-10">
					<div class="p-6 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-2xl shadow-indigo-500/30">
						<Activity class="size-20 text-white" />
					</div>
				</div>
				<h2 class="text-6xl font-extrabold mb-8">Empowering the Frontline</h2>
				<p class="text-2xl text-slate-300 font-light leading-relaxed mb-16">
					We aren't just digitizing records.<br> 
					We are distributing medical expertise to the communities that need it most, giving every rural clinic a senior consultant in their pocket.
				</p>
				<p class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
					Thank You. Questions?
				</p>
			</div>
		{/if}

	</div>

	<!-- Controls -->
	<div class="absolute bottom-8 left-0 right-0 flex justify-between items-center px-12 opacity-50 hover:opacity-100 transition-opacity">
		<button onclick={prevSlide} disabled={currentSlide === 0} class="p-3 rounded-full hover:bg-slate-800 disabled:opacity-30 transition-colors border border-transparent hover:border-slate-700">
			<ChevronLeft class="size-6" />
		</button>
		<div class="text-sm font-mono text-slate-500">
			Slide {currentSlide + 1} / {totalSlides}
		</div>
		<button onclick={nextSlide} disabled={currentSlide === totalSlides - 1} class="p-3 rounded-full hover:bg-slate-800 disabled:opacity-30 transition-colors border border-transparent hover:border-slate-700">
			<ChevronRight class="size-6" />
		</button>
	</div>
</div>
