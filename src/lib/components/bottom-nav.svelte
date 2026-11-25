<script lang="ts">
	import { page } from '$app/state';
	import type { Component } from 'svelte';
	import { cn } from '#lib/utils.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';

	export type BottomNavItem = {
		href: string;
		label: string;
		icon: Component<any>;
		badge?: number;
		badgeVariant?: 'default' | 'destructive' | 'secondary';
	};

	type Props = {
		items: BottomNavItem[];
	};

	let { items }: Props = $props();

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<!-- Bottom Tab Bar — Dock shell, phone/tablet only -->
<nav
	class="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-border bg-background"
	style="padding-bottom: env(safe-area-inset-bottom);"
	aria-label="Main navigation"
>
	{#each items.slice(0, 5) as item (item.label)}
		{@const active = isActive(item.href)}
		<a
			href={item.href}
			class={cn(
				'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors duration-100',
				active ? 'text-primary' : 'text-muted-foreground'
			)}
			aria-current={active ? 'page' : undefined}
		>
			<!-- Active indicator pill at top -->
			{#if active}
				<span class="absolute top-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-primary"
				></span>
			{/if}

			<!-- Icon with badge -->
			<span class="relative">
				<item.icon
					class={cn('size-5 transition-all duration-100', active && 'scale-110')}
					stroke-width={active ? 2.5 : 1.75}
				/>
				{#if item.badge && item.badge > 0}
					<Badge
						variant={item.badgeVariant ?? 'destructive'}
						class="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold tabular-nums"
					>
						{item.badge > 99 ? '99+' : item.badge}
					</Badge>
				{/if}
			</span>

			<!-- Label -->
			<span
				class={cn(
					'text-[10px] font-medium leading-none transition-opacity',
					active ? 'opacity-100' : 'opacity-70'
				)}
			>
				{item.label}
			</span>
		</a>
	{/each}
</nav>
