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

	let copiedCurl = $state('');

	async function copyCurl(b) {
		const out = b.name.replace(/\.bin$/, '');
		try {
			await navigator.clipboard.writeText(`curl -fL ${b.url} -o ${out} && chmod +x ${out}`);
			copiedCurl = b.name;
			const status = document.getElementById('sr-status');
			if (status) status.textContent = 'curl command copied';
			setTimeout(() => (copiedCurl = ''), 1600);
		} catch {
			/* clipboard unavailable */
		}
	}
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
					<li class:current={detected?.name === b.name}>
						<a href={b.url} download>
							<span class="os mono">{b.label}</span>
							<span class="arch serif-i">{b.arch}</span>
							<span class="leaders" aria-hidden="true"></span>
							<span class="bsize mono">{b.size}</span>
						</a>
						<button
							class="curl mono"
							onclick={() => copyCurl(b)}
							aria-label="Copy curl command for {b.label} {b.arch}"
							>{copiedCurl === b.name ? 'copied' : 'curl'}</button
						>
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
		white-space: normal;
		max-width: 100%;
		flex-wrap: wrap;
		text-align: left;
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
		display: flex;
		align-items: stretch;
		border-bottom: 1px solid var(--line);
	}

	.binaries a {
		flex: 1;
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		padding: 0.7rem 0.4rem;
		transition: background 0.2s var(--ease-out);
		min-width: 0;
	}

	.binaries a:hover {
		background: var(--bg-2);
	}

	.binaries li.current :global(.os) {
		color: var(--accent);
	}

	.curl {
		font-size: 0.62rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-3);
		padding: 0 0.8em;
		border-left: 1px solid var(--line);
		transition: color 0.2s var(--ease-out), background 0.2s var(--ease-out);
		white-space: nowrap;
	}

	.curl:hover {
		color: var(--accent);
		background: var(--bg-2);
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

	@media (max-width: 860px) {
		.binaries {
			columns: 1;
		}
	}
</style>
