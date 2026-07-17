<script>
	import { products, groups } from '$lib/site';
	import Seo from '$lib/components/Seo.svelte';
	import ProductMark from '$lib/components/ProductMark.svelte';
	import Reveal from '$lib/components/Reveal.svelte';

	const byGroup = groups.map((g) => ({
		...g,
		items: products.filter((p) => p.group === g.id)
	}));
</script>

<Seo
	title="The menu — every product in the Null ecosystem"
	description="The full catalog: agent runtime, management console, orchestration, tasks, memory, observability. Single-binary Zig tools, each on its own subdomain."
	canonical="https://nullmenu.ai/products/"
/>

<section class="head">
	<div class="container">
		<p class="label label--accent">nullmenu.ai · full carte</p>
		<h1><span class="serif">The</span> <span class="serif-i">menu.</span></h1>
		<p class="sub">
			Every dish is a single static Zig binary with its own site and docs. Composable over plain
			JSON and HTTP — each one works alone.
		</p>
	</div>
</section>

<section class="menu">
	<div class="container">
		{#each byGroup as g}
			<div class="group">
				<Reveal>
					<div class="group-head">
						<h2 class="serif-i">{g.title}</h2>
						<span class="leaders" aria-hidden="true"></span>
						<span class="note mono">{g.note}</span>
					</div>
				</Reveal>

				{#each g.items as p, i}
					<Reveal delay={i * 50}>
						<a class="row" href="https://{p.domain}" style:--spice={p.accent}>
							<span class="mark"><ProductMark id={p.id} size={30} /></span>
							<span class="ident">
								<span class="name mono">{p.name}</span>
								<span class="course serif-i">{p.course}</span>
							</span>
							<span class="line">{p.line}</span>
							<span class="leaders" aria-hidden="true"></span>
							<span class="meta">
								<span class="stat mono">{p.stat}</span>
								<span class="tags mono">
									{#if p.version}<span class="tag">{p.version}</span>{/if}
									{#if p.license}<span class="tag">{p.license}</span>{/if}
									<span class="tag tag--status">{p.status}</span>
								</span>
							</span>
						</a>
					</Reveal>
				{/each}
			</div>
		{/each}

		<p class="fine mono">
			all components pre-1.0 · CalVer releases · products without a license tag have no license
			file yet
		</p>
	</div>
</section>

<style>
	.head {
		padding: clamp(4rem, 10vw, 7rem) 0 3rem;
		background:
			radial-gradient(50rem 30rem at 50% -30%, var(--accent-glow), transparent 60%),
			var(--bg);
	}

	h1 {
		font-size: clamp(3rem, 9vw, 6rem);
		font-weight: 400;
		line-height: 1;
		margin-top: 1.25rem;
	}

	h1 .serif-i {
		color: var(--accent);
	}

	.sub {
		max-width: 34rem;
		margin-top: 1.5rem;
		color: var(--ink-2);
		font-size: var(--text-lg);
	}

	.menu {
		padding-bottom: clamp(4rem, 8vw, 6rem);
	}

	.group {
		margin-top: 3.5rem;
	}

	.group-head {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.group-head h2 {
		font-size: clamp(1.7rem, 3.5vw, 2.4rem);
		font-weight: 400;
		color: var(--ink);
	}

	.group-head .note {
		font-size: var(--text-xs);
		color: var(--ink-3);
		letter-spacing: 0.08em;
	}

	.row {
		display: grid;
		grid-template-columns: auto 15rem minmax(0, 26rem) 1fr auto;
		align-items: center;
		gap: 1.5rem;
		padding: 1.4rem 0.75rem;
		border-bottom: 1px solid var(--line);
		transition: background 0.25s var(--ease-out);
	}

	.group .row:first-of-type {
		border-top: 1px solid var(--line);
	}

	.row:hover {
		background: var(--bg-2);
	}

	.mark {
		color: var(--ink-3);
		transition: color 0.25s var(--ease-out), transform 0.25s var(--ease-out);
	}

	.row:hover .mark {
		color: var(--spice);
		transform: scale(1.08);
	}

	.ident {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.name {
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--ink);
	}

	.course {
		color: var(--ink-3);
		font-size: 0.95rem;
	}

	.row:hover .course {
		color: color-mix(in srgb, var(--spice) 70%, var(--ink-3));
	}

	:global([data-theme='light']) .row:hover .mark,
	:global([data-theme='light']) .row:hover .course {
		color: color-mix(in srgb, var(--spice) 45%, var(--ink));
	}

	:global([data-theme='light']) .row:hover .leaders {
		border-color: color-mix(in srgb, var(--spice) 45%, var(--ink));
	}

	.line {
		color: var(--ink-2);
		font-size: var(--text-sm);
	}

	.row:hover .leaders {
		border-color: var(--spice);
		opacity: 0.8;
	}

	.meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.4rem;
	}

	.stat {
		font-size: var(--text-xs);
		color: var(--ink);
		letter-spacing: 0.05em;
	}

	.tags {
		display: flex;
		gap: 0.4rem;
	}

	.tag {
		font-size: 0.62rem;
		letter-spacing: 0.08em;
		color: var(--ink-3);
		border: 1px solid var(--line);
		padding: 0.1em 0.55em;
		border-radius: 99px;
	}

	.tag--status {
		color: var(--spice);
		border-color: color-mix(in srgb, var(--spice) 40%, transparent);
	}

	:global([data-theme='light']) .tag--status {
		color: color-mix(in srgb, var(--spice) 40%, var(--ink));
	}

	.fine {
		margin-top: 3rem;
		font-size: 0.65rem;
		letter-spacing: 0.08em;
		color: var(--ink-3);
	}

	@media (max-width: 1080px) {
		.row {
			grid-template-columns: auto 13rem 1fr auto;
		}
		.line {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.row {
			grid-template-columns: auto 1fr;
			grid-template-areas: 'mark ident' 'mark meta';
			row-gap: 0.5rem;
		}
		.mark {
			grid-area: mark;
			align-self: start;
		}
		.ident {
			grid-area: ident;
		}
		.row :global(.leaders) {
			display: none;
		}
		.meta {
			grid-area: meta;
			align-items: flex-start;
		}
	}
</style>
