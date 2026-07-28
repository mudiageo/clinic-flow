<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
	import { CreditCard, CheckCircle2, AlertCircle, ArrowUpRight } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
</script>

<svelte:head>
	<title>Billing & Subscriptions — Superadmin</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-5xl mx-auto py-8">
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<CreditCard class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Billing & Subscriptions</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Manage subscription tiers, payment statuses, and platform revenue.
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="md:col-span-2 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Subscription Status by PHC</CardTitle>
					<CardDescription>Overview of active, trial, and suspended accounts.</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						<div class="flex items-center justify-between p-4 rounded-lg border bg-card">
							<div>
								<div class="flex items-center gap-2">
									<p class="font-medium">Ugbowo Main Clinic</p>
									<Badge variant="outline" class="text-green-600 border-green-200 bg-green-50">Active</Badge>
								</div>
								<p class="text-sm text-muted-foreground mt-1">Pro Tier • ₦50,000/mo</p>
							</div>
							<div class="text-right">
								<p class="text-sm font-medium">Next Billing</p>
								<p class="text-sm text-muted-foreground">Nov 15, 2023</p>
							</div>
						</div>

						<div class="flex items-center justify-between p-4 rounded-lg border bg-card">
							<div>
								<div class="flex items-center gap-2">
									<p class="font-medium">Oredo Community Health Center</p>
									<Badge variant="outline" class="text-orange-600 border-orange-200 bg-orange-50">Trial Ends Soon</Badge>
								</div>
								<p class="text-sm text-muted-foreground mt-1">Free Tier (3 days left)</p>
							</div>
							<div class="text-right">
								<p class="text-sm font-medium">Action Required</p>
								<Button variant="link" class="p-0 h-auto text-primary">Send Reminder</Button>
							</div>
						</div>

						<div class="flex items-center justify-between p-4 rounded-lg border bg-card opacity-60">
							<div>
								<div class="flex items-center gap-2">
									<p class="font-medium">Egor Rural Clinic</p>
									<Badge variant="destructive">Suspended</Badge>
								</div>
								<p class="text-sm text-muted-foreground mt-1">Payment Overdue</p>
							</div>
							<div class="text-right">
								<p class="text-sm font-medium">Missed: Oct 1, 2023</p>
								<p class="text-sm text-muted-foreground">—</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<div class="space-y-6">
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="text-base flex items-center gap-2">
						<CreditCard class="size-4 text-muted-foreground" />
						Monthly Revenue
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-3xl font-bold tracking-tight">₦450,000</div>
					<div class="flex items-center gap-1 text-sm text-green-600 mt-1">
						<ArrowUpRight class="size-4" />
						<span>12.5% from last month</span>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="text-base">Quick Actions</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2">
					<Button variant="outline" class="w-full justify-start">
						<CheckCircle2 class="size-4 mr-2 text-green-600" />
						Approve Offline Payment
					</Button>
					<Button variant="outline" class="w-full justify-start">
						<AlertCircle class="size-4 mr-2 text-orange-600" />
						Generate Invoices
					</Button>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
