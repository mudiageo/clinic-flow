<script lang="ts">
	import { patientStore } from '#lib/state/patients.svelte.ts';
	import { encounterStore } from '#lib/state/encounters.svelte.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/table/index.ts';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogTrigger
	} from '#lib/components/ui/dialog/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.ts';
	import QrCode from '#lib/components/QrCode.svelte';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.ts';
	import {
		Search,
		Printer,
		User,
		Scan,
		FileText,
		MoreHorizontal,
		ChevronLeft,
		ChevronRight,
		ArrowUpDown
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let searchTerm = $state('');
	let selectedPatientForQr = $state<unknown>(null);
	let currentPage = $state(1);
	let pageSize = $state(10);
	let sortColumn = $state('name');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	const results = $derived(searchTerm ? patientStore.search(searchTerm) : patientStore.items);

	const sortedResults = $derived.by(() => {
		const res = [...results];
		res.sort((a, b) => {
			let valA: string | number;
			let valB: string | number;
			if (sortColumn === 'lastVisit') {
				const encA = encounterStore.items
					.filter((e) => e.patientId === a.id)
					.sort((x, y) => y.visitDate - x.visitDate)[0];
				const encB = encounterStore.items
					.filter((e) => e.patientId === b.id)
					.sort((x, y) => y.visitDate - x.visitDate)[0];
				valA = encA ? new Date(encA.visitDate).getTime() : 0;
				valB = encB ? new Date(encB.visitDate).getTime() : 0;
			} else if (sortColumn === 'clinicId') {
				valA = a.clinicId;
				valB = b.clinicId;
			} else if (sortColumn === 'phone') {
				valA = a.phone ?? '';
				valB = b.phone ?? '';
			} else {
				valA = a.name;
				valB = b.name;
			}
			if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
			if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});
		return res;
	});

	const paginatedResults = $derived(
		sortedResults.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	const totalPages = $derived(Math.ceil(sortedResults.length / pageSize) || 1);

	$effect(() => {
		void searchTerm;
		currentPage = 1;
	});

	function toggleSort(col: string) {
		if (sortColumn === col) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = col;
			sortDirection = 'asc';
		}
	}

	function handlePrintQr(patient: unknown) {
		selectedPatientForQr = patient;
		setTimeout(() => {
			if (typeof window !== 'undefined') window.print();
		}, 100);
	}

	function getLastVisit(patientId: string) {
		const encounters = encounterStore.items
			.filter((e) => e.patientId === patientId)
			.sort((x, y) => y.visitDate - x.visitDate);
		if (encounters.length > 0) {
			return new Date(encounters[0].visitDate).toLocaleDateString();
		}
		return 'Never';
	}

	function getAge(dob: string | Date | null | undefined): string {
		if (!dob) return '—';
		const diff = Date.now() - new Date(dob).getTime();
		const ageDate = new Date(diff);
		const years = Math.abs(ageDate.getUTCFullYear() - 1970);
		return years > 0 ? `${years}y` : '<1y';
	}

	function exportCsv() {
		const headers = ['Clinic ID', 'Name', 'Phone', 'Sex', 'Age', 'Community', 'Last Visit'];
		const rows = sortedResults.map((p) => [
			p.clinicId,
			p.name,
			p.phone || '',
			p.sex,
			getAge(p.dob),
			p.community || '',
			getLastVisit(p.id)
		]);

		const csvContent = [
			headers.join(','),
			...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute(
			'download',
			`patients_registry_${new Date().toISOString().split('T')[0]}.csv`
		);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<svelte:head>
	<title>Patients Registry — ClinicFlow</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto">
	<div
		class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2 border-b border-border"
	>
		<div>
			<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
				Administration
			</p>
			<h1 class="text-2xl font-bold text-foreground tracking-tight">Patients Registry</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Manage and view all registered patient folders
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
			<div class="relative flex-1 md:w-72">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					bind:value={searchTerm}
					placeholder="Search by name, ID or phone..."
					class="pl-9 h-10 bg-card"
				/>
			</div>
			<Button variant="outline" class="h-10" onclick={exportCsv}>
				<FileText class="size-4 mr-2" />
				Export
			</Button>
			<Button variant="outline" class="h-10" onclick={() => window.print()}>
				<Printer class="size-4 mr-2" />
				Print
			</Button>
		</div>
	</div>

	<section class="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
		<div class="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center justify-between">
			<div>
				<h2 class="text-base font-semibold">Registered Patient Files</h2>
				<p class="text-xs text-muted-foreground">
					Offline-first copy of clinic registration registry
				</p>
			</div>
			<span class="text-xs font-mono tabular-nums text-muted-foreground">
				{sortedResults.length} records
			</span>
		</div>

		<ScrollArea class="h-[520px] w-full border-b border-border">
			<Table>
				<TableHeader class="bg-muted/40 sticky top-0 z-10">
					<TableRow class="hover:bg-transparent">
						<TableHead
							class="font-mono text-xs uppercase tracking-wider px-5 py-3 cursor-pointer hover:text-foreground"
							onclick={() => toggleSort('clinicId')}
						>
							<div class="flex items-center gap-1">
								Clinic ID
								<ArrowUpDown class="size-3 opacity-50" />
							</div>
						</TableHead>
						<TableHead
							class="font-mono text-xs uppercase tracking-wider px-5 py-3 cursor-pointer hover:text-foreground"
							onclick={() => toggleSort('name')}
						>
							<div class="flex items-center gap-1">
								Full Name
								<ArrowUpDown class="size-3 opacity-50" />
							</div>
						</TableHead>
						<TableHead
							class="font-mono text-xs uppercase tracking-wider px-5 py-3 cursor-pointer hover:text-foreground"
							onclick={() => toggleSort('phone')}
						>
							<div class="flex items-center gap-1">
								Phone
								<ArrowUpDown class="size-3 opacity-50" />
							</div>
						</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 py-3">Sex</TableHead>
						<TableHead class="font-mono text-xs uppercase tracking-wider px-5 py-3">Age</TableHead>
						<TableHead
							class="font-mono text-xs uppercase tracking-wider px-5 py-3 cursor-pointer hover:text-foreground"
							onclick={() => toggleSort('lastVisit')}
						>
							<div class="flex items-center gap-1">
								Last Visit
								<ArrowUpDown class="size-3 opacity-50" />
							</div>
						</TableHead>
						<TableHead class="w-16 px-5"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if paginatedResults.length === 0}
						<TableRow>
							<TableCell colspan={7} class="text-center py-16 text-muted-foreground">
								<div class="flex flex-col items-center justify-center">
									<User class="size-8 opacity-40 mb-2" />
									<span class="text-sm font-medium">No patient records found</span>
								</div>
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedResults as patient, idx (patient.id)}
							<TableRow
								class={idx % 2 === 1 ? 'bg-muted/20 hover:bg-muted/40' : 'hover:bg-muted/40'}
							>
								<TableCell class="font-mono font-bold text-primary px-5 py-3.5 text-sm">
									{patient.clinicId}
								</TableCell>
								<TableCell class="font-semibold text-foreground px-5 py-3.5 text-sm">
									{patient.name}
								</TableCell>
								<TableCell class="text-muted-foreground font-mono px-5 py-3.5 text-xs">
									{patient.phone ?? '—'}
								</TableCell>
								<TableCell
									class="text-muted-foreground px-5 py-3.5 uppercase text-xs font-semibold"
								>
									{patient.sex}
								</TableCell>
								<TableCell class="text-muted-foreground font-mono px-5 py-3.5 text-xs">
									{getAge(patient.dob)}
								</TableCell>
								<TableCell class="text-muted-foreground font-mono px-5 py-3.5 text-xs">
									{getLastVisit(patient.id)}
								</TableCell>
								<TableCell class="px-5 py-3.5 text-right">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger
											class="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-9 w-9 p-0"
										>
											<span class="sr-only">Open menu</span>
											<MoreHorizontal class="h-4 w-4" />
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Label>Actions</DropdownMenu.Label>
											<DropdownMenu.Item onSelect={() => goto(`/patients/${patient.clinicId}`)}>
												<User class="mr-2 size-4" />
												View Profile
											</DropdownMenu.Item>
											<DropdownMenu.Item onSelect={() => goto(`/doctor/patients/${patient.id}`)}>
												<FileText class="mr-2 size-4" />
												Medical History
											</DropdownMenu.Item>
											<DropdownMenu.Separator />
											<Dialog>
												<DialogTrigger
													class="w-full flex items-center justify-start rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
												>
													<Scan class="mr-2 size-4" />
													Scan ID Card
												</DialogTrigger>
												<DialogContent class="bg-card border-border max-w-sm text-center">
													<DialogHeader>
														<DialogTitle class="text-foreground text-lg font-bold">
															{patient.name}
														</DialogTitle>
														<DialogDescription class="font-mono text-xs">
															{patient.clinicId}
														</DialogDescription>
													</DialogHeader>

													<div
														class="flex flex-col items-center justify-center py-6 space-y-4 print:p-0"
													>
														<div class="bg-white p-4 rounded-xl border border-border">
															<QrCode value={patient.clinicId} />
														</div>
														<p class="text-xs text-muted-foreground font-medium max-w-[220px]">
															Scan QR code on kiosk to load patient files.
														</p>
													</div>

													<div
														class="flex justify-end gap-2 print:hidden border-t border-border pt-3"
													>
														<Button class="h-9 text-xs" onclick={() => handlePrintQr(patient)}>
															<Printer class="size-3.5 mr-1.5" />
															Print ID Card
														</Button>
													</div>
												</DialogContent>
											</Dialog>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</ScrollArea>

		<div class="flex items-center justify-between px-5 py-3.5 bg-muted/15">
			<div class="text-xs font-mono text-muted-foreground">
				Showing {(currentPage - 1) * pageSize + 1} to {Math.min(
					currentPage * pageSize,
					sortedResults.length
				)} of {sortedResults.length} records
			</div>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="icon"
					disabled={currentPage === 1}
					onclick={() => currentPage--}
					class="size-9"
				>
					<ChevronLeft class="size-4" />
				</Button>
				<span class="text-xs font-mono font-medium px-2">Page {currentPage} of {totalPages}</span>
				<Button
					variant="outline"
					size="icon"
					disabled={currentPage >= totalPages}
					onclick={() => currentPage++}
					class="size-9"
				>
					<ChevronRight class="size-4" />
				</Button>
			</div>
		</div>
	</section>
</div>
