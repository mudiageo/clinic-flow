<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import * as Dialog from '#lib/components/ui/dialog/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import {
		Activity,
		AlertTriangle,
		Clock,
		Thermometer,
		ThermometerSnowflake
	} from '@lucide/svelte';
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

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-sky-100 text-sky-600">
				<ThermometerSnowflake class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Cold Chain Tracker</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Monitor vaccine temperatures and sensitive stock
				</p>
			</div>
		</div>
		<div class="flex flex-col items-start md:items-end gap-1.5">
			<Button
				variant="outline"
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
				<p class="flex items-center gap-1 text-xs text-amber-600">
					<AlertTriangle class="size-3" />
					Cold-chain logging is disabled for this facility.
				</p>
			{/if}
		</div>
	</div>

	<!-- Fridge Status -->
	<Card class="overflow-hidden border-sky-100 bg-sky-50/30">
		<CardContent class="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
			<div class="flex items-center gap-6">
				<div class="relative">
					<div
						class="size-20 rounded-full border-4 flex items-center justify-center {isExcursion
							? 'border-red-200 text-red-600'
							: 'border-muted text-muted-foreground'}"
					>
						<span class="text-2xl font-bold">
							{latestLog ? latestLog.temperatureCelsius.toFixed(1) : '—'}
						</span>
					</div>
					<div
						class="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-white shadow-sm text-muted-foreground"
					>
						<Thermometer class="size-5" />
					</div>
				</div>
				<div>
					<h3 class="text-lg font-bold">
						{latestLog?.fridgeLabel ?? 'No fridge unit recorded'}
					</h3>
					{#if latestLog}
						<p class="text-sm text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
							Recorded:
							<span class="font-medium text-foreground">{formatDateTime(latestLog.recordedAt)}</span
							>
							{#if isExcursion}
								<Badge variant="outline" class="text-red-600 border-red-200 bg-red-50 gap-1">
									<AlertTriangle class="size-3" />
									Out of range (2–8 °C)
								</Badge>
							{:else}
								<Badge variant="outline" class="border-muted text-muted-foreground bg-white">
									Within range
								</Badge>
							{/if}
							{#if isStale}
								<Badge variant="outline" class="text-amber-600 border-amber-200 bg-amber-50 gap-1">
									<Clock class="size-3" />
									Stale reading
								</Badge>
							{/if}
						</p>
						{#if isExcursion}
							<p class="text-xs text-red-600 mt-2 flex items-center gap-1">
								<AlertTriangle class="size-3" />
								Advisory only — verify against the physical thermometer; no automatic action is taken.
							</p>
						{/if}
					{:else}
						<p class="text-sm text-muted-foreground flex items-center gap-2 mt-1">
							Status:
							<Badge variant="outline" class="border-muted text-muted-foreground bg-white">
								No temperature logs recorded
							</Badge>
						</p>
					{/if}
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Recent Readings -->
	<Card>
		<CardHeader>
			<CardTitle class="text-base">Recent readings</CardTitle>
			<CardDescription>Latest five staff-recorded temperature readings.</CardDescription>
		</CardHeader>
		<CardContent>
			{#if recentLogs.length === 0}
				<p class="text-sm text-muted-foreground">No temperature logs recorded.</p>
			{:else}
				<ul class="divide-y divide-border">
					{#each recentLogs as log (log.id)}
						<li class="flex items-center justify-between gap-3 py-2.5">
							<div class="min-w-0">
								<p class="text-sm font-medium truncate">{log.fridgeLabel}</p>
								<p class="text-xs text-muted-foreground">{formatDateTime(log.recordedAt)}</p>
							</div>
							<div class="flex items-center gap-2 shrink-0">
								<span
									class="text-sm font-bold {log.temperatureCelsius < 2 || log.temperatureCelsius > 8
										? 'text-red-600'
										: ''}"
								>
									{log.temperatureCelsius.toFixed(1)} °C
								</span>
								{#if log.temperatureCelsius < 2 || log.temperatureCelsius > 8}
									<Badge variant="outline" class="text-red-600 border-red-200 bg-red-50">
										Out of range
									</Badge>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</CardContent>
	</Card>

	<!-- Vaccine Inventory -->
	<div class="space-y-4">
		<h2 class="text-lg font-bold tracking-tight">Sensitive Stock</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#if vaccineStock.length === 0}
				<Card class="md:col-span-2 lg:col-span-4">
					<CardContent class="p-8 text-center text-muted-foreground">
						No vaccine stock recorded in pharmacy inventory.
					</CardContent>
				</Card>
			{/if}

			{#each vaccineStock as item (item.id)}
				{@const lowStock = isLowStock(item)}
				<Card class="card-hover {lowStock ? 'border-amber-200 bg-amber-50/30' : ''}">
					<CardContent class="p-5 flex flex-col h-full">
						<div class="flex justify-between items-start mb-4">
							<Badge
								variant="outline"
								class="text-[10px] uppercase font-bold tracking-wider text-sky-600 border-sky-200 bg-sky-50"
							>
								Vaccine
							</Badge>
							{#if lowStock}
								<Badge variant="outline" class="text-amber-600 border-amber-200 bg-amber-50 gap-1">
									<AlertTriangle class="size-3" />
									Low stock
								</Badge>
							{/if}
						</div>

						<h3 class="text-xl font-bold mb-1">{item.itemName}</h3>

						<div class="mt-auto pt-4 space-y-2">
							<div class="flex justify-between items-end gap-2">
								<span class="text-xs text-muted-foreground">Stock</span>
								<span class="font-bold {lowStock ? 'text-red-600' : ''}">
									{item.currentStock}
									{item.unit}
								</span>
							</div>
							<div class="flex justify-between items-end gap-2">
								<span class="text-xs text-muted-foreground">Batch</span>
								<span class="text-sm font-medium truncate">
									{item.batchNumber ?? 'Not recorded'}
								</span>
							</div>
							<div class="flex justify-between items-end gap-2">
								<span class="text-xs text-muted-foreground">Expiry</span>
								<span class="text-sm font-medium flex items-center gap-1.5 flex-wrap justify-end">
									{#if item.expiryDate !== null}
										{formatDate(item.expiryDate)}
										{#if isExpired(item)}
											<Badge variant="outline" class="text-red-600 border-red-200 bg-red-50">
												Expired
											</Badge>
										{/if}
									{:else}
										No expiry recorded
									{/if}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
		<p class="text-xs text-muted-foreground">
			Staff-entered record. Verify against the physical fridge thermometer and vaccine vial before
			clinical use. Out-of-range readings are advisory and require human review.
		</p>
	</div>

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
