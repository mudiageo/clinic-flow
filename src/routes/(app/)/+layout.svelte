<script lang="ts">
	import { getCurrentSession, signOutAction } from '$lib/remote/auth.remote';
	import SyncIndicator from '$lib/components/SyncIndicator.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let { children } = $props();
</script>

{#await getCurrentSession()}
	<div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
		<div class="w-full max-w-sm space-y-4">
			<Skeleton class="h-12 w-12 rounded-2xl bg-slate-900" />
			<Skeleton class="h-6 w-1/2 bg-slate-900" />
			<Skeleton class="h-4 w-3/4 bg-slate-900" />
			<div class="space-y-2 pt-8">
				<Skeleton class="h-10 w-full bg-slate-900" />
				<Skeleton class="h-10 w-full bg-slate-900" />
				<Skeleton class="h-10 w-full bg-slate-900" />
			</div>
		</div>
	</div>
{:then sessionData}
	{#if !sessionData.user}
		<!-- If not authenticated, redirect script -->
		<meta http-equiv="refresh" content="0;url=/login" />
	{:else}
		{@const user = sessionData.user}
		{@const role = sessionData.role}
		<div class="min-h-screen bg-slate-950 text-slate-100 flex">
			<!-- Sidebar -->
			<aside
				class="w-64 border-r border-slate-900 bg-slate-900/30 flex flex-col hidden md:flex shrink-0"
			>
				<!-- Logo Header -->
				<div class="h-16 px-6 flex items-center gap-3">
					<div
						class="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20"
					>
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
							/>
						</svg>
					</div>
					<span class="font-bold text-white text-lg tracking-tight">ClinicFlow</span>
				</div>

				<Separator class="bg-slate-900" />

				<!-- Navigation -->
				<nav class="flex-1 px-4 py-6 space-y-1.5">
					<!-- Nurse Station Links -->
					{#if role === 'nurse' || role === 'admin'}
						<div class="space-y-1">
							<p class="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
								Nurse Station
							</p>
							<a
								href="/nurse"
								class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition"
							>
								📋 Queue Board
							</a>
							<a
								href="/nurse/register"
								class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition"
							>
								👤 Register Patient
							</a>
							<a
								href="/nurse/vitals"
								class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition"
							>
								🌡️ Vitals & Triage
							</a>
						</div>
					{/if}

					<!-- Doctor Desk Links -->
					{#if role === 'doctor' || role === 'admin'}
						<div class="space-y-1 pt-4">
							<p class="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
								Doctor Desk
							</p>
							<a
								href="/doctor"
								class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition"
							>
								🩺 Consultation Queue
							</a>
						</div>
					{/if}

					<!-- Admin Dashboard Links -->
					{#if role === 'admin'}
						<div class="space-y-1 pt-4">
							<p class="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
								Administrator
							</p>
							<a
								href="/admin"
								class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition"
							>
								📊 Operations Stats
							</a>
							<a
								href="/admin/patients"
								class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white transition"
							>
								🗂️ Patients Registry
							</a>
						</div>
					{/if}
				</nav>

				<!-- Sidebar Footer -->
				<div class="p-4 border-t border-slate-900 space-y-4">
					<div class="flex items-center gap-3">
						<Avatar class="w-10 h-10 border border-slate-800 bg-slate-900">
							<AvatarFallback class="text-teal-400 bg-teal-500/10 font-bold uppercase">
								{user.name.slice(0, 2)}
							</AvatarFallback>
						</Avatar>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-semibold text-white truncate">{user.name}</p>
							<p class="text-xs text-slate-500 capitalize">{role}</p>
						</div>
					</div>

					<SyncIndicator />

					<form {...signOutAction}>
						<Button
							type="submit"
							variant="ghost"
							class="w-full text-left text-slate-400 hover:text-white hover:bg-slate-900/50 justify-start"
						>
							🚪 Log Out
						</Button>
					</form>
				</div>
			</aside>

			<!-- Main Section -->
			<div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
				<!-- Header for mobile -->
				<header
					class="h-16 border-b border-slate-900 flex items-center justify-between px-6 md:justify-end shrink-0 bg-slate-950/80 backdrop-blur"
				>
					<div class="flex items-center gap-3 md:hidden">
						<span class="font-bold text-white tracking-tight">ClinicFlow</span>
					</div>
					<div class="flex items-center gap-4">
						<div class="md:hidden">
							<SyncIndicator />
						</div>
					</div>
				</header>

				<main class="flex-1 p-6 md:p-10">
					{@render children()}
				</main>
			</div>
		</div>
	{/if}
{/await}
