<script>
	import { products, groups } from '$lib/site';
	import Seo from '$lib/components/Seo.svelte';
	import Ink from '$lib/components/Ink.svelte';
	import ProductMark from '$lib/components/ProductMark.svelte';
	import Reveal from '$lib/components/Reveal.svelte';

	let { data } = $props();

	const heroStats = [
		{ k: 'agent runtime', v: '678 KB' },
		{ k: 'peak memory', v: '~1 MB' },
		{ k: 'model providers', v: '50+' },
		{ k: 'chat channels', v: '19' }
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
			body: 'Components compose over plain JSON and HTTP, and every one works alone. Take one dish or the full tasting menu.'
		},
		{
			title: 'Honest',
			body: 'Pre-1.0, CalVer-versioned, benchmarks self-reported and reproducible. No crypto tokens, ever.'
		}
	];

	const mains = products.filter((p) => p.group === 'mains');
</script>

<Seo />

<!-- ———— hero ———— -->
<section class="hero">
	<Ink tint="#e8ddc9" />
	<div class="container hero-inner">
		<p class="label kicker">The Null ecosystem &nbsp;·&nbsp; est. 2026 &nbsp;·&nbsp; 100% Zig</p>
		<h1>
			<span class="serif">Autonomous AI,</span>
			<span class="serif-i accent">à&nbsp;la&nbsp;carte.</span>
		</h1>
		<p class="sub">
			A family of single-binary Zig tools for running AI agents on your own hardware — runtime,
			orchestration, tasks, memory, observability. Install NullHub, add components as you need
			them.
		</p>
		<div class="cta">
			<a class="btn btn--solid" href="/docs/start/install-nullhub/">Install NullHub</a>
			<a class="btn" href="/products/">Browse the menu</a>
		</div>

		<dl class="stats" aria-label="Key numbers">
			{#each heroStats as s}
				<div class="stat">
					<dt class="mono">{s.k}</dt>
					<span class="leaders" aria-hidden="true"></span>
					<dd class="mono">{s.v}</dd>
				</div>
			{/each}
			<p class="fine mono">figures measured by the project · everything pre-1.0</p>
		</dl>
	</div>
</section>

<!-- ———— the order ———— -->
<section class="section" id="order">
	<div class="container">
		<Reveal>
			<p class="label label--accent">01 · The order</p>
			<h2 class="serif">Set the table once,<br />then order as you go.</h2>
		</Reveal>

		<div class="courses">
			<Reveal delay={0}>
				<article class="course">
					<span class="num serif-i">1</span>
					<h3 class="mono">Seat the sous-chef</h3>
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
					<h3 class="mono">Order à la carte</h3>
					<p>
						The install wizard fetches, configures and links each component. Skip what you don't
						need — every dish stands alone.
					</p>
					{@html data.code.order}
				</article>
			</Reveal>
			<Reveal delay={180}>
				<article class="course">
					<span class="num serif-i">3</span>
					<h3 class="mono">Service</h3>
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
					<span class="serif-i">In a hurry?</span> The chef also works alone —
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
			<p class="label label--accent">02 · The brigade</p>
			<h2 class="serif">Each station does one thing.<br />Together they run the kitchen.</h2>
		</Reveal>

		<div class="brigade">
			<Reveal>
				<a class="hub-band" href="https://hub.nullmenu.ai">
					<span class="mark"><ProductMark id="hub" size={26} /></span>
					<span class="mono name">nullhub</span>
					<span class="serif-i role">the sous-chef</span>
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
				<a class="pantry-band" href="https://pantry.nullmenu.ai">
					<span class="mark"><ProductMark id="pantry" size={26} /></span>
					<span class="mono name">nullpantry</span>
					<span class="serif-i role">the larder</span>
					<span class="leaders" aria-hidden="true"></span>
					<span class="desc">shared knowledge & memory, served to every agent</span>
				</a>
			</Reveal>
		</div>
	</div>
</section>

<!-- ———— tasting menu ———— -->
<section class="section">
	<div class="container">
		<Reveal>
			<p class="label label--accent">03 · Tonight's mains</p>
			<h2 class="serif">The tasting menu.</h2>
		</Reveal>

		<div class="menu-list">
			{#each mains as p, i}
				<Reveal delay={i * 60}>
					<a class="menu-row" href="https://{p.domain}" style:--spice={p.accent}>
						<span class="mark"><ProductMark id={p.id} size={26} /></span>
						<span class="name mono">{p.name}</span>
						<span class="course serif-i">{p.course}</span>
						<span class="leaders" aria-hidden="true"></span>
						<span class="stat mono">{p.stat}</span>
					</a>
				</Reveal>
			{/each}
		</div>

		<Reveal>
			<div class="menu-more">
				<a class="btn" href="/products/">Full menu — all {products.length} products</a>
			</div>
		</Reveal>
	</div>
</section>

<!-- ———— kitchen rules ———— -->
<section class="section">
	<div class="container">
		<Reveal>
			<p class="label label--accent">04 · Kitchen rules</p>
			<h2 class="serif">Cooked to a few<br />non-negotiables.</h2>
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
					<p class="label label--accent">05 · The cookbook</p>
					<h2 class="serif">Recipes, references,<br />and honest run-books.</h2>
					<p class="cookbook-sub">
						Task-oriented guides for real setups — a personal assistant, a durable backlog, an
						observable multi-agent stack. Markdown-first: every page has a <span class="mono"
							>.md</span
						>
						twin, and the whole site ships
						<a href="/llms.txt" class="mono">llms.txt</a> for your agents.
					</p>
					<div class="cta">
						<a class="btn btn--solid" href="/docs/">Open the cookbook</a>
						<a class="btn" href="/docs/recipes/personal-assistant/">First recipe</a>
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

	.hero-inner {
		position: relative;
		z-index: 1;
		padding-block: 6rem 4rem;
		width: 100%;
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
		text-shadow: 0 1px 22px rgba(12, 10, 8, 0.7);
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
		font-size: 0.65rem;
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
		font-size: 0.72rem;
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
		color: #e3a93c;
	}

	.pantry-band:hover .mark {
		color: #8fb573;
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

	.station {
		border: 1px solid var(--line);
		padding: 1.75rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		background: var(--bg);
		transition: background 0.3s var(--ease-out), border-color 0.3s var(--ease-out);
		position: relative;
	}

	.station:not(:first-child) {
		margin-left: -1px;
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

	.station .role {
		font-size: 0.65rem;
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
		align-items: baseline;
		gap: 1.1rem;
		padding: 1.35rem 0.75rem;
		border-bottom: 1px solid var(--line);
		transition: background 0.45s var(--ease-out);
	}

	.menu-row:hover {
		background: var(--bg-2);
	}

	.menu-row .mark {
		align-self: center;
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

	.menu-more {
		margin-top: 2.5rem;
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
	}
</style>
