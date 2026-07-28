<script lang="ts">
	import { patientStore } from '$lib/state/patients.svelte';
	import { encounterStore } from '$lib/state/encounters.svelte';
	import { Input } from '$lib/components/ui/input';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardContent,
		CardDescription,
		CardFooter
	} from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import QrCode from '$lib/components/QrCode.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Search, Printer, User, FolderOpen, Scan, FileText, ArrowRight, MoreHorizontal, ChevronLeft, ChevronRight, ArrowUpDown } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let searchTerm = $state('');
	let selectedPatientForQr = $state<any>(null);
	let isSaving = $state(false);
	let currentPage = $state(1);
	let pageSize = $state(10);
	let sortColumn = $state('name');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	const results = $derived(searchTerm ? patientStore.search(searchTerm) : patientStore.items);

	const sortedResults = $derived.by(() => {
		let res = [...results];
		res.sort((a: any, b: any) => {
			let valA = a[sortColumn];
			let valB = b[sortColumn];
			if (sortColumn === 'lastVisit') {
				const encA = encounterStore.items.filter((e) => e.patientId === a.id).sort((x, y) => y.visitDate - x.visitDate)[0];
				const encB = encounterStore.items.filter((e) => e.patientId === b.id).sort((x, y) => y.visitDate - x.visitDate)[0];
				valA = encA ? new Date(encA.visitDate).getTime() : 0;
				valB = encB ? new Date(encB.visitDate).getTime() : 0;
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
		// Reset page when search changes
		searchTerm;
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

	function handlePrintQr(patient: any) {
		selectedPatientForQr = patient;
		setTimeout(() => {
			if (typeof window !== 'undefined') window.print();
		}, 100);
	}

	function getLastVisit(patientId: string) {
		const encounters = encounterStore.items.filter((e) => e.patientId === patientId).sort((x, y) => y.visitDate - x.visitDate);
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
		const rows = sortedResults.map(p => [
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
			...rows.map(row => row.map(cell => `"${cell}"`).join(','))
		].join('\n');
		
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', `patients_registry_${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<svelte:head>
	<title>Patients Registry — ClinicFlow</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="p-2.5 rounded-xl bg-primary/10 text-primary">
				<FolderOpen class="size-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground tracking-tight">Patients Registry</h1>
				<p class="text-muted-foreground text-sm mt-0.5 font-medium">
					Manage and view all registered patient files
				</p>
			</div>
		</div>
		<div class="flex items-center gap-3 w-full md:w-auto">
			<div class="relative flex-1 md:w-80">
				<Search class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
				<Input
					bind:value={searchTerm}
					placeholder="Search by name, ID or phone..."
					class="pl-9 h-11 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
				/>
			</div>
			<Button variant="outline" class="h-11 border-border" onclick={exportCsv}>
				<FileText class="size-4 mr-2" />
				Export
			</Button>
			<Button variant="outline" class="h-11 border-border" onclick={() => window.print()}>
				<Printer class="size-4 mr-2" />
				Print
			</Button>
		</div>
	</div>

	<Card class="overflow-hidden card-hover flex flex-col">
		<CardHeader class="border-b border-border bg-muted/20 px-6 py-4">
			<CardTitle class="text-base font-semibold">Registered Patient Files</CardTitle>
			<CardDescription>Offline-first copy of clinic registration registry</CardDescription>
		</CardHeader>

		<ScrollArea class="h-[500px] w-full border-b border-border">
			<Table>
				<TableHeader class="bg-muted/40 sticky top-0 z-10">
					<TableRow class="hover:bg-transparent">
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider cursor-pointer hover:text-foreground"
							onclick={() => toggleSort('clinicId')}
						>
							<div class="flex items-center gap-1">
								Clinic ID
								<ArrowUpDown class="size-3 opacity-50" />
							</div>
						</TableHead>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider cursor-pointer hover:text-foreground"
							onclick={() => toggleSort('name')}
						>
							<div class="flex items-center gap-1">
								Full Name
								<ArrowUpDown class="size-3 opacity-50" />
							</div>
						</TableHead>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider cursor-pointer hover:text-foreground"
							onclick={() => toggleSort('phone')}
						>
							<div class="flex items-center gap-1">
								Phone
								<ArrowUpDown class="size-3 opacity-50" />
							</div>
						</TableHead>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider"
							>Sex</TableHead
						>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider"
							>Age</TableHead
						>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-xs uppercase tracking-wider cursor-pointer hover:text-foreground"
							onclick={() => toggleSort('lastVisit')}
						>
							<div class="flex items-center gap-1">
								Last Visit
								<ArrowUpDown class="size-3 opacity-50" />
							</div>
						</TableHead>
						<TableHead
							class="font-semibold text-muted-foreground px-6 py-3.5 text-right w-16 text-xs uppercase tracking-wider"
							></TableHead
						>
					</TableRow>
				</TableHeader>
				<TableBody class="animate-stagger">
					{#if paginatedResults.length === 0}
						<TableRow>
							<TableCell colspan={7} class="text-center py-16 text-muted-foreground">
								<div class="flex flex-col items-center justify-center">
									<User class="size-8 text-muted-foreground/60 mb-2" />
									<span class="text-sm font-medium">No patient records found</span>
								</div>
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedResults as patient (patient.id)}
							<TableRow class="hover:bg-muted/40 border-b border-border transition-colors group">
								<TableCell class="font-mono font-bold text-primary px-6 py-4 text-sm"
									>{patient.clinicId}</TableCell
								>
								<TableCell class="font-semibold text-foreground px-6 py-4 text-sm"
									>{patient.name}</TableCell
								>
								<TableCell class="text-muted-foreground px-6 py-4 text-sm"
									>{patient.phone ?? '—'}</TableCell
								>
								<TableCell class="text-muted-foreground px-6 py-4 uppercase text-xs font-semibold"
									>{patient.sex}</TableCell
								>
								<TableCell class="text-muted-foreground px-6 py-4 text-sm"
									>{getAge(patient.dob)}</TableCell
								>
								<TableCell class="text-muted-foreground px-6 py-4 text-sm"
									>{getLastVisit(patient.id)}</TableCell
								>
								<TableCell class="px-6 py-4 text-right">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
											<span class="sr-only">Open menu</span>
											<MoreHorizontal class="h-4 w-4" />
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Label>Actions</DropdownMenu.Label>
											<DropdownMenu.Item onSelect={() => goto(`/admin/patients/${patient.id}`)}>
												<User class="mr-2 size-4" />
												View Profile
											</DropdownMenu.Item>
											<DropdownMenu.Item onSelect={() => goto(`/admin/patients/${patient.id}/history`)}>
												<FileText class="mr-2 size-4" />
												Medical History
											</DropdownMenu.Item>
											<DropdownMenu.Separator />
											<Dialog>
												<DialogTrigger class="w-full flex items-center justify-start rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
													<Scan class="mr-2 size-4" />
													Scan ID Card
												</DialogTrigger>
												<DialogContent class="bg-card border-border max-w-sm text-center">
													<DialogHeader>
														<DialogTitle class="text-foreground text-lg font-bold"
															>{patient.name}</DialogTitle
														>
														<DialogDescription class="font-mono text-xs"
															>{patient.clinicId}</DialogDescription
														>
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
														class="flex justify-end gap-2 print:hidden border-t border-border/60 pt-3"
													>
														<Button
															class="bg-primary text-primary-foreground hover:bg-primary/95 btn-press h-9 text-xs"
															onclick={() => handlePrintQr(patient)}
														>
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
		<CardFooter class="flex items-center justify-between p-4 bg-muted/10">
			<div class="text-sm text-muted-foreground font-medium">
				Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedResults.length)} of {sortedResults.length} records
			</div>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="icon"
					disabled={currentPage === 1}
					onclick={() => currentPage--}
					class="size-8"
				>
					<ChevronLeft class="size-4" />
				</Button>
				<span class="text-sm font-medium px-2">Page {currentPage} of {totalPages}</span>
				<Button
					variant="outline"
					size="icon"
					disabled={currentPage >= totalPages}
					onclick={() => currentPage++}
					class="size-8"
				>
					<ChevronRight class="size-4" />
				</Button>
			</div>
		</CardFooter>
	</Card>
</div>
