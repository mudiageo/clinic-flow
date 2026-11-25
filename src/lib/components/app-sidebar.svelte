<script module lang="ts">
	import type { Component } from 'svelte';

	export type NavItem = {
		href: string;
		label: string;
		icon: Component;
		badge?: number;
	};

	export type NavGroup = {
		label: string;
		items: NavItem[];
	};
</script>

<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '#lib/components/ui/sidebar/index.ts';
	import { Avatar, AvatarFallback } from '#lib/components/ui/avatar/index.ts';
	import SyncIndicator from '#lib/components/SyncIndicator.svelte';
	import { signOutAction } from '#lib/remote/auth.remote.ts';
	import { notificationStore } from '#lib/state/notifications.svelte.ts';
	import { announcementStore } from '#lib/state/announcements.svelte.ts';
	import {
		HeartPulse,
		LogOut,
		UserCircle,
		Bell,
		HelpCircle,
		Megaphone,
		Wifi
	} from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import * as Popover from '#lib/components/ui/popover/index.ts';
	import GlobalHelpDrawer from '#lib/components/global-help-drawer.svelte';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { formatDistanceToNow } from '#lib/utils/date.ts';
	import { onMount } from 'svelte';
	import { cn } from '#lib/utils.ts';

	type Props = {
		navGroups: NavGroup[];
		role: string;
		phcName?: string;
		userName: string;
		userInitials: string;
	};

	let { navGroups, role, phcName, userName, userInitials }: Props = $props();

	let helpDrawerOpen = $state(false);
	let acknowledgingAnnouncementId = $state<string | null>(null);
	const totalUnread = $derived(notificationStore.unreadCount + announcementStore.unreadCount);

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}

	async function markAllNotificationsRead(): Promise<void> {
		notificationStore.markAllAsRead();
		await announcementStore.markAllRead();
	}

	async function acknowledgeAnnouncement(announcementId: string): Promise<void> {
		if (acknowledgingAnnouncementId) return;
		acknowledgingAnnouncementId = announcementId;
		try {
			await announcementStore.acknowledge(announcementId);
		} finally {
			acknowledgingAnnouncementId = null;
		}
	}

	onMount(() => {
		notificationStore.setRole(role);
	});
</script>

<!--
	App Sidebar — "Paper & Ink" design system
	Deep indigo background, light text. Distinct from the content area.
	Collapsible to 56px icon rail on desktop.
