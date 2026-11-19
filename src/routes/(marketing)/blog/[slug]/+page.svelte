<script lang="ts">
	import { page } from '$app/state';
	import { getBlogPost, blogPosts } from '#lib/data/blog-posts';
	import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, Check, User } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button';

	let post = $derived(getBlogPost(page.params.slug ?? ''));
	let relatedPosts = $derived(
		blogPosts.filter((p) => p.slug !== (page.params.slug ?? '')).slice(0, 2)
	);

	let copied = $state(false);

	function copyUrl() {
		navigator.clipboard.writeText(window.location.href);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head>
	{#if post}
		<title>{post.title} — ClinicFlow Blog</title>
		<meta name="description" content={post.summary} />
	{:else}
		<title>Article Not Found — ClinicFlow</title>
	{/if}
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-3xl py-16 md:py-24 space-y-12">
	<!-- Back link -->
	<div>
		<a
			href="/blog"
			class="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
		>
			<ArrowLeft class="size-4" /> Back to all articles
		</a>
	</div>

	{#if post}
		<!-- Article Header -->
		<header class="space-y-6 border-b border-border/60 pb-8">
			<div class="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
				<span class="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
					{post.category}
				</span>
				<span class="flex items-center gap-1">
					<Calendar class="size-3.5" />
					{post.date}
				</span>
				<span>·</span>
				<span class="flex items-center gap-1">
					<Clock class="size-3.5" />
					{post.readTime}
				</span>
			</div>

			<h1 class="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
				{post.title}
			</h1>

			<p class="text-lg text-muted-foreground leading-relaxed">
				{post.summary}
			</p>

			<!-- Author bar -->
			<div class="flex items-center justify-between pt-4">
				<div class="flex items-center gap-3">
					<div
						class="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm"
					>
						MA
					</div>
					<div>
						<p class="font-bold text-sm text-foreground">{post.author.name}</p>
						<p class="text-xs text-muted-foreground">{post.author.role}</p>
					</div>
				</div>

				<Button onclick={copyUrl} variant="outline" size="sm" class="rounded-full gap-1.5 text-xs">
					{#if copied}
						<Check class="size-3.5 text-primary" /> Link Copied
					{:else}
						<Share2 class="size-3.5" /> Share
					{/if}
				</Button>
			</div>
		</header>

		<!-- Article Body -->
		<article
			class="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6 leading-relaxed"
		>
			{#each post.content as paragraph}
				<p class="text-muted-foreground text-base md:text-lg leading-relaxed">
					{paragraph}
				</p>
			{/each}
		</article>

		<!-- Author Box -->
		<section class="rounded-3xl border border-border bg-card p-8 md:p-10 space-y-4 shadow-sm">
			<h3 class="text-xs font-bold uppercase tracking-widest text-primary">About the Author</h3>
			<div class="space-y-2">
				<p class="font-bold text-lg text-foreground">{post.author.name}</p>
				<p class="text-sm text-muted-foreground leading-relaxed">
					Mudiaga is a 500-level Computer Engineering student at the University of Benin (UNIBEN)
					and the founder of Mudiageo Technologies. He built ClinicFlow alone over 2.5 months,
					winning 2nd place at the 3MTT/IdentArk AI Hackathon and achieving Top 5 Finalist status at
					the NextGen Knowledge Showcase in partnership with Stripe.
				</p>
			</div>
		</section>

		<!-- Related Articles -->
		{#if relatedPosts.length > 0}
			<section class="pt-8 border-t border-border/60 space-y-6">
				<h3 class="text-xl font-bold text-foreground">Related Articles</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{#each relatedPosts as rel}
						<a
							href="/blog/{rel.slug}"
							class="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors space-y-2 group block"
						>
							<span class="text-xs text-primary font-semibold">{rel.category}</span>
							<h4
								class="font-bold text-base text-foreground group-hover:text-primary transition-colors"
							>
								{rel.title}
							</h4>
							<p class="text-xs text-muted-foreground line-clamp-2">{rel.summary}</p>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{:else}
		<div class="text-center py-24 space-y-4">
			<h2 class="text-2xl font-bold text-foreground">Article Not Found</h2>
			<p class="text-sm text-muted-foreground">The requested article could not be located.</p>
			<Button href="/blog" class="rounded-full">Back to Blog</Button>
		</div>
	{/if}
</div>
