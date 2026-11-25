<script lang="ts">
	import { authStore } from '#lib/state/auth.svelte.ts';
	import NotificationPreferencesForm from './notification-preferences-form.svelte';
</script>

<div class="space-y-6">
	<div class="pb-2 border-b border-border">
		<p class="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Account</p>
		<h1 class="text-2xl font-bold tracking-tight text-foreground">Notification Settings</h1>
		<p class="text-sm text-muted-foreground mt-0.5">
			Choose what you want to be notified about and how
		</p>
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