-->
<Sidebar.Root collapsible="icon">
	<!-- ── Header: ClinicFlow brand mark ── -->
	<Sidebar.Header class="bg-sidebar border-b border-sidebar-border pb-3">
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" class="hover:bg-sidebar-accent">
					<!-- Logo mark: indigo circle with heartpulse -->
					<div
						class="flex aspect-square size-8 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm"
					>
						<HeartPulse class="size-4 text-primary-foreground" />
					</div>
					<div class="grid flex-1 text-left text-sm leading-tight">
						<span class="truncate font-bold tracking-tight text-sidebar-foreground">ClinicFlow</span
						>
						<span class="truncate text-xs text-sidebar-foreground/60 capitalize">
							{phcName ?? role}
						</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<!-- ── Navigation ── -->
	<Sidebar.Content class="bg-sidebar">
		{#each navGroups as group (group.label)}
			<Sidebar.Group>
				<!-- Section label: uppercase micro, subdued -->
				<Sidebar.GroupLabel
					class="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/40 px-3"
				>
					{group.label}
				</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each group.items as item (item.label)}
							{@const active = isActive(item.href)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									isActive={active}
									tooltipContent={item.label}
									class={cn(
										'rounded-lg transition-colors duration-100',
										active
											? 'bg-sidebar-primary/15 text-sidebar-primary font-semibold'
											: 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
									)}
								>
									{#snippet child({ props })}
										<a href={item.href} {...props}>
											<!-- Active: filled icon weight; inactive: lighter -->
											<item.icon
												stroke-width={active ? 2.5 : 1.75}
												class={cn('size-4', active && 'text-sidebar-primary')}
											/>
											<span>{item.label}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
								{#if item.badge && item.badge > 0}
									<Sidebar.MenuBadge
										class="bg-destructive text-destructive-foreground text-[10px] font-bold tabular-nums"
									>
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

	<!-- ── Footer: status + user ── -->
	<Sidebar.Separator class="bg-sidebar-border" />
	<Sidebar.Footer class="bg-sidebar gap-1 pb-2">
		<Sidebar.Menu>
			<!-- Sync status — hidden in collapsed icon rail mode -->
			<Sidebar.MenuItem class="group-data-[collapsible=icon]:hidden">
				<div class="px-2 py-1">
					<SyncIndicator />
				</div>
			</Sidebar.MenuItem>

			<!-- Notifications bell -->
			<Sidebar.MenuItem>
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								{...props}
								class="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
							>
								<Bell class="size-4" />
								<span>Notifications</span>
								{#if totalUnread > 0}
									<Sidebar.MenuBadge
										class="bg-destructive text-destructive-foreground text-[10px] font-bold"
									>
										{totalUnread > 99 ? '99+' : totalUnread}
									</Sidebar.MenuBadge>
								{/if}
							</Sidebar.MenuButton>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content side="right" align="end" class="w-80 p-0 overflow-hidden rounded-xl">
						<!-- Notification panel header -->
						<div class="flex items-center justify-between px-4 py-3 border-b border-border">
							<span class="text-sm font-semibold">Notifications</span>
							{#if totalUnread > 0}
								<button
									class="text-xs text-primary hover:underline"
									onclick={markAllNotificationsRead}
								>
									Mark all read
								</button>
							{/if}
						</div>
						<ScrollArea class="max-h-80">
							{#if announcementStore.unreadItems.length === 0 && notificationStore.items.length === 0}
								<div class="flex flex-col items-center justify-center py-10 text-muted-foreground">
									<Bell class="size-8 mb-2 opacity-30" />
									<p class="text-sm">All clear — no new notifications</p>
								</div>
							{:else}
								<div class="divide-y divide-border">
									{#each announcementStore.unreadItems as announcement (announcement.announcementId)}
										<div class={cn(!announcement.readAt && 'bg-primary/5')}>
											<button
												class="flex w-full flex-col gap-1 p-4 text-left hover:bg-muted/50 transition-colors"
												onclick={() => announcementStore.open(announcement)}
											>
												<div class="flex w-full items-start justify-between gap-2">
													<span class="flex items-center gap-1.5 text-sm font-semibold">
														<Megaphone class="size-3.5 text-primary" />
														{announcement.title}
													</span>
													<span class="whitespace-nowrap text-[10px] text-muted-foreground">
														{formatDistanceToNow(
															announcement.publishedAt ??
																announcement.scheduledFor ??
																announcement.createdAt
														)}
													</span>
												</div>
												<span class="line-clamp-2 text-sm text-muted-foreground"
													>{announcement.body}</span
												>
											</button>
											{#if announcement.requiresAcknowledgement && !announcement.acknowledgedAt}
												<div class="flex items-center justify-between gap-2 px-4 pb-3">
													<span class="text-[10px] font-medium text-destructive"
														>Acknowledgement required</span
													>
													<Button
														variant="outline"
														size="sm"
														class="h-7 text-xs"
														disabled={acknowledgingAnnouncementId === announcement.announcementId}
														onclick={() => acknowledgeAnnouncement(announcement.announcementId)}
													>
														{acknowledgingAnnouncementId === announcement.announcementId
															? 'Saving…'
															: 'Acknowledge'}
													</Button>
												</div>
											{/if}
										</div>
									{/each}
									{#each notificationStore.items as notif (notif.id)}
										<button
											class={cn(
												'flex flex-col gap-1 p-4 text-left hover:bg-muted/50 transition-colors w-full',
												notif.read ? 'opacity-70' : 'bg-primary/5'
											)}
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
											<span class="text-sm text-muted-foreground line-clamp-2">{notif.message}</span
											>
										</button>
									{/each}
								</div>
							{/if}
						</ScrollArea>
					</Popover.Content>
				</Popover.Root>
			</Sidebar.MenuItem>

			<!-- Account Settings -->
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					isActive={page.url.pathname.startsWith('/settings')}
					class="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
				>
					{#snippet child({ props })}
						<a href="/settings" {...props}>
							<UserCircle class="size-4" />
							<span>Account Settings</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>

			<!-- Help & Support -->
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					class="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
					onclick={() => (helpDrawerOpen = true)}
				>
					{#snippet child({ props })}
						<button {...props}>
							<HelpCircle class="size-4" />
							<span>Help & Support</span>
						</button>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>

			<!-- Divider -->
			<div class="mx-3 my-1 h-px bg-sidebar-border"></div>

			<!-- User avatar + name -->
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" class="hover:bg-sidebar-accent">
					<Avatar class="size-7 shrink-0 ring-1 ring-sidebar-border">
						<AvatarFallback class="bg-primary/20 text-primary text-xs font-bold uppercase">
							{userInitials}
						</AvatarFallback>
					</Avatar>
					<div class="grid flex-1 text-left text-sm leading-tight">
						<span class="truncate font-semibold text-sidebar-foreground">{userName}</span>
						<span class="truncate text-xs text-sidebar-foreground/60 capitalize">{role}</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>

			<!-- Log out -->
			<Sidebar.MenuItem>
				<form
					{...signOutAction}
					onsubmit={(e) => {
						localStorage.removeItem('clinicflow_offline_session');
						if (typeof navigator !== 'undefined' && !navigator.onLine) {
							e.preventDefault();
							window.location.href = '/login';
						}
					}}
				>
					<Sidebar.MenuButton
						class="w-full text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
					>
						{#snippet child({ props })}
							<button type="submit" {...props}>
								<LogOut class="size-4" />
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

<GlobalHelpDrawer bind:open={helpDrawerOpen} />
