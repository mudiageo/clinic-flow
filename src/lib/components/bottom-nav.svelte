<script lang="ts">
  import { page } from '$app/state';
  import type { Component } from 'svelte';
  import { cn } from '$lib/utils';
  import { Badge } from '$lib/components/ui/badge';

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
    return page.url.pathname === href;
  }
</script>

<nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/80 backdrop-blur-lg pb-safe">
  {#each items.slice(0, 5) as item (item.href)}
    {@const active = isActive(item.href)}
    <a
      href={item.href}
      class={cn(
        "relative flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors duration-200",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div class="relative">
        <item.icon
          class={cn("size-5 transition-transform duration-200", active && "scale-110")}
          strokeWidth={active ? 2.5 : 2}
        />
        {#if item.badge && item.badge > 0}
          <Badge
            variant={item.badgeVariant ?? 'default'}
            class="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] tabular-nums"
          >
            {item.badge > 99 ? '99+' : item.badge}
          </Badge>
        {/if}
      </div>
      <span class={cn("text-[10px] font-medium transition-all", active ? "opacity-100" : "opacity-80")}>
        {item.label}
      </span>
      
      {#if active}
        <span class="absolute -top-[1px] left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_0_rgba(var(--primary),0.4)]"></span>
      {/if}
    </a>
  {/each}
</nav>

<style>
  /* Safe area padding for iOS devices with home indicator */
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }
</style>
