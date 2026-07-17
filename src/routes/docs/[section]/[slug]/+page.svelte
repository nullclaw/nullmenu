<script>
	import { site } from '$lib/site';
	import Seo from '$lib/components/Seo.svelte';

	let { data } = $props();

	const doc = $derived(data.doc);
	const editUrl = $derived(
		`https://github.com/nullclaw/nullmenu/edit/main/content/${site.id}/docs/${doc.section}/${doc.slug}.md`
	);

	let copied = $state(false);
	let currentHeading = $state('');

	// scroll-spy: the TOC follows the reader
	$effect(() => {
		doc; // re-run per page
		currentHeading = '';
		const headings = [...document.querySelectorAll('.prose h2[id], .prose h3[id]')];
		if (!headings.length) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) currentHeading = entry.target.id;
				}
			},
			{ rootMargin: '-72px 0px -70% 0px' }
		);
		headings.forEach((h) => io.observe(h));
		return () => io.disconnect();
	});

	async function copyMarkdown() {
		const status = document.getElementById('sr-status');
		try {
			await navigator.clipboard.writeText(data.raw);
			copied = true;
			if (status) status.textContent = 'Copied to clipboard';
			setTimeout(() => (copied = false), 1800);
		} catch {
			if (status) status.textContent = 'Copy failed';
		}
	}
</script>

<Seo title="{doc.title} — {site.display} docs" description={doc.description} />

<div class="page" class:has-toc={doc.toc.length > 1}>
	<article data-pagefind-body>
		<p class="label label--accent crumb" data-pagefind-ignore>{data.sectionTitle}</p>
		<h1 class="serif">{doc.title}</h1>

		<div class="meta mono" data-pagefind-ignore>
			{#if doc.verified}
				<span class="chip" title="Last verified with this release">verified · {doc.verified}</span>
			{/if}
			<button class="meta-link" onclick={copyMarkdown}>
				{copied ? 'copied ✓' : 'copy as markdown'}
			</button>
			<a class="meta-link" href="/docs/{doc.section}/{doc.slug}.md">.md</a>
			<a class="meta-link" href={editUrl} target="_blank" rel="noopener">edit on github &nearr;</a>
		</div>

		<div class="prose">
			{@html doc.html}
		</div>

		<nav class="pager" aria-label="Previous and next" data-pagefind-ignore>
			{#if data.prev}
				<a class="pager-link prev" href="/docs/{data.prev.section}/{data.prev.slug}/">
					<span class="dir mono">&larr; previous</span>
					<span class="serif-i">{data.prev.title}</span>
				</a>
			{:else}
				<span></span>
			{/if}
			{#if data.next}
				<a class="pager-link next" href="/docs/{data.next.section}/{data.next.slug}/">
					<span class="dir mono">next &rarr;</span>
					<span class="serif-i">{data.next.title}</span>
				</a>
			{/if}
		</nav>
	</article>

	{#if doc.toc.length > 1}
		<aside class="toc" aria-label="On this page">
			<h2 class="label">On this page</h2>
			<ul>
				{#each doc.toc as t}
					<li class="d{t.depth}">
						<a
							href="#{t.id}"
							class:current={currentHeading === t.id}
							aria-current={currentHeading === t.id ? 'true' : undefined}>{t.text}</a
						>
					</li>
				{/each}
			</ul>
		</aside>
	{/if}
</div>

<style>
	.page {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 3rem;
		align-items: start;
	}

	.page.has-toc {
		grid-template-columns: minmax(0, 1fr) 12rem;
	}

	.crumb {
		margin-bottom: 0.75rem;
	}

	h1 {
		font-size: clamp(2.2rem, 5vw, 3.2rem);
		font-weight: 400;
		line-height: 1.1;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
		margin-top: 1.25rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--line);
		margin-bottom: 2rem;
	}

	.chip {
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
		padding: 0.2em 0.7em;
		border-radius: 99px;
	}

	.meta-link {
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-3);
		font-family: var(--font-mono);
		transition: color 0.2s;
		padding: 0;
	}

	.meta-link:hover {
		color: var(--accent);
	}

	.pager {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-top: 4rem;
		border-top: 1px solid var(--line);
		padding-top: 1.5rem;
	}

	.pager-link {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 1rem;
		border: 1px solid var(--line);
		transition: border-color 0.25s, background 0.25s;
	}

	.pager-link:hover {
		border-color: var(--accent-dim);
		background: var(--bg-2);
	}

	.pager-link .dir {
		font-size: 0.65rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.pager-link .serif-i {
		font-size: 1.15rem;
		color: var(--ink);
	}

	.pager-link:hover .serif-i {
		color: var(--accent);
	}

	.next {
		text-align: right;
		align-items: flex-end;
	}

	.toc {
		position: sticky;
		top: calc(var(--header-h) + 2rem);
	}

	.toc h2 {
		margin-bottom: 0.9rem;
	}

	.toc ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.toc a {
		display: block;
		font-size: 0.78rem;
		color: var(--ink-3);
		padding: 0.28rem 0 0.28rem 0.9rem;
		border-left: 1px solid var(--line);
		transition: color 0.2s, border-color 0.2s;
	}

	.toc li.d3 a {
		padding-left: 1.8rem;
	}

	.toc a:hover {
		color: var(--accent);
		border-left-color: var(--accent);
	}

	.toc a.current {
		color: var(--accent);
		border-left-color: var(--accent);
	}

	@media (max-width: 1200px) {
		.page.has-toc {
			grid-template-columns: minmax(0, 1fr);
		}
		.toc {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.pager {
			grid-template-columns: 1fr;
		}
		.next {
			text-align: left;
			align-items: flex-start;
		}
	}
</style>
