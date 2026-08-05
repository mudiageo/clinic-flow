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
	import { notificationStore } from '$lib/state/notifications.svelte';
	import { HeartPulse, LogOut, UserCircle, Bell } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Button } from '$lib/components/ui/button';
	import { formatDistanceToNow } from '$lib/utils/date';
	import { onMount } from 'svelte';

	type Props = {
		navGroups: NavGroup[];
		role: string;
		phcName?: string;
		userName: string;
		userInitials: string;
	};

	let { navGroups, role, phcName, userName, userInitials }: Props = $props();

	onMount(() => {
		notificationStore.setRole(role);
	});
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

			<!-- Notifications -->
			<Sidebar.MenuItem>
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton {...props}>
								<Bell />
								<span>Notifications</span>
								{#if notificationStore.unreadCount > 0}
									<Sidebar.MenuBadge class="bg-primary text-primary-foreground">
										{notificationStore.unreadCount}
									</Sidebar.MenuBadge>
								{/if}
							</Sidebar.MenuButton>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content side="right" align="end" class="w-80 p-0">
						<div class="flex items-center justify-between px-4 py-3 border-b">
							<h4 class="font-semibold">Notifications</h4>
							{#if notificationStore.unreadCount > 0}
								<Button variant="ghost" size="sm" class="h-auto px-2 text-xs" onclick={() => notificationStore.markAllAsRead()}>
									Mark all read
								</Button>
							{/if}
						</div>
						<ScrollArea class="h-80">
							{#if notificationStore.items.length === 0}
								<div class="p-8 text-center text-muted-foreground text-sm">
									No notifications yet
								</div>
							{:else}
								<div class="flex flex-col">
									{#each notificationStore.items as notif}
										<button 
											class="flex flex-col gap-1 p-4 text-left hover:bg-muted/50 transition-colors border-b last:border-0 {notif.read ? 'opacity-70' : 'bg-primary/5'}"
											onclick={() => {
												notificationStore.markAsRead(notif.id);
												if (notif.link) window.location.href = notif.link;
											}}
										>
											<div class="flex justify-between items-start gap-2">
												<span class="font-semibold text-sm">{notif.title}</span>
												<span class="text-[10px] text-muted-foreground whitespace-nowrap">
													{formatDistanceToNow(notif.timestamp)}
												</span>
											</div>
											<span class="text-sm text-muted-foreground line-clamp-2">{notif.message}</span>
										</button>
									{/each}
								</div>
							{/if}
						</ScrollArea>
					</Popover.Content>
				</Popover.Root>
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

			<!-- Account Settings -->
			<Sidebar.MenuItem>
				<Sidebar.MenuButton isActive={page.url.pathname.startsWith('/settings')}>
					{#snippet child({ props })}
						<a href="/settings" {...props}>
							<UserCircle />
							<span>Account Settings</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>

			<!-- Log out -->
			<Sidebar.MenuItem>
				<form {...signOutAction} onsubmit={(e) => {
					localStorage.removeItem('clinicflow_offline_session');
					if (typeof navigator !== 'undefined' && !navigator.onLine) {
						e.preventDefault();
						window.location.href = '/login';
					}
				}}>
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
