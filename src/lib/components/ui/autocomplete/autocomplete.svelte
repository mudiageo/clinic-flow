<script lang="ts" generics="T">
	import { Input } from '#lib/components/ui/input/index.ts';
	import { cn } from '#lib/utils.ts';
	import { Loader2, Search, X } from '@lucide/svelte';
	import { Portal } from 'bits-ui';
	import { fly } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		value = $bindable(''),
		selected = $bindable<T | null>(null),
		options = [],
		loading = false,
		placeholder = 'Search...',
		labelKey,
		class: className,
		onSelect,
		itemSnippet,
		emptySnippet,
		...rest
	}: {
		value: string;
		selected?: T | null;
		options: T[];
		loading?: boolean;
		placeholder?: string;
		labelKey?: keyof T;
		class?: string;
		onSelect?: (item: T) => void;
		itemSnippet: Snippet<[T, boolean]>;
		emptySnippet?: Snippet;
	} & Omit<HTMLInputAttributes, 'value' | 'placeholder' | 'class' | 'type' | 'files'> = $props();

	let isOpen = $state(false);
	let activeIndex = $state(-1);

	let inputContainerRef = $state<HTMLDivElement | null>(null);
	let listRef = $state<HTMLDivElement | null>(null);

	function open() {
		isOpen = true;
		activeIndex = -1;
	}

	function close() {
		isOpen = false;
		activeIndex = -1;
	}

	function handleInput(e: Event) {
		value = (e.target as HTMLInputElement).value;
		if (value.length > 0) open();
		else close();
	}

	function handleSelect(item: T) {
		selected = item;

		if (labelKey && item && typeof item === 'object') {
			value = String(item[labelKey]);
		} else if (typeof item === 'string') {
			value = item;
		}

		if (onSelect) onSelect(item);
		close();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) {
			if (e.key === 'ArrowDown' && value.length > 0) open();
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				activeIndex = (activeIndex + 1) % options.length;
				scrollToActive();
				break;
			case 'ArrowUp':
				e.preventDefault();
				activeIndex = (activeIndex - 1 + options.length) % options.length;
				scrollToActive();
				break;
			case 'Enter':
				e.preventDefault();
				if (activeIndex >= 0 && options[activeIndex]) {
					handleSelect(options[activeIndex]);
				}
				break;
			case 'Escape':
				close();
				break;
		}
	}

	function scrollToActive() {
		if (!listRef) return;
		const activeEl = listRef.children[activeIndex] as HTMLElement;
		if (activeEl) {
			activeEl.scrollIntoView({ block: 'nearest' });
		}
	}

	function clickOutside(node: HTMLElement) {
		const handleClick = (event: MouseEvent) => {
			const target = event.target as Node;
			const clickedDropdown =
				node.contains(target) || (listRef !== null && listRef.contains(target));
			const clickedInput = inputContainerRef !== null && inputContainerRef.contains(target);
			if (!clickedDropdown && !clickedInput) {
				close();
			}
		};
		document.addEventListener('click', handleClick, true);
		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}

	function positionDropdown(node: HTMLDivElement) {
		function update() {
			if (!inputContainerRef) return;

			const rect = inputContainerRef.getBoundingClientRect();
			const spaceBelow = window.innerHeight - rect.bottom;
			const spaceAbove = rect.top;

			node.style.left = `${rect.left}px`;
			node.style.width = `${rect.width}px`;

			// Prefer opening below the input, but flip above when there is not
			// enough room and more space is available there.
			if (spaceBelow < 200 && spaceAbove > spaceBelow) {
				node.style.top = 'auto';
				node.style.bottom = `${window.innerHeight - rect.top + 8}px`;
				node.style.maxHeight = `${Math.min(Math.max(Math.min(300, spaceAbove - 16), 140), 300)}px`;
			} else {
				node.style.top = `${rect.bottom + 8}px`;
				node.style.bottom = 'auto';
				node.style.maxHeight = `${Math.min(Math.max(Math.min(300, spaceBelow - 16), 140), 300)}px`;
			}
		}

		update();
		// Capture phase catches scrolling of nested containers such as the app's
		// `<main class="overflow-y-auto">`, not just the document scroller.
		document.addEventListener('scroll', update, true);
		window.addEventListener('resize', update);

		return {
			destroy() {
				document.removeEventListener('scroll', update, true);
				window.removeEventListener('resize', update);
			}
		};
	}
</script>

<div class={cn('relative w-full group', className)}>
	<div class="relative" bind:this={inputContainerRef}>
		<Input
			type="text"
			{placeholder}
			bind:value
			oninput={handleInput}
			onkeydown={handleKeydown}
			onfocus={() => {
				if (value) open();
			}}
			role="combobox"
			aria-expanded={isOpen}
			aria-autocomplete="list"
			{...rest}
		/>

		{#if loading}
			<Loader2
				class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"
			/>
		{:else if value.length > 0}
			<button
				class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
				onclick={() => {
					value = '';
					selected = null;
					inputContainerRef?.querySelector('input')?.focus();
					close();
				}}
				aria-label="Clear"
			>
				<X class="h-4 w-4" />
			</button>
		{:else}
			<Search
				class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
			/>
		{/if}
	</div>

	{#if isOpen}
		<Portal>
			<div
				use:clickOutside
				use:positionDropdown
				bind:this={listRef}
				class="fixed z-50 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none"
				transition:fly={{ y: -5, duration: 150 }}
			>
				{#if options.length > 0}
					{#each options as option, i (option)}
						<div
							role="option"
							tabindex="-1"
							aria-selected={i === activeIndex}
							class={cn(
								'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
								i === activeIndex
									? 'bg-accent text-accent-foreground'
									: 'hover:bg-accent hover:text-accent-foreground'
							)}
							onclick={() => handleSelect(option)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									handleSelect(option);
								}
							}}
							onmouseenter={() => (activeIndex = i)}
						>
							{@render itemSnippet(option, i === activeIndex)}
						</div>
					{/each}
				{:else if !loading}
					<div class="py-6 text-center text-sm text-muted-foreground">
						{#if emptySnippet}
							{@render emptySnippet()}
						{:else}
							No results found.
						{/if}
					</div>
				{/if}
			</div>
		</Portal>
	{/if}
</div>
