<script>
	/**
	 * Docs search — Pagefind over the static build, opened with ⌘K or /.
	 * The index is generated at build time (scripts/build-all.js); in dev the
	 * modal explains itself instead of erroring.
	 */
	import { searchState } from '$lib/search.svelte.js';

	let query = $state('');
	let results = $state([]);
	let sel = $state(0);
	let unavailable = $state(false);
	let ready = $state(false);
	let input = $state();
	let lastFocus = null;

	let pagefind = null;
	let debounceTimer;

	async function ensurePagefind() {
		if (pagefind || unavailable) return;
		try {
			// runtime asset from the static build — keep it opaque to Vite
			const url = '/pagefind/pagefind.js';
			pagefind = await import(/* @vite-ignore */ `${url}`);
			pagefind.init?.();
			ready = true;
			if (query.trim()) run(query); // replay what was typed while loading
		} catch {
			unavailable = true;
		}
	}

	async function run(q) {
		if (!pagefind || !q.trim()) {
			results = [];
			return;
		}
		const res = await pagefind.search(q);
		results = await Promise.all(res.results.slice(0, 8).map((r) => r.data()));
		sel = 0;
	}

	$effect(() => {
		const q = query;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => run(q), 120);
	});

	$effect(() => {
		if (searchState.open) {
			lastFocus = document.activeElement;
			ensurePagefind();
			queueMicrotask(() => input?.focus());
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
			lastFocus?.focus?.();
		}
	});

	$effect(() => {
		function onKey(e) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				searchState.open = !searchState.open;
				return;
			}
			if (!searchState.open) {
				if (
					e.key === '/' &&
					!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) &&
					!document.activeElement?.isContentEditable
				) {
					e.preventDefault();
					searchState.open = true;
				}
				return;
			}
			if (e.key === 'Escape') searchState.open = false;
			if (e.key === 'Tab') {
				const panel = document.querySelector('.panel');
				const focusables = panel ? [...panel.querySelectorAll('input, a[href], button')] : [];
				if (focusables.length) {
					const first = focusables[0];
					const last = focusables[focusables.length - 1];
					if (e.shiftKey && document.activeElement === first) {
						e.preventDefault();
						last.focus();
					} else if (!e.shiftKey && document.activeElement === last) {
						e.preventDefault();
						first.focus();
					}
				}
			}
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				sel = Math.min(sel + 1, results.length - 1);
			}
			if (e.key === 'ArrowUp') {
				e.preventDefault();
				sel = Math.max(sel - 1, 0);
			}
			if (e.key === 'Enter' && results[sel]) {
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
</script>

{#if searchState.open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="overlay" role="presentation" onclick={() => (searchState.open = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
		<div
			class="panel"
			role="dialog"
			aria-modal="true"
			aria-label="Search documentation"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="field">
				<span class="glyph mono" aria-hidden="true">⌕</span>
				<input
					bind:this={input}
					bind:value={query}
					type="search"
					placeholder="Search the docs…"
					aria-label="Search the docs"
					autocomplete="off"
					spellcheck="false"
				/>
				<kbd class="mono">esc</kbd>
			</div>

			{#if unavailable}
				<p class="hint mono">the search index is baked at build time — run a production build</p>
			{:else if query.trim() && !ready}
				<p class="hint mono">warming up…</p>
			{:else if query.trim() && results.length === 0}
				<p class="hint mono">nothing on the menu for “{query}”</p>
			{:else if results.length}
				<ul role="listbox" aria-label="Results">
					{#each results as r, i}
						<li role="option" aria-selected={sel === i}>
							<a
								href={r.url}
								class:selected={sel === i}
								onmouseenter={() => (sel = i)}
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
				<span>⌘K toggle</span>
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
		width: min(34rem, 100%);
		background: var(--bg-2);
		border: 1px solid var(--line-2);
		box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		max-height: 70vh;
	}

	.field {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
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

	kbd {
		font-size: 0.62rem;
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
		padding: 0.7rem 0.85rem;
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
		font-size: 0.62rem;
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

	.foot {
		display: flex;
		gap: 1.5rem;
		padding: 0.6rem 1rem;
		border-top: 1px solid var(--line);
		font-size: 0.62rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	@media (max-width: 560px) {
		.overlay {
			padding-top: 6vh;
		}
		.foot {
			display: none;
		}
	}
</style>
