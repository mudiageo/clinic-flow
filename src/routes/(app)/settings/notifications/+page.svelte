<script lang="ts">
	import { authStore } from '#lib/state/auth.svelte.ts';
	import NotificationPreferencesForm from './notification-preferences-form.svelte';
</script>

<div class="space-y-6">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">Notification Settings</h1>
		<p class="text-muted-foreground mt-2">Choose what you want to be notified about and how.</p>
	</div>

	{#if !authStore.preferences}
		<div class="space-y-4">
			<div class="h-40 rounded-xl bg-muted animate-pulse"></div>
			<div class="h-40 rounded-xl bg-muted animate-pulse"></div>
		</div>
	{:else}
		<NotificationPreferencesForm
			preferences={authStore.preferences}
			onSave={(prefs) => authStore.updatePreferences(prefs)}
		/>
	{/if}
</div>
