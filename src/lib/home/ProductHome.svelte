<script>
	import { site, sites } from '$lib/site';
	import Seo from '$lib/components/Seo.svelte';
	import Ink from '$lib/components/Ink.svelte';
	import Downloads from '$lib/components/Downloads.svelte';
	import ProductMark from '$lib/components/ProductMark.svelte';
	import Reveal from '$lib/components/Reveal.svelte';

	let { data } = $props();

	const p = $derived(data.product);
	let activeInstall = $state(0);

	const installTabs = $derived(
		p
			? [
					{ label: p.install.primary.label, html: data.code.installPrimary },
					...data.code.alts
				]
			: []
	);

	const pairs = $derived((p?.pairs ?? []).map((id) => sites[id]).filter(Boolean));
</script>

<Seo />

<!-- ———— hero ———— -->
<section class="hero">
	<Ink tint={site.accent} />
	<div class="watermark" aria-hidden="true">
		<ProductMark id={site.id} size={560} stroke="var(--accent)" />
	</div>

	<div class="container hero-inner">
		<p class="label">
			<span class="label--accent">{p?.hero.kicker ?? site.course}</span>
			&nbsp;·&nbsp; <span class="chip">{site.status}</span>
		</p>
		<h1 class="serif">{p?.hero.title ?? site.title.split('—')[1] ?? site.display}</h1>
		<p class="sub">{p?.hero.sub ?? site.description}</p>

		<div class="cta">
			{#if data.release}
				<a class="btn btn--solid" href="#download">Download &darr;</a>
				<a class="btn" href="/docs/">Documentation</a>
			{:else}
				<a class="btn btn--solid" href="/docs/">Documentation</a>
			{/if}
			<a class="btn" href={site.github} target="_blank" rel="noopener">GitHub &nearr;</a>
		</div>

		{#if p}
			<div class="install">
				<div class="tabs" role="group" aria-label="Install methods">
					{#each installTabs as t, i}
						<button
							class="tab mono"
							aria-pressed={activeInstall === i}
							class:active={activeInstall === i}
							onclick={() => (activeInstall = i)}>{t.label}</button
						>
					{/each}
				</div>
				{@html installTabs[activeInstall].html}
			</div>
		{/if}
	</div>
</section>

{#if p}
	<!-- ———— metrics ———— -->
	<section class="section">
		<div class="container">
			<Reveal>
				<p class="label label--accent">By the numbers</p>
			</Reveal>
			<dl class="metrics">
				{#each p.metrics as m, i}
					<Reveal delay={i * 60}>
						<div class="metric">
							<dd class="serif">{m.value}</dd>
							<dt class="mono">{m.label}</dt>
						</div>
					</Reveal>
				{/each}
			</dl>
			<p class="fine mono">figures measured by the project</p>
		</div>
	</section>

	<!-- ———— features ———— -->
	<section class="section">
		<div class="container">
			<Reveal>
				<p class="label label--accent">On the plate</p>
				<h2 class="serif">What {site.display} does.</h2>
			</Reveal>
			<div class="features">
				{#each p.features as f, i}
					<Reveal delay={(i % 3) * 70}>
						<div class="card feature">
							<h3 class="mono">{f.title}</h3>
							<p>{f.body}</p>
						</div>
					</Reveal>
				{/each}
			</div>
		</div>
	</section>

	<!-- ———— takeaway ———— -->
	{#if data.release}
		<Downloads release={data.release} />
	{/if}

	<!-- ———— quickstart ———— -->
	<section class="section">
		<div class="container quickstart">
			<Reveal>
				<div class="qs-head">
					<p class="label label--accent">First taste</p>
					<h2 class="serif">Up and running.</h2>
					<p class="qs-sub">
						Full walkthrough in the <a href="/docs/">docs</a>
						{#if site.version}— verified with <span class="mono">{site.version}</span>{/if}.
					</p>
				</div>
			</Reveal>
			<Reveal delay={100}>
				<div class="qs-code prose">
					{@html data.code.quickstart}
				</div>
			</Reveal>
		</div>
	</section>

	<!-- ———— pairs well with ———— -->
	{#if pairs.length}
		<section class="section">
			<div class="container">
				<Reveal>
					<p class="label label--accent">Pairs well with</p>
				</Reveal>
				<div class="pairs">
					{#each pairs as pair, i}
						<Reveal delay={i * 70}>
							<a class="pair" href="https://{pair.domain}" style:--spice={pair.accent}>
								<span class="mark"><ProductMark id={pair.id} size={28} /></span>
								<span>
									<span class="name mono">{pair.name}</span>
									<span class="course serif-i">{pair.course}</span>
								</span>
								<span class="line">{pair.line}</span>
								<span class="go mono" aria-hidden="true">&rarr;</span>
							</a>
						</Reveal>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	{#if p.note}
		<section class="notice">
			<div class="container">
				<p class="mono">{p.note}</p>
			</div>
		</section>
	{/if}
{:else}
	<section class="section">
		<div class="container">
			<p class="sub">Documentation is being plated. Meanwhile — <a href={site.github}>the repository</a>.</p>
		</div>
	</section>
{/if}

<style>
	.hero {
		position: relative;
		min-height: min(88svh, 56rem);
		display: flex;
		align-items: center;
		overflow: hidden;
		background:
			radial-gradient(55rem 36rem at 80% -20%, var(--accent-glow), transparent 60%),
			var(--bg);
	}

	.watermark {
		position: absolute;
		right: -6rem;
		bottom: -8rem;
		opacity: 0.07;
		pointer-events: none;
	}

	.hero-inner {
		position: relative;
		z-index: 1;
		padding-block: 6rem 4.5rem;
		width: 100%;
		max-width: var(--container);
	}

	.chip {
		border: 1px solid var(--accent-dim);
		color: var(--accent);
		border-radius: 99px;
		padding: 0.1em 0.7em;
		letter-spacing: 0.12em;
	}

	h1 {
		font-size: clamp(2.6rem, 7vw, 5rem);
		line-height: 1.05;
		font-weight: 400;
		letter-spacing: -0.015em;
		margin-top: 1.5rem;
		max-width: 18ch;
	}

	.sub {
		max-width: 36rem;
		margin-top: 1.5rem;
		font-size: var(--text-lg);
		color: var(--ink-2);
		text-shadow: 0 1px 22px rgba(12, 10, 8, 0.7);
	}

	.cta {
		display: flex;
		gap: 1rem;
		margin-top: 2.25rem;
		flex-wrap: wrap;
	}

	.install {
		margin-top: 3rem;
		max-width: 38rem;
	}

	.tabs {
		display: flex;
		gap: 0;
		border: 1px solid var(--line);
		border-bottom: none;
		width: fit-content;
	}

	.tab {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 0.55em 1.1em;
		color: var(--ink-3);
		border-right: 1px solid var(--line);
		transition: color 0.2s, background 0.2s;
	}

	.tab:last-child {
		border-right: none;
	}

	.tab.active {
		color: var(--accent);
		background: var(--bg-2);
	}

	.install :global(.code-figure) {
		margin: 0;
	}

	.install :global(pre.shiki) {
		font-size: 0.8rem;
	}

	h2 {
		font-size: clamp(1.9rem, 4.4vw, 2.8rem);
		font-weight: 400;
		line-height: 1.12;
		margin-top: 1rem;
	}

	/* metrics */
	.metrics {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1.5rem;
		margin-top: 2.5rem;
	}

	.metric {
		border-left: 1px solid var(--line-2);
		padding-left: 1.5rem;
	}

	.metric dd {
		font-size: clamp(2.2rem, 4.5vw, 3.4rem);
		color: var(--accent);
		line-height: 1.05;
	}

	.metric dt {
		margin-top: 0.5rem;
		font-size: var(--text-xs);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-2);
	}

	.fine {
		margin-top: 2rem;
		font-size: 0.65rem;
		letter-spacing: 0.08em;
		color: var(--ink-3);
	}

	/* features */
	.features {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.25rem;
		margin-top: 3rem;
	}

	.feature h3 {
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 0.8rem;
	}

	.feature p {
		color: var(--ink-2);
		font-size: var(--text-sm);
	}

	/* quickstart */
	.quickstart {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
		gap: 3rem;
		align-items: start;
	}

	.qs-sub {
		color: var(--ink-2);
		margin-top: 1.25rem;
	}

	.qs-code :global(pre.shiki) {
		font-size: 0.8rem;
	}

	/* pairs */
	.pairs {
		margin-top: 2.5rem;
		border-top: 1px solid var(--line);
	}

	.pair {
		display: grid;
		grid-template-columns: auto 14rem 1fr auto;
		align-items: center;
		gap: 1.5rem;
		padding: 1.3rem 0.5rem;
		border-bottom: 1px solid var(--line);
		transition: background 0.25s var(--ease-out), padding 0.25s var(--ease-out);
	}

	.pair:hover {
		background: var(--bg-2);
		padding-inline: 1rem;
	}

	.pair .mark {
		color: var(--ink-3);
		transition: color 0.25s;
	}

	.pair:hover .mark {
		color: var(--spice);
	}

	.pair .name {
		font-weight: 500;
		display: block;
	}

	.pair .course {
		color: var(--ink-3);
		font-size: 0.95rem;
	}

	.pair .line {
		color: var(--ink-2);
		font-size: var(--text-sm);
	}

	.pair .go {
		color: var(--ink-3);
		transition: color 0.25s, transform 0.25s var(--ease-out);
	}

	.pair:hover .go {
		color: var(--spice);
		transform: translateX(4px);
	}

	.notice {
		border-top: 1px solid var(--line);
		padding: 1.5rem 0;
	}

	.notice p {
		font-size: var(--text-xs);
		color: var(--ink-3);
		letter-spacing: 0.05em;
	}

	@media (max-width: 980px) {
		.metrics {
			grid-template-columns: 1fr 1fr;
			gap: 2rem 1.5rem;
		}
		.features {
			grid-template-columns: 1fr 1fr;
		}
		.quickstart {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}

	@media (max-width: 620px) {
		.features {
			grid-template-columns: 1fr;
		}
		.pair {
			grid-template-columns: auto 1fr auto;
		}
		.pair .line {
			display: none;
		}
	}
</style>
