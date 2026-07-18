<script>
	import { site } from '$lib/site';
	import Seo from '$lib/components/Seo.svelte';

	let { data } = $props();
</script>

<Seo
	title="{site.display} documentation"
	description="Guides, workflows and references for {site.display}. Every page has a Markdown twin; llms.txt included."
	breadcrumbs={[
		{ name: site.display, url: `https://${site.domain}/` },
		{ name: 'Documentation', url: `https://${site.domain}/docs/` }
	]}
/>

<header class="head">
	<p class="label label--accent">{site.display} docs</p>
	<h1><span class="serif">Product</span> <span class="serif-i">documentation.</span></h1>
	<p class="sub">
		Task-oriented guides with real commands and verified versions. Machine-readable too —
		<a href="/llms.txt" class="mono">llms.txt</a>,
		<a href="/llms-full.txt" class="mono" rel="nofollow">llms-full.txt</a>, and a
		<span class="mono">.md</span> twin for every page.
	</p>
</header>

{#each data.tree as section}
	<section class="toc-group">
		<h2 class="serif-i">{section.title}</h2>
		<ul>
			{#each section.pages as p}
				<li>
					<a href="/docs/{section.slug}/{p.slug}/">
						<span class="title">{p.title}</span>
						<span class="leaders" aria-hidden="true"></span>
						<span class="desc mono">{p.description}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/each}

<style>
	.head {
		margin-bottom: 3rem;
	}

	h1 {
		font-size: clamp(2.6rem, 6vw, 4.2rem);
		font-weight: 400;
		line-height: 1.05;
		margin-top: 1rem;
	}

	h1 .serif-i {
		color: var(--accent);
	}

	.sub {
		max-width: 36rem;
		color: var(--ink-2);
		margin-top: 1.25rem;
	}

	.toc-group {
		margin-bottom: 2.75rem;
	}

	.toc-group h2 {
		font-size: 1.7rem;
		font-weight: 400;
		margin-bottom: 0.9rem;
		color: var(--ink);
	}

	ul {
		list-style: none;
		padding: 0;
		border-top: 1px solid var(--line);
	}

	li a {
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		padding: 0.8rem 0.5rem;
		border-bottom: 1px solid var(--line);
		transition: background 0.2s var(--ease-out);
	}

	li a:hover {
		background: var(--bg-2);
	}

	.title {
		color: var(--ink);
		font-size: 0.98rem;
		white-space: nowrap;
	}

	li a:hover .title {
		color: var(--accent);
	}

	li a:hover .leaders {
		border-color: var(--accent);
	}

	.desc {
		color: var(--ink-3);
		font-size: 0.8125rem;
		letter-spacing: 0.03em;
		text-align: right;
		max-width: 24rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 720px) {
		.desc {
			display: none;
		}
	}
</style>
