<script>
	import { page } from '$app/state';
	import { site } from '$lib/site';

	const notFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{notFound ? 'Page not found' : `Error ${page.status}`} — {site.display}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="err container">
	<p class="label label--accent">Error {page.status}</p>
	<h1 class="serif">{notFound ? 'Page not found.' : 'Something went wrong.'}</h1>
	<p class="sub">
		{notFound
			? 'We could not find this page. It may have moved, or the address may be incorrect.'
			: 'The page could not be loaded. Return to the homepage and try again.'}
	</p>
	<a class="btn" href="/">Go to {site.display} home</a>
</section>

<style>
	.err {
		min-height: 60vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: flex-start;
		gap: 1.25rem;
		padding-block: 6rem;
	}

	h1 {
		font-size: clamp(3rem, 9vw, 6rem);
		line-height: 1.05;
		color: var(--accent);
	}

	.sub {
		color: var(--ink-2);
		font-size: var(--text-lg);
	}
</style>
