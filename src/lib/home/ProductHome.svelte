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
		try {
			const saved = Number(localStorage.getItem(`install-${site.id}`));
			if (saved > 0 && saved < installTabs.length) activeInstall = saved;
		} catch {
			/* storage can be unavailable in hardened/private contexts */
		}
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
	const operatingSystems = $derived.by(() => {
		const labels = { mac: 'macOS', linux: 'Linux', windows: 'Windows', android: 'Android' };
		return [
			...new Set(
				(data.release?.binaries ?? [])
					.map((binary) => labels[binary.os])
					.filter(Boolean)
			)
		];
	});

	function splitIntro(value, limit = 34) {
		const words = String(value ?? '').trim().split(/\s+/).filter(Boolean);
		if (words.length <= limit) return { lead: words.join(' '), tail: '' };
		return {
			lead: words.slice(0, limit).join(' '),
			tail: words.slice(limit).join(' ')
		};
	}

	function signatureFor(id) {
		return String(id ?? '')
			.split('')
			.reduce((sum, character) => sum + character.charCodeAt(0), 0) % 3;
	}

	const heroIntro = $derived(splitIntro(p?.hero.sub ?? site.description));
	const proofIndex = $derived(signatureFor(site.id));
	const proofMetric = $derived(p?.metrics?.[proofIndex % (p?.metrics?.length || 1)]);
	const proofFeature = $derived(p?.features?.[proofIndex % (p?.features?.length || 1)]);
	const proofSecondary = $derived.by(() => {
		if (p?.how?.steps?.length) {
			return { label: 'documented path', value: `${p.how.steps.length} steps` };
		}
		const group = p?.inside?.[proofIndex % (p?.inside?.length || 1)];
		return group?.items?.length
			? { label: group.title, value: `${group.items.length} listed` }
			: null;
	});
	const insideItemCount = $derived(
		p?.inside?.reduce((total, group) => total + (group.items?.length ?? 0), 0) ?? 0
	);
</script>

<Seo
	pageType={site.id === 'builder' ? 'website' : 'software'}
	version={site.version}
	releaseUrl={data.release?.url ??
		(site.version ? `${site.github}/releases/tag/${site.version}` : null)}
	operatingSystems={operatingSystems}
	faq={p && !site.comingSoon ? (p.faq ?? []) : []}
	breadcrumbs={[
		{ name: 'The menu', url: 'https://nullmenu.ai/products/' },
		{ name: site.display, url: `https://${site.domain}/` }
	]}
/>

