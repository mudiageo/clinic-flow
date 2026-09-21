<script lang="ts">
	import { getPhcStaffList } from '$lib/remote/admin.remote';
	import { 
		getStaffPermissions, 
		grantPermission, 
		revokePermission, 
		resetStaffPermissions 
	} from '$lib/remote/permissions.remote';
	import { PERMISSION_DESCRIPTIONS, type PermissionKey } from '$lib/config/permissions';
	import { ROLE_DEFAULTS } from '$lib/config/role-defaults';
	
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import { ShieldCheck, Search, Undo2, Loader2, AlertCircle } from '@lucide/svelte';
	
	let staffList = $state<any[]>([]);
	let selectedStaffId = $state<string | null>(null);
	let selectedStaff = $derived(staffList.find(s => s.id === selectedStaffId));
	
	let rawOverrides = $state<any[]>([]);
	let searchQuery = $state('');
	
	// Track loading states
	let isFetchingStaff = $state(true);
	let isFetchingPermissions = $state(false);
	let pendingToggles = $state<Record<string, boolean>>({});
	let isResetting = $state(false);
	
	// Load staff on mount
	$effect(() => {
		getPhcStaffList().then(res => {
			staffList = res;
			isFetchingStaff = false;
		});
	});
	
	// Filter staff by search
	const filteredStaff = $derived(
		staffList.filter(s => 
			s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
			s.role?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
	
	// Fetch permissions when a staff member is selected
	$effect(() => {
		if (selectedStaffId) {
			isFetchingPermissions = true;
			getStaffPermissions(selectedStaffId).then(res => {
				rawOverrides = res;
				isFetchingPermissions = false;
			});
		} else {
			rawOverrides = [];
		}
	});
	
	// Calculate active permissions
	const activePermissions = $derived.by(() => {
		if (!selectedStaff) return [];
		
		let perms = [...(ROLE_DEFAULTS[selectedStaff.role as keyof typeof ROLE_DEFAULTS] || [])];
		
		// Sort overrides oldest to newest so latest takes precedence
		const sortedOverrides = [...rawOverrides].sort((a, b) => 
			new Date(a.grantedAt).getTime() - new Date(b.grantedAt).getTime()
		);
		
		for (const override of sortedOverrides) {
			if (override.revoked) {
				perms = perms.filter(p => p !== override.permission);
			} else if (!perms.includes(override.permission)) {
				perms.push(override.permission);
			}
		}
		return perms;
	});
	
	// Group all available permissions by category
	const groupedPermissions = $derived.by(() => {
		const groups: Record<string, { key: string; label: string; description: string }[]> = {};
		for (const [key, details] of Object.entries(PERMISSION_DESCRIPTIONS)) {
			if (!groups[details.category]) groups[details.category] = [];
			groups[details.category].push({ key, ...details });
		}
		return groups;
	});
	
	// Helpers for the UI
	function isRoleDefault(perm: string) {
		if (!selectedStaff) return false;
		return (ROLE_DEFAULTS[selectedStaff.role] || []).includes(perm);
	}
	
	function getDiffStatus(perm: string) {
		const isDefault = isRoleDefault(perm);
		const isActive = activePermissions.includes(perm);
		
		if (isDefault && !isActive) return 'revoked'; // Default taken away (Red)
		if (!isDefault && isActive) return 'added';   // Extra granted (Blue)
		return 'baseline';                            // Matches role (Normal)
	}
	
	async function handleToggle(permission: string, currentActive: boolean) {
		if (!selectedStaffId) return;
		
		const action = currentActive ? revokePermission : grantPermission;
		
		pendingToggles[permission] = true;
		try {
			const res = await action({ staffId: selectedStaffId, permission });
			if (res) {
				// Refresh overrides
				rawOverrides = await getStaffPermissions(selectedStaffId);
				toast.success(`Permission ${currentActive ? 'revoked' : 'granted'}`);
			}
		} catch (err: any) {
			toast.error(err.message || 'Failed to update permission');
		} finally {
			pendingToggles[permission] = false;
		}
	}
	
	async function handleReset() {
		if (!selectedStaffId) return;
		if (!confirm('Are you sure you want to reset this staff member to their role defaults? All custom overrides will be lost.')) return;
		
		isResetting = true;
		try {
			await resetStaffPermissions({ staffId: selectedStaffId });
			rawOverrides = await getStaffPermissions(selectedStaffId);
			toast.success('Permissions reset to role defaults');
		} catch (err: any) {
			toast.error(err.message || 'Failed to reset permissions');
		} finally {
			isResetting = false;
		}
	}

</script>

<svelte:head>
	<title>Permission Editor — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 animate-fade-in h-[calc(100vh-6rem)] flex flex-col">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<ShieldCheck class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Permission Editor</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Manage granular module access overrides per staff member
				</p>
			</div>
		</div>
	</div>

	<div class="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
		<!-- Left Pane: Staff List -->
		<Card class="w-full lg:w-1/3 shrink-0 h-full overflow-hidden {selectedStaff ? 'hidden lg:flex flex-col' : 'flex flex-col'}">
			<CardHeader class="border-b px-4 py-3 shrink-0 bg-muted/20">
				<div class="relative">
					<Search class="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
					<Input 
						placeholder="Search staff..." 
						class="pl-9 h-9 bg-background" 
						bind:value={searchQuery}
					/>
				</div>
			</CardHeader>
			<ScrollArea class="flex-1">
				{#if isFetchingStaff}
					<div class="flex items-center justify-center h-32">
						<Loader2 class="size-6 animate-spin text-muted-foreground" />
					</div>
				{:else if filteredStaff.length === 0}
					<div class="flex flex-col items-center justify-center h-32 text-muted-foreground">
						<p class="text-sm">No staff found</p>
					</div>
				{:else}
					<div class="p-2 space-y-1">
						{#each filteredStaff as staff}
							{@const isActive = selectedStaffId === staff.id}
							<button 
								class="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors border hover:bg-muted/50 {isActive ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' : 'border-transparent'}"
								onclick={() => selectedStaffId = staff.id}
							>
								<Avatar class="size-10 border shadow-sm shrink-0">
									<AvatarFallback class="bg-primary/10 text-primary text-xs font-bold uppercase">
										{staff.fullName?.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
									</AvatarFallback>
								</Avatar>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-semibold truncate text-foreground leading-tight">{staff.fullName}</p>
									<p class="text-xs text-muted-foreground capitalize mt-0.5">{staff.role}</p>
								</div>
								{#if !staff.active}
									<Badge variant="destructive" class="text-[10px] shrink-0">Inactive</Badge>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</ScrollArea>
		</Card>

		<!-- Right Pane: Permission Matrix -->
		<Card class="flex-1 h-full overflow-hidden {selectedStaff ? 'flex flex-col' : 'hidden lg:flex flex-col'}">
			{#if !selectedStaff}
				<div class="flex flex-col items-center justify-center flex-1 text-muted-foreground bg-muted/10">
					<ShieldCheck class="size-12 opacity-20 mb-3" />
					<p class="font-medium text-foreground">Select a staff member</p>
					<p class="text-sm mt-1">Choose someone from the list to view and edit their permissions</p>
				</div>
			{:else}
				<div class="flex flex-col flex-1 h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
				<CardHeader class="border-b px-6 py-4 shrink-0 flex flex-row items-center justify-between bg-muted/10">
					<div class="flex items-center gap-3 min-w-0">
						<!-- Mobile Back Button -->
						<button 
							class="lg:hidden shrink-0 -ml-2 mr-1 p-2 rounded-full hover:bg-muted transition-colors"
							onclick={() => { selectedStaffId = null; }}
						>
							<Undo2 class="size-5 text-muted-foreground" />
						</button>
						<Avatar class="size-12 border shadow-sm">
							<AvatarFallback class="bg-primary/10 text-primary font-bold uppercase">
								{selectedStaff.fullName?.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
							</AvatarFallback>
						</Avatar>
						<div class="min-w-0">
							<CardTitle class="truncate">{selectedStaff.fullName}</CardTitle>
							<div class="flex items-center gap-2 mt-1">
								<Badge variant="outline" class="capitalize">{selectedStaff.role}</Badge>
								<span class="text-xs text-muted-foreground">{activePermissions.length} permissions active</span>
							</div>
						</div>
					</div>
					
					<Button 
						variant="outline" 
						size="sm" 
						class="shrink-0 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
						disabled={rawOverrides.length === 0 || isResetting}
						onclick={handleReset}
					>
						{#if isResetting}
							<Loader2 class="size-4 mr-2 animate-spin" />
						{:else}
							<Undo2 class="size-4 mr-2" />
						{/if}
						Reset to Defaults
					</Button>
				</CardHeader>
				
				<div class="flex-1 p-6 relative overflow-y-auto">
					{#if isFetchingPermissions}
						<div class="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
							<Loader2 class="size-8 animate-spin text-primary" />
						</div>
					{/if}
					
					{#if selectedStaff.role === 'superadmin'}
						<div class="p-4 border rounded-lg bg-amber-50 border-amber-200 text-amber-800 flex items-start gap-3 mb-6">
							<AlertCircle class="size-5 shrink-0 mt-0.5" />
							<div class="text-sm">
								<p class="font-semibold">Superadmin Account</p>
								<p class="mt-1">Superadmins inherently bypass all permission checks. Toggling these switches will record overrides in the database, but will not actually restrict this user's access.</p>
							</div>
						</div>
					{/if}
					
					<div class="space-y-8">
						{#each Object.entries(groupedPermissions) as [category, perms]}
							<section class="space-y-4">
								<h3 class="text-sm font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-2">
									{category}
									<div class="h-px flex-1 bg-border/60"></div>
								</h3>
								
								<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
									{#each perms as perm}
										{@const isActive = activePermissions.includes(perm.key)}
										{@const diff = getDiffStatus(perm.key)}
										{@const isPending = pendingToggles[perm.key]}
										
										<div class="flex items-center justify-between p-3 rounded-xl border bg-card transition-colors hover:border-border/80 {diff === 'added' ? 'bg-blue-50/50 border-blue-100' : diff === 'revoked' ? 'bg-red-50/50 border-red-100 opacity-60' : ''}">
											<div class="flex-1 min-w-0 pr-4">
												<div class="flex items-center gap-2">
													<p class="text-sm font-semibold truncate text-foreground">{perm.label}</p>
													{#if diff === 'added'}
														<Badge variant="outline" class="text-[9px] h-4 px-1.5 bg-blue-100 text-blue-700 border-blue-200">Added</Badge>
													{:else if diff === 'revoked'}
														<Badge variant="outline" class="text-[9px] h-4 px-1.5 bg-red-100 text-red-700 border-red-200">Revoked</Badge>
													{/if}
												</div>
												<p class="text-xs text-muted-foreground line-clamp-1 mt-0.5">{perm.description}</p>
											</div>
											<div class="flex items-center gap-3 shrink-0">
												{#if isPending}
													<Loader2 class="size-4 animate-spin text-muted-foreground" />
												{/if}
												<Switch 
													checked={isActive} 
													disabled={isPending || !selectedStaff.active}
													onCheckedChange={() => handleToggle(perm.key, isActive)}
												/>
											</div>
										</div>
									{/each}
								</div>
							</section>
						{/each}
					</div>
				</div>
				</div>
			{/if}
		</Card>
	</div>
</div>
