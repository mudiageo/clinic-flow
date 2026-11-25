<script lang="ts">
	import { CreditCard, CheckCircle2, AlertCircle, ArrowUpRight } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Alert, AlertTitle, AlertDescription } from '#lib/components/ui/alert/index.ts';
</script>

<svelte:head>
	<title>Billing &amp; Subscriptions — Superadmin</title>
</svelte:head>

<div class="space-y-6 max-w-5xl mx-auto">
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Platform Management
		</p>
		<h1 class="text-2xl font-bold text-foreground tracking-tight">Billing &amp; Subscriptions</h1>
		<p class="text-muted-foreground text-sm mt-0.5">
			Manage subscription tiers, payment statuses, and platform revenue
		</p>
	</div>

	<Alert class="border-triage-amber/50 bg-triage-amber/10 text-foreground">
		<AlertCircle class="size-4 text-amber-700 dark:text-triage-amber" />
		<AlertTitle>Demo data</AlertTitle>
		<AlertDescription>
			Billing and subscriptions are not connected. Figures below are illustrative only.
		</AlertDescription>
	</Alert>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="md:col-span-2">
			<section class="rounded-xl border border-border bg-card overflow-hidden">
				<div
					class="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between"
				>
					<div>
						<h2 class="text-base font-semibold flex items-center gap-2">
							Subscription Status by PHC
							<Badge variant="secondary" class="font-mono text-[10px]">Demo</Badge>
						</h2>
						<p class="text-xs text-muted-foreground">
							Overview of active, trial, and suspended accounts
						</p>
					</div>
				</div>
				<div class="divide-y divide-border">
					<div class="flex items-center justify-between p-4">
						<div>
							<div class="flex items-center gap-2">
								<p class="font-semibold text-sm">Ugbowo Main Clinic</p>
								<Badge
									variant="outline"
									class="text-triage-green border-triage-green/30 bg-triage-green/10"
								>
									Active
								</Badge>
							</div>
							<p class="text-xs font-mono text-muted-foreground mt-1">Pro Tier · ₦50,000/mo</p>
						</div>
						<div class="text-right">
							<p class="text-xs font-medium text-muted-foreground">Next Billing</p>
							<p class="text-xs font-mono font-semibold">Nov 15, 2023</p>
						</div>
					</div>

					<div class="flex items-center justify-between p-4">
						<div>
							<div class="flex items-center gap-2">
								<p class="font-semibold text-sm">Oredo Community Health Center</p>
								<Badge
									variant="outline"
									class="text-amber-700 dark:text-triage-amber border-triage-amber/40 bg-triage-amber/12"
								>
									Trial Ends Soon
								</Badge>
							</div>
							<p class="text-xs font-mono text-muted-foreground mt-1">Free Tier (3 days left)</p>
						</div>
						<div class="text-right">
							<p class="text-xs font-medium text-muted-foreground">Action Required</p>
							<Button
								variant="link"
								class="p-0 h-auto text-xs text-primary"
								disabled
								title="Not implemented (demo)"
							>
								Send Reminder
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between p-4 opacity-65">
						<div>
							<div class="flex items-center gap-2">
								<p class="font-semibold text-sm">Egor Rural Clinic</p>
								<Badge variant="destructive">Suspended</Badge>
							</div>
							<p class="text-xs font-mono text-muted-foreground mt-1">Payment Overdue</p>
						</div>
						<div class="text-right">
							<p class="text-xs font-medium text-muted-foreground">Missed: Oct 1, 2023</p>
							<p class="text-xs font-mono text-muted-foreground">—</p>
						</div>
					</div>
				</div>
			</section>
		</div>

		<div class="space-y-5">
			<section class="rounded-xl border border-border bg-card p-5 space-y-2">
				<div class="flex items-center justify-between">
					<span
						class="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
					>
						<CreditCard class="size-3.5" />
						Monthly Revenue
					</span>
					<Badge variant="secondary" class="font-mono text-[10px]">Demo</Badge>
				</div>
				<div class="text-3xl font-bold font-mono tabular-nums tracking-tight">₦450,000</div>
				<div class="flex items-center gap-1 text-xs font-medium text-triage-green">
					<ArrowUpRight class="size-3.5" />
					<span>12.5% from last month</span>
				</div>
			</section>

			<section class="rounded-xl border border-border bg-card p-5 space-y-3">
				<h2 class="text-sm font-semibold">Quick Actions</h2>
				<div class="space-y-2">
					<Button
						variant="outline"
						class="w-full justify-start min-h-10 text-xs"
						disabled
						title="Not implemented (demo)"
					>
						<CheckCircle2 class="size-4 mr-2 text-triage-green" />
						Approve Offline Payment
					</Button>
					<Button
						variant="outline"
						class="w-full justify-start min-h-10 text-xs"
						disabled
						title="Not implemented (demo)"
					>
						<AlertCircle class="size-4 mr-2 text-triage-amber" />
						Generate Invoices
					</Button>
				</div>
			</section>
		</div>
	</div>
</div>
