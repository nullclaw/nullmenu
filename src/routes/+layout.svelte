<script>
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import { site } from '$lib/site';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Grain from '$lib/components/Grain.svelte';

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

	// per-site theme + favicon (∅ plate in the site's accent).
	// :root:root beats the app.css defaults regardless of stylesheet order.
	const themeCss = `:root:root{--accent:${site.accent};--accent-dim:${site.accentDim};}`;
	const favicon =
		'data:image/svg+xml,' +
		encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10.5" stroke="#ece5d8" stroke-width="2.4" fill="none"/><line x1="7" y1="27" x2="25" y2="5" stroke="${site.accent}" stroke-width="2.4" stroke-linecap="round"/></svg>`
		);

	// copy buttons in rendered markdown (event delegation, one listener)
	$effect(() => {
		async function onClick(e) {
			const btn = e.target.closest('[data-code]');
			if (!btn) return;
			const code = btn.closest('.code-figure')?.querySelector('pre')?.textContent ?? '';
			const status = document.getElementById('sr-status');
			try {
				await navigator.clipboard.writeText(code.trim());
				btn.textContent = 'copied';
				btn.classList.add('done');
				if (status) status.textContent = 'Copied to clipboard';
				setTimeout(() => {
					btn.textContent = 'copy';
					btn.classList.remove('done');
				}, 1600);
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
