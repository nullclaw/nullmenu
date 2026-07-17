<script>
	import { page } from '$app/state';
	import { site, products } from '$lib/site';

	let { data, children } = $props();

	const isMenu = site.kind === 'menu';
	let navOpen = $state(false);

	const current = $derived(page.url.pathname);

	$effect(() => {
		current;
		navOpen = false;
	});
</script>

<div class="docs container">
	<button class="nav-toggle mono" onclick={() => (navOpen = !navOpen)} aria-expanded={navOpen}>
		{navOpen ? 'close' : 'menu'} — docs
	</button>

	<nav class="sidebar" class:open={navOpen} aria-label="Documentation">
		<a
			href="/docs/"
			class="cookbook-link serif-i"
			class:active={current === '/docs/'}
			aria-current={current === '/docs/' ? 'page' : undefined}
		>
			The cookbook
		</a>
		{#each data.tree as section}
			<div class="group">
				<h2 class="label">{section.title}</h2>
				<ul>
					{#each section.pages as p}
						{@const href = `/docs/${section.slug}/${p.slug}/`}
						<li>
							<a {href} class:active={current === href} aria-current={current === href ? 'page' : undefined}>{p.title}</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}

		{#if isMenu}
			<div class="group">
				<h2 class="label">Products</h2>
				<ul>
					{#each products as p}
						<li>
							<a href="https://{p.domain}/docs/" class="ext-link">
								{p.display} <span aria-hidden="true">&nearr;</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</nav>

	<div class="content">
		{@render children()}
	</div>
</div>

<style>
	.docs {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
		gap: 3.5rem;
		align-items: start;
		padding-block: 2.5rem var(--section-pad-sm);
	}

	.nav-toggle {
		display: none;
	}

	.sidebar {
		position: sticky;
		top: calc(var(--header-h) + 2rem);
		max-height: calc(100vh - var(--header-h) - 4rem);
		overflow-y: auto;
		padding: 6px 1rem 0 6px;
		margin-left: -6px;
		scrollbar-width: thin;
	}

	.cookbook-link {
		font-size: 1.35rem;
		color: var(--ink);
		display: block;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--line);
		margin-bottom: 1.5rem;
	}

	.cookbook-link:hover,
	.cookbook-link.active {
		color: var(--accent);
	}

	.group {
		margin-bottom: 1.75rem;
	}

	.group h2 {
		margin-bottom: 0.75rem;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
	}

	li a {
		display: block;
		font-size: var(--text-sm);
		color: var(--ink-2);
		padding: 0.35rem 0 0.35rem 0.9rem;
		border-left: 1px solid var(--line);
		transition: color 0.2s, border-color 0.2s;
	}

	li a:hover {
		color: var(--ink);
		border-left-color: var(--ink-3);
	}

	li a.active {
		color: var(--accent);
		border-left-color: var(--accent);
	}

	.ext-link span {
		font-size: 0.8em;
		opacity: 0.6;
	}

	@media (max-width: 900px) {
		.docs {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.nav-toggle {
			display: block;
			border: 1px solid var(--line-2);
			padding: 0.6em 1.2em;
			font-size: var(--text-xs);
			letter-spacing: 0.12em;
			text-transform: uppercase;
			color: var(--ink-2);
			width: fit-content;
		}

		.sidebar {
			display: none;
			position: static;
			max-height: none;
			border: 1px solid var(--line);
			padding: 1.5rem;
			background: var(--bg-2);
		}

		.sidebar.open {
			display: block;
		}
	}
</style>
