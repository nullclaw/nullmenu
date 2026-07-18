<script>
	import { page } from '$app/state';
	import { site, products } from '$lib/site';
	import {
		inertElements,
		lockPageScroll,
		trapTab
	} from '$lib/components/overlay.js';

	let { data, children } = $props();

	const isMenu = site.kind === 'menu';
	let navOpen = $state(false);
	let navToggle = $state();
	let sidebar = $state();
	let navClose = $state();
	let content = $state();
	const scrollLock = Symbol('docs-navigation');

	const current = $derived(page.url.pathname);

	$effect(() => {
		current;
		navOpen = false;
	});

	$effect(() => {
		function onSearchOpening() {
			if (navOpen) closeNav(true);
		}
		window.addEventListener('nullmenu:search-opening', onSearchOpening);
		return () => window.removeEventListener('nullmenu:search-opening', onSearchOpening);
	});

	$effect(() => {
		if (!navOpen) return;
		const releaseScroll = lockPageScroll(scrollLock);
		let releaseInert = () => {};
		let cancelled = false;
		const media = matchMedia('(max-width: 900px)');

		requestAnimationFrame(() => {
			if (cancelled) return;
			navClose?.focus();
			releaseInert = inertElements([
				document.querySelector('header'),
				document.querySelector('footer'),
				content
			]);
		});

		function onKey(event) {
			if (event.key === 'Escape') {
				event.preventDefault();
				closeNav(true);
			} else if (event.key === 'Tab') {
				trapTab(event, sidebar);
			}
		}

		function onBreakpoint(event) {
			if (!event.matches) navOpen = false;
		}

		window.addEventListener('keydown', onKey);
		media.addEventListener('change', onBreakpoint);
		return () => {
			cancelled = true;
			window.removeEventListener('keydown', onKey);
			media.removeEventListener('change', onBreakpoint);
			releaseInert();
			releaseScroll();
		};
	});

	function closeNav(restoreFocus = false) {
		navOpen = false;
		if (restoreFocus) requestAnimationFrame(() => navToggle?.focus());
	}
</script>

