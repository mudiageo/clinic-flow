<script module lang="ts">
	import type { Component } from 'svelte';
	
	export type NavItem = {
		href: string;
		label: string;
		icon: Component<any>;
		badge?: number;
	};

	export type NavGroup = {
		label: string;
		items: NavItem[];
	};
</script>

<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import SyncIndicator from '$lib/components/SyncIndicator.svelte';
	import { signOutAction } from '$lib/remote/auth.remote';
	import { HeartPulse, LogOut } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		navGroups: NavGroup[];
		role: string;
		phcName?: string;
		userName: string;
		userInitials: string;
	};

	let { navGroups, role, phcName, userName, userInitials }: Props = $props();
</script>

<Sidebar.Root collapsible="icon">
	<!-- ── Header ── -->
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					<div
						class="flex aspect-square size-8 items-center justify-center rounded-xl bg-primary shadow-sm"
					>
						<HeartPulse class="size-4 text-primary-foreground" />
					</div>
					<div class="grid flex-1 text-left text-sm leading-tight">
						<span class="truncate font-bold tracking-tight">ClinicFlow</span>
						<span class="truncate text-xs text-sidebar-foreground/60 capitalize">
							{phcName ?? role}
						</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Separator />

	<!-- ── Navigation ── -->
	<Sidebar.Content>
		{#each navGroups as group (group.label)}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each group.items as item (item.href)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									isActive={page.url.pathname === item.href}
									tooltipContent={item.label}
								>
									{#snippet child({ props })}
										<a href={item.href} {...props}>
											<item.icon />
											<span>{item.label}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
								{#if item.badge && item.badge > 0}
									<Sidebar.MenuBadge>
										{item.badge > 99 ? '99+' : item.badge}
									</Sidebar.MenuBadge>
								{/if}
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>

	<!-- ── Footer ── -->
	<Sidebar.Separator />
	<Sidebar.Footer>
		<Sidebar.Menu>
			<!-- Sync status — hidden in collapsed icon mode -->
			<Sidebar.MenuItem class="group-data-[collapsible=icon]:hidden">
				<div class="px-2 py-1">
					<SyncIndicator />
				</div>
			</Sidebar.MenuItem>

			<!-- User info -->
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" class="data-[state=open]:bg-sidebar-accent">
					<Avatar class="size-8 shrink-0">
						<AvatarFallback class="bg-primary/10 text-primary text-xs font-bold uppercase">
							{userInitials}
						</AvatarFallback>
					</Avatar>
					<div class="grid flex-1 text-left text-sm leading-tight">
						<span class="truncate font-semibold">{userName}</span>
						<span class="truncate text-xs text-sidebar-foreground/60 capitalize">{role}</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>

			<!-- Log out -->
			<Sidebar.MenuItem>
				<form {...signOutAction}>
					<Sidebar.MenuButton
						class="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
					>
						{#snippet child({ props })}
							<button type="submit" {...props}>
								<LogOut />
								<span>Log Out</span>
							</button>
						{/snippet}
					</Sidebar.MenuButton>
				</form>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>

	<Sidebar.Rail />
</Sidebar.Root>
