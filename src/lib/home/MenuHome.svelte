<script>
	import { products, groups } from '$lib/site';
	import Seo from '$lib/components/Seo.svelte';
	import Ink from '$lib/components/Ink.svelte';
	import ProductMark from '$lib/components/ProductMark.svelte';
	import Reveal from '$lib/components/Reveal.svelte';

	let { data } = $props();

	const heroStats = [
		{ k: 'agent runtime', v: '4.4–6.5 MB' },
		{ k: 'model providers', v: '~60' },
		{ k: 'chat channels', v: '26' },
		{ k: 'built-in tools', v: '39' }
	];

	const stack = [
		{ id: 'watch', role: 'observation', text: 'every span, verdict and dollar — local JSONL' },
		{ id: 'boiler', role: 'policy', text: 'decides what runs, when, on which worker' },
		{ id: 'tickets', role: 'truth', text: 'durable tasks, leases, pipelines' },
		{ id: 'claw', role: 'execution', text: 'the agent that actually does the work' }
	];

	const rules = [
		{
			title: 'Local-first',
			body: 'State lives in ~/.null* on your disk. Nothing phones home; there is no hosted service to depend on.'
		},
		{
			title: 'Single binary',
			body: 'Every component is one static Zig binary. No Node, no Python, no containers required — kilobytes, not gigabytes.'
		},
		{
			title: 'À la carte',
			body: 'Components compose over plain JSON and HTTP, and every one works alone. Use one tool or combine the full stack.'
		},
		{
			title: 'As counted',
			body: 'Pre-1.0, CalVer-versioned; the numbers on these pages come from the source tree and the release assets.'
		}
	];

	const mains = products.filter((p) => p.group === 'mains');

	const heroDescription =
		'Ten small open-source tools for running AI agents on your own hardware: an agent you can message from Telegram or Slack, plus the orchestration, task queue, shared memory and tracing to grow it into a fleet. Each one is a single Zig binary — install NullHub to manage them all, or take any piece alone.';

	function splitIntro(value, limit = 34) {
		const words = value.trim().split(/\s+/);
		if (words.length <= limit) return { lead: value, tail: '' };
		return {
			lead: words.slice(0, limit).join(' '),
			tail: words.slice(limit).join(' ')
		};
	}

	const heroIntro = splitIntro(heroDescription);
</script>

<Seo />

