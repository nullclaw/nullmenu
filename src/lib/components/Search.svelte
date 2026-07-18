<script>
	/**
	 * Docs search — Pagefind over the static build, opened with ⌘K or /.
	 * The index is generated at build time (scripts/build-all.js); in dev the
	 * modal explains itself instead of erroring.
	 */
	import { requestSearch, searchState } from '$lib/search.svelte.js';
	import {
		inertElements,
		lockPageScroll,
		searchShortcutLabel,
		trapTab
	} from './overlay.js';

	let query = $state('');
	let results = $state([]);
	let sel = $state(-1);
	let unavailable = $state(false);
	let ready = $state(false);
	let searching = $state(false);
	let input = $state();
	let panel = $state();
	let shortcut = $state('Ctrl K');
	let lastFocus = null;

	let pagefind = null;
	let debounceTimer;
	let requestId = 0;
	const scrollLock = Symbol('search');

	async function ensurePagefind() {
		if (pagefind || unavailable) return;
		try {
			// runtime asset from the static build — keep it opaque to Vite
			const url = '/pagefind/pagefind.js';
			pagefind = await import(/* @vite-ignore */ `${url}`);
			await pagefind.init?.();
			ready = true;
			if (query.trim()) run(query); // replay what was typed while loading
		} catch {
			unavailable = true;
		}
	}

	async function run(q) {
		const id = ++requestId;
		const normalized = q.trim();
		if (!pagefind || !normalized) {
			results = [];
			sel = -1;
			if (!normalized) searching = false;
			return;
		}
		try {
			const res = await pagefind.search(normalized);
			const next = await Promise.all(res.results.slice(0, 8).map((r) => r.data()));
			if (id !== requestId || normalized !== query.trim()) return;
			results = next;
			sel = next.length ? 0 : -1;
			searching = false;
		} catch {
			if (id !== requestId) return;
			results = [];
			sel = -1;
			searching = false;
			unavailable = true;
		}
	}

	$effect(() => {
		const q = query;
		clearTimeout(debounceTimer);
		if (!q.trim()) {
			results = [];
			sel = -1;
			searching = false;
		} else if (ready) {
			searching = true;
		}
		debounceTimer = setTimeout(() => run(q), 120);
		return () => clearTimeout(debounceTimer);
	});

	$effect(() => {
		shortcut = searchShortcutLabel();
	});

	$effect(() => {
		if (!searchState.open) return;
		lastFocus = document.activeElement;
		ensurePagefind();
		const releaseScroll = lockPageScroll(scrollLock);
		let releaseInert = () => {};
		let cancelled = false;

		requestAnimationFrame(() => {
			if (cancelled) return;
			input?.focus();
			releaseInert = inertElements([
				document.querySelector('header'),
				document.querySelector('main'),
				document.querySelector('footer')
			]);
		});

		return () => {
			cancelled = true;
			releaseInert();
			releaseScroll();
			if (lastFocus?.isConnected) requestAnimationFrame(() => lastFocus?.focus?.());
		};
	});

	$effect(() => {
		function onKey(e) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				if (searchState.open || searchState.opening) {
					searchState.opening = false;
					searchState.open = false;
				} else requestSearch();
				return;
			}
			if (e.key === 'Escape' && (searchState.open || searchState.opening)) {
				e.preventDefault();
				searchState.opening = false;
				searchState.open = false;
				return;
			}
			if (!searchState.open) {
				if (
					e.key === '/' &&
					!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) &&
					!document.activeElement?.matches?.('[contenteditable]:not([contenteditable="false"])')
				) {
					e.preventDefault();
					requestSearch();
				}
				return;
			}
			if (e.key === 'Tab') {
				trapTab(e, panel);
				return;
			}

			const links = panel ? [...panel.querySelectorAll('[data-search-result]')] : [];
			const focusedIndex = links.indexOf(document.activeElement);
			if (e.key === 'ArrowDown' && (document.activeElement === input || focusedIndex >= 0)) {
				e.preventDefault();
				const next = focusedIndex < 0 ? 0 : Math.min(focusedIndex + 1, links.length - 1);
				if (links[next]) {
					sel = next;
					links[next].focus();
				}
			}
			if (e.key === 'ArrowUp' && focusedIndex >= 0) {
				e.preventDefault();
				if (focusedIndex === 0) input?.focus();
				else {
					sel = focusedIndex - 1;
					links[focusedIndex - 1].focus();
				}
			}
			if (e.key === 'Enter' && document.activeElement === input && results[sel]) {
				e.preventDefault();
				searchState.open = false;
				window.location.href = results[sel].url;
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function pathOf(url) {
		try {
			return new URL(url, location.origin).pathname;
		} catch {
			return url;
		}
	}

	function useSuggestion(suggestion) {
		query = suggestion;
		requestAnimationFrame(() => input?.focus());
	}
</script>

{#if searchState.open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="overlay"
		data-search-overlay
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && (searchState.open = false)}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={panel}
			class="panel"
			role="dialog"
			aria-modal="true"
			aria-labelledby="search-title"
			aria-describedby="search-status"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="panel-head mono">
				<span id="search-title">Search documentation</span>
				<span aria-hidden="true">documentation search</span>
			</div>
			<div class="field">
				<span class="glyph mono" aria-hidden="true">⌕</span>
				<input
					bind:this={input}
					bind:value={query}
					type="search"
					placeholder="Search the docs…"
					aria-label="Search the docs"
					aria-controls={results.length ? 'search-results' : undefined}
					aria-describedby="search-status"
					autocomplete="off"
					spellcheck="false"
				/>
				<button class="close" onclick={() => (searchState.open = false)} aria-label="Close search">
					<span aria-hidden="true">×</span>
					<kbd class="mono">esc</kbd>
				</button>
			</div>

			<p id="search-status" class="sr-only" role="status" aria-live="polite" aria-atomic="true">
				{#if unavailable}
					Search is unavailable.
				{:else if query.trim() && !ready}
					Loading the search index.
				{:else if searching}
					Searching for {query}.
				{:else if query.trim()}
					{results.length} {results.length === 1 ? 'result' : 'results'} for {query}.
				{:else}
					Type to search the documentation.
				{/if}
			</p>

			{#if !query.trim()}
				<div class="empty-state">
					<p class="empty-title serif">Find the right page.</p>
					<p class="empty-copy">Try a component, command, setting, or error message.</p>
					<div class="suggestions" aria-label="Suggested searches">
						{#each ['install', 'configuration', 'troubleshooting'] as suggestion}
							<button class="mono" onclick={() => useSuggestion(suggestion)}>{suggestion}</button>
						{/each}
					</div>
				</div>
			{:else if unavailable}
				<p class="hint mono">the search index is baked at build time — run a production build</p>
			{:else if query.trim() && !ready}
				<p class="hint mono">warming up…</p>
			{:else if searching}
				<p class="hint mono">searching the index…</p>
			{:else if query.trim() && results.length === 0}
				<p class="hint mono">No results for “{query}”</p>
			{:else if results.length}
				<ul id="search-results" aria-label="Search results">
					{#each results as r, i}
						<li>
							<a
								href={r.url}
								data-search-result
								class:selected={sel === i}
								onmouseenter={() => (sel = i)}
								onfocus={() => (sel = i)}
								onclick={() => (searchState.open = false)}
							>
								<span class="title serif">{r.meta?.title ?? 'Untitled'}</span>
								<span class="path mono">{pathOf(r.url)}</span>
								<span class="excerpt">{@html r.excerpt}</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			<div class="foot mono">
				<span>↑↓ navigate</span>
				<span>↵ open</span>
				<span>{shortcut} toggle</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 300;
		background: color-mix(in srgb, var(--bg) 55%, transparent);
		backdrop-filter: blur(7px);
		-webkit-backdrop-filter: blur(7px);
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 14vh var(--pad) 2rem;
	}

	.panel {
		position: relative;
		width: min(34rem, 100%);
		background: var(--bg);
		border: 1px solid var(--line-2);
		box-shadow: 0 32px 90px -24px rgba(0, 0, 0, 0.72);
		display: flex;
		flex-direction: column;
		max-height: 70vh;
	}

	.panel::before {
		content: '';
		position: absolute;
		inset: -1px -1px auto;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--accent), transparent);
		opacity: 0.75;
	}

	.panel-head {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem 0.45rem;
		font-size: 0.75rem;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.panel-head span:first-child {
		color: var(--accent);
	}

	.field {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.25rem 0.5rem 0.5rem 1rem;
		border-bottom: 1px solid var(--line);
		transition: border-color 0.2s var(--ease-out);
	}

	.field:focus-within {
		border-bottom-color: var(--accent);
	}

	.glyph {
		color: var(--ink-3);
		font-size: 1.1rem;
	}

	input {
		flex: 1;
		background: none;
		border: none;
		color: var(--ink);
		font-family: var(--font-sans);
		font-size: 1.05rem;
		padding: 0.65rem 0;
		outline: none;
	}

	input::placeholder {
		color: var(--ink-3);
	}

	input::-webkit-search-cancel-button {
		display: none;
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		min-width: 44px;
		min-height: 44px;
		color: var(--ink-3);
		transition: color 0.2s var(--ease-out), background 0.2s var(--ease-out);
	}

	.close > span {
		font-size: 1.25rem;
		line-height: 1;
	}

	.close:hover {
		color: var(--accent);
		background: var(--bg-2);
	}

	kbd {
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-3);
		border: 1px solid var(--line);
		border-radius: 4px;
		padding: 0.2em 0.5em;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0.4rem;
		overflow-y: auto;
	}

	li a {
		display: block;
		min-height: 68px;
		padding: 0.75rem 0.85rem;
		border-radius: 2px;
		transition: background 0.15s var(--ease-out);
	}

	li a.selected {
		background: var(--bg-3);
	}

	.title {
		display: block;
		font-size: 1.1rem;
		color: var(--ink);
	}

	li a.selected .title {
		color: var(--accent);
	}

	.path {
		display: block;
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		color: var(--ink-3);
		margin-top: 0.15rem;
	}

	.excerpt {
		display: block;
		font-size: var(--text-sm);
		color: var(--ink-2);
		margin-top: 0.35rem;
		line-height: 1.5;
	}

	.excerpt :global(mark) {
		background: none;
		color: var(--accent);
		font-weight: 560;
	}

	.hint {
		padding: 1.25rem 1rem;
		font-size: var(--text-xs);
		color: var(--ink-3);
		letter-spacing: 0.06em;
	}

	.empty-state {
		padding: 1.35rem 1rem 1.5rem;
	}

	.empty-title {
		font-size: 1.55rem;
		line-height: 1.1;
		color: var(--ink);
	}

	.empty-copy {
		margin-top: 0.35rem;
		font-size: var(--text-sm);
		line-height: 1.5;
		color: var(--ink-2);
	}

	.suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-top: 1rem;
	}

	.suggestions button {
		min-height: 44px;
		padding: 0.65rem 0.8rem;
		border: 1px solid var(--line-2);
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		color: var(--ink-2);
		transition: color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), background 0.2s var(--ease-out);
	}

	.suggestions button:hover {
		color: var(--accent);
		border-color: var(--accent-dim);
		background: var(--bg-2);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	.foot {
		display: flex;
		gap: 1.5rem;
		padding: 0.6rem 1rem;
		border-top: 1px solid var(--line);
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	@media (max-width: 560px) {
		.overlay {
			padding: 0;
			align-items: stretch;
		}
		.panel {
			width: 100%;
			height: 100dvh;
			max-height: 100dvh;
			border-inline: 0;
			border-top: 0;
			box-shadow: none;
		}
		.panel-head {
			padding-top: max(0.75rem, env(safe-area-inset-top));
		}
		.close kbd {
			display: none;
		}
		.foot {
			display: none;
		}
	}
</style>
