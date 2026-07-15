<script lang="ts">
	interface Props {
		data: number[];
		width?: number;
		height?: number;
		color?: string;
	}
	let { data = [], width = 100, height = 24, color = '#2dd4bf' }: Props = $props();

	const min = $derived(Math.min(...data));
	const max = $derived(Math.max(...data));
	const range = $derived(max - min || 1);

	const points = $derived(
		data
			.map((val, i) => {
				const x = (i / (data.length - 1 || 1)) * width;
				// padding 2px top and bottom
				const y = height - 4 - ((val - min) / range) * (height - 4) + 2;
				return `${x},${y}`;
			})
			.join(' ')
	);
</script>

{#if data.length > 1}
	<svg {width} {height} class="overflow-visible mt-1">
		<polyline
			{points}
			fill="none"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		{#each data as val, i}
			{@const x = (i / (data.length - 1 || 1)) * width}
			{@const y = height - 4 - ((val - min) / range) * (height - 4) + 2}
			<circle
				cx={x}
				cy={y}
				r="2.5"
				fill={color}
				class="opacity-50 hover:opacity-100 transition-opacity"
			>
				<title>{val}</title>
			</circle>
		{/each}
	</svg>
{:else if data.length === 1}
	<div class="h-6 mt-1 flex items-center justify-center">
		<span class="text-[10px] text-slate-600 font-medium tracking-wide">NO TREND</span>
	</div>
{:else}
	<div class="h-6 mt-1 flex items-center justify-center">
		<span class="text-[10px] text-slate-600 font-medium tracking-wide">NO DATA</span>
	</div>
{/if}
