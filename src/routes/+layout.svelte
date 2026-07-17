<script>
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import { syncTheme } from '$lib/theme.svelte.js';
	import { site } from '$lib/site';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Grain from '$lib/components/Grain.svelte';
	import Search from '$lib/components/Search.svelte';

	let { children } = $props();

	// page-to-page morphs via the View Transitions API
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	// per-site spice + favicon (∅ plate in the site's accent).
	// :root:root beats the app.css defaults regardless of stylesheet order;
	// light/dark themes derive their working tokens from the raw spice.
	const themeCss = `:root:root{--spice:${site.accent};--spice-dim:${site.accentDim};}`;
	const favicon =
		'data:image/svg+xml,' +
		encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10.5" stroke="#ece5d8" stroke-width="2.4" fill="none"/><line x1="7" y1="27" x2="25" y2="5" stroke="${site.accent}" stroke-width="2.4" stroke-linecap="round"/></svg>`
		);

	// mirror the pre-paint theme choice into reactive state
	$effect(() => {
		syncTheme();
	});

	// click-to-copy: the button, or anywhere on a code block (event delegation)
	$effect(() => {
		async function onClick(e) {
			const fig = e.target.closest('.code-figure');
			if (!fig) return;
			// don't hijack links or an in-progress text selection
			if (e.target.closest('a')) return;
			const btn = fig.querySelector('[data-code]');
			if (!e.target.closest('[data-code]') && !window.getSelection()?.isCollapsed) return;
			const code = fig.querySelector('pre')?.textContent ?? '';
			const status = document.getElementById('sr-status');
			try {
				await navigator.clipboard.writeText(code.trim());
				if (btn) {
					btn.textContent = 'copied';
					btn.classList.add('done');
					setTimeout(() => {
						btn.textContent = 'copy';
						btn.classList.remove('done');
					}, 1600);
				}
				if (status) status.textContent = 'Copied to clipboard';
			} catch {
				if (status) status.textContent = 'Copy failed';
			}
		}
		document.addEventListener('click', onClick);
		return () => document.removeEventListener('click', onClick);
	});
</script>

<svelte:head>
	{@html `<style>${themeCss}</style>`}
	<link rel="icon" href={favicon} type="image/svg+xml" />
</svelte:head>

<a class="skip mono" href="#main">Skip to content</a>
<span id="sr-status" class="sr-status" role="status" aria-live="polite"></span>
<Header />
<Search />
<main id="main">
	{@render children()}
</main>
<Footer />
<Grain />

<style>
	main {
		padding-top: var(--header-h);
		min-height: 70vh;
	}

	.skip {
		position: fixed;
		top: -100%;
		left: 1rem;
		z-index: 300;
		background: var(--accent);
		color: var(--accent-ink);
		padding: 0.6em 1em;
		font-size: var(--text-sm);
	}

	.skip:focus {
		top: 1rem;
	}
</style>
