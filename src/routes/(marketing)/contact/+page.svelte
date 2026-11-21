<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { Textarea } from '#lib/components/ui/textarea';
	import { Label } from '#lib/components/ui/label';
	import { submitInquiry } from '#lib/remote/contact.remote';
	import {
		Mail,
		MapPin,
		Send,
		CheckCircle2,
		MessageSquare,
		Building2,
		Phone
	} from '@lucide/svelte';

	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let organization = $state('');
	let state = $state('Edo State');
	let inquiryType = $state<
		'pilot_application' | 'state_procurement' | 'ngo_partnership' | 'general'
	>('general');
	let message = $state('');
	let isSubmitting = $state(false);
	let submitted = $state(false);
	let errorMessage = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		isSubmitting = true;
		errorMessage = '';

		try {
			const res = await submitInquiry({
				name,
				email,
				phone,
				organization,
				state,
				inquiryType,
				message
			});
			if (res.success) {
				submitted = true;
			}
		} catch (err: any) {
			errorMessage = err?.message || 'Failed to submit inquiry. Please check your inputs.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Contact Us & Partnerships | ClinicFlow</title>
	<meta
		name="description"
		content="Get in touch with Mudiageo Technologies regarding ClinicFlow pilots, state agency contracts, or technical partnerships."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-16 space-y-12">
	<!-- Top Intro -->
	<div class="max-w-3xl space-y-3">
		<p class="text-xs font-mono font-semibold tracking-wider text-primary">
			COMMUNICATIONS & PARTNERSHIPS
		</p>
		<h1
			class="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]"
		>
			Let’s talk digital health.
		</h1>
		<p class="text-base text-muted-foreground leading-relaxed">
			Have inquiries about pilot deployments, State Primary Health Care agency agreements, or
			technical integrations? We are ready to assist.
		</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
		<!-- Contact details card -->
		<div class="lg:col-span-5 space-y-5">
			<div class="rounded-lg border border-border bg-card p-6 md:p-7 space-y-5 shadow-sm">
				<h3 class="text-lg font-bold text-foreground">Direct Contact</h3>

				<div class="space-y-5 text-sm">
					<div class="flex items-start gap-3.5">
						<div
							class="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"
						>
							<Mail class="size-5" />
						</div>
						<div>
							<p class="font-bold text-foreground">Email</p>
							<a
								href="mailto:contact@mudiageotech.com"
								class="text-muted-foreground hover:text-primary transition-colors"
							>
								contact@mudiageotech.com
							</a>
						</div>
					</div>

					<div class="flex items-start gap-3.5">
						<div
							class="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"
						>
							<MapPin class="size-5" />
						</div>
						<div>
							<p class="font-bold text-foreground">Headquarters</p>
							<p class="text-muted-foreground leading-relaxed">
								Mudiageo Technologies<br />
								Benin City, Edo State, Nigeria
							</p>
						</div>
					</div>

					<div class="flex items-start gap-3.5">
						<div
							class="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"
						>
							<Building2 class="size-5" />
						</div>
						<div>
							<p class="font-bold text-foreground">Entity Registration</p>
							<p class="text-muted-foreground leading-relaxed">
								CAC Registered Business Name (Oct 2021)
							</p>
						</div>
					</div>
				</div>
			</div>

			<div
				class="rounded-2xl border border-border/80 bg-muted/40 p-6 space-y-2 text-xs text-muted-foreground"
			>
				<p class="font-semibold text-foreground">Looking for software downloads?</p>
				<p>
					You can download the Windows executable and Android APK without submitting this form by
					visiting our <a href="/download" class="text-primary hover:underline">Download page</a>.
				</p>
			</div>
		</div>

		<!-- Form -->
		<div class="lg:col-span-7">
			<div class="rounded-lg border border-border bg-card p-6 md:p-8 shadow-sm">
				{#if submitted}
					<div class="text-center py-12 space-y-4">
						<div
							class="size-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto"
						>
							<CheckCircle2 class="size-10" />
						</div>
						<h3 class="text-2xl font-bold text-foreground">Message Dispatched</h3>
						<p class="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
							Thank you, <strong>{name}</strong>. Your inquiry has been routed to our clinical
							coordination team. We will respond promptly via <strong>{email}</strong>.
						</p>
						<Button
							href="/"
							variant="outline"
							class="rounded-md mt-4 font-semibold text-xs h-9 border-border"
						>
							Back to Homepage
						</Button>
					</div>
				{:else}
					<form onsubmit={handleSubmit} class="space-y-4">
						<div class="space-y-1">
							<h3 class="text-lg font-bold text-foreground">Send a Message</h3>
							<p class="text-xs text-muted-foreground">
								We typically reply within one business day.
							</p>
						</div>

						{#if errorMessage}
							<div
								class="p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20"
							>
								{errorMessage}
							</div>
						{/if}

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<Label for="name">Your Name *</Label>
								<Input id="name" bind:value={name} placeholder="e.g. Favour Ohenhen" required />
							</div>
							<div class="space-y-1.5">
								<Label for="email">Email Address *</Label>
								<Input
									id="email"
									type="email"
									bind:value={email}
									placeholder="favour@example.com"
									required
								/>
							</div>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<Label for="phone">Phone / WhatsApp</Label>
								<Input id="phone" type="tel" bind:value={phone} placeholder="+234..." />
							</div>
							<div class="space-y-1.5">
								<Label for="state">State / Region *</Label>
								<Input id="state" bind:value={state} placeholder="e.g. Edo State" required />
							</div>
						</div>

						<div class="space-y-1.5">
							<Label for="organization">Facility or Organization *</Label>
							<Input
								id="organization"
								bind:value={organization}
								placeholder="e.g. EDSPHCDA / General Hospital"
								required
							/>
						</div>

						<div class="space-y-1.5">
							<Label for="inquiryType">Topic / Inquiry Nature</Label>
							<select
								id="inquiryType"
								bind:value={inquiryType}
								class="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="general">General Inquiry</option>
								<option value="pilot_application">Primary Health Centre Pilot</option>
								<option value="state_procurement">State Government / Agency Procurement</option>
								<option value="ngo_partnership">NGO / International Donor Project</option>
							</select>
						</div>

						<div class="space-y-1.5">
							<Label for="message">Message *</Label>
							<Textarea
								id="message"
								bind:value={message}
								rows={4}
								placeholder="Describe your inquiry, timeline, or clinical requirements..."
								required
							/>
						</div>

						<Button
							type="submit"
							disabled={isSubmitting}
							class="w-full rounded-md h-10 font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
						>
							{#if isSubmitting}
								Sending...
							{:else}
								Transmit Message <Send class="ml-2 size-3.5" />
							{/if}
						</Button>
					</form>
				{/if}
			</div>
		</div>
	</div>
</div>
