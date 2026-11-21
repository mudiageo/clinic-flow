<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from '#lib/components/ui/dialog/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '#lib/components/ui/select/index.ts';
	import { Alert, AlertDescription } from '#lib/components/ui/alert/index.ts';
	import { Activity, AlertTriangle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { ancVisitsStore } from '#lib/state/anc-visits.svelte.ts';

	interface Props {
		open?: boolean;
		patientId: string;
		pregnancyRecordId: string;
		onComplete?: () => void;
	}

	let { open = $bindable(false), patientId, pregnancyRecordId, onComplete }: Props = $props();

	const VISIT_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];
	const ONE_DAY_MS = 24 * 60 * 60 * 1000;

	// datetime-local inputs are interpreted in the user's local timezone, so build a local value.
	function toDateTimeLocalValue(date: Date): string {
		const pad = (value: number) => String(value).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	let visitNumber = $state<number | ''>('');
	let visitDate = $state(toDateTimeLocalValue(new Date()));
	let systolicBp = $state<number | ''>('');
	let diastolicBp = $state<number | ''>('');
	let weightKg = $state<number | ''>('');
	let fetalHeartRateBpm = $state<number | ''>('');
	let fundalHeightCm = $state<number | ''>('');
	let notes = $state('');
	let isSaving = $state(false);

	function checkRange(value: number | '', label: string, min: number, max: number): string | null {
		if (value === '') return null;
		if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
			return `${label} must be between ${min} and ${max}.`;
		}
		return null;
	}

	function validate(): string | null {
		const timestamp = new Date(visitDate).getTime();
		if (!Number.isFinite(timestamp)) return 'Enter a valid visit date.';
		if (timestamp > Date.now() + ONE_DAY_MS) {
			return 'Visit date cannot be more than one day in the future.';
		}
		if (
			visitNumber !== '' &&
			(!Number.isInteger(visitNumber) || visitNumber < 1 || visitNumber > 8)
		) {
			return 'Visit number must be between 1 and 8.';
		}
		return (
			checkRange(systolicBp, 'Systolic BP', 50, 300) ??
			checkRange(diastolicBp, 'Diastolic BP', 20, 200) ??
			checkRange(weightKg, 'Weight', 1, 400) ??
			checkRange(fetalHeartRateBpm, 'Fetal heart rate', 50, 250) ??
			checkRange(fundalHeightCm, 'Fundal height', 5, 60) ??
			(notes.length > 500 ? 'Notes must be 500 characters or fewer.' : null)
		);
	}

	async function handleSubmit() {
		const error = validate();
		if (error) {
			toast.error(error);
			return;
		}

		isSaving = true;
		try {
			await ancVisitsStore.logVisit({
				patientId,
				pregnancyRecordId,
				visitNumber,
				visitDate: new Date(visitDate).getTime(),
				systolicBp,
				diastolicBp,
				weightKg,
				fetalHeartRateBpm,
				fundalHeightCm,
				notes: notes.trim() ? notes.trim() : null
			});
			toast.success('ANC visit recorded');
			open = false;
			onComplete?.();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to record ANC visit');
		} finally {
			isSaving = false;
		}
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-2xl max-h-[85vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2 text-triage-amber">
				<Activity class="size-5" />
				Log ANC Visit
			</DialogTitle>
			<DialogDescription>
				Record antenatal observations for this pregnancy. All clinical fields are optional.
			</DialogDescription>
		</DialogHeader>

		<Alert
			variant="default"
			class="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
		>
			<AlertTriangle class="size-4 text-amber-600 dark:text-amber-500" />
			<AlertDescription class="text-xs font-medium leading-relaxed">
				Staff-entered record. Verify against the physical ANC register before clinical use.
			</AlertDescription>
		</Alert>

		<div class="space-y-4 py-2">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="anc-visit-number">Visit number (optional)</Label>
					<Select
						type="single"
						value={visitNumber === '' ? undefined : String(visitNumber)}
						onValueChange={(value) => (visitNumber = value ? Number(value) : '')}
					>
						<SelectTrigger class="w-full">
							{visitNumber === '' ? 'Select visit number' : `Visit ${visitNumber}`}
						</SelectTrigger>
						<SelectContent>
							{#each VISIT_NUMBERS as number (number)}
								<SelectItem value={String(number)}>Visit {number}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-2">
					<Label for="anc-visit-date">Visit date &amp; time</Label>
					<Input id="anc-visit-date" type="datetime-local" bind:value={visitDate} />
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="anc-systolic">Systolic BP (mmHg, 50-300)</Label>
					<Input
						id="anc-systolic"
						type="number"
						min="50"
						max="300"
						bind:value={systolicBp}
						placeholder="120"
					/>
				</div>
				<div class="space-y-2">
					<Label for="anc-diastolic">Diastolic BP (mmHg, 20-200)</Label>
					<Input
						id="anc-diastolic"
						type="number"
						min="20"
						max="200"
						bind:value={diastolicBp}
						placeholder="80"
					/>
				</div>
				<div class="space-y-2">
					<Label for="anc-weight">Weight (kg, 1-400)</Label>
					<Input
						id="anc-weight"
						type="number"
						step="0.1"
						min="1"
						max="400"
						bind:value={weightKg}
						placeholder="60"
					/>
				</div>
				<div class="space-y-2">
					<Label for="anc-fhr">Fetal heart rate (bpm, 50-250)</Label>
					<Input
						id="anc-fhr"
						type="number"
						min="50"
						max="250"
						bind:value={fetalHeartRateBpm}
						placeholder="140"
					/>
				</div>
				<div class="space-y-2">
					<Label for="anc-fundal">Fundal height (cm, 5-60)</Label>
					<Input
						id="anc-fundal"
						type="number"
						step="0.1"
						min="5"
						max="60"
						bind:value={fundalHeightCm}
						placeholder="28"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="anc-notes">Notes (optional)</Label>
				<Textarea
					id="anc-notes"
					bind:value={notes}
					maxlength={500}
					rows={3}
					placeholder="Observations, concerns, or follow-up required"
				/>
				<p class="text-xs text-muted-foreground">{notes.length}/500 characters</p>
			</div>
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={() => (open = false)} disabled={isSaving}>Cancel</Button>
			<Button onclick={handleSubmit} disabled={isSaving}>
				{isSaving ? 'Saving...' : 'Record ANC Visit'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
