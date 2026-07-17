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

	// remember the visitor's preferred install method
	$effect(() => {
		const saved = Number(localStorage.getItem(`install-${site.id}`));
		if (saved > 0 && saved < installTabs.length) activeInstall = saved;
	});

	function pickInstall(i) {
		activeInstall = i;
		try {
			localStorage.setItem(`install-${site.id}`, String(i));
		} catch {
			/* private mode */
		}
	}

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

		{#if p && !site.comingSoon}
			<div class="install">
				<div class="tabs" role="group" aria-label="Install methods">
					{#each installTabs as t, i}
						<button
							class="tab mono"
							aria-pressed={activeInstall === i}
							class:active={activeInstall === i}
							onclick={() => pickInstall(i)}>{t.label}</button
						>
					{/each}
				</div>
				{@html installTabs[activeInstall].html}
			</div>
		{/if}
	</div>
</section>

{#if p && site.comingSoon}
	<!-- ———— coming soon: a menu card, not a full spread ———— -->
	<section class="section">
		<div class="container">
			<Reveal>
				<p class="label label--accent">In plain words</p>
			</Reveal>
			<dl class="plain">
				<Reveal>
					<div class="plain-row">
						<dt class="serif-i">What it is</dt>
						<dd>{p.plain.what}</dd>
					</div>
				</Reveal>
				{#if p.plain.fit}
					<Reveal delay={70}>
						<div class="plain-row">
							<dt class="serif-i">Where it fits</dt>
							<dd>{p.plain.fit}</dd>
						</div>
					</Reveal>
				{/if}
			</dl>
			<Reveal>
				<p class="soon-note">
					<span class="serif-i">Still on the stove.</span> No releases yet — the dish is being
					cooked in the open at
					<a href={site.github} target="_blank" rel="noopener">{site.name} on GitHub</a>. The
					<a href="/docs/">notes so far</a> cover what already works.
				</p>
			</Reveal>
		</div>
	</section>
{:else if p}
	<!-- ———— in plain words ———— -->
	{#if p.plain}
		<section class="section">
			<div class="container">
				<Reveal>
					<p class="label label--accent">In plain words</p>
				</Reveal>
				<dl class="plain">
					<Reveal>
						<div class="plain-row">
							<dt class="serif-i">What it is</dt>
							<dd>{p.plain.what}</dd>
						</div>
					</Reveal>
					<Reveal delay={70}>
						<div class="plain-row">
							<dt class="serif-i">Why it exists</dt>
							<dd>{p.plain.why}</dd>
						</div>
					</Reveal>
					<Reveal delay={140}>
						<div class="plain-row">
							<dt class="serif-i">When you need it</dt>
							<dd>{p.plain.when}</dd>
						</div>
					</Reveal>
					{#if p.plain.fit}
						<Reveal delay={210}>
							<div class="plain-row">
								<dt class="serif-i">Where it fits</dt>
								<dd>{p.plain.fit}</dd>
							</div>
						</Reveal>
					{/if}
				</dl>
			</div>
		</section>
	{/if}

	<!-- ———— how it works ———— -->
	{#if p.how}
		<section class="section">
			<div class="container">
				<Reveal>
					<p class="label label--accent">How it works</p>
					<h2 class="serif">From zero to running.</h2>
					{#if p.how.intro}<p class="section-sub">{p.how.intro}</p>{/if}
				</Reveal>
				<ol class="how">
					{#each p.how.steps as step, i}
						<Reveal delay={i * 60}>
							<li class="how-step">
								<span class="num serif-i" aria-hidden="true">{i + 1}</span>
								<div class="how-body">
									<h3 class="mono">{step.title}</h3>
									<p>{step.body}</p>
									{#if step.code}
										<figure class="code-figure mini"><pre class="mono">{step.code}</pre></figure>
									{/if}
								</div>
							</li>
						</Reveal>
					{/each}
				</ol>
			</div>
		</section>
	{/if}

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
							<dt class="mono">{m.label}</dt>
							<dd class="serif">{m.value}</dd>
						</div>
					</Reveal>
				{/each}
			</dl>
			<p class="fine mono">figures measured by the project</p>
		</div>
	</section>

	<!-- ———— what's inside ———— -->
	{#if p.inside?.length}
		<section class="section">
			<div class="container">
				<Reveal>
					<p class="label label--accent">What's inside</p>
					<h2 class="serif">Counted in the source,<br />not the brochure.</h2>
				</Reveal>
				<div class="inside">
					{#each p.inside as group, i}
						<Reveal delay={i * 60}>
							<div class="inside-group">
								<div class="inside-head">
									<h3 class="serif-i">{group.title}</h3>
									{#if group.note}<p class="inside-note">{group.note}</p>{/if}
								</div>
								<ul class="chips" role="list">
									{#each group.items as item}
										<li class="chip-item mono">{item}</li>
									{/each}
								</ul>
							</div>
						</Reveal>
					{/each}
				</div>
			</div>
		</section>
	{/if}

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

	<!-- ———— use it for ———— -->
	{#if p.useCases?.length}
		<section class="section">
			<div class="container">
				<Reveal>
					<p class="label label--accent">Use it for</p>
					<h2 class="serif">Three dinners it cooks well.</h2>
				</Reveal>
				<div class="cases">
					{#each p.useCases as c, i}
						<Reveal delay={i * 70}>
							<article class="card case">
								<h3 class="serif-i">{c.title}</h3>
								<p>{c.body}</p>
								{#if c.code}
									<figure class="code-figure mini"><pre class="mono">{c.code}</pre></figure>
								{/if}
							</article>
						</Reveal>
					{/each}
				</div>
			</div>
		</section>
	{/if}

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

	<!-- ———— before you order ———— -->
	{#if p.faq?.length}
		<section class="section">
			<div class="container faq-wrap">
				<Reveal>
					<p class="label label--accent">Before you order</p>
					<h2 class="serif">Questions, answered.</h2>
				</Reveal>
				<div class="faq">
					{#each p.faq as f, i}
						<Reveal delay={i * 40}>
							<details class="faq-item">
								<summary>
									<span class="serif q">{f.q}</span>
									<span class="ind mono" aria-hidden="true">+</span>
								</summary>
								<p class="a">{f.a}</p>
							</details>
						</Reveal>
					{/each}
				</div>
			</div>
		</section>
	{/if}

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
		text-shadow: 0 1px 22px var(--halo);
	}

	.cta {
		display: flex;
		gap: 1rem;
		margin-top: 2.25rem;
		flex-wrap: wrap;
	}

	/* one framed unit: the tab strip and the code share edges exactly */
	.install {
		margin-top: 3rem;
		max-width: 38rem;
		border: 1px solid var(--line-2);
		background: var(--bg-2);
	}

	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0;
		border-bottom: 1px solid var(--line);
	}

	.tab {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 0.7em 1.2em;
		color: var(--ink-3);
		border-right: 1px solid var(--line);
		transition: color 0.2s, background 0.2s;
	}

	.tab:last-child {
		border-right: none;
	}

	.tab.active {
		color: var(--accent);
		background: var(--bg-3);
	}

	.install :global(.code-figure) {
		margin: 0;
	}

	.install :global(pre.shiki) {
		border: none;
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

	.soon-note {
		margin-top: 2.5rem;
		padding: 1.5rem 1.75rem;
		border: 1px dashed var(--line-2);
		color: var(--ink-2);
		max-width: 44rem;
	}

	.soon-note .serif-i {
		color: var(--accent);
		font-size: 1.15rem;
		margin-right: 0.35rem;
	}

	.section-sub {
		color: var(--ink-2);
		margin-top: 1.25rem;
		max-width: 40rem;
	}

	/* how it works */
	.how {
		list-style: none;
		margin: 3rem 0 0;
		padding: 0;
		max-width: 46rem;
		display: flex;
		flex-direction: column;
	}

	.how-step {
		display: grid;
		grid-template-columns: 3.5rem minmax(0, 1fr);
		gap: 1.25rem;
		padding: 1.75rem 0;
		border-top: 1px solid var(--line);
	}

	.how-step .num {
		font-size: 2.6rem;
		line-height: 1;
		color: var(--accent);
		opacity: 0.85;
	}

	.how-body h3 {
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 0.6rem;
	}

	.how-body p {
		color: var(--ink-2);
		max-width: 40rem;
	}

	.code-figure.mini {
		margin: 0.9rem 0 0;
		max-width: 36rem;
	}

	.code-figure.mini pre {
		margin: 0;
		background: #0a0806;
		color: #d9d1c3;
		border: 1px solid var(--line);
		padding: 0.7rem 1rem;
		font-size: 0.78rem;
		line-height: 1.6;
		overflow-x: auto;
		white-space: pre;
	}

	/* what's inside */
	.inside {
		margin-top: 3rem;
		border-top: 1px solid var(--line);
	}

	.inside-group {
		display: grid;
		grid-template-columns: 17rem minmax(0, 1fr);
		gap: 2rem;
		padding: 1.75rem 0.5rem;
		border-bottom: 1px solid var(--line);
	}

	.inside-head h3 {
		font-size: 1.45rem;
		color: var(--accent);
	}

	.inside-note {
		color: var(--ink-3);
		font-size: var(--text-sm);
		margin-top: 0.4rem;
	}

	.chips {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		align-content: flex-start;
	}

	.chip-item {
		font-size: 0.68rem;
		letter-spacing: 0.05em;
		color: var(--ink-2);
		border: 1px solid var(--line);
		border-radius: 99px;
		padding: 0.25em 0.75em;
		transition: color var(--t-row) var(--ease-out), border-color var(--t-row) var(--ease-out);
	}

	.chip-item:hover {
		color: var(--accent);
		border-color: var(--accent-dim);
	}

	/* use it for */
	.cases {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.5rem;
		margin-top: 3rem;
	}

	.cases > :global(div) {
		display: grid;
	}

	.case {
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.case h3 {
		font-size: 1.5rem;
		color: var(--accent);
	}

	.case p {
		color: var(--ink-2);
		font-size: var(--text-sm);
		flex: 1;
	}

	/* before you order */
	.faq {
		margin-top: 2.5rem;
		border-top: 1px solid var(--line);
		max-width: 50rem;
	}

	.faq-item {
		border-bottom: 1px solid var(--line);
	}

	.faq-item summary {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 1.25rem 0.5rem;
		cursor: pointer;
		list-style: none;
		transition: color var(--t-row) var(--ease-out);
	}

	.faq-item summary::-webkit-details-marker {
		display: none;
	}

	.faq-item summary .q {
		font-size: 1.25rem;
		color: var(--ink);
		transition: color var(--t-row) var(--ease-out);
	}

	.faq-item summary:hover .q {
		color: var(--accent);
	}

	.faq-item .ind {
		color: var(--ink-3);
		font-size: 1rem;
		transition: transform 0.3s var(--ease-swift), color 0.3s var(--ease-out);
	}

	.faq-item[open] .ind {
		transform: rotate(45deg);
		color: var(--accent);
	}

	.faq-item .a {
		padding: 0 2.5rem 1.4rem 0.5rem;
		color: var(--ink-2);
		max-width: 44rem;
		line-height: 1.7;
	}

	/* in plain words */
	.plain {
		margin-top: 2.5rem;
		border-top: 1px solid var(--line);
	}

	.plain-row {
		display: grid;
		grid-template-columns: 13rem minmax(0, 1fr);
		gap: 2rem;
		padding: 1.5rem 0.5rem;
		border-bottom: 1px solid var(--line);
	}

	.plain-row dt {
		font-size: 1.3rem;
		color: var(--accent);
	}

	.plain-row dd {
		color: var(--ink-2);
		max-width: 44rem;
		line-height: 1.7;
	}

	@media (max-width: 720px) {
		.plain-row {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
	}

	/* metrics */
	.metrics {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1.5rem;
		margin-top: 2.5rem;
	}

	.metrics > :global(div) {
		display: grid;
	}

	.metric {
		border-left: 1px solid var(--line-2);
		padding-left: 1.5rem;
		height: 100%;
		display: flex;
		flex-direction: column-reverse; /* value above label; dt precedes dd in DOM */
	}

	.metric dd {
		font-size: clamp(2.2rem, 4.5vw, 3.4rem);
		color: var(--accent);
		line-height: 1.05;
		font-variant-numeric: tabular-nums;
	}

	.metric dt {
		margin-bottom: 0;
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
		gap: 1.5rem;
		margin-top: 3rem;
	}

	.features > :global(div) {
		display: grid;
	}

	.feature {
		height: 100%;
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
		padding: var(--row-pad);
		border-bottom: 1px solid var(--line);
		transition: background var(--t-row) var(--ease-out);
	}

	.pair:hover {
		background: var(--bg-2);
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

	:global([data-theme='light']) .pair:hover .mark,
	:global([data-theme='light']) .pair:hover .go {
		color: color-mix(in srgb, var(--spice) 45%, var(--ink));
	}

	:global([data-theme='light']) .pair:hover .leaders {
		border-color: color-mix(in srgb, var(--spice) 45%, var(--ink));
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
		.cases {
			grid-template-columns: 1fr;
		}
		.inside-group {
			grid-template-columns: 1fr;
			gap: 1rem;
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