<!-- ———— hero ———— -->
<section class="hero" data-group={site.group}>
	<Ink tint={site.accent} />
	<div class="watermark" aria-hidden="true">
		<ProductMark id={site.id} size={560} stroke="var(--accent)" />
	</div>

	<div class="container hero-inner">
		<div class="hero-layout">
			<div class="hero-copy">
				<p class="label">
					<span class="label--accent">{p?.hero.kicker ?? site.role}</span>
					&nbsp;·&nbsp; <span class="chip">{site.status}</span>
				</p>
				<h1 class="serif">{p?.hero.title ?? site.title.split('—')[1] ?? site.display}</h1>
				<p class="sub">
					<span class="hero-lead">{heroIntro.lead}</span>{#if heroIntro.tail}<span class="hero-tail">
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
					{#if data.release}
						<a class="btn btn--solid" href="#download">Download &darr;</a>
						<a class="btn" href="/docs/">Documentation</a>
					{:else}
						<a class="btn btn--solid" href="/docs/">Documentation</a>
					{/if}
					<a class="btn" href={site.github} target="_blank" rel="noopener">GitHub &nearr;</a>
				</div>
			</div>

			{#if p && proofFeature && proofMetric}
				<aside
					class="hero-proof"
					data-signature={proofIndex}
					aria-label={`${site.display} at a glance`}
				>
					<div class="proof-head">
						<span class="proof-mark" aria-hidden="true">
							<ProductMark id={site.id} size={72} stroke="var(--accent)" />
						</span>
						<span>
							<span class="proof-kicker mono">At a glance</span>
							<strong class="proof-name serif-i">{site.name}</strong>
						</span>
					</div>
					<div class="proof-copy">
						<p class="proof-title mono">{proofFeature.title}</p>
						<p class="proof-body">{proofFeature.body}</p>
					</div>
					<dl class="proof-facts">
						<div>
							<dt class="mono">{proofMetric.label}</dt>
							<dd class="serif">{proofMetric.value}</dd>
						</div>
						{#if proofSecondary}
							<div>
								<dt class="mono">{proofSecondary.label}</dt>
								<dd class="serif">{proofSecondary.value}</dd>
							</div>
						{/if}
					</dl>
				</aside>
			{/if}
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
			<div class="plain">
				<Reveal>
					<dl class="plain-row">
						<dt class="serif-i">What it is</dt>
						<dd>{p.plain.what}</dd>
					</dl>
				</Reveal>
				{#if p.plain.fit}
					<Reveal delay={70}>
						<dl class="plain-row">
							<dt class="serif-i">Where it fits</dt>
							<dd>{p.plain.fit}</dd>
						</dl>
					</Reveal>
				{/if}
			</div>
			<Reveal>
				<p class="soon-note">
					<span class="serif-i">In development.</span> No releases yet — work is public at
					<a href={site.github} target="_blank" rel="noopener">{site.name} on GitHub</a>. The
					<a href="/docs/">notes so far</a> cover what already works.
				</p>
			</Reveal>
		</div>
	</section>
{:else if p}
	<!-- ———— editorial overview: story and evidence in one compact service note ———— -->
	<section class="section overview" data-group={site.group} data-profile={proofIndex}>
		<div class="container">
			<Reveal>
				<p class="label label--accent">Overview</p>
				<h2 class="serif">The useful part, at a glance.</h2>
			</Reveal>

			<div class="overview-grid">
				{#if p.plain}
					<div class="overview-story">
						<p class="ledger-label mono">In plain words</p>
						<div class="plain">
							<dl class="plain-row">
								<dt class="serif-i">What it is</dt>
								<dd>{p.plain.what}</dd>
							</dl>
							{#if p.plain.fit}
								<dl class="plain-row">
									<dt class="serif-i">Where it fits</dt>
									<dd>{p.plain.fit}</dd>
								</dl>
							{/if}
							<details class="plain-more">
								<summary>
									<span class="serif-i">Why it exists — and when you need it</span>
									<span class="plain-ind mono" aria-hidden="true">+</span>
								</summary>
								<div>
									<dl class="plain-row">
										<dt class="serif-i">Why it exists</dt>
										<dd>{p.plain.why}</dd>
									</dl>
									<dl class="plain-row">
										<dt class="serif-i">When you need it</dt>
										<dd>{p.plain.when}</dd>
									</dl>
								</div>
							</details>
						</div>
					</div>
				{/if}

				<aside class="overview-evidence" aria-label="Project figures">
					<p class="ledger-label mono">By the numbers</p>
					<div class="metrics">
						{#each p.metrics as m}
							<dl class="metric">
								<dt class="mono">{m.label}</dt>
								<dd class="serif">{m.value}</dd>
							</dl>
						{/each}
					</div>
					<p class="fine mono">figures measured by the project</p>
				</aside>
			</div>
		</div>
	</section>

	<!-- ———— how it works ———— -->
	{#if p.how}
		<section class="section">
			<div class="container">
				<Reveal>
					<p class="label label--accent">How it works</p>
					<h2 class="serif">From zero to running.</h2>
					{#if p.how.intro}<p class="section-sub">{p.how.intro}</p>{/if}
				</Reveal>
			<Reveal>
				<ol class="how">
					{#each p.how.steps as step, i}
						<li class="how-step">
							<details open={i === 0}>
								<summary>
									<span class="num serif-i" aria-hidden="true">{i + 1}</span>
									<span class="how-title mono">{step.title}</span>
									<span class="how-ind mono" aria-hidden="true">+</span>
								</summary>
								<div class="how-body">
									<p>{step.body}</p>
									{#if step.code}
										<figure class="code-figure mini">
											<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
											<pre
												class="mono"
												role="region"
												aria-label={`${step.title} command`}
												tabindex="0">{step.code}</pre
											>
										</figure>
									{/if}
								</div>
							</details>
						</li>
					{/each}
				</ol>
				</Reveal>
			</div>
		</section>
	{/if}

	<!-- The primary task follows the decision context, before the deep capability ledger. -->
	{#if data.release}
		<Downloads release={data.release} />
	{/if}

	<!-- ———— capabilities: the complete story in a compact reading length ———— -->
	<section class="section capabilities" data-group={site.group} data-profile={proofIndex}>
		<div class="container">
			<Reveal>
				<p class="label label--accent">Capabilities</p>
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

			{#if p.useCases?.length}
				<div class="use-cases-block">
					<p class="label label--accent">Use it for</p>
					<h3 class="serif section-title">Where it earns its place.</h3>
					<div class="cases">
						{#each p.useCases as c}
							<details class="case">
								<summary>
									<span class="serif-i">{c.title}</span>
									<span class="case-ind mono" aria-hidden="true">+</span>
								</summary>
								<div class="case-body">
									<p>{c.body}</p>
								{#if c.code}
									<figure class="code-figure mini">
										<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
										<pre
											class="mono"
											role="region"
											aria-label={`${c.title} command`}
											tabindex="0">{c.code}</pre
										>
									</figure>
								{/if}
								</div>
							</details>
						{/each}
					</div>
				</div>
			{/if}

			{#if p.inside?.length}
				<details class="inventory">
					<summary>
						<span>
							<span class="label label--accent">What's inside</span>
							<span class="serif inventory-title">Counted in the source, not the brochure.</span>
						</span>
						<span class="inventory-count mono">{insideItemCount} listed&nbsp;&nbsp;＋</span>
					</summary>
					<div class="inside">
						{#each p.inside as group}
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
						{/each}
					</div>
				</details>
			{/if}
		</div>
	</section>

	<!-- ———— quickstart ———— -->
	<section class="section">
		<div class="container quickstart">
			<Reveal>
				<div class="qs-head">
					<p class="label label--accent">Quickstart</p>
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

	<!-- ———— common questions ———— -->
	{#if p.faq?.length}
		<section class="section">
			<div class="container faq-wrap">
				<Reveal>
					<p class="label label--accent">Common questions</p>
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
					<p class="label label--accent">Works with</p>
				</Reveal>
				<div class="pairs">
					{#each pairs as pair, i}
						<Reveal delay={i * 70}>
							<a class="pair" href="https://{pair.domain}" style:--spice={pair.accent}>
								<span class="mark"><ProductMark id={pair.id} size={28} /></span>
								<span>
									<span class="name mono">{pair.name}</span>
									<span class="course serif-i">{pair.role}</span>
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
			<p class="sub">Documentation is in progress. Meanwhile — <a href={site.github}>the repository</a>.</p>
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

	.section {
		overflow-x: clip;
	}

	.capabilities {
		padding-block: clamp(4.5rem, 9vw, 6.75rem);
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

	.hero-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(18rem, 22rem);
		gap: clamp(3rem, 7vw, 7rem);
		align-items: center;
	}

	.hero-copy,
	.hero-proof,
	.install,
	.install :global(.code-figure),
	.install :global(pre) {
		min-width: 0;
		max-width: 100%;
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

	.hero-more {
		display: none;
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
		overflow-x: auto;
		overscroll-behavior-inline: contain;
	}

	/* A product-specific service note: real catalog data, never a simulated screenshot. */
	.hero-proof {
		position: relative;
		padding: 1.4rem;
		background: color-mix(in srgb, var(--bg-2) 92%, transparent);
		border: 1px solid var(--line-2);
		box-shadow: 0 1.5rem 5rem rgba(0, 0, 0, 0.14);
		backdrop-filter: blur(16px);
	}

	.hero-proof::after {
		content: '';
		position: absolute;
		inset: 0.45rem;
		border: 1px solid var(--line);
		pointer-events: none;
	}

	.hero-proof[data-signature='1'] {
		border-left: 3px solid var(--accent);
	}

	.hero-proof[data-signature='2'] {
		background:
			linear-gradient(135deg, var(--accent-glow), transparent 45%),
			color-mix(in srgb, var(--bg-2) 94%, transparent);
	}

	.hero[data-group='small-plates'] .hero-layout {
		grid-template-columns: minmax(0, 0.9fr) minmax(21rem, 1.1fr);
	}

	.hero[data-group='small-plates'] .hero-proof {
		border-left: 1px solid var(--line-2);
		border-top: 3px solid var(--accent);
		box-shadow: none;
	}

	.hero[data-group='small-plates'] .watermark {
		bottom: auto;
		right: -9rem;
		top: -11rem;
	}

	.hero[data-group='test-kitchen'] {
		background:
			linear-gradient(90deg, transparent 0 49.9%, var(--line) 50%, transparent 50.1%),
			linear-gradient(var(--accent-glow), transparent 52%),
			var(--bg);
	}

	.hero[data-group='test-kitchen'] .hero-proof {
		backdrop-filter: none;
		border-style: dashed;
		box-shadow: none;
	}

	.hero[data-group='test-kitchen'] .hero-proof::after {
		display: none;
	}

	.proof-head {
		display: flex;
		align-items: center;
		gap: 1rem;
		position: relative;
		z-index: 1;
	}

	.proof-mark {
		display: grid;
		place-items: center;
		width: 4.5rem;
		height: 4.5rem;
		color: var(--accent);
	}

	.proof-kicker,
	.proof-name {
		display: block;
	}

	.proof-kicker {
		font-size: 0.75rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.proof-name {
		font-size: 1.35rem;
		font-weight: 400;
		color: var(--accent);
		margin-top: 0.15rem;
	}

	.proof-copy {
		position: relative;
		z-index: 1;
		padding: 1.2rem 0;
		border-block: 1px solid var(--line);
	}

	.proof-title {
		font-size: var(--text-xs);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.proof-body {
		font-size: var(--text-sm);
		color: var(--ink-2);
		margin-top: 0.55rem;
	}

	.proof-facts {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		position: relative;
		z-index: 1;
		padding-top: 1rem;
	}

	.proof-facts dt {
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.proof-facts dd {
		font-size: 1.3rem;
		color: var(--ink);
		margin-top: 0.15rem;
		overflow-wrap: anywhere;
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
		margin: 2.5rem 0 0;
		padding: 0;
		max-width: 46rem;
		border-top: 1px solid var(--line);
	}

	.how-step {
		border-bottom: 1px solid var(--line);
	}

	.how-step details {
		min-width: 0;
	}

	.how-step summary {
		align-items: center;
		cursor: pointer;
		display: grid;
		gap: 1.25rem;
		grid-template-columns: 3.5rem minmax(0, 1fr) auto;
		list-style: none;
		min-height: 5.25rem;
		padding: 0.75rem 0.5rem;
	}

	.how-step summary::-webkit-details-marker {
		display: none;
	}

	.how-step summary:hover .how-title,
	.how-step details[open] .how-title {
		color: var(--accent);
	}

	.how-step .num {
		font-size: 2.25rem;
		line-height: 1;
		color: var(--accent);
		opacity: 0.85;
	}

	.how-title {
		font-size: var(--text-xs);
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		transition: color var(--t-row) var(--ease-out);
	}

	.how-ind {
		color: var(--ink-3);
		transition: color 0.25s, transform 0.3s var(--ease-swift);
	}

	.how-step details[open] .how-ind {
		color: var(--accent);
		transform: rotate(45deg);
	}

	.how-body {
		padding: 0 3rem 1.5rem 5.25rem;
	}

	.how-body p {
		color: var(--ink-2);
		max-width: 40rem;
		overflow-wrap: anywhere;
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
		white-space: pre;
		overflow-x: auto;
		overscroll-behavior-inline: contain;
	}

	/* compact editorial overview */
	.overview-grid {
		display: grid;
		gap: clamp(2.5rem, 6vw, 6rem);
		grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.65fr);
		margin-top: 3rem;
		align-items: start;
	}

	.ledger-label {
		color: var(--ink-3);
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.overview .plain {
		margin-top: 0.85rem;
	}

	.overview .plain-row {
		gap: 1.25rem;
		grid-template-columns: 8.5rem minmax(0, 1fr);
		padding: 1.15rem 0.25rem;
	}

	.overview .plain-row dt {
		font-size: 1.12rem;
	}

	.overview .plain-row dd {
		font-size: var(--text-sm);
		line-height: 1.62;
	}

	.plain-more {
		border-bottom: 1px solid var(--line);
	}

	.plain-more > summary {
		align-items: center;
		cursor: pointer;
		display: flex;
		gap: 1rem;
		justify-content: space-between;
		list-style: none;
		min-height: 4.75rem;
		padding: 0.9rem 0.25rem;
	}

	.plain-more > summary::-webkit-details-marker {
		display: none;
	}

	.plain-more > summary .serif-i {
		font-size: 1.05rem;
		transition: color var(--t-row) var(--ease-out);
	}

	.plain-more > summary:hover .serif-i,
	.plain-more[open] > summary .serif-i {
		color: var(--accent);
	}

	.plain-ind {
		color: var(--ink-3);
		transition: color 0.25s, transform 0.3s var(--ease-swift);
	}

	.plain-more[open] .plain-ind {
		color: var(--accent);
		transform: rotate(45deg);
	}

	.plain-more .plain-row:last-child {
		border-bottom: 0;
	}

	.overview-evidence {
		background:
			linear-gradient(145deg, var(--accent-glow), transparent 46%),
			var(--bg-2);
		border: 1px solid var(--line-2);
		padding: 1.25rem;
	}

	.overview .metrics {
		gap: 0;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		margin-top: 0.85rem;
		border-top: 1px solid var(--line);
	}

	.overview .metric {
		border-bottom: 1px solid var(--line);
		border-left: 0;
		min-height: 7.5rem;
		padding: 1rem 0.75rem 0.9rem 0;
	}

	.overview .metric:nth-child(even) {
		border-left: 1px solid var(--line);
		padding-left: 0.9rem;
	}

	.overview .metric dd {
		font-size: clamp(1.65rem, 3vw, 2.35rem);
	}

	.overview .fine {
		margin-top: 1rem;
	}

	.overview[data-group='small-plates'] .overview-story {
		grid-column: 2;
		grid-row: 1;
	}

	.overview[data-group='small-plates'] .overview-evidence {
		grid-column: 1;
		grid-row: 1;
	}

	.overview[data-group='small-plates'] .plain-row {
		grid-template-columns: minmax(0, 1fr);
		gap: 0.45rem;
	}

	.overview[data-group='test-kitchen'] .overview-grid {
		grid-template-columns: minmax(0, 1fr);
	}

	.overview[data-group='test-kitchen'] .overview-evidence {
		display: grid;
		gap: 0 2rem;
		grid-template-columns: 10rem minmax(0, 1fr);
	}

	.overview[data-group='test-kitchen'] .overview-evidence .ledger-label,
	.overview[data-group='test-kitchen'] .overview-evidence .fine {
		grid-column: 1;
	}

	.overview[data-group='test-kitchen'] .overview-evidence .metrics {
		grid-column: 2;
		grid-row: 1 / span 2;
		margin-top: 0;
	}

	/* expandable source inventory */
	.inventory {
		border-block: 1px solid var(--line-2);
		margin-top: clamp(3.5rem, 8vw, 6rem);
	}

	.inventory > summary {
		align-items: center;
		cursor: pointer;
		display: flex;
		gap: 2rem;
		justify-content: space-between;
		list-style: none;
		min-height: 7rem;
		padding: 1.2rem 0.5rem;
	}

	.inventory > summary::-webkit-details-marker {
		display: none;
	}

	.inventory-title {
		display: block;
		font-size: clamp(1.35rem, 3vw, 1.9rem);
		line-height: 1.15;
		margin-top: 0.45rem;
	}

	.inventory-count {
		color: var(--ink-3);
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		white-space: nowrap;
		transition: color 0.2s;
	}

	.inventory[open] .inventory-count,
	.inventory > summary:hover .inventory-count {
		color: var(--accent);
	}

	/* what's inside */
	.inside {
		margin-top: 0;
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
		font-size: 0.75rem;
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
	.use-cases-block {
		border-top: 1px solid var(--line-2);
		margin-top: clamp(3.5rem, 8vw, 6rem);
		padding-top: clamp(2.5rem, 6vw, 4.5rem);
	}

	.section-title {
		font-size: clamp(1.65rem, 3.5vw, 2.25rem);
		font-weight: 400;
		line-height: 1.12;
		margin-top: 0.75rem;
	}

	.cases {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0 2rem;
		margin-top: 2rem;
		border-top: 1px solid var(--line);
	}

	.case,
	.case .code-figure,
	.case pre,
	.how-body,
	.quickstart > :global(div),
	.qs-code,
	.qs-code :global(.code-figure),
	.qs-code :global(pre) {
		min-width: 0;
		max-width: 100%;
	}

	.qs-code :global(pre) {
		overflow-x: auto;
		overscroll-behavior-inline: contain;
	}

	.case {
		border-bottom: 1px solid var(--line);
	}

	.case summary {
		align-items: center;
		cursor: pointer;
		display: flex;
		gap: 1.5rem;
		justify-content: space-between;
		list-style: none;
		min-height: 5rem;
		padding: 1rem 0.5rem;
	}

	.case summary::-webkit-details-marker {
		display: none;
	}

	.case summary .serif-i {
		font-size: 1.25rem;
		transition: color var(--t-row) var(--ease-out);
	}

	.case summary:hover .serif-i,
	.case[open] summary .serif-i {
		color: var(--accent);
	}

	.case-ind {
		color: var(--ink-3);
		transition: color 0.25s, transform 0.3s var(--ease-swift);
	}

	.case[open] .case-ind {
		color: var(--accent);
		transform: rotate(45deg);
	}

	.case-body {
		padding: 0 2.5rem 1.4rem 0.5rem;
	}

	.case-body p {
		color: var(--ink-2);
		font-size: var(--text-sm);
	}

	/* common questions */
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
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		color: var(--ink-3);
	}

	/* features */
	.features {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.5rem;
		margin-top: 2.5rem;
	}

	.features > :global(div) {
		display: grid;
	}

	.feature {
		height: 100%;
		padding: 1.35rem;
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

	/* Three editorial rhythms keep the family related without cloning every page. */
	.capabilities[data-profile='0'] .feature {
		background: transparent;
		border-width: 1px 0 0;
		padding-inline: 0.25rem;
	}

	:global(.capabilities[data-profile='1'] .features > div:nth-child(2)) .feature,
	:global(.capabilities[data-profile='1'] .features > div:nth-child(5)) .feature {
		position: relative;
		top: 1.25rem;
	}

	.capabilities[data-profile='2'] .features {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.capabilities[data-profile='2'] .features > :global(div:first-child),
	.capabilities[data-profile='2'] .features > :global(div:last-child) {
		grid-column: 1 / -1;
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
		.hero-layout {
			grid-template-columns: minmax(0, 1fr) minmax(16rem, 19rem);
			gap: 2.5rem;
		}
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

	@media (max-width: 780px) {
		.overview-grid,
		.overview[data-group='test-kitchen'] .overview-grid {
			grid-template-columns: minmax(0, 1fr);
			gap: 2.5rem;
		}

		.overview[data-group='small-plates'] .overview-story,
		.overview[data-group='small-plates'] .overview-evidence {
			grid-column: 1;
			grid-row: auto;
		}

		.overview[data-group='small-plates'] .overview-evidence {
			grid-row: 1;
		}

		.overview[data-group='test-kitchen'] .overview-evidence {
			display: block;
		}

		.overview[data-group='test-kitchen'] .overview-evidence .metrics {
			margin-top: 0.85rem;
		}
	}

	@media (max-width: 620px) {
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
			background: linear-gradient(to bottom, var(--bg) 0 67%, transparent 86%);
			pointer-events: none;
		}

		.hero-inner {
			padding-block: 4.25rem 3rem;
		}

		.hero-layout {
			grid-template-columns: minmax(0, 1fr);
			gap: 2.25rem;
		}

		.hero[data-group='small-plates'] .hero-layout {
			grid-template-columns: minmax(0, 1fr);
		}

		.hero-copy {
			position: relative;
			z-index: 2;
			background: var(--bg);
		}

		h1 {
			font-size: clamp(2.55rem, 13vw, 3.5rem);
			margin-top: 1.15rem;
		}

		.sub {
			font-size: 1.05rem;
			line-height: 1.6;
			margin-top: 1.15rem;
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

		.hero-proof {
			padding: 1.15rem;
			background: var(--bg-2);
			backdrop-filter: none;
		}

		.proof-mark {
			width: 3.25rem;
			height: 3.25rem;
		}

		.proof-mark :global(svg) {
			width: 3.25rem;
			height: 3.25rem;
		}

		.proof-copy {
			padding-block: 0.9rem;
		}

		.proof-body {
			display: none;
		}

		.install {
			margin-top: 2rem;
			width: 100%;
			overflow: hidden;
		}

		.tabs {
			overflow-x: auto;
			flex-wrap: nowrap;
		}

		.tab {
			flex: 0 0 auto;
			min-height: 2.75rem;
		}

		.watermark {
			right: -10rem;
			bottom: -4rem;
			opacity: 0.04;
		}

		.hero[data-group='small-plates'] .watermark {
			bottom: -4rem;
			right: -10rem;
			top: auto;
		}

		.features,
		.capabilities[data-profile='2'] .features {
			grid-template-columns: 1fr;
		}

		.capabilities[data-profile='2'] .features > :global(div:first-child),
		.capabilities[data-profile='2'] .features > :global(div:last-child) {
			grid-column: auto;
		}

		:global(.capabilities[data-profile='1'] .features > div:nth-child(2)) .feature,
		:global(.capabilities[data-profile='1'] .features > div:nth-child(5)) .feature {
			top: 0;
		}

		.overview .plain-row {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.45rem;
		}

		.overview-evidence {
			padding: 1rem;
		}

		.overview .metric {
			min-height: 6.75rem;
			padding-block: 0.85rem;
		}

		.how-step summary {
			gap: 0.8rem;
			grid-template-columns: 2.5rem minmax(0, 1fr) auto;
			min-height: 4.75rem;
			padding-inline: 0.25rem;
		}

		.how-step .num {
			font-size: 1.85rem;
		}

		.how-body {
			padding: 0 0.5rem 1.4rem 3.55rem;
		}

		.inventory > summary {
			align-items: flex-start;
			gap: 1rem;
			min-height: 6.5rem;
			padding-inline: 0.25rem;
		}

		.inventory-count {
			padding-top: 0.2rem;
		}

		.case-body {
			padding-right: 0.5rem;
		}
		.pair {
			grid-template-columns: auto 1fr auto;
		}
		.pair .line {
			display: none;
		}

		.inside-group,
		.plain-row,
		.how-step,
		.card,
		.pair,
		.faq-item,
		.metrics,
		.features,
		.cases {
			min-width: 0;
			max-width: 100%;
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

		.proof-facts {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
