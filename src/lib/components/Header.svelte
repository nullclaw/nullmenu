<script>
	import { page } from '$app/state';
	import { site } from '$lib/site';
	import { themeState, toggleTheme } from '$lib/theme.svelte.js';
	import { searchState } from '$lib/search.svelte.js';
	import Logo from './Logo.svelte';

	let scrolled = $state(false);
	let open = $state(false);

	const isMenu = site.kind === 'menu';
	const suffix = isMenu ? 'menu' : site.id;

	const links = [
		...(isMenu ? [{ href: '/products/', label: 'The menu' }] : []),
		{ href: '/docs/', label: 'Docs' },
		...(isMenu ? [] : [{ href: 'https://nullmenu.ai', label: 'The menu', external: true }]),
		{ href: site.github, label: 'GitHub', external: true }
	];

	$effect(() => {
		const onScroll = () => (scrolled = scrollY > 8);
		onScroll();
		addEventListener('scroll', onScroll, { passive: true });
		return () => removeEventListener('scroll', onScroll);
	});

	$effect(() => {
		// close the mobile menu on navigation
		page.url.pathname;
		open = false;
	});
</script>

<header class:scrolled class:open>
	<div class="inner container">
		<div class="left">
			<a class="brand" href="/" aria-label="{site.display} home">
				<Logo size={24} />
				<span class="word mono">null<span class="suffix serif-i">·{suffix}</span></span>
			</a>
			{#if site.version}
				<a
					class="version mono"
					href="{site.github}/releases"
					target="_blank"
					rel="noopener"
					aria-label="Releases — latest {site.version}">{site.version}</a
				>
			{/if}
		</div>

		<nav class="desktop" aria-label="Main">
			{#each links as l}
				{@const active = !l.external && page.url.pathname.startsWith(l.href)}
				<a
					href={l.href}
					class="nav-link mono"
					class:active
					aria-current={active ? 'page' : undefined}
					target={l.external ? '_blank' : undefined}
					rel={l.external ? 'noopener' : undefined}
				>
					{l.label}{#if l.external}<span class="ext">&nearr;</span>{/if}
				</a>
			{/each}

			<button class="search-btn mono" onclick={() => (searchState.open = true)} aria-label="Search docs">
				<span aria-hidden="true">⌕</span>
				<kbd>⌘K</kbd>
			</button>

			<button
				class="theme-toggle"
				onclick={toggleTheme}
				aria-label={themeState.current === 'dark'
					? 'Switch to day service (light theme)'
					: 'Switch to evening service (dark theme)'}
				title={themeState.current === 'dark' ? 'day service' : 'evening service'}
			>
				<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
					<circle cx="9" cy="9" r="6.75" fill="none" stroke="currentColor" stroke-width="1.5" />
					<path class="half" d="M9 2.25 a6.75 6.75 0 0 1 0 13.5 Z" fill="currentColor" />
				</svg>
			</button>
		</nav>

		<button
			class="burger"
			aria-expanded={open}
			aria-label="Toggle navigation"
			onclick={() => (open = !open)}
		>
			<span></span><span></span>
		</button>
	</div>

	{#if open}
		<nav class="mobile" aria-label="Main">
			{#each links as l}
				{@const active = !l.external && page.url.pathname.startsWith(l.href)}
				<a
					href={l.href}
					class="mono"
					class:active
					aria-current={active ? 'page' : undefined}
					target={l.external ? '_blank' : undefined}
					rel={l.external ? 'noopener' : undefined}>{l.label}{#if l.external}&nbsp;&nearr;{/if}</a
				>
			{/each}
			<button class="mobile-theme mono" onclick={() => (searchState.open = true)}>search ⌕</button>
			<button
				class="mobile-theme mono"
				onclick={toggleTheme}
				aria-label={themeState.current === 'dark'
					? 'Switch to day service (light theme)'
					: 'Switch to evening service (dark theme)'}
			>
				{themeState.current === 'dark' ? 'day service' : 'evening service'}
			</button>
		</nav>
	{/if}
</header>

<style>
	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		border-bottom: 1px solid transparent;
		transition: border-color 0.3s var(--ease-out), background-color 0.3s var(--ease-out);
	}

	header.scrolled,
	header.open {
		background: var(--bg-glass);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border-bottom-color: var(--line);
	}

	.inner {
		height: var(--header-h);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
	}

	.left {
		display: flex;
		align-items: center;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		color: var(--ink);
	}

	.brand:hover :global(.slash) {
		animation: slash-redraw 0.7s var(--ease-swift);
	}

	.word {
		font-size: 1.05rem;
		font-weight: 500;
		letter-spacing: 0.02em;
	}

	.suffix {
		color: var(--accent);
		font-size: 1.1em;
	}

	.version {
		font-size: 0.65rem;
		color: var(--ink-3);
		border: 1px solid var(--line);
		padding: 0.15em 0.5em;
		border-radius: 99px;
		letter-spacing: 0.05em;
		margin-left: 0.9rem;
		transform: translateY(1px);
		transition: color 0.2s var(--ease-out), border-color 0.2s var(--ease-out);
	}

	.version:hover {
		color: var(--accent);
		border-color: var(--accent-dim);
	}

	nav.desktop {
		display: flex;
		align-items: center;
		gap: 1.75rem;
	}

	.nav-link {
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-2);
		transition: color 0.2s var(--ease-out);
		position: relative;
	}

	.nav-link:hover,
	.nav-link.active {
		color: var(--accent);
	}

	.nav-link.active::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -6px;
		border-bottom: 1px dotted var(--accent);
	}

	.ext {
		margin-left: 0.3em;
		font-size: 0.85em;
		opacity: 0.7;
	}

	.search-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--ink-2);
		font-size: 0.95rem;
		padding: 0.25rem 0.4rem;
		transition: color 0.2s var(--ease-out);
	}

	.search-btn:hover {
		color: var(--accent);
	}

	.search-btn kbd {
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.08em;
		color: var(--ink-3);
		border: 1px solid var(--line);
		border-radius: 4px;
		padding: 0.15em 0.45em;
	}

	.theme-toggle {
		display: grid;
		place-items: center;
		padding: 0.4rem;
		margin: -0.4rem -0.4rem -0.4rem -0.5rem;
		color: var(--ink-2);
		transition: color 0.3s var(--ease-out);
	}

	.theme-toggle:hover {
		color: var(--accent);
	}

	.theme-toggle svg {
		transition: transform 0.6s var(--ease-swift);
	}

	:global([data-theme='light']) .theme-toggle svg {
		transform: rotate(180deg);
	}

	.mobile-theme {
		font-size: 1.05rem;
		padding: 0.9rem 0;
		border-top: 1px solid var(--line);
		color: var(--ink-2);
		text-align: left;
	}

	.burger {
		display: none;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 6px;
		min-width: 44px;
		min-height: 44px;
		margin-right: -11px;
	}

	.burger span {
		display: block;
		width: 22px;
		height: 1.5px;
		background: var(--ink);
		transition: transform 0.3s var(--ease-swift);
	}

	header.open .burger span:first-child {
		transform: translateY(3.75px) rotate(45deg);
	}

	header.open .burger span:last-child {
		transform: translateY(-3.75px) rotate(-45deg);
	}

	nav.mobile {
		display: flex;
		flex-direction: column;
		padding: 0.5rem var(--pad) 1.5rem;
		gap: 0;
	}

	nav.mobile a {
		font-size: 1.05rem;
		padding: 0.9rem 0;
		border-top: 1px solid var(--line);
		color: var(--ink);
	}

	nav.mobile a.active {
		color: var(--accent);
	}

	@media (max-width: 720px) {
		nav.desktop {
			display: none;
		}
		.burger {
			display: flex;
		}
		.version {
			display: none;
		}
	}
</style>
