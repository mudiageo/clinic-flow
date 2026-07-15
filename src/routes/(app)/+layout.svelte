<script lang="ts">
  import { getCurrentSession, signOutAction } from '$lib/remote/auth.remote';
  import SyncIndicator from '$lib/components/SyncIndicator.svelte';
  import { Separator } from '$lib/components/ui/separator';
  import { Button } from '$lib/components/ui/button';
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
  } from '$lib/components/ui/sidebar';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import {
    ClipboardList,
    UserPlus,
    Thermometer,
    Stethoscope,
    BarChart3,
    FolderOpen,
    LogOut,
    HeartPulse,
    Sun,
    Moon,
    Monitor,
    Shield
  } from '@lucide/svelte';
  import { ModeWatcher, toggleMode, mode } from 'mode-watcher';

  let { children } = $props();

  // Nav link active state helper
  function isActive(path: string): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.pathname === path;
  }
</script>

<ModeWatcher />

{#await getCurrentSession()}
  <!-- Loading skeleton -->
  <div class="min-h-screen bg-background flex flex-col items-center justify-center p-8">
    <div class="w-full max-w-sm space-y-4">
      <Skeleton class="h-12 w-12 rounded-2xl" />
      <Skeleton class="h-6 w-1/2" />
      <Skeleton class="h-4 w-3/4" />
      <div class="space-y-2 pt-8">
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
      </div>
    </div>
  </div>
{:then sessionData}
  {#if !sessionData.user}
    <meta http-equiv="refresh" content="0;url=/login" />
  {:else}
    {@const user = sessionData.user}
    {@const role = sessionData.role}

    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        <!-- ── Logo Header ── -->
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent">
                <div class="flex aspect-square size-8 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30">
                  <HeartPulse class="size-4 text-primary-foreground" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-bold text-foreground tracking-tight">ClinicFlow</span>
                  <span class="truncate text-xs text-muted-foreground capitalize">{role}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarSeparator />

        <!-- ── Navigation ── -->
        <SidebarContent>

          <!-- Nurse Station Links -->
          {#if role === 'nurse' || role === 'admin'}
            <SidebarGroup>
              <SidebarGroupLabel>Nurse Station</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={isActive('/nurse')} tooltipContent="Queue Board">
                      {#snippet child({ props })}
                        <a href="/nurse" {...props} class="transition-all duration-150 active:scale-95">
                          <ClipboardList class="size-4" />
                          <span>Queue Board</span>
                        </a>
                      {/snippet}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={isActive('/nurse/register')} tooltipContent="Register Patient">
                      {#snippet child({ props })}
                        <a href="/nurse/register" {...props} class="transition-all duration-150 active:scale-95">
                          <UserPlus class="size-4" />
                          <span>Register Patient</span>
                        </a>
                      {/snippet}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={isActive('/nurse/vitals')} tooltipContent="Vitals &amp; Triage">
                      {#snippet child({ props })}
                        <a href="/nurse/vitals" {...props} class="transition-all duration-150 active:scale-95">
                          <Thermometer class="size-4" />
                          <span>Vitals &amp; Triage</span>
                        </a>
                      {/snippet}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          {/if}

          <!-- Doctor Desk Links -->
          {#if role === 'doctor' || role === 'admin'}
            <SidebarGroup>
              <SidebarGroupLabel>Doctor Desk</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={isActive('/doctor')} tooltipContent="Consultation Queue">
                      {#snippet child({ props })}
                        <a href="/doctor" {...props} class="transition-all duration-150 active:scale-95">
                          <Stethoscope class="size-4" />
                          <span>Consultation Queue</span>
                        </a>
                      {/snippet}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          {/if}

          <!-- Admin Links -->
          {#if role === 'admin'}
            <SidebarGroup>
              <SidebarGroupLabel>Administrator</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={isActive('/admin')} tooltipContent="Operations Stats">
                      {#snippet child({ props })}
                        <a href="/admin" {...props} class="transition-all duration-150 active:scale-95">
                          <BarChart3 class="size-4" />
                          <span>Operations Stats</span>
                        </a>
                      {/snippet}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={isActive('/admin/patients')} tooltipContent="Patients Registry">
                      {#snippet child({ props })}
                        <a href="/admin/patients" {...props} class="transition-all duration-150 active:scale-95">
                          <FolderOpen class="size-4" />
                          <span>Patients Registry</span>
                        </a>
                      {/snippet}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={isActive('/superadmin')} tooltipContent="Makers Dashboard">
                      {#snippet child({ props })}
                        <a href="/superadmin" {...props} class="transition-all duration-150 active:scale-95">
                          <Shield class="size-4" />
                          <span>Makers Dashboard</span>
                        </a>
                      {/snippet}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          {/if}

        </SidebarContent>

        <!-- ── Footer: User + Sync + Logout ── -->
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            <!-- Sync status -->
            <SidebarMenuItem class="group-data-[collapsible=icon]:hidden">
              <div class="px-2 py-1">
                <SyncIndicator />
              </div>
            </SidebarMenuItem>

            <!-- User info -->
            <SidebarMenuItem>
              <SidebarMenuButton class="h-auto py-2 hover:bg-sidebar-accent transition-colors duration-150">
                <Avatar class="size-8 shrink-0 ring-2 ring-primary/30">
                  <AvatarFallback class="bg-primary/10 text-primary text-xs font-bold uppercase">
                    {user.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold text-foreground">{user.name}</span>
                  <span class="truncate text-xs text-muted-foreground capitalize">{role}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <!-- Logout -->
            <SidebarMenuItem>
              <form {...signOutAction}>
                <SidebarMenuButton class="w-full text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors duration-150 active:scale-95">
                  {#snippet child({ props })}
                    <button type="submit" {...props}>
                      <LogOut class="size-4" />
                      <span>Log Out</span>
                    </button>
                  {/snippet}
                </SidebarMenuButton>
              </form>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <!-- ── Main Content ── -->
      <SidebarInset>
        <!-- Top header bar -->
        <header class="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-40">
          <div class="flex items-center gap-3">
            <SidebarTrigger class="text-muted-foreground hover:text-foreground transition-colors" />
            <Separator orientation="vertical" class="h-5 hidden md:block" />
            <!-- Mobile brand name -->
            <span class="font-bold text-foreground tracking-tight md:hidden">ClinicFlow</span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Sync indicator (mobile, when sidebar hidden) -->
            <div class="md:hidden">
              <SyncIndicator />
            </div>

            <!-- Theme toggle -->
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-muted-foreground hover:text-foreground transition-all duration-200 hover:rotate-12"
                    onclick={toggleMode}
                    aria-label="Toggle theme"
                  >
                    {#if mode.current === 'dark'}
                      <Sun class="size-4" />
                    {:else if mode.current === 'light'}
                      <Moon class="size-4" />
                    {:else}
                      <Monitor class="size-4" />
                    {/if}
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Toggle theme</Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
          {@render children()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  {/if}
{/await}
