<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { syncStore } from '#lib/state/sync.svelte.ts';
	import { outreachStore } from '#lib/state/outreach.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import { OUTREACH_ACTIVITY_LABELS } from '#lib/outreach/types.ts';
	import { formatDate } from '#lib/utils/date.ts';
	import {
		UserPlus,
		Activity,
		Home,
		MapPin,
		WifiOff,
		CloudUpload,
		ShieldAlert
	} from '@lucide/svelte';

	const ACTIONS = [
		{
			label: 'Register Patient',
			icon: UserPlus,
			href: '/nurse/register'
		},
		{
			label: 'Household Visit',
			icon: Home,
			href: '/families'
		},
		{
			label: 'Outreach Log',
			icon: MapPin,
			href: '/field/outreach'
		},
		{
			label: 'Record Vitals',
			icon: Activity,
			href: '/nurse/vitals'
		}
	];

	const recentOutreach = $derived(outreachStore.forPhc(sessionStore.activePhcId).slice(0, 3));
</script>

<svelte:head>
	<title>Field Outreach — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-lg mx-auto pb-20">
	<!-- Header -->
	<div class="flex items-end justify-between gap-3 pb-2 border-b border-border">
		<div>
			<p
				class="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-1"
			>
				<WifiOff class="size-3.5" />
				Offline Ready
			</p>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Field Mode</h1>
		</div>

		<Button
			variant="outline"
			size="sm"
			onclick={() => syncStore.flush()}
			disabled={syncStore.isSyncing || syncStore.pendingCount === 0}
			class="min-h-10 px-3.5 font-mono text-xs {syncStore.pendingCount > 0
				? 'border-triage-amber/60 bg-triage-amber/12 text-foreground'
				: 'text-muted-foreground'}"
		>
			<CloudUpload class="size-4 mr-1.5 {syncStore.isSyncing ? 'animate-bounce' : ''}" />
			Sync ({syncStore.pendingCount})
		</Button>
	</div>

	<!-- Touch-First 2x2 Field Actions -->
	<div class="grid grid-cols-2 gap-3">
		{#each ACTIONS as action (action.href)}
			<a
				href={action.href}
				class="flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border border-border bg-card text-center hover:border-primary/40 hover:bg-primary/5 transition-colors active:scale-97 min-h-28"
			>
				<div class="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
					<action.icon class="size-5" />
				</div>
				<span class="text-sm font-semibold text-foreground leading-tight">{action.label}</span>
			</a>
		{/each}
	</div>

	<!-- Recent Activity (Offline Cache) -->
	<section class="space-y-2.5">
		<div class="flex items-center gap-2">
			<h2
				class="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-widest"
			>
				Recent Activity (Local)
			</h2>
			<div class="h-px flex-1 bg-border"></div>
		</div>

		{#each recentOutreach as record (record.id)}
			<div
				class="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-4"
			>
				<div class="min-w-0">
					<p class="truncate text-sm font-semibold text-foreground">
						{OUTREACH_ACTIVITY_LABELS[record.activityType]}
					</p>
					<p class="mt-0.5 text-xs text-muted-foreground font-mono">
						{record.community} · {formatDate(record.occurredAt)}
					</p>
				</div>
				<Badge variant={record.syncStatus === 'conflict' ? 'destructive' : 'outline'}>
					{record.syncStatus}
				</Badge>
			</div>
		{:else}
			<div
				class="p-6 flex flex-col items-center justify-center text-center text-muted-foreground rounded-xl border border-dashed border-border bg-card/50"
			>
				<Activity class="size-8 opacity-25 mb-2" />
				<p class="text-sm font-medium text-foreground">No outreach activity recorded</p>
				<p class="text-xs mt-1 max-w-[240px]">
					Saved outreach records remain visible here while offline.
				</p>
			</div>
		{/each}
	</section>

	<!-- Safety Protocol -->
	<div
		class="rounded-xl border border-triage-red/30 border-l-4 border-l-triage-red bg-triage-red/8 p-4 flex gap-3"
	>
		<ShieldAlert class="size-5 shrink-0 text-triage-red mt-0.5" />
		<div>
			<h3 class="text-sm font-semibold text-triage-red">Critical Safety Protocol</h3>
			<p class="text-xs mt-1 text-foreground/85 leading-relaxed">
				If you detect any critical red flags in the field (e.g., severe acute malnutrition,
				prolonged fever, signs of Lassa), you MUST initiate an immediate physical referral to the
				PHC. Do not rely solely on offline AI triage for critical cases.
			</p>
		</div>
	</div>
</div>
