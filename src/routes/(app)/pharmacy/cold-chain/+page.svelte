<script lang="ts">
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Activity, AlertTriangle, Clock, Thermometer } from '@lucide/svelte';
	import { pharmacyStore } from '#lib/state/pharmacy.svelte.ts';
	import { temperatureLogsStore } from '#lib/state/temperature-logs.svelte.ts';
	import { sessionStore } from '#lib/state/session.svelte.ts';
	import { settingsStore } from '#lib/state/settings.svelte.ts';
	import { formatDate, formatDateTime } from '#lib/utils/date.ts';
	import { toast } from 'svelte-sonner';

	let dialogOpen = $state(false);
	let fridgeLabel = $state('');
	let temperatureInput = $state<number | undefined>(undefined);
	let recordedAtInput = $state(toLocalDatetimeInput(new Date()));
	let notes = $state('');
	let saving = $state(false);

	const vaccineStock = $derived(
		pharmacyStore.items.filter((item) => item.category?.toLowerCase() === 'vaccine')
	);

	const coldChainEnabled = $derived(settingsStore.current.coldChainEnabled);
	const canManageColdChain = $derived(sessionStore.can('manage:cold_chain'));

	const latestLog = $derived(temperatureLogsStore.latest());
	const recentLogs = $derived(
		temperatureLogsStore.items
			.slice()
			.sort((a, b) => b.recordedAt - a.recordedAt)
			.slice(0, 5)
	);
	const isExcursion = $derived(
		latestLog !== undefined &&
			(latestLog.temperatureCelsius < 2 || latestLog.temperatureCelsius > 8)
	);
	const isStale = $derived(
		latestLog !== undefined && Date.now() - latestLog.recordedAt > 24 * 60 * 60 * 1000
	);

	function toLocalDatetimeInput(date: Date): string {
		const pad = (value: number) => String(value).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	function isLowStock(item: (typeof vaccineStock)[number]): boolean {
		return item.currentStock <= item.lowStockThreshold || item.isCritical;
	}

	function isExpired(item: (typeof vaccineStock)[number]): boolean {
		return item.expiryDate !== null && item.expiryDate < Date.now();
	}

	function openDialog() {
		fridgeLabel = '';
		temperatureInput = undefined;
		recordedAtInput = toLocalDatetimeInput(new Date());
		notes = '';
		dialogOpen = true;
	}

	async function saveTemperatureLog() {
		const trimmedLabel = fridgeLabel.trim();
		const recordedAt = new Date(recordedAtInput).getTime();

		if (!trimmedLabel) {
			toast.error('Enter the fridge or unit label.');
			return;
		}
		if (temperatureInput === undefined || !Number.isFinite(temperatureInput)) {
			toast.error('Enter a valid temperature in degrees Celsius.');
			return;
		}
		if (!Number.isFinite(recordedAt)) {
			toast.error('Enter a valid recorded-at date and time.');
			return;
		}

		saving = true;
		try {
			await temperatureLogsStore.log({
				fridgeLabel: trimmedLabel,
				temperatureCelsius: temperatureInput,
				recordedAt,
				notes: notes.trim() || undefined
			});
			toast.success('Temperature logged');
			dialogOpen = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to log temperature.');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Cold Chain — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto">
	<div
		class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Vaccine Storage
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Cold Chain Tracker</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Monitor vaccine fridge temperatures (2–8 °C) and sensitive stock
			</p>
		</div>
		<div class="flex flex-col items-start md:items-end gap-1.5">
			<Button
				class="min-h-11 px-5 font-semibold"
				onclick={openDialog}
				disabled={coldChainEnabled === false || !canManageColdChain}
				title={coldChainEnabled === false
					? 'Cold-chain logging is disabled for this facility'
					: !canManageColdChain
						? 'You do not have permission to log cold-chain temperatures'
						: undefined}
			>
				<Activity class="size-4 mr-2" />
				Log Temperature
			</Button>
			{#if coldChainEnabled === false}
				<p class="flex items-center gap-1 text-xs text-amber-700 dark:text-triage-amber">
					<AlertTriangle class="size-3" />
					Cold-chain logging is disabled for this facility.
				</p>
			{/if}
		</div>
	</div>

	<!-- Fridge Status -->
	<section
		class="rounded-xl border border-border border-l-4 bg-card p-5 sm:p-6 {isExcursion
			? 'border-l-triage-red bg-triage-red/5'
			: 'border-l-primary'}"
	>
		<div class="flex flex-col sm:flex-row sm:items-center gap-5">
			<div class="relative shrink-0">
				<div
					class="size-20 rounded-xl border-2 flex flex-col items-center justify-center bg-background {isExcursion
						? 'border-triage-red text-triage-red'
						: 'border-primary/40 text-foreground'}"
				>
					<span class="text-2xl font-bold font-mono tabular-nums">
						{latestLog ? latestLog.temperatureCelsius.toFixed(1) : '—'}
					</span>
					<span class="text-[10px] font-mono text-muted-foreground">°C</span>
				</div>
				<div
					class="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-card border border-border text-muted-foreground"
				>
					<Thermometer class="size-4" />
				</div>
			</div>

			<div class="flex-1 min-w-0">
				<h2 class="text-lg font-bold text-foreground">
					{latestLog?.fridgeLabel ?? 'No fridge unit recorded'}
				</h2>
				{#if latestLog}
					<p class="text-xs text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
						<span>Recorded:</span>
						<span class="font-mono font-medium text-foreground"
							>{formatDateTime(latestLog.recordedAt)}</span
						>
						{#if isExcursion}
							<Badge variant="destructive" class="gap-1">
								<AlertTriangle class="size-3" />
								Out of range (2–8 °C)
							</Badge>
						{:else}
							<Badge
								variant="secondary"
								class="bg-triage-green/15 text-triage-green border-triage-green/30"
							>
								Within range
							</Badge>
						{/if}
						{#if isStale}
							<Badge
								variant="outline"
								class="text-amber-700 dark:text-triage-amber border-triage-amber/40 gap-1"
							>
								<Clock class="size-3" />
								Stale reading
							</Badge>
						{/if}
					</p>
					{#if isExcursion}
						<p class="text-xs text-triage-red mt-2 flex items-center gap-1">
							<AlertTriangle class="size-3 shrink-0" />
							Advisory only — verify against the physical thermometer; no automatic action is taken.
						</p>
					{/if}
				{:else}
					<p class="text-xs text-muted-foreground mt-1">No temperature logs recorded yet.</p>
				{/if}
			</div>
		</div>
	</section>

	<!-- Recent Readings -->
	<section class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="px-5 py-3.5 border-b border-border bg-muted/20">
			<h2 class="text-base font-semibold text-foreground">Recent Readings</h2>
			<p class="text-xs text-muted-foreground">Latest five staff-recorded temperature readings</p>
		</div>
		<div class="p-5">
			{#if recentLogs.length === 0}
				<p class="text-sm text-muted-foreground">No temperature logs recorded.</p>
			{:else}
				<ul class="divide-y divide-border">
					{#each recentLogs as log (log.id)}
						<li class="flex items-center justify-between gap-3 py-2.5">
							<div class="min-w-0">
								<p class="text-sm font-medium truncate">{log.fridgeLabel}</p>
								<p class="text-xs font-mono text-muted-foreground">
									{formatDateTime(log.recordedAt)}
								</p>
							</div>
							<div class="flex items-center gap-2 shrink-0">
								<span
									class="text-sm font-bold font-mono tabular-nums {log.temperatureCelsius < 2 ||
									log.temperatureCelsius > 8
										? 'text-triage-red'
										: ''}"
								>
									{log.temperatureCelsius.toFixed(1)} °C
								</span>
								{#if log.temperatureCelsius < 2 || log.temperatureCelsius > 8}
									<Badge variant="destructive">Out of range</Badge>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>

	<!-- Vaccine Inventory -->
	<section class="space-y-3">
		<div class="flex items-center gap-2">
			<h2 class="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold">
				Sensitive Stock
			</h2>
			<div class="h-px flex-1 bg-border"></div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
			{#if vaccineStock.length === 0}
				<div
					class="md:col-span-2 lg:col-span-4 p-8 text-center text-muted-foreground rounded-xl border border-dashed border-border bg-card/50"
				>
					No vaccine stock recorded in pharmacy inventory.
				</div>
			{/if}

			{#each vaccineStock as item (item.id)}
				{@const lowStock = isLowStock(item)}
				<article
					class="rounded-xl border border-border bg-card p-4 flex flex-col {lowStock
						? 'border-l-4 border-l-triage-amber'
						: ''}"
				>
					<div class="flex justify-between items-start mb-3 gap-2">
						<Badge variant="secondary" class="text-[10px] font-mono uppercase">Vaccine</Badge>
						{#if lowStock}
							<Badge
								variant="outline"
								class="text-amber-700 dark:text-triage-amber border-triage-amber/40 gap-1"
							>
								<AlertTriangle class="size-3" />
								Low stock
							</Badge>
						{/if}
					</div>

					<h3 class="text-base font-bold mb-3">{item.itemName}</h3>

					<div class="mt-auto pt-3 border-t border-dashed border-border space-y-1.5 text-xs">
						<div class="flex justify-between items-center gap-2">
							<span class="text-muted-foreground">Stock</span>
							<span class="font-mono font-bold tabular-nums {lowStock ? 'text-triage-red' : ''}">
								{item.currentStock}
								{item.unit}
							</span>
						</div>
						<div class="flex justify-between items-center gap-2">
							<span class="text-muted-foreground">Batch</span>
							<span class="font-mono truncate">{item.batchNumber ?? 'Not recorded'}</span>
						</div>
						<div class="flex justify-between items-center gap-2">
							<span class="text-muted-foreground">Expiry</span>
							<span class="font-mono flex items-center gap-1.5 flex-wrap justify-end">
								{#if item.expiryDate !== null}
									{formatDate(item.expiryDate)}
									{#if isExpired(item)}
										<Badge variant="destructive" class="text-[10px]">Expired</Badge>
									{/if}
								{:else}
									Not recorded
								{/if}
							</span>
						</div>
					</div>
				</article>
			{/each}
		</div>
		<p class="text-xs text-muted-foreground">
			Staff-entered record. Verify against the physical fridge thermometer and vaccine vial before
			clinical use. Out-of-range readings are advisory and require human review.
		</p>
	</section>

	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>Log temperature</Dialog.Title>
				<Dialog.Description>
					Record a manual fridge reading. The entry is saved locally first and synchronized when a
					connection is available. Out-of-range readings are advisory only.
				</Dialog.Description>
			</Dialog.Header>

			<div class="grid gap-4 py-4">
				<div class="space-y-2">
					<Label for="cold-chain-fridge-label">Fridge / unit label</Label>
					<Input
						id="cold-chain-fridge-label"
						bind:value={fridgeLabel}
						maxlength={80}
						placeholder="e.g. Main vaccine fridge"
					/>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="cold-chain-temperature">Temperature (°C)</Label>
						<Input
							id="cold-chain-temperature"
							type="number"
							step="0.1"
							min="-50"
							max="100"
							required
							bind:value={temperatureInput}
							placeholder="e.g. 4.5"
						/>
					</div>
					<div class="space-y-2">
						<Label for="cold-chain-recorded-at">Recorded at</Label>
						<Input id="cold-chain-recorded-at" type="datetime-local" bind:value={recordedAtInput} />
					</div>
				</div>
				<div class="space-y-2">
					<Label for="cold-chain-notes">Notes (optional)</Label>
					<Input
						id="cold-chain-notes"
						bind:value={notes}
						maxlength={500}
						placeholder="Optional non-identifying notes"
					/>
				</div>
			</div>

			<Dialog.Footer>
				<Button variant="outline" onclick={() => (dialogOpen = false)} disabled={saving}>
					Cancel
				</Button>
				<Button onclick={saveTemperatureLog} disabled={saving}>
					{saving ? 'Saving...' : 'Save reading'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
