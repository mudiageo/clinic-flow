<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { Textarea } from '#lib/components/ui/textarea';
	import { Label } from '#lib/components/ui/label';
	import { submitInquiry } from '#lib/remote/contact.remote';
	import {
		CheckCircle2,
		Building2,
		Stethoscope,
		ShieldCheck,
		Sparkles,
		Send
	} from '@lucide/svelte';

	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let organization = $state('');
	let state = $state('Edo State');
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
				inquiryType: 'pilot_application',
				message: message || 'Requesting a live demonstration and pilot evaluation of ClinicFlow.'
			});
			if (res.success) {
				submitted = true;
			}
		} catch (err: any) {
			errorMessage = err?.message || 'Failed to submit request. Please verify your details.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Request a Demo & Pilot Evaluation | ClinicFlow</title>
	<meta
		name="description"
		content="Experience ClinicFlow in your Primary Health Centre. Request an on-site or virtual demonstration for healthcare administrators."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-16 md:py-24">
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
		<!-- Left info column -->
		<div class="lg:col-span-5 space-y-8">
			<div class="space-y-3">
				<p class="text-xs font-mono font-semibold tracking-wider text-primary">PILOT EVALUATION</p>
				<h1
					class="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight"
				>
					See ClinicFlow in action.
				</h1>
				<p class="text-sm text-muted-foreground leading-relaxed">
					Whether you manage an individual Primary Health Centre or oversee statewide clinical
					services, we provide hands-on walkthroughs and pilot hardware support.
				</p>
			</div>

			<div class="space-y-4 pt-4 border-t border-border/60">
				<div class="flex items-start gap-3">
					<div
						class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5"
					>
						<Stethoscope class="size-4" />
					</div>
					<div>
						<h4 class="font-bold text-sm text-foreground">Tailored to your facility</h4>
						<p class="text-xs text-muted-foreground mt-0.5">
							We demonstrate workflows for your specific clinical roles: CHEWs, nurses, doctors, or
							pharmacy technicians.
						</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div
						class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5"
					>
						<Building2 class="size-4" />
					</div>
					<div>
						<h4 class="font-bold text-sm text-foreground">Hardware & LAN guidance</h4>
						<p class="text-xs text-muted-foreground mt-0.5">
							We help assess existing tablets or recommend solar-inverter and router bundles for
							reliable off-grid uptime.
						</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div
						class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5"
					>
						<ShieldCheck class="size-4" />
					</div>
					<div>
						<h4 class="font-bold text-sm text-foreground">Zero financial obligation</h4>
						<p class="text-xs text-muted-foreground mt-0.5">
							Pilot evaluations and initial clinical staff training are provided at no software
							licensing cost.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Right form card -->
		<div class="lg:col-span-7">
			<div class="rounded-lg border border-border bg-card p-6 md:p-8 shadow-sm">
				{#if submitted}
					<div class="text-center py-12 space-y-4">
						<div
							class="size-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto"
						>
							<CheckCircle2 class="size-10" />
						</div>
						<h3 class="text-2xl font-bold text-foreground">Pilot Request Received</h3>
						<p class="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
							Thank you, <strong>{name}</strong>. Our deployment team has received your details for
							<strong>{organization}</strong> and will reach out via WhatsApp or email within 24 to 48
							hours.
						</p>
						<Button href="/" variant="outline" class="mt-4 rounded-full font-semibold">
							Return to Home
						</Button>
					</div>
				{:else}
					<form onsubmit={handleSubmit} class="space-y-5">
						<div class="space-y-1">
							<h3 class="text-xl font-bold text-foreground">Schedule a Walkthrough</h3>
							<p class="text-xs text-muted-foreground">
								Fill in your facility information and our team will get in touch.
							</p>
						</div>

						{#if errorMessage}
							<div
								class="p-3 text-sm rounded-xl bg-destructive/10 text-destructive border border-destructive/20"
							>
								{errorMessage}
							</div>
						{/if}

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<Label for="name">Your Full Name *</Label>
								<Input id="name" bind:value={name} placeholder="e.g. Dr. Osas Igbinovia" required />
							</div>
							<div class="space-y-1.5">
								<Label for="email">Work Email *</Label>
								<Input
									id="email"
									type="email"
									bind:value={email}
									placeholder="name@facility.org"
									required
								/>
							</div>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<Label for="phone">Phone / WhatsApp Number</Label>
								<Input id="phone" type="tel" bind:value={phone} placeholder="+234 800 000 0000" />
							</div>
							<div class="space-y-1.5">
								<Label for="state">State in Nigeria *</Label>
								<Input id="state" bind:value={state} placeholder="e.g. Edo State" required />
							</div>
						</div>

						<div class="space-y-1.5">
							<Label for="organization">Facility or Organization Name *</Label>
							<Input
								id="organization"
								bind:value={organization}
								placeholder="e.g. Ugbowo Primary Health Centre"
								required
							/>
						</div>

						<div class="space-y-1.5">
							<Label for="message">Specific Requirements / PHC Needs</Label>
							<Textarea
								id="message"
								bind:value={message}
								rows={3}
								placeholder="Tell us about your facility (number of staff, current patient volume, power situation)..."
							/>
						</div>

						<Button
							type="submit"
							disabled={isSubmitting}
							class="w-full rounded-md h-10 font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
						>
							{#if isSubmitting}
								Submitting Request...
							{:else}
								Submit Pilot Application <Send class="ml-2 size-4" />
							{/if}
						</Button>
					</form>
				{/if}
			</div>
		</div>
	</div>
</div>
