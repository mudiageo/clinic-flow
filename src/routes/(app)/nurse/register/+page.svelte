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

  let showScanner = $state(false);
  let searchQuery = $state('');

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
      
      // Clear form
      fullName = '';
      phone = '';
      dob = '';
      sex = 'male';
      isPregnant = false;
      community = '';
      address = '';
    } catch (e: any) {
      toast.error(`Failed to register: ${e.message}`);
    }
  }
</script>

<svelte:head>
  <title>Register Patient — ClinicFlow</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
  <div>
    <h1 class="text-3xl font-extrabold text-white tracking-tight">Patient Registry</h1>
    <p class="text-slate-400 mt-1">Register new patients or search existing records</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Left Column: Search / QR -->
    <div class="space-y-6 lg:col-span-1">
      <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
        <CardHeader>
          <CardTitle class="text-white text-lg">Find Patient</CardTitle>
          <CardDescription class="text-slate-400">Search by name, phone or scan QR code</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Input 
            bind:value={searchQuery}
            placeholder="Search..."
            class="bg-slate-950/50 border-slate-800 text-white placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
          />

          {#if showScanner}
            <div class="mt-4">
              <QrScanner onResult={handleQrResult} />
              <Button variant="ghost" class="w-full text-slate-400 hover:text-white mt-2" onclick={() => showScanner = false}>
                Cancel Scan
              </Button>
            </div>
          {:else}
            <Button variant="outline" class="w-full border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800" onclick={() => showScanner = true}>
              📷 Scan QR Code
            </Button>
          {/if}

          <!-- Search Results List -->
          {#if searchResults.length > 0}
            <div class="space-y-2 mt-4 max-h-60 overflow-y-auto">
              {#each searchResults as patient}
                <div class="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                  <div class="font-medium text-white">{patient.name}</div>
                  <div class="text-xs text-slate-500">{patient.clinicId} · {patient.phone ?? 'No Phone'}</div>
                </div>
              {/each}
            </div>
          {:else if searchQuery}
            <p class="text-xs text-slate-500 text-center py-4">No matching records found.</p>
          {/if}
        </CardContent>
      </Card>
    </div>

    <!-- Right Column: Registration Form -->
    <div class="lg:col-span-2">
      <Card class="bg-slate-900/40 border-slate-900 backdrop-blur">
        <CardHeader>
          <CardTitle class="text-white text-lg">New Patient Registration</CardTitle>
          <CardDescription class="text-slate-400">Fill in patient details to create profile and queue ticket</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="space-y-2">
              <Label for="name" class="text-slate-300">Full Name</Label>
              <Input id="name" bind:value={fullName} placeholder="e.g. Osagie Ighodaro" class="h-12 bg-slate-950/50 border-slate-800 text-white" />
            </div>

            <div class="space-y-2">
              <Label for="phone" class="text-slate-300">Phone Number</Label>
              <Input id="phone" bind:value={phone} placeholder="e.g. 2348012345678" class="h-12 bg-slate-950/50 border-slate-800 text-white" />
            </div>

            <div class="space-y-2">
              <Label for="dob" class="text-slate-300">Date of Birth</Label>
              <Input id="dob" type="date" bind:value={dob} class="h-12 bg-slate-950/50 border-slate-800 text-white" />
            </div>

            <div class="space-y-2">
              <Label for="sex" class="text-slate-300">Sex</Label>
              <Select type="single" bind:value={sex}>
                <SelectTrigger class="h-12 bg-slate-950/50 border-slate-800 text-white">
                  <SelectPrimitive.Value placeholder="Select Sex" />
                </SelectTrigger>
                <SelectContent class="bg-slate-950 border-slate-800">
                  <SelectItem value="male" class="text-white hover:bg-slate-900">Male</SelectItem>
                  <SelectItem value="female" class="text-white hover:bg-slate-900">Female</SelectItem>
                  <SelectItem value="other" class="text-white hover:bg-slate-900">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="community" class="text-slate-300">Community / Area</Label>
              <Input id="community" bind:value={community} placeholder="e.g. GRA, Ikpoba Hill" class="h-12 bg-slate-950/50 border-slate-800 text-white" />
            </div>

            <div class="space-y-2 flex items-center pt-8">
              <label class="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" bind:checked={isPregnant} class="w-5 h-5 rounded border-slate-800 bg-slate-950 text-teal-600 focus:ring-teal-500" />
                <span class="text-sm font-medium text-slate-300">Is Patient Pregnant?</span>
              </label>
            </div>

            <div class="md:col-span-2 space-y-2">
              <Label for="address" class="text-slate-300">Residential Address</Label>
              <Input id="address" bind:value={address} placeholder="Full street address..." class="h-12 bg-slate-950/50 border-slate-800 text-white" />
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <Button onclick={handleRegister} class="h-12 px-8 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/10">
              Create & Queue Patient
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>
