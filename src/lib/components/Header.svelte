<script>
	import { page } from '$app/state';
	import { site } from '$lib/site';
	import { themeState, themeToggleLabel, toggleTheme } from '$lib/theme.svelte.js';
	import { requestSearch } from '$lib/search.svelte.js';
	import FunctionalIcon from './FunctionalIcon.svelte';
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
	let headerInner = $state();
	let mobilePanel = $state();
	let shortcut = $state('Ctrl K');
	const scrollLock = Symbol('main-navigation');

	const isMenu = site.kind === 'menu';
	const suffix = isMenu ? 'menu' : site.id;

	const links = [
		...(isMenu ? [{ href: '/products/', label: 'The menu' }] : []),
		{ href: '/docs/', label: 'Docs' },
		...(isMenu
			? []
			: [{ href: 'https://nullmenu.ai', label: 'The menu', external: true }]),
		{ href: site.github, label: 'GitHub', external: true, newTab: true }
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
				headerInner,
				document.querySelector('main'),
				document.querySelector('footer')
			]);
		});

		function onKey(event) {
			if (event.key === 'Escape') {
				event.preventDefault();
				closeMenu(true);
			} else if (event.key === 'Tab') {
				trapTab(event, mobilePanel);
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
	<div bind:this={headerInner} class="inner container">
		<div class="left">
			<a class="brand" href="/" aria-label="{site.display} home">
				<Logo size={24} />
				<span class="word mono">null<span class="suffix serif-i">·{suffix}</span></span>
			</a>
			{#if site.version}
				<a
					class="version mono"
					href="{site.github}/releases/tag/{site.version}"
					target="_blank"
					rel="noopener"
					aria-label="Published release {site.version} (opens in a new tab)"
				>
					{site.version}<FunctionalIcon name="external" size={14} />
				</a
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
					target={l.newTab ? '_blank' : undefined}
					rel={l.newTab ? 'noopener' : undefined}
				>
					{l.label}{#if l.newTab}<span class="ext"
							><FunctionalIcon name="external" size={15} label="opens in a new tab" /></span
						>{/if}
				</a>
			{/each}

			<button class="search-btn mono" onclick={requestSearch} aria-label="Search docs">
				<FunctionalIcon name="search" size={18} />
				<kbd>{shortcut}</kbd>
			</button>

			<button
				class="theme-toggle"
				onclick={toggleTheme}
				aria-label={themeToggleLabel()}
				title={themeToggleLabel()}
			>
				<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
					<circle cx="9" cy="9" r="6.75" fill="none" stroke="currentColor" stroke-width="1.5" />
					<path class="half" d="M9 2.25 a6.75 6.75 0 0 1 0 13.5 Z" fill="currentColor" />
				</svg>
				<span class="theme-mode mono" aria-hidden="true">{themeState.mode}</span>
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

	<details class="nojs-navigation" data-pagefind-ignore>
		<summary class="mono">Menu</summary>
		<nav aria-label="Main navigation">
			{#each links as link}
				<a
					href={link.href}
					class="mono"
					target={link.newTab ? '_blank' : undefined}
					rel={link.newTab ? 'noopener' : undefined}
					>{link.label}{#if link.newTab}<span class="ext"
							><FunctionalIcon name="external" size={15} label="opens in a new tab" /></span
						>{/if}</a
				>
			{/each}
		</nav>
	</details>

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
				role="dialog"
				aria-modal="true"
				aria-labelledby="mobile-navigation-title"
				tabindex="-1"
			>
				<div class="mobile-head mono">
					<span id="mobile-navigation-title">Navigation</span>
					<button class="mobile-close" onclick={() => closeMenu(true)} aria-label="Close navigation">
						<span>close</span><FunctionalIcon name="close" size={20} />
					</button>
				</div>
				<nav class="mobile" aria-label="Main">
					{#each links as l}
						{@const active = !l.external && page.url.pathname.startsWith(l.href)}
						<a
							href={l.href}
							class="mono"
							class:active
							aria-current={active ? 'page' : undefined}
							target={l.newTab ? '_blank' : undefined}
							rel={l.newTab ? 'noopener' : undefined}
							onclick={() => closeMenu(false)}>{l.label}{#if l.newTab}<span class="ext"
									><FunctionalIcon
										name="external"
										size={16}
										label="opens in a new tab"
									/></span
								>{/if}</a
						>
					{/each}
					<button class="mobile-theme mono" onclick={openSearch}>
						<span>search</span><span class="action-detail"
							><FunctionalIcon name="search" size={16} /><span>{shortcut}</span></span
						>
					</button>
					<button
						class="mobile-theme mono"
						onclick={toggleTheme}
						aria-label={themeToggleLabel()}
					>
						<span>theme</span>
						<span class="action-detail" aria-hidden="true">
							{themeState.mode}{themeState.mode === 'system' ? ` · ${themeState.current}` : ''}
						</span>
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
		min-height: 44px;
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		font-size: 0.75rem;
		color: var(--ink-3);
		border: 1px solid var(--line);
		padding: 0.15em 0.5em;
		border-radius: 99px;
		letter-spacing: 0.05em;
		margin-left: 0.9rem;
		transform: translateY(1px);
		transition: color 0.2s var(--ease-out), border-color 0.2s var(--ease-out);
		gap: 0.3rem;
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
		display: inline-flex;
		align-items: center;
		min-height: 44px;
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
		display: inline-flex;
		margin-left: 0.35em;
		opacity: 0.7;
		vertical-align: -0.16em;
	}

	.search-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--ink-2);
		font-size: 0.95rem;
		min-height: 44px;
		padding: 0.4rem 0.55rem;
		transition: color 0.2s var(--ease-out);
	}

	.search-btn:hover {
		color: var(--accent);
	}

	.search-btn kbd {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		color: var(--ink-3);
		border: 1px solid var(--line);
		border-radius: 4px;
		padding: 0.15em 0.45em;
	}

	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		min-height: 44px;
		padding: 0.4rem 0.55rem;
		margin: 0 -0.55rem 0 -0.35rem;
		color: var(--ink-2);
		transition: color 0.3s var(--ease-out);
	}

	.theme-toggle:hover {
		color: var(--accent);
	}

	.theme-toggle svg {
		transition: transform 0.6s var(--ease-swift);
	}

	.theme-mode {
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
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
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.75rem;
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

	.nojs-navigation {
		display: none;
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
		justify-content: space-between;
		min-height: 52px;
		padding-inline: var(--pad);
		border-bottom: 1px solid var(--line-2);
		font-size: 0.75rem;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.mobile-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		min-height: 44px;
		min-width: 44px;
		color: var(--ink-2);
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.mobile-close:hover {
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
		font-size: 0.75rem;
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

		header.open .burger {
			visibility: hidden;
		}

		:global(html:not(.js)) .burger {
			display: none;
		}

		:global(html:not(.js)) .nojs-navigation {
			display: block;
			position: absolute;
			right: var(--pad);
			top: 10px;
			z-index: 3;
		}

		.nojs-navigation summary {
			display: flex;
			align-items: center;
			justify-content: center;
			min-width: 64px;
			min-height: 44px;
			border: 1px solid var(--line-2);
			color: var(--ink);
			cursor: pointer;
			font-size: var(--text-xs);
			letter-spacing: 0.12em;
			list-style: none;
			text-transform: uppercase;
		}

		.nojs-navigation summary::-webkit-details-marker {
			display: none;
		}

		.nojs-navigation nav {
			position: fixed;
			top: var(--header-h);
			left: 0;
			right: 0;
			display: grid;
			background: var(--bg);
			border-block: 1px solid var(--line-2);
			box-shadow: 0 22px 42px rgba(0, 0, 0, 0.28);
			padding: 0.5rem var(--pad);
		}

		.nojs-navigation nav a {
			display: flex;
			align-items: center;
			min-height: 48px;
			border-bottom: 1px solid var(--line);
			font-size: var(--text-sm);
			letter-spacing: 0.08em;
			text-transform: uppercase;
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
