<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const user = $derived(page.data.user);
	const session = $derived(page.data.session);
</script>

<svelte:head>
	<title>ClinicFlow — PHC Management</title>
	<meta name="description" content="ClinicFlow — offline-first clinic management for primary health centres" />
</svelte:head>

{#if user}
	<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
		<div class="text-center space-y-6">
			<div class="flex items-center justify-center gap-3">
				<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-900/40">
					<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
					</svg>
				</div>
				<h1 class="text-3xl font-bold text-white tracking-tight">ClinicFlow</h1>
			</div>
			<p class="text-slate-400 text-lg">Welcome back, {user.name}</p>
			<div class="flex flex-col gap-3 mt-8">
				<a href="/nurse" class="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors">
					→ Nurse Dashboard
				</a>
				<a href="/doctor" class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
					→ Doctor Dashboard
				</a>
				<a href="/admin" class="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors">
					→ Admin Dashboard
				</a>
			</div>
		</div>
	</div>
{:else}
	<meta http-equiv="refresh" content="0;url=/login" />
{/if}
