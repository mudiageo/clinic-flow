<script lang="ts">
	import { getPhcStaffList } from '#lib/remote/admin.remote.ts';
	import {
		getStaffPermissions,
		grantPermission,
		revokePermission,
		resetStaffPermissions
	} from '#lib/remote/permissions.remote.ts';
	import { PERMISSION_DESCRIPTIONS } from '#lib/config/permissions.ts';
	import { ROLE_DEFAULTS } from '#lib/config/role-defaults.ts';

	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.ts';
	import { Avatar, AvatarFallback } from '#lib/components/ui/avatar/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { toast } from 'svelte-sonner';
	import { ShieldCheck, Search, Undo2, Loader2, AlertCircle } from '@lucide/svelte';

	type StaffItem = {
		id: string;
		fullName: string;
		role: string;
		active: boolean;
	};

	type PermOverride = {
		permission: string;
		revoked: boolean;
		grantedAt: string | Date;
	};

	let staffList = $state<StaffItem[]>([]);
	let selectedStaffId = $state<string | null>(null);
	let selectedStaff = $derived(staffList.find((s) => s.id === selectedStaffId));

	let rawOverrides = $state<PermOverride[]>([]);
	let searchQuery = $state('');

	let isFetchingStaff = $state(true);
	let isFetchingPermissions = $state(false);
	let pendingToggles = $state<Record<string, boolean>>({});
	let isResetting = $state(false);

	$effect(() => {
		getPhcStaffList().then((res) => {
			staffList = res as StaffItem[];
			isFetchingStaff = false;
		});
	});

	const filteredStaff = $derived(
		staffList.filter(
			(s) =>
				s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.role?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	$effect(() => {
		if (selectedStaffId) {
			isFetchingPermissions = true;
			getStaffPermissions(selectedStaffId).then((res) => {
				rawOverrides = res as PermOverride[];
				isFetchingPermissions = false;
			});
		} else {
			rawOverrides = [];
		}
	});

	const activePermissions = $derived.by(() => {
		if (!selectedStaff) return [];

		let perms = [...(ROLE_DEFAULTS[selectedStaff.role as keyof typeof ROLE_DEFAULTS] || [])];

		const sortedOverrides = [...rawOverrides].sort(
			(a, b) => new Date(a.grantedAt).getTime() - new Date(b.grantedAt).getTime()
		);

		for (const override of sortedOverrides) {
			if (override.revoked) {
				perms = perms.filter((p) => p !== override.permission);
			} else if (!perms.includes(override.permission)) {
				perms.push(override.permission);
			}
		}
		return perms;
	});

	const groupedPermissions = $derived.by(() => {
		const groups: Record<string, { key: string; label: string; description: string }[]> = {};
		for (const [key, details] of Object.entries(PERMISSION_DESCRIPTIONS)) {
			if (!groups[details.category]) groups[details.category] = [];
			groups[details.category].push({ key, ...details });
		}
		return groups;
	});

	function isRoleDefault(perm: string) {
		if (!selectedStaff) return false;
		return (ROLE_DEFAULTS[selectedStaff.role] || []).includes(perm);
	}

	function getDiffStatus(perm: string) {
		const isDefault = isRoleDefault(perm);
		const isActive = activePermissions.includes(perm);

		if (isDefault && !isActive) return 'revoked';
		if (!isDefault && isActive) return 'added';
		return 'baseline';
	}

	async function handleToggle(permission: string, currentActive: boolean) {
		if (!selectedStaffId) return;

		const action = currentActive ? revokePermission : grantPermission;

		pendingToggles[permission] = true;
		const previousOverrides = rawOverrides;

		rawOverrides = [
			...rawOverrides,
			{
				permission,
				revoked: currentActive,
				grantedAt: new Date().toISOString()
			}
		];

		try {
			const res = await action({ staffId: selectedStaffId, permission });
			if (!res || !res.success) {
				rawOverrides = previousOverrides;
				toast.error('Failed to update permission');
			} else {
				toast.success(`Permission ${currentActive ? 'revoked' : 'granted'}`);
			}
		} catch (err) {
			rawOverrides = previousOverrides;
			toast.error(err instanceof Error ? err.message : 'Failed to update permission');
		} finally {
			pendingToggles[permission] = false;
		}
	}

	async function handleReset() {
		if (!selectedStaffId) return;
		if (
			!confirm(
				'Are you sure you want to reset this staff member to their role defaults? All custom overrides will be lost.'
			)
		)
			return;

		isResetting = true;
		const previousOverrides = rawOverrides;
		rawOverrides = [];

		try {
			const res = await resetStaffPermissions({ staffId: selectedStaffId });
			if (!res || !res.success) {
				rawOverrides = previousOverrides;
				toast.error('Failed to reset permissions');
			} else {
				toast.success('Permissions reset to role defaults');
			}
		} catch (err) {
			rawOverrides = previousOverrides;
			toast.error(err instanceof Error ? err.message : 'Failed to reset permissions');
		} finally {
			isResetting = false;
		}
	}
</script>

<svelte:head>
	<title>Permission Editor — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
	<div class="pb-2 border-b border-border shrink-0">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
			Access Control
		</p>
		<h1 class="text-2xl font-bold text-foreground tracking-tight">Permission Editor</h1>
		<p class="text-muted-foreground text-sm mt-0.5">
			Manage granular module access overrides per staff member
		</p>
	</div>

	<div class="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
		<!-- Left Pane: Staff List -->
		<section
			class="w-full lg:w-1/3 shrink-0 h-full overflow-hidden rounded-xl border border-border bg-card {selectedStaff
				? 'hidden lg:flex flex-col'
				: 'flex flex-col'}"
		>
			<div class="border-b border-border px-4 py-3 shrink-0 bg-muted/20">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						placeholder="Search staff..."
						class="pl-9 h-10 bg-background"
						bind:value={searchQuery}
					/>
				</div>
			</div>
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
						{#each filteredStaff as staff (staff.id)}
							{@const isActive = selectedStaffId === staff.id}
							<button
								class="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors border hover:bg-muted/40 {isActive
									? 'bg-primary/8 border-primary/35'
									: 'border-transparent'}"
								onclick={() => (selectedStaffId = staff.id)}
							>
								<Avatar class="size-10 border shrink-0">
									<AvatarFallback class="bg-primary/10 text-primary text-xs font-bold uppercase">
										{staff.fullName
											?.split(' ')
											.slice(0, 2)
											.map((n: string) => n[0])
											.join('')}
									</AvatarFallback>
								</Avatar>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-semibold truncate text-foreground leading-tight">
										{staff.fullName}
									</p>
									<p class="text-xs font-mono text-muted-foreground capitalize mt-0.5">
										{staff.role}
									</p>
								</div>
								{#if !staff.active}
									<Badge variant="destructive" class="text-[10px] shrink-0">Inactive</Badge>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</ScrollArea>
		</section>

		<!-- Right Pane: Permission Matrix -->
		<section
			class="flex-1 h-full overflow-hidden rounded-xl border border-border bg-card {selectedStaff
				? 'flex flex-col'
				: 'hidden lg:flex flex-col'}"
		>
			{#if !selectedStaff}
				<div
					class="flex flex-col items-center justify-center flex-1 text-muted-foreground bg-muted/10"
				>
					<ShieldCheck class="size-10 opacity-25 mb-2" />
					<p class="font-medium text-foreground text-sm">Select a staff member</p>
					<p class="text-xs mt-1">
						Choose someone from the list to view and edit their permissions
					</p>
				</div>
			{:else}
				<div class="flex flex-col flex-1 h-full">
					<div
						class="border-b border-border px-5 py-3.5 shrink-0 flex items-center justify-between bg-muted/20 gap-3"
					>
						<div class="flex items-center gap-3 min-w-0">
							<button
								class="lg:hidden shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
								onclick={() => {
									selectedStaffId = null;
								}}
								aria-label="Back to staff list"
							>
								<Undo2 class="size-5 text-muted-foreground" />
							</button>
							<Avatar class="size-11 border shrink-0">
								<AvatarFallback class="bg-primary/10 text-primary font-bold uppercase">
									{selectedStaff.fullName
										?.split(' ')
										.slice(0, 2)
										.map((n: string) => n[0])
										.join('')}
								</AvatarFallback>
							</Avatar>
							<div class="min-w-0">
								<h2 class="font-bold text-base truncate">{selectedStaff.fullName}</h2>
								<div class="flex items-center gap-2 mt-0.5">
									<Badge variant="outline" class="capitalize font-mono text-[10px]">
										{selectedStaff.role}
									</Badge>
									<span class="text-xs font-mono text-muted-foreground">
										{activePermissions.length} active
									</span>
								</div>
							</div>
						</div>

						<Button
							variant="outline"
							size="sm"
							class="shrink-0 text-amber-700 dark:text-triage-amber border-triage-amber/40 hover:bg-triage-amber/10"
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
					</div>

					<div class="flex-1 p-5 relative overflow-y-auto">
						{#if isFetchingPermissions}
							<div
								class="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center"
							>
								<Loader2 class="size-8 animate-spin text-primary" />
							</div>
						{/if}

						{#if selectedStaff.role === 'superadmin'}
							<div
								class="p-4 border border-triage-amber/40 rounded-xl bg-triage-amber/10 text-foreground flex items-start gap-3 mb-5"
							>
								<AlertCircle class="size-5 shrink-0 mt-0.5 text-amber-700 dark:text-triage-amber" />
								<div class="text-xs">
									<p class="font-semibold text-sm">Superadmin Account</p>
									<p class="mt-1 text-muted-foreground">
										Superadmins inherently bypass all permission checks. Toggling these switches
										records overrides in the database, but will not restrict access.
									</p>
								</div>
							</div>
						{/if}

						<div class="space-y-6">
							{#each Object.entries(groupedPermissions) as [category, perms]}
								<section class="space-y-3">
									<h3
										class="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2"
									>
										{category}
										<div class="h-px flex-1 bg-border"></div>
									</h3>

									<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
										{#each perms as perm}
											{@const isActive = activePermissions.includes(perm.key)}
											{@const diff = getDiffStatus(perm.key)}
											{@const isPending = pendingToggles[perm.key]}

											<div
												class="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/60 transition-colors {diff ===
												'added'
													? 'bg-primary/8 border-primary/30'
													: diff === 'revoked'
														? 'bg-destructive/5 border-destructive/25 opacity-70'
														: ''}"
											>
												<div class="flex-1 min-w-0 pr-3">
													<div class="flex items-center gap-2">
														<p class="text-sm font-semibold truncate text-foreground">
															{perm.label}
														</p>
														{#if diff === 'added'}
															<Badge
																variant="outline"
																class="text-[9px] h-4 px-1.5 bg-primary/10 text-primary border-primary/30"
															>
																Added
															</Badge>
														{:else if diff === 'revoked'}
															<Badge
																variant="outline"
																class="text-[9px] h-4 px-1.5 bg-destructive/10 text-destructive border-destructive/30"
															>
																Revoked
															</Badge>
														{/if}
													</div>
													<p class="text-xs text-muted-foreground line-clamp-1 mt-0.5">
														{perm.description}
													</p>
												</div>
												<div class="flex items-center gap-2 shrink-0">
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
		</section>
	</div>
</div>
