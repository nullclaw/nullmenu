<script>
	import { page } from '$app/state';
	import { site } from '$lib/site';
	import { themeState, toggleTheme } from '$lib/theme.svelte.js';
	import { requestSearch } from '$lib/search.svelte.js';
	import Logo from './Logo.svelte';
	import {
		inertElements,
		lockPageScroll,
		searchShortcutLabel,
		trapTab
	} from './overlay.js';

	let scrolled = $state(false);
	let open = $state(false);
	let burger = $state();
	let mobilePanel = $state();
	let shortcut = $state('Ctrl K');
	const scrollLock = Symbol('main-navigation');

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

	$effect(() => {
		shortcut = searchShortcutLabel();
	});

	$effect(() => {
		function onSearchOpening() {
			if (open) closeMenu(true);
		}
		window.addEventListener('nullmenu:search-opening', onSearchOpening);
		return () => window.removeEventListener('nullmenu:search-opening', onSearchOpening);
	});

	$effect(() => {
		if (!open) return;
		const releaseScroll = lockPageScroll(scrollLock);
		let releaseInert = () => {};
		let cancelled = false;
		const media = matchMedia('(max-width: 880px)');

		requestAnimationFrame(() => {
			if (cancelled) return;
			mobilePanel?.querySelector('a, button')?.focus();
			releaseInert = inertElements([
				document.querySelector('main'),
				document.querySelector('footer')
			]);
		});

		function onKey(event) {
			if (event.key === 'Escape') {
				event.preventDefault();
				closeMenu(true);
			} else if (event.key === 'Tab') {
				trapTab(event, document.querySelector('header'));
			}
		}

		function onBreakpoint(event) {
			if (!event.matches) open = false;
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

	function closeMenu(restoreFocus = false) {
		open = false;
		if (restoreFocus) requestAnimationFrame(() => burger?.focus());
	}

	function openSearch() {
		requestSearch();
	}
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

			<button class="search-btn mono" onclick={requestSearch} aria-label="Search docs">
				<span aria-hidden="true">⌕</span>
				<kbd>{shortcut}</kbd>
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
			bind:this={burger}
			class="burger"
			aria-expanded={open}
			aria-controls="mobile-navigation"
			aria-label={open ? 'Close navigation' : 'Open navigation'}
			onclick={() => (open ? closeMenu(true) : (open = true))}
		>
			<span></span><span></span>
		</button>
	</div>

	{#if open}
		<div class="mobile-layer">
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div
				class="mobile-backdrop"
				aria-hidden="true"
				onclick={() => closeMenu(true)}
			></div>
			<div
				bind:this={mobilePanel}
				id="mobile-navigation"
				class="mobile-panel"
			>
				<div class="mobile-head mono">
					<span>Navigation</span>
				</div>
				<nav class="mobile" aria-label="Main">
					{#each links as l}
						{@const active = !l.external && page.url.pathname.startsWith(l.href)}
						<a
							href={l.href}
							class="mono"
							class:active
							aria-current={active ? 'page' : undefined}
							target={l.external ? '_blank' : undefined}
							rel={l.external ? 'noopener' : undefined}
							onclick={() => closeMenu(false)}>{l.label}{#if l.external}&nbsp;&nearr;{/if}</a
						>
					{/each}
					<button class="mobile-theme mono" onclick={openSearch}>
						<span>search</span><span class="action-detail">⌕ · {shortcut}</span>
					</button>
					<button
						class="mobile-theme mono"
						onclick={toggleTheme}
						aria-label={themeState.current === 'dark'
							? 'Switch to day service (light theme)'
							: 'Switch to evening service (dark theme)'}
					>
						<span>{themeState.current === 'dark' ? 'day service' : 'evening service'}</span>
						<span class="action-detail" aria-hidden="true">theme</span>
					</button>
				</nav>
				<p class="mobile-note mono">Local tools. Quiet infrastructure.</p>
			</div>
		</div>
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

	header.open {
		background: var(--bg);
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}

	.inner {
		position: relative;
		z-index: 2;
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
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		min-height: 54px;
		font-size: 1.05rem;
		padding: 0.8rem var(--pad);
		border-top: 1px solid var(--line);
		color: var(--ink-2);
		text-align: left;
	}

	.mobile-theme:hover {
		color: var(--accent);
		background: var(--bg-2);
	}

	.action-detail {
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-3);
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

	.mobile-layer {
		position: fixed;
		inset: var(--header-h) 0 0;
		z-index: 1;
		display: flex;
		justify-content: flex-end;
	}

	.mobile-backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		background: color-mix(in srgb, var(--bg) 72%, transparent);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		cursor: default;
	}

	.mobile-panel {
		position: relative;
		display: flex;
		flex-direction: column;
		width: min(29rem, 100%);
		height: 100%;
		overflow-y: auto;
		overscroll-behavior: contain;
		background:
			linear-gradient(135deg, var(--accent-glow), transparent 42%),
			var(--bg);
		border-left: 1px solid var(--line-2);
		box-shadow: -28px 0 80px -34px rgba(0, 0, 0, 0.78);
		animation: drawer-in 0.34s var(--ease-out) both;
	}

	.mobile-head {
		display: flex;
		align-items: center;
		min-height: 52px;
		padding-inline: var(--pad);
		border-bottom: 1px solid var(--line-2);
		font-size: 0.65rem;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--accent);
	}

	nav.mobile {
		display: flex;
		flex-direction: column;
		padding: 0.8rem 0 1.5rem;
		gap: 0;
	}

	nav.mobile a {
		display: flex;
		align-items: center;
		min-height: 54px;
		font-size: 1.05rem;
		padding: 0.8rem var(--pad);
		border-top: 1px solid var(--line);
		color: var(--ink);
		transition: color 0.2s var(--ease-out), background 0.2s var(--ease-out);
	}

	nav.mobile a:hover,
	nav.mobile a.active {
		color: var(--accent);
		background: var(--bg-2);
	}

	.mobile-note {
		margin: auto var(--pad) 0;
		padding: 1.25rem 0 max(1.25rem, env(safe-area-inset-bottom));
		border-top: 1px solid var(--line);
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	@keyframes drawer-in {
		from {
			opacity: 0;
			transform: translateX(1.5rem);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (max-width: 880px) {
		nav.desktop {
			display: none;
		}
		.burger {
			display: flex;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mobile-panel {
			animation: none;
		}
	}

	@media (max-width: 480px) {
		.version {
			display: none;
		}
	}
</style>
