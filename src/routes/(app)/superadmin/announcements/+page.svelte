<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
	import { Megaphone, Send, Users } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';

	let subject = $state('');
	let message = $state('');
	let target = $state('all');
	let isSending = $state(false);

	async function handleSend(e: Event) {
		e.preventDefault();
		if (!subject || !message) {
			toast.error('Please fill in both subject and message.');
			return;
		}

		isSending = true;
		// Mock sending
		setTimeout(() => {
			toast.success('Announcement broadcasted successfully!');
			subject = '';
			message = '';
			isSending = false;
		}, 1500);
	}
</script>

<svelte:head>
	<title>Announcements — Superadmin</title>
</svelte:head>

<div class="space-y-6 animate-fade-in max-w-4xl mx-auto py-8">
	<div class="flex items-start gap-3">
		<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
			<Megaphone class="size-6" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">System Announcements</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Broadcast critical information to clinic administrators or all staff.
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="md:col-span-2">
			<Card>
				<form onsubmit={handleSend}>
					<CardHeader>
						<CardTitle>Compose Broadcast</CardTitle>
						<CardDescription>This message will appear in the target users' in-app notification center and via email.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<Label for="target">Target Audience</Label>
							<Select.Root type="single" bind:value={target}>
								<Select.Trigger class="w-full">
									{target === 'all' ? 'All Staff (Platform Wide)' : target === 'admins' ? 'All Clinic Admins' : 'Specific PHC'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="all">All Staff (Platform Wide)</Select.Item>
									<Select.Item value="admins">All Clinic Admins</Select.Item>
									<Select.Item value="specific" disabled>Specific PHC (Coming Soon)</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>

						<div class="space-y-2">
							<Label for="subject">Subject</Label>
							<Input id="subject" bind:value={subject} placeholder="e.g. Scheduled Maintenance Notice" />
						</div>

						<div class="space-y-2">
							<Label for="message">Message Body</Label>
							<Textarea 
								id="message" 
								bind:value={message} 
								placeholder="Enter your announcement here. Markdown is supported." 
								class="min-h-[200px]"
							/>
						</div>
					</CardContent>
					<CardFooter class="flex justify-end bg-muted/30 border-t p-4">
						<Button type="submit" disabled={isSending}>
							{#if isSending}
								Sending...
							{:else}
								<Send class="size-4 mr-2" />
								Broadcast Now
							{/if}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>

		<div class="space-y-6">
			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="text-base flex items-center gap-2">
						<Users class="size-4 text-muted-foreground" />
						Reach Estimate
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-3xl font-bold tracking-tight">
						{target === 'all' ? '1,245' : target === 'admins' ? '42' : '0'}
					</div>
					<p class="text-sm text-muted-foreground mt-1">Users will receive this broadcast.</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-3">
					<CardTitle class="text-base">Recent Broadcasts</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div>
						<p class="text-sm font-medium">System Update v1.2</p>
						<div class="flex justify-between items-center mt-1">
							<span class="text-xs text-muted-foreground">To: All Staff</span>
							<span class="text-xs text-muted-foreground">Oct 24, 2023</span>
						</div>
					</div>
					<div class="border-t pt-3">
						<p class="text-sm font-medium">New Triage Rules Policy</p>
						<div class="flex justify-between items-center mt-1">
							<span class="text-xs text-muted-foreground">To: All Admins</span>
							<span class="text-xs text-muted-foreground">Oct 10, 2023</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
