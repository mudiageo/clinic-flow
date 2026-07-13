<script lang="ts">
  import { patientStore } from '$lib/state/patients.svelte';
  import { queueStore } from '$lib/state/queue.svelte';
  import QrScanner from '$lib/components/QrScanner.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
  import { Select as SelectPrimitive } from 'bits-ui';
  import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
  import { toast } from 'svelte-sonner';
  import * as Dialog from '$lib/components/ui/dialog';
  import QRCode from 'qrcode';
  import { 
    Search, 
    Camera, 
    Printer, 
    ChevronRight, 
    ChevronLeft, 
    FolderOpen, 
    User, 
    Phone, 
    Calendar, 
    MapPin, 
    Check, 
    Scan,
    Sparkles
  } from '@lucide/svelte';
  import { fade } from 'svelte/transition';

  let showScanner = $state(false);
  let searchQuery = $state('');

  // QR Display
  let showQrDialog = $state(false);
  let registeredPatientInfo = $state<{name: string, clinicId: string} | null>(null);
  let qrCanvas = $state<HTMLCanvasElement | null>(null);

  $effect(() => {
    if (showQrDialog && registeredPatientInfo && qrCanvas) {
      QRCode.toCanvas(qrCanvas, registeredPatientInfo.clinicId, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    }
  });

  // Stepper State
  let currentStep = $state(1);

  // Form Fields
  let fullName = $state('');
  let phone = $state('');
  let dob = $state('');
  let sex = $state<'male' | 'female' | 'other'>('male');
  let isPregnant = $state(false);
  let community = $state('');
  let address = $state('');

  const searchResults = $derived(searchQuery ? patientStore.search(searchQuery) : []);

  function handleQrResult(clinicId: string) {
    showScanner = false;
    const found = patientStore.findByClinicId(clinicId);
    if (found) {
      toast.success(`Found patient: ${found.name}`);
      searchQuery = found.name;
    } else {
      toast.error(`No patient found with Clinic ID: ${clinicId}`);
    }
  }

  async function handleRegister() {
    if (!fullName) {
      toast.error('Full name is required');
      return;
    }

    try {
      // Auto-generate Clinic ID format OR-XXXX-01
      const initialParts = fullName.toUpperCase().split(' ');
      const prefix = initialParts.map(p => p[0] || '').join('').slice(0, 4);
      const rand = Math.floor(10 + Math.random() * 90);
      const clinicId = `OR-${prefix}-${rand}`;

      // Write patient record to local store (IndexedDB)
      const patientId = await patientStore.create({
        clinicId,
        phcId: crypto.randomUUID(), // Stub or current PHC
        familyId: null,
        guardianId: null,
        name: fullName,
        phone: phone || null,
        dob: dob || null,
        sex,
        isPregnant,
        address: address || null,
        community: community || null,
        nextOfKinName: null,
        nextOfKinPhone: null,
        deleted: false,
        serverUpdatedAt: null,
      });

      // Auto-issue a waiting ticket in the queue
      await queueStore.create({
        patientId,
        phcId: crypto.randomUUID(),
        encounterId: null,
        ticketNumber: 0, // Auto-computed sequentially in state
        status: 'waiting',
        triageLevel: 'green',
        triageReason: 'New Registration',
        calledAt: null,
        completedAt: null,
        createdAt: Date.now(),
      });

      toast.success(`Patient ${fullName} registered and queued successfully!`);
      
      registeredPatientInfo = { name: fullName, clinicId };
      showQrDialog = true;

      // Clear form & reset stepper
      fullName = '';
      phone = '';
      dob = '';
      sex = 'male';
      isPregnant = false;
      community = '';
      address = '';
      currentStep = 1;
    } catch (e: any) {
      toast.error(`Failed to register: ${e.message}`);
    }
  }

  function nextStep() {
    if (currentStep === 1 && !fullName) {
      toast.error('Please enter the patient\'s full name');
      return;
    }
    if (currentStep < 3) {
      currentStep += 1;
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep -= 1;
    }
  }
</script>

<svelte:head>
  <title>Register Patient — ClinicFlow</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-8 animate-fade-in">
  <div class="flex items-start gap-3">
    <div class="p-2.5 rounded-xl bg-primary/10 text-primary">
      <FolderOpen class="size-6" />
    </div>
    <div>
      <h1 class="text-2xl font-bold text-foreground tracking-tight">Patient Registry</h1>
      <p class="text-muted-foreground text-sm mt-0.5">Register new patients or search existing records</p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Left Column: Search / QR -->
    <div class="space-y-6 lg:col-span-1">
      <Card class="bg-card/60 card-hover">
        <CardHeader class="pb-3">
          <CardTitle class="text-base font-semibold">Find Patient</CardTitle>
          <CardDescription>Search registry or scan barcode/QR code</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="relative">
            <Search class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
            <Input 
              bind:value={searchQuery}
              placeholder="Search by name/ID..."
              class="pl-9 h-11 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
            />
          </div>

          {#if showScanner}
            <div class="mt-4 border border-border rounded-xl overflow-hidden bg-background p-2">
              <QrScanner onResult={handleQrResult} />
              <Button variant="ghost" class="w-full text-muted-foreground hover:text-foreground mt-2 btn-press" onclick={() => showScanner = false}>
                Cancel Scan
              </Button>
            </div>
          {:else}
            <Button variant="outline" class="w-full border-border text-foreground hover:bg-muted btn-press h-10" onclick={() => showScanner = true}>
              <Scan class="size-4 mr-2" />
              Scan QR Code
            </Button>
          {/if}

          <!-- Search Results List -->
          {#if searchResults.length > 0}
            <div class="space-y-2 mt-4 max-h-60 overflow-y-auto pr-1 no-scrollbar animate-stagger">
              {#each searchResults as patient}
                <a href="/patients/{patient.clinicId}" class="block p-3 bg-muted/40 border border-border rounded-xl transition-all hover:bg-muted/80">
                  <div class="font-medium text-foreground text-sm">{patient.name}</div>
                  <div class="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                    <span class="font-mono">{patient.clinicId}</span>
                    <span>{patient.phone ?? 'No Phone'}</span>
                  </div>
                </a>
              {/each}
            </div>
          {:else if searchQuery}
            <p class="text-xs text-muted-foreground text-center py-4">No matching records found.</p>
          {/if}
        </CardContent>
      </Card>
    </div>

    <!-- Right Column: Multi-Step Registration Form -->
    <div class="lg:col-span-2">
      <Card class="bg-card/60 card-hover overflow-hidden">
        <CardHeader class="pb-4 border-b border-border/60 bg-muted/20">
          <!-- Custom Stepper Progress Header -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <Sparkles class="size-4 text-primary" />
              <CardTitle class="text-base font-semibold">New Patient Registration</CardTitle>
            </div>
            <span class="text-xs font-semibold text-muted-foreground">Step {currentStep} of 3</span>
          </div>
          
          <div class="flex items-center gap-2 w-full">
            <div class="h-1.5 rounded-full flex-1 transition-all duration-350 bg-primary"></div>
            <div class="h-1.5 rounded-full flex-1 transition-all duration-350 {currentStep >= 2 ? 'bg-primary' : 'bg-muted'}"></div>
            <div class="h-1.5 rounded-full flex-1 transition-all duration-350 {currentStep >= 3 ? 'bg-primary' : 'bg-muted'}"></div>
          </div>
        </CardHeader>
        
        <CardContent class="p-6 min-h-[300px] flex flex-col justify-between">
          {#if currentStep === 1}
            <div in:fade={{ duration: 150 }} class="space-y-5">
              <h3 class="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">Step 1: Patient Identity</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="name" class="text-foreground">Full Name</Label>
                  <div class="relative">
                    <User class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                    <Input id="name" bind:value={fullName} placeholder="e.g. Osagie Ighodaro" class="pl-9 h-11 bg-background/50 border-border text-foreground" />
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="phone" class="text-foreground">Phone Number</Label>
                  <div class="relative">
                    <Phone class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                    <Input id="phone" bind:value={phone} placeholder="e.g. 2348012345678" class="pl-9 h-11 bg-background/50 border-border text-foreground" />
                  </div>
                </div>
              </div>
            </div>
          {:else if currentStep === 2}
            <div in:fade={{ duration: 150 }} class="space-y-5">
              <h3 class="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">Step 2: Demographics</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="dob" class="text-foreground">Date of Birth</Label>
                  <div class="relative">
                    <Calendar class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                    <Input id="dob" type="date" bind:value={dob} class="pl-9 h-11 bg-background/50 border-border text-foreground" />
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="sex" class="text-foreground">Sex</Label>
                  <Select type="single" bind:value={sex}>
                    <SelectTrigger class="h-11 bg-background/50 border-border text-foreground">
                      <SelectPrimitive.Value placeholder="Select Sex" />
                    </SelectTrigger>
                    <SelectContent class="bg-card border-border">
                      <SelectItem value="male" class="hover:bg-muted">Male</SelectItem>
                      <SelectItem value="female" class="hover:bg-muted">Female</SelectItem>
                      <SelectItem value="other" class="hover:bg-muted">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          {:else if currentStep === 3}
            <div in:fade={{ duration: 150 }} class="space-y-5">
              <h3 class="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">Step 3: Location & Health Status</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="community" class="text-foreground">Community / Area</Label>
                  <div class="relative">
                    <MapPin class="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                    <Input id="community" bind:value={community} placeholder="e.g. GRA, Ikpoba Hill" class="pl-9 h-11 bg-background/50 border-border text-foreground" />
                  </div>
                </div>

                <div class="space-y-2 flex items-center pt-8">
                  <label class="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      bind:checked={isPregnant} 
                      class="w-5 h-5 rounded border-border bg-background text-primary focus:ring-primary/20 accent-primary" 
                    />
                    <span class="text-sm font-medium text-foreground">Is Patient Pregnant?</span>
                  </label>
                </div>

                <div class="md:col-span-2 space-y-2">
                  <Label for="address" class="text-foreground">Residential Address</Label>
                  <Input id="address" bind:value={address} placeholder="Full street address..." class="h-11 bg-background/50 border-border text-foreground" />
                </div>
              </div>
            </div>
          {/if}

          <!-- Form Navigation Controls -->
          <div class="mt-8 pt-4 border-t border-border/60 flex justify-between gap-3">
            <Button 
              variant="ghost" 
              class="h-11 px-5 text-muted-foreground btn-press" 
              onclick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft class="size-4 mr-1.5" />
              Back
            </Button>

            {#if currentStep < 3}
              <Button 
                class="h-11 px-6 btn-press" 
                onclick={nextStep}
              >
                Continue
                <ChevronRight class="size-4 ml-1.5" />
              </Button>
            {:else}
              <Button 
                onclick={handleRegister} 
                class="h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 btn-press"
              >
                Create &amp; Queue Patient
                <Check class="size-4 ml-1.5" />
              </Button>
            {/if}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>

<!-- QR Print Dialog -->
<Dialog.Root bind:open={showQrDialog}>
  <Dialog.Content class="sm:max-w-md bg-card border-border">
    <Dialog.Header>
      <Dialog.Title class="text-foreground">Patient Registered</Dialog.Title>
      <Dialog.Description class="text-muted-foreground">
        Scan this QR code to quickly retrieve the patient profile.
      </Dialog.Description>
    </Dialog.Header>
    <div class="flex flex-col items-center justify-center py-6 space-y-4">
      <div class="bg-white p-4 rounded-xl shadow-inner border border-border">
        <canvas bind:this={qrCanvas}></canvas>
      </div>
      <div class="text-center">
        <p class="text-foreground font-bold text-lg">{registeredPatientInfo?.name}</p>
        <p class="text-primary font-mono text-sm mt-1">{registeredPatientInfo?.clinicId}</p>
      </div>
    </div>
    <Dialog.Footer class="sm:justify-between gap-2">
      <Button variant="outline" class="border-border text-muted-foreground btn-press" onclick={() => showQrDialog = false}>
        Close
      </Button>
      <Button class="bg-primary text-primary-foreground hover:bg-primary/95 btn-press" onclick={() => window.print()}>
        <Printer class="size-4 mr-1.5" />
        Print ID Card
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
