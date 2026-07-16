<script>
	import { page } from '$app/state';
</script>

<section class="err container">
	<p class="label label--accent">{page.status}</p>
	<h1 class="serif-i">86'd.</h1>
	<p class="sub">
		This dish is off the menu{page.status === 404 ? " — the page doesn't exist" : ''}.
	</p>
	<a class="btn" href="/">Back to the kitchen</a>
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
		font-size: clamp(4rem, 12vw, 8rem);
		line-height: 1;
		color: var(--accent);
	}

	.sub {
		color: var(--ink-2);
		font-size: var(--text-lg);
	}
</style>