<!-- ———— hero ———— -->
<section class="hero">
	<Ink tint="#e8ddc9" intensity={0.55} />
	<div class="container hero-inner">
		<div class="hero-copy">
			<p class="label kicker">Open source &nbsp;·&nbsp; self-hosted AI agents &nbsp;·&nbsp; written in Zig</p>
			<h1>
				<span class="serif">Autonomous AI,</span>
				<span class="serif-i accent">à&nbsp;la&nbsp;carte.</span>
			</h1>
			<p class="sub">
				<span class="hero-lead">{heroIntro.lead}</span>{#if heroIntro.tail}{' '}<span class="hero-tail">
					{heroIntro.tail}</span
				>{/if}
			</p>
			{#if heroIntro.tail}
				<details class="hero-more">
					<summary class="mono">Continue reading</summary>
					<p>{heroIntro.tail}</p>
				</details>
			{/if}
			<div class="cta">
				<a class="btn btn--solid" href="/docs/start/install-nullhub/">Install NullHub</a>
				<a class="btn" href="/products/">Browse the menu</a>
			</div>
		</div>

		<dl class="stats" aria-label="Key numbers">
			{#each heroStats as s}
				<div class="stat">
					<dt class="mono">{s.k}</dt>
					<span class="leaders" aria-hidden="true"></span>
					<dd class="mono">{s.v}</dd>
				</div>
			{/each}
		</dl>
		<p class="fine mono">counted in the source at v2026.5.29 · everything pre-1.0</p>
	</div>
</section>

<!-- ———— the order ———— -->
<section class="section" id="order">
	<div class="container">
		<Reveal>
			<p class="label label--accent">01 · Get started</p>
			<h2 class="serif">Install once,<br />then add what you need.</h2>
		</Reveal>

		<div class="courses">
			<Reveal delay={0}>
				<article class="course">
					<span class="num serif-i">1</span>
					<h3 class="mono">Install the control plane</h3>
					<p>
						NullHub is one binary with an embedded dashboard. Run it with Docker, or grab a <a
							href="https://github.com/nullclaw/nullhub/releases">release binary</a
						> for your platform.
					</p>
					{@html data.code.seat}
				</article>
			</Reveal>
			<Reveal delay={90}>
				<article class="course">
					<span class="num serif-i">2</span>
					<h3 class="mono">Choose components</h3>
					<p>
						The install wizard fetches, configures and links each component. Skip what you don't
						need — every component runs independently.
					</p>
					{@html data.code.order}
				</article>
			</Reveal>
			<Reveal delay={180}>
				<article class="course">
					<span class="num serif-i">3</span>
					<h3 class="mono">Run the stack</h3>
					<p>
						One command brings the stack up; the dashboard supervises processes, health, logs and
						updates from <span class="mono">~/.nullhub</span>.
					</p>
					{@html data.code.service}
				</article>
			</Reveal>
		</div>

		<Reveal>
			<aside class="solo">
				<p>
					<span class="serif-i">Need only the agent?</span> NullClaw works independently —
					a fully autonomous agent, no console required:
				</p>
				{@html data.code.solo}
			</aside>
		</Reveal>
	</div>
</section>

<!-- ———— the brigade ———— -->
<section class="section">
	<div class="container">
		<Reveal>
			<p class="label label--accent">02 · The stack</p>
			<h2 class="serif">Each component does one job.<br />Together they form the platform.</h2>
		</Reveal>

		<div class="brigade">
			<Reveal>
				<a class="hub-band" href="https://hub.nullmenu.ai" style:--spice="#e3a93c">
					<span class="mark"><ProductMark id="hub" size={26} /></span>
					<span class="mono name">nullhub</span>
					<span class="serif-i role">control plane</span>
					<span class="leaders" aria-hidden="true"></span>
					<span class="desc">installs, supervises, updates every station below</span>
				</a>
			</Reveal>
			<div class="stations">
				{#each stack as s, i}
					<Reveal delay={i * 70}>
						<a class="station" href="https://{s.id}.nullmenu.ai" style:--spice={products.find((p) => p.id === s.id).accent}>
							<span class="mark"><ProductMark id={s.id} size={30} /></span>
							<span class="role mono">{s.role}</span>
							<span class="name mono">null{s.id === 'claw' ? 'claw' : s.id}</span>
							<span class="text">{s.text}</span>
						</a>
					</Reveal>
				{/each}
			</div>
			<Reveal>
				<a class="pantry-band" href="https://pantry.nullmenu.ai" style:--spice="#8fb573">
					<span class="mark"><ProductMark id="pantry" size={26} /></span>
					<span class="mono name">nullpantry</span>
					<span class="serif-i role">shared memory</span>
					<span class="leaders" aria-hidden="true"></span>
					<span class="desc">shared knowledge and memory for every agent</span>
				</a>
			</Reveal>
		</div>
	</div>
</section>

<!-- ———— tasting menu ———— -->
<section class="section">
	<div class="container">
		<Reveal>
			<p class="label label--accent">03 · Core tools</p>
			<h2 class="serif">The core stack.</h2>
		</Reveal>

		<div class="menu-list">
			{#each mains as p, i}
				<Reveal delay={i * 60}>
					<a class="menu-row" href="https://{p.domain}" style:--spice={p.accent}>
						<span class="mark"><ProductMark id={p.id} size={26} /></span>
						<span class="ident">
							<span class="topline">
								<span class="name mono">{p.name}</span>
								<span class="course serif-i">{p.course}</span>
								<span class="leaders" aria-hidden="true"></span>
								<span class="stat mono">{p.stat}</span>
							</span>
							<span class="line">{p.line}</span>
						</span>
					</a>
				</Reveal>
			{/each}
		</div>

		<Reveal>
			<p class="also">
					<span class="mono also-label">also in the ecosystem</span>
				{#each products.filter((p) => p.group !== 'mains') as o, i}
					<a href="https://{o.domain}" class="mono">{o.name}</a>{#if i < products.filter((p) => p.group !== 'mains').length - 1}<span class="dot" aria-hidden="true">·</span>{/if}
				{/each}
			</p>
			<div class="menu-more">
				<a class="btn" href="/products/">All {products.length} products</a>
			</div>
		</Reveal>
	</div>
</section>

<!-- ———— kitchen rules ———— -->
<section class="section">
	<div class="container">
		<Reveal>
			<p class="label label--accent">04 · Design principles</p>
			<h2 class="serif">Built around four<br />non-negotiables.</h2>
		</Reveal>
		<div class="rules">
			{#each rules as r, i}
				<Reveal delay={i * 60}>
					<div class="rule">
						<h3 class="serif-i">{r.title}</h3>
						<p>{r.body}</p>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>

<!-- ———— cookbook ———— -->
<section class="section cookbook">
	<div class="container">
		<Reveal>
			<div class="cookbook-inner">
				<div>
					<p class="label label--accent">05 · Documentation</p>
					<h2 class="serif">Guides, references,<br />and runbooks.</h2>
					<p class="cookbook-sub">
							Task-oriented guides for real setups — a personal assistant, a durable backlog, an
							observable multi-agent stack. The site also ships an
							<a href="/llms.txt" class="mono">llms.txt</a> index that points agents to the
							canonical documentation.
					</p>
					<div class="cta">
						<a class="btn btn--solid" href="/docs/">Open documentation</a>
						<a class="btn" href="/docs/recipes/personal-assistant/">Example workflow</a>
					</div>
				</div>
			</div>
		</Reveal>
	</div>
</section>

<style>
	/* ———— hero ———— */
	.hero {
		position: relative;
		min-height: calc(100svh - var(--header-h));
		display: flex;
		align-items: center;
		overflow: hidden;
		background:
			radial-gradient(60rem 40rem at 70% -10%, rgba(232, 221, 201, 0.05), transparent 60%),
			var(--bg);
	}

	.section {
		overflow-x: clip;
	}

	.hero-inner {
		position: relative;
		z-index: 1;
		padding-block: 6rem 4rem;
		width: 100%;
	}

	.hero-copy {
		max-width: 44rem;
	}

	.kicker {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: clamp(3rem, 9vw, 6.75rem);
		line-height: 1.02;
		font-weight: 400;
		letter-spacing: -0.02em;
		display: flex;
		flex-direction: column;
		gap: 0.05em;
	}

	.accent {
		color: var(--accent);
	}

	.sub {
		max-width: 38rem;
		margin-top: 1.75rem;
		font-size: var(--text-lg);
		color: var(--ink-2);
		text-shadow: 0 1px 22px var(--halo);
	}

	.hero-more {
		display: none;
	}

	.cta {
		display: flex;
		gap: 1rem;
		margin-top: 2.5rem;
		flex-wrap: wrap;
	}

	.stats {
		margin-top: 4.5rem;
		max-width: 30rem;
	}

	.stat {
		display: flex;
		align-items: baseline;
		padding: 0.45rem 0;
		font-size: var(--text-sm);
	}

	.stat dt {
		color: var(--ink-2);
	}

	.stat dd {
		color: var(--ink);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.fine {
		margin-top: 0.9rem;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		color: var(--ink-3);
	}

	/* ———— sections shared ———— */
	h2 {
		font-size: clamp(1.9rem, 4.4vw, 3rem);
		font-weight: 400;
		line-height: 1.12;
		letter-spacing: -0.01em;
		margin: 1rem 0 0;
	}

	/* ———— the order ———— */
	.courses {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.5rem;
		margin-top: 3.25rem;
	}

	.courses > :global(div),
	.course,
	.course :global(.code-figure),
	.course :global(pre),
	.solo,
	.solo :global(.code-figure),
	.solo :global(pre),
	.stations > :global(div),
	.station,
	.menu-row,
	.menu-row .ident,
	.menu-row .topline {
		min-width: 0;
		max-width: 100%;
	}

	.course {
		border: 1px solid var(--line);
		background: var(--bg-2);
		padding: 1.75rem;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		position: relative;
		transition: border-color 0.3s var(--ease-out);
	}

	.course:hover {
		border-color: var(--line-2);
	}

	.num {
		position: absolute;
		top: 0.6rem;
		right: 1.2rem;
		font-size: 3.2rem;
		color: var(--accent);
		opacity: 0.32;
		line-height: 1;
	}

	.course h3 {
		font-size: var(--text-sm);
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.course p {
		color: var(--ink-2);
		font-size: var(--text-sm);
		flex: 1;
	}

	.course :global(.code-figure) {
		margin: 0;
	}

	.course :global(pre.shiki) {
		font-size: 0.75rem;
		overflow-x: auto;
		overscroll-behavior-inline: contain;
	}

	.solo {
		margin-top: 2rem;
		border: 1px dashed var(--line-2);
		padding: 1.4rem 1.75rem;
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1.5rem;
		align-items: center;
	}

	.solo p {
		color: var(--ink-2);
		max-width: 28rem;
	}

	.solo :global(.code-figure) {
		margin: 0;
		min-width: 20rem;
	}

	.solo :global(pre.shiki) {
		font-size: 0.78rem;
		overflow-x: auto;
		overscroll-behavior-inline: contain;
	}

	/* ———— brigade ———— */
	.brigade {
		margin-top: 3.25rem;
	}

	.hub-band,
	.pantry-band {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		padding: 1.2rem 1.5rem;
		border: 1px solid var(--line);
		background: var(--bg-2);
		transition: border-color 0.3s var(--ease-out), background 0.3s var(--ease-out);
	}

	.hub-band {
		border-bottom: none;
	}

	.pantry-band {
		border-top: none;
	}

	.hub-band:hover,
	.pantry-band:hover {
		border-color: var(--line-2);
		background: var(--bg-3);
	}

	.hub-band .mark,
	.pantry-band .mark {
		align-self: center;
		color: var(--ink-2);
	}

	.hub-band:hover .mark {
		color: var(--spice);
	}

	:global([data-theme='light']) .hub-band:hover .mark,
	:global([data-theme='light']) .pantry-band:hover .mark,
	:global([data-theme='light']) .menu-row:hover .mark {
		color: color-mix(in srgb, var(--spice) 50%, var(--ink));
	}

	:global([data-theme='light']) .menu-row:hover .leaders {
		border-color: color-mix(in srgb, var(--spice) 45%, var(--ink));
	}

	.pantry-band:hover .mark {
		color: var(--spice);
	}

	.hub-band .name,
	.pantry-band .name {
		font-weight: 500;
	}

	.hub-band .role,
	.pantry-band .role {
		color: var(--ink-3);
		font-size: 1.05rem;
	}

	.hub-band .desc,
	.pantry-band .desc {
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.stations {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	/* reveal wrappers must pass the row height down to the plates;
	   -1px collapse handles both column and row seams at any breakpoint */
	.stations {
		padding: 1px 0 0 1px;
	}

	.stations > :global(div) {
		display: grid;
		margin: -1px 0 0 -1px;
	}

	.station {
		border: 1px solid var(--line);
		padding: 1.75rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		height: 100%;
		background: var(--bg);
		transition: background 0.3s var(--ease-out), border-color 0.3s var(--ease-out);
		position: relative;
	}

	.station:hover {
		background: var(--bg-2);
		border-color: color-mix(in srgb, var(--spice) 45%, var(--line));
		z-index: 1;
	}

	.station .mark {
		color: var(--spice);
		margin-bottom: 0.4rem;
	}

	:global([data-theme='light']) .station .mark {
		color: color-mix(in srgb, var(--spice) 45%, var(--ink));
	}

	.station .role {
		font-size: 0.75rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.station .name {
		font-weight: 500;
		color: var(--ink);
	}

	.station .text {
		font-size: var(--text-sm);
		color: var(--ink-2);
	}

	/* ———— tasting menu ———— */
	.menu-list {
		margin-top: 3rem;
		border-top: 1px solid var(--line);
	}

	.menu-row {
		display: flex;
		align-items: flex-start;
		gap: 1.1rem;
		padding: var(--row-pad);
		border-bottom: 1px solid var(--line);
		transition: background var(--t-row) var(--ease-out);
	}

	.menu-row .ident {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
	}

	.menu-row .topline {
		display: flex;
		align-items: baseline;
		gap: 1.1rem;
	}

	.menu-row .line {
		color: var(--ink-2);
		font-size: var(--text-sm);
		max-width: 44rem;
	}

	.menu-row:hover {
		background: var(--bg-2);
	}

	.menu-row .mark {
		margin-top: 0.35rem;
		color: var(--ink-3);
		transition: color 0.25s var(--ease-out);
	}

	.menu-row:hover .mark {
		color: var(--spice);
	}

	.menu-row .name {
		font-size: 1.1rem;
		font-weight: 500;
	}

	.menu-row .course {
		color: var(--ink-3);
		font-size: 1.05rem;
	}

	.menu-row:hover .leaders {
		border-color: var(--spice);
		opacity: 0.8;
	}

	.menu-row .stat {
		font-size: var(--text-xs);
		color: var(--ink-2);
		letter-spacing: 0.06em;
	}

	.also {
		margin-top: 2rem;
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		flex-wrap: wrap;
		font-size: var(--text-sm);
	}

	.also-label {
		font-size: var(--text-xs);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.also a {
		color: var(--ink-2);
		transition: color 0.2s var(--ease-out);
	}

	.also a:hover {
		color: var(--accent);
	}

	.also .dot {
		color: var(--ink-3);
	}

	.menu-more {
		margin-top: 2.5rem;
	}

	.menu-more .btn {
		max-width: 100%;
	}

	/* ———— rules ———— */
	.rules {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1.5rem;
		margin-top: 3.25rem;
	}

	.rule h3 {
		font-size: 1.6rem;
		color: var(--accent);
		margin-bottom: 0.75rem;
	}

	.rule p {
		color: var(--ink-2);
		font-size: var(--text-sm);
	}

	/* ———— cookbook ———— */
	.cookbook {
		background:
			radial-gradient(50rem 26rem at 20% 120%, var(--accent-glow), transparent 65%),
			var(--bg);
	}

	.cookbook-sub {
		max-width: 34rem;
		color: var(--ink-2);
		margin-top: 1.5rem;
	}

	/* ———— responsive ———— */
	@media (max-width: 980px) {
		.courses {
			grid-template-columns: 1fr;
		}
		.stations {
			grid-template-columns: 1fr 1fr;
		}
		.rules {
			grid-template-columns: 1fr 1fr;
		}
		.solo {
			grid-template-columns: 1fr;
		}
		.solo :global(.code-figure) {
			min-width: 0;
		}
	}

	@media (max-width: 640px) {
		.hero {
			min-height: auto;
			align-items: stretch;
			background: var(--bg);
		}

		.hero::after {
			content: '';
			position: absolute;
			inset: 0;
			z-index: 0;
			background: linear-gradient(to bottom, var(--bg) 0 72%, transparent 92%);
			pointer-events: none;
		}

		.hero-inner {
			padding-block: 4.25rem 3rem;
		}

		.hero-copy,
		.stats {
			position: relative;
			z-index: 1;
			background: var(--bg);
		}

		.kicker {
			margin-bottom: 1.25rem;
			line-height: 1.55;
		}

		h1 {
			font-size: clamp(3rem, 15vw, 4rem);
		}

		.sub {
			font-size: 1.05rem;
			line-height: 1.6;
			margin-top: 1.2rem;
			text-shadow: none;
		}

		.hero-tail {
			display: none;
		}

		.hero-lead::after {
			content: '…';
		}

		.hero-more {
			display: block;
			margin-top: 0.8rem;
			color: var(--ink-2);
		}

		.hero-more summary {
			width: fit-content;
			min-height: 2.75rem;
			display: flex;
			align-items: center;
			font-size: 0.75rem;
			letter-spacing: 0.1em;
			text-transform: uppercase;
			color: var(--accent);
			cursor: pointer;
		}

		.hero-more p {
			padding: 0.75rem 0 0.25rem;
			font-size: var(--text-sm);
			line-height: 1.65;
		}

		.cta {
			margin-top: 1.4rem;
			gap: 0.65rem;
		}

		.cta .btn {
			font-size: 0.76rem;
			padding-inline: 1.15em;
			min-height: 2.75rem;
		}

		.stats {
			margin-top: 2.75rem;
		}

		.menu-more .btn {
			white-space: normal;
			text-align: center;
			justify-content: center;
		}

		.hub-band .desc,
		.pantry-band .desc {
			display: none;
		}

		.courses,
		.course,
		.solo,
		.brigade,
		.hub-band,
		.pantry-band,
		.stations,
		.station,
		.menu-list,
		.menu-row,
		.rules {
			min-width: 0;
			max-width: 100%;
		}
	}

	@media (max-width: 560px) {
		.stations {
			grid-template-columns: 1fr;
		}
		.rules {
			grid-template-columns: 1fr;
		}
		.menu-row .course {
			display: none;
		}

		.menu-row .topline {
			gap: 0.65rem;
		}

		.menu-row .leaders {
			min-width: 0;
			margin-inline: 0.25rem;
		}
	}

	@media (max-width: 360px) {
		.cta {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
		}

		.cta .btn {
			justify-content: center;
			white-space: normal;
			text-align: center;
		}

		.solo,
		.course,
		.station {
			padding-inline: 1.15rem;
		}

		.hub-band,
		.pantry-band {
			gap: 0.65rem;
			padding-inline: 1rem;
		}
	}
</style>
