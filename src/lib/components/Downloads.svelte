<script>
	/**
	 * "Takeaway" — platform-aware binary downloads, straight from the latest
	 * GitHub release (baked in at build time). The visitor's platform is
	 * detected client-side; everything else is a menu of binaries.
	 */
	import { site } from '$lib/site';
	import Reveal from './Reveal.svelte';

	let { release } = $props();

	let detected = $state(null);

	$effect(() => {
		const ua = navigator.userAgent;
		const plat = navigator.userAgentData?.platform ?? navigator.platform ?? '';
		let os = null;
		if (/mac/i.test(plat) || /Macintosh/.test(ua)) os = 'mac';
		else if (/win/i.test(plat) || /Windows/.test(ua)) os = 'windows';
		else if (/android/i.test(ua)) os = 'android';
		else if (/linux/i.test(plat) || /Linux/.test(ua)) os = 'linux';
		if (!os) return;
		// sane 2026 defaults: mac → Apple Silicon, else x86-64/first of OS
		detected =
			(os === 'mac'
				? release.binaries.find((b) => b.arch === 'Apple Silicon')
				: release.binaries.find((b) => b.os === os && /x(86-)?64/.test(b.arch))) ??
			release.binaries.find((b) => b.os === os) ??
			null;
	});

	const chmodHint = $derived(
		detected && detected.os !== 'windows'
			? `chmod +x ${detected.name} && ./${detected.name.replace(/\.bin$/, '')} --help`
			: null
	);
</script>

<section class="section" id="download">
	<div class="container">
		<Reveal>
			<p class="label label--accent">Takeaway</p>
			<h2 class="serif">One binary, packed to go.</h2>
			<p class="sub">
				Cross-compiled by <a href="https://builder.nullmenu.ai">nullbuilder</a> for every kitchen —
				no runtime, no installer, nothing else on the plate.
			</p>
		</Reveal>

		{#if detected}
			<Reveal>
				<div class="primary">
					<a class="btn btn--solid big" href={detected.url} download>
						Download for {detected.label} · {detected.arch}
						<span class="size mono">{detected.size}</span>
					</a>
					{#if chmodHint}
						<code class="hint mono">{chmodHint}</code>
					{/if}
				</div>
			</Reveal>
		{/if}

		<Reveal>
			<div class="menu-head mono">
				<span>{site.name} · {release.tag}{#if release.date}&nbsp;· {release.date}{/if}</span>
				<a href={release.url} target="_blank" rel="noopener">all releases &nearr;</a>
			</div>
			<ul class="binaries">
				{#each release.binaries as b}
					<li>
						<a href={b.url} download class:current={detected?.name === b.name}>
							<span class="os mono">{b.label}</span>
							<span class="arch serif-i">{b.arch}</span>
							<span class="leaders" aria-hidden="true"></span>
							<span class="bsize mono">{b.size}</span>
						</a>
					</li>
				{/each}
			</ul>
		</Reveal>
	</div>
</section>

<style>
	h2 {
		font-size: clamp(1.9rem, 4.4vw, 2.8rem);
		font-weight: 400;
		line-height: 1.12;
		margin-top: 1rem;
	}

	.sub {
		color: var(--ink-2);
		margin-top: 1rem;
		max-width: 34rem;
	}

	.primary {
		margin-top: 2.5rem;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.big {
		font-size: var(--text-base);
		padding: 1em 1.6em;
	}

	.big .size {
		opacity: 0.65;
		font-size: 0.8em;
	}

	.hint {
		font-size: var(--text-xs);
		color: var(--ink-3);
		letter-spacing: 0.02em;
	}

	.menu-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-top: 2.75rem;
		padding-bottom: 0.75rem;
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		color: var(--ink-3);
		text-transform: uppercase;
	}

	.menu-head a {
		color: var(--ink-2);
		transition: color 0.2s;
	}

	.menu-head a:hover {
		color: var(--accent);
	}

	.binaries {
		list-style: none;
		padding: 0;
		margin: 0;
		border-top: 1px solid var(--line);
		columns: 2;
		column-gap: 3rem;
	}

	.binaries li {
		break-inside: avoid;
	}

	.binaries a {
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		padding: 0.7rem 0.4rem;
		border-bottom: 1px solid var(--line);
		transition: background 0.2s var(--ease-out);
	}

	.binaries a:hover {
		background: var(--bg-2);
	}

	.binaries a.current .os {
		color: var(--accent);
	}

	.os {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--ink);
		min-width: 5.5rem;
	}

	.binaries a:hover .os {
		color: var(--accent);
	}

	.binaries a:hover .leaders {
		border-color: var(--accent);
	}

	.arch {
		color: var(--ink-3);
		font-size: 0.95rem;
	}

	.bsize {
		font-size: var(--text-xs);
		color: var(--ink-2);
	}

	@media (max-width: 760px) {
		.binaries {
			columns: 1;
		}
	}
</style>
