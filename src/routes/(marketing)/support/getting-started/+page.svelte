<script lang="ts">
	import SupportArticle from '$lib/components/ui/support-article.svelte';
</script>

<svelte:head>
	<title>Quick Start Guide — ClinicFlow Support</title>
</svelte:head>

<SupportArticle>
	<h1>Quick Start Guide</h1>
	<p>Welcome to ClinicFlow. This guide will help you get your Primary Health Centre up and running in minutes.</p>
	
	<h2>1. Initial Setup</h2>
	<p>When you first launch the app, you will be prompted to either register a new PHC or log in to an existing one.</p>
	<ul>
		<li>If you are an admin setting up for the first time, click <strong>Register PHC</strong>.</li>
		<li>You will need an active internet connection just for this initial setup to sync your admin credentials.</li>
	</ul>

	<h2>2. Going Offline</h2>
	<p>ClinicFlow is designed as an <em>offline-first</em> system. Once you are logged in, you can disconnect from the internet and the entire application will continue to function seamlessly on your local network.</p>
	
	<h2>3. Managing Staff</h2>
	<p>Navigate to your Admin Dashboard to invite other nurses, doctors, and pharmacy staff. They can log in on their respective devices.</p>
</SupportArticle>
