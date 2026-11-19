<script lang="ts">
	import { blogPosts } from '#lib/data/blog-posts';
	import { Calendar, Clock, ArrowRight, BookOpen, Sparkles } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button';

	const featuredPost = blogPosts[0];
	const recentPosts = blogPosts.slice(1);
</script>

<svelte:head>
	<title>Blog & Insights — ClinicFlow</title>
	<meta
		name="description"
		content="Articles on offline-first healthcare engineering, rural Primary Health Centre realities in Nigeria, and safe AI clinical decision support."
	/>
</svelte:head>

<div class="container mx-auto px-4 md:px-8 max-w-5xl py-16 md:py-24 space-y-20">
	<!-- Header -->
	<section class="text-center max-w-2xl mx-auto space-y-4">
		<div
			class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary"
		>
			Engineering & Public Health Insights
		</div>
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
			Thoughts on local-first digital health.
		</h1>
		<p class="text-lg text-muted-foreground leading-relaxed">
			Reflections on building resilient software for low-resource clinics, data sovereignty under
			the NDPA, and real-world offline field deployments.
		</p>
	</section>

	<!-- Featured Post Hero -->
	{#if featuredPost}
		<section
			class="rounded-3xl border border-primary/20 bg-primary/5 p-8 md:p-12 space-y-6 shadow-sm"
		>
			<div class="flex items-center gap-3">
				<span
					class="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider"
				>
					Featured Article
				</span>
				<span class="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
					<Calendar class="size-3.5" />
					{featuredPost.date}
				</span>
				<span class="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
					<Clock class="size-3.5" />
					{featuredPost.readTime}
				</span>
			</div>

			<div class="space-y-3">
				<h2
					class="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight hover:text-primary transition-colors"
				>
					<a href="/blog/{featuredPost.slug}">
						{featuredPost.title}
					</a>
				</h2>
				<p class="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
					{featuredPost.summary}
				</p>
			</div>

			<div
				class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-primary/10"
			>
				<div>
					<p class="font-bold text-sm text-foreground">{featuredPost.author.name}</p>
					<p class="text-xs text-muted-foreground">{featuredPost.author.role}</p>
				</div>
				<Button
					href="/blog/{featuredPost.slug}"
					class="rounded-full px-6 font-bold bg-primary text-primary-foreground shadow-sm"
				>
					Read Article <ArrowRight class="ml-2 size-4" />
				</Button>
			</div>
		</section>
	{/if}

	<!-- Recent Articles Grid -->
	<section class="space-y-8">
		<div class="border-b border-border/60 pb-3 flex items-center justify-between">
			<h2 class="text-2xl font-bold text-foreground">Recent Articles</h2>
			<span class="text-xs text-muted-foreground font-medium"
				>All articles written by ClinicFlow engineering</span
			>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			{#each recentPosts as post}
				<article
					class="rounded-3xl border border-border bg-card p-8 flex flex-col justify-between space-y-6 shadow-sm hover:border-primary/40 transition-colors group"
				>
					<div class="space-y-4">
						<div class="flex items-center gap-3 text-xs text-muted-foreground font-medium">
							<span class="px-2.5 py-1 rounded-full bg-muted font-bold text-foreground">
								{post.category}
							</span>
							<span class="flex items-center gap-1">
								<Clock class="size-3.5" />
								{post.readTime}
							</span>
						</div>

						<h3
							class="text-xl font-bold text-foreground group-hover:text-primary transition-colors"
						>
							<a href="/blog/{post.slug}">
								{post.title}
							</a>
						</h3>

						<p class="text-sm text-muted-foreground leading-relaxed">
							{post.summary}
						</p>
					</div>

					<div class="pt-4 border-t border-border/60 flex items-center justify-between">
						<div>
							<p class="font-bold text-xs text-foreground">{post.author.name}</p>
							<p class="text-[11px] text-muted-foreground">{post.date}</p>
						</div>
						<a
							href="/blog/{post.slug}"
							class="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center"
						>
							Read <ArrowRight class="ml-1 size-3.5" />
						</a>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<!-- Newsletter / Updates Card -->
	<section class="rounded-3xl border border-border bg-muted/20 p-8 md:p-12 text-center space-y-4">
		<h3 class="text-2xl font-bold text-foreground">Follow our deployment journey</h3>
		<p class="text-sm text-muted-foreground max-w-md mx-auto">
			We regularly share empirical data, clinical audit results, and offline architecture learnings
			from our Primary Health Centre field trials in Edo State.
		</p>
		<div class="pt-2">
			<Button href="/contact" variant="outline" class="rounded-full font-semibold px-6">
				Subscribe to Clinical Updates
			</Button>
		</div>
	</section>
</div>