<div class="docs container">
	<button
		bind:this={navToggle}
		class="nav-toggle mono"
		onclick={() => (navOpen ? closeNav(true) : (navOpen = true))}
		aria-expanded={navOpen}
		aria-controls="docs-navigation"
	>
		{navOpen ? 'close' : 'menu'} — docs
	</button>

	<details class="nojs-docs-navigation" data-pagefind-ignore>
		<summary class="mono">Browse documentation</summary>
		<nav aria-label="Documentation navigation">
			<a href="/docs/" class="serif-i">Docs home</a>
			{#each data.tree as section}
				<div class="nojs-group">
					<h2 class="label">{section.title}</h2>
					{#each section.pages as item}
						<a href="/docs/{section.slug}/{item.slug}/">{item.title}</a>
					{/each}
				</div>
			{/each}
			{#if isMenu}
				<div class="nojs-group">
					<h2 class="label">Product docs</h2>
					{#each products as product}
						<a href="https://{product.domain}/docs/">{product.display}</a>
					{/each}
				</div>
			{/if}
		</nav>
	</details>

	{#if navOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class="nav-backdrop"
			aria-hidden="true"
			onclick={() => closeNav(true)}
		></div>
	{/if}

	<nav
		bind:this={sidebar}
		id="docs-navigation"
		class="sidebar"
		class:open={navOpen}
		aria-label="Documentation"
	>
		<div class="drawer-head mono">
			<div>
				<span class="drawer-kicker">Browse</span>
				<span class="drawer-title">Documentation</span>
			</div>
			<button bind:this={navClose} class="drawer-close" onclick={() => closeNav(true)}>
				<span>close</span><span class="close-mark" aria-hidden="true">×</span>
			</button>
		</div>
		<a
			href="/docs/"
			class="cookbook-link serif-i"
			class:active={current === '/docs/'}
			aria-current={current === '/docs/' ? 'page' : undefined}
			onclick={() => closeNav(false)}
		>
			Docs home
		</a>
		{#each data.tree as section}
			<div class="group">
				<h2 class="label">{section.title}</h2>
				<ul>
					{#each section.pages as p}
						{@const href = `/docs/${section.slug}/${p.slug}/`}
						<li>
							<a
								{href}
								class:active={current === href}
								aria-current={current === href ? 'page' : undefined}
								onclick={() => closeNav(false)}>{p.title}</a
							>
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
							<a href="https://{p.domain}/docs/" class="ext-link" onclick={() => closeNav(false)}>
								{p.display} <span aria-hidden="true">&nearr;</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</nav>

	<div bind:this={content} class="content">
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

	.nojs-docs-navigation {
		display: none;
	}

	.nav-backdrop,
	.drawer-head {
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
		border-bottom: 1px solid var(--line-2);
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
		display: flex;
		align-items: center;
		min-height: 44px;
		font-size: var(--text-sm);
		color: var(--ink-2);
		padding: 0.55rem 0 0.55rem 0.9rem;
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

	.content {
		min-width: 0;
		max-width: 100%;
	}

	@media (max-width: 900px) {
		.docs {
			grid-template-columns: minmax(0, 1fr);
			gap: 1rem;
		}

		.nav-toggle {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-height: 44px;
			border: 1px solid var(--line-2);
			padding: 0.7em 1.2em;
			font-size: var(--text-xs);
			letter-spacing: 0.12em;
			text-transform: uppercase;
			color: var(--ink-2);
			width: fit-content;
			background: var(--bg);
			transition: color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), background 0.2s var(--ease-out);
		}

		:global(html:not(.js)) .nav-toggle {
			display: none;
		}

		:global(html:not(.js)) .nojs-docs-navigation {
			display: block;
			border: 1px solid var(--line-2);
			background: var(--bg-2);
		}

		.nojs-docs-navigation summary {
			display: flex;
			align-items: center;
			min-height: 48px;
			padding: 0.65rem 1rem;
			color: var(--ink);
			cursor: pointer;
			font-size: var(--text-xs);
			letter-spacing: 0.1em;
			text-transform: uppercase;
		}

		.nojs-docs-navigation nav {
			display: grid;
			max-height: min(70vh, 38rem);
			overflow-y: auto;
			padding: 0 1rem 1rem;
		}

		.nojs-docs-navigation nav a {
			display: flex;
			align-items: center;
			min-height: 44px;
			border-bottom: 1px solid var(--line);
			color: var(--ink-2);
		}

		.nojs-group {
			display: grid;
			margin-top: 1rem;
		}

		.nojs-group h2 {
			margin-bottom: 0.25rem;
		}

		.nav-toggle:hover {
			color: var(--accent);
			border-color: var(--accent-dim);
			background: var(--bg-2);
		}

		.nav-backdrop {
			display: block;
			position: fixed;
			inset: var(--header-h) 0 0;
			z-index: 170;
			width: 100%;
			height: calc(100% - var(--header-h));
			background: color-mix(in srgb, var(--bg) 70%, transparent);
			backdrop-filter: blur(8px);
			-webkit-backdrop-filter: blur(8px);
			cursor: default;
		}

		.sidebar {
			display: none;
			position: fixed;
			inset: var(--header-h) 0 0 auto;
			z-index: 180;
			width: min(29rem, 100%);
			max-height: none;
			overflow-y: auto;
			overscroll-behavior: contain;
			border: 0;
			border-left: 1px solid var(--line-2);
			padding: 0 1.25rem max(1.5rem, env(safe-area-inset-bottom));
			margin: 0;
			background:
				linear-gradient(135deg, var(--accent-glow), transparent 38%),
				var(--bg);
			box-shadow: -28px 0 80px -34px rgba(0, 0, 0, 0.78);
		}

		.sidebar.open {
			display: block;
			animation: docs-drawer-in 0.34s var(--ease-out) both;
		}

		.drawer-head {
			display: flex;
			position: sticky;
			top: 0;
			z-index: 1;
			align-items: center;
			justify-content: space-between;
			gap: 1rem;
			min-height: 64px;
			margin: 0 -1.25rem 1.2rem;
			padding-left: 1.25rem;
			border-bottom: 1px solid var(--line-2);
			background: var(--bg);
		}

		.drawer-head > div {
			display: flex;
			flex-direction: column;
			gap: 0.15rem;
		}

		.drawer-kicker,
		.drawer-title {
			font-size: 0.75rem;
			letter-spacing: 0.13em;
			text-transform: uppercase;
		}

		.drawer-kicker {
			color: var(--accent);
		}

		.drawer-title {
			color: var(--ink);
		}

		.drawer-close {
			display: inline-flex;
			align-items: center;
			justify-content: flex-end;
			gap: 0.55rem;
			min-width: 86px;
			min-height: 64px;
			padding: 0 1.25rem 0 0.7rem;
			font-size: 0.75rem;
			letter-spacing: 0.1em;
			text-transform: uppercase;
			color: var(--ink);
		}

		.drawer-close:hover {
			color: var(--accent);
			background: var(--bg-2);
		}

		.close-mark {
			font-family: var(--font-sans);
			font-size: 1.35rem;
			font-weight: 300;
			line-height: 1;
		}

		.cookbook-link {
			min-height: 48px;
			padding: 0.55rem 0 1rem;
		}

		.group {
			margin-bottom: 1.35rem;
		}

		li a {
			display: flex;
			align-items: center;
			min-height: 44px;
			padding-block: 0.55rem;
		}

		@keyframes docs-drawer-in {
			from {
				opacity: 0;
				transform: translateX(1.5rem);
			}
			to {
				opacity: 1;
				transform: none;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sidebar.open {
			animation: none;
		}
	}
</style>
