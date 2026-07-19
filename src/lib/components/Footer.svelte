<script>
	import { site, products } from '$lib/site';
	import Logo from './Logo.svelte';
	import FunctionalIcon from './FunctionalIcon.svelte';

	const isMenu = site.kind === 'menu';
	const year = new Date().getFullYear();
</script>

<footer>
	<div class="container">
		<div class="signoff">
			<p class="serif-i big">Built for your hardware.</p>
			<p class="sub">
				Single-binary Zig tools for running and supervising AI agents locally.
			</p>
		</div>

		<div class="cols">
			<div class="col">
				<h3 class="label">Products</h3>
				<ul>
					{#each products as p}
						<li>
							<a href="https://{p.domain}" class="mono">{p.name}</a>
						</li>
					{/each}
				</ul>
			</div>

			<div class="col">
				<h3 class="label">Explore</h3>
				<ul>
					<li><a href={isMenu ? '/products/' : 'https://nullmenu.ai/products/'}>All products</a></li>
						<li><a href="/docs/">Documentation</a></li>
						<li><a href="/llms.txt" class="mono">llms.txt</a></li>
				</ul>
			</div>

			<div class="col">
				<h3 class="label">Source</h3>
				<ul>
					<li>
						<a href={site.github} target="_blank" rel="noopener"
							>GitHub <FunctionalIcon name="external" size={15} label="opens in a new tab" /></a
						>
					</li>
					<li>
						<a href="https://github.com/nullclaw" target="_blank" rel="noopener"
							>nullclaw org <FunctionalIcon
								name="external"
								size={15}
								label="opens in a new tab"
							/></a
						>
					</li>
					{#if site.license}
						<li><span class="dim">{site.license} licensed</span></li>
					{/if}
					{#if site.version}
						<li><span class="dim mono">{site.version}</span></li>
					{/if}
				</ul>
			</div>
		</div>

		<div class="bottom">
			<span class="mark"><Logo size={24} /></span>
			<span class="mono note">© {year} the Null ecosystem</span>
			<span class="mono note">built with Zig 0.16</span>
			<span class="mono note">local-first · no cloud</span>
		</div>
	</div>
</footer>

<style>
	footer {
		border-top: 1px solid var(--line-2);
		padding: var(--section-pad-sm) 0 2.5rem;
		position: relative;
		background:
			radial-gradient(80rem 30rem at 50% 130%, var(--accent-glow), transparent 60%),
			var(--bg);
	}

	.signoff {
		margin-bottom: 3.5rem;
	}

	.big {
		font-size: clamp(2.4rem, 6vw, 4rem);
		color: var(--ink);
		line-height: 1.1;
	}

	.sub {
		color: var(--ink-3);
		margin-top: 0.75rem;
		max-width: 34rem;
	}

	.cols {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 2rem;
		padding-bottom: 3rem;
	}

	.col h3 {
		margin-bottom: 1.1rem;
	}

	ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.col a {
		color: var(--ink-2);
		font-size: var(--text-sm);
		transition: color 0.2s var(--ease-out);
	}

	.col a:has(:global(.functional-icon)) {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.col a:hover {
		color: var(--accent);
	}

	.dim {
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.bottom {
		border-top: 1px solid var(--line-2);
		padding-top: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1.75rem;
		flex-wrap: wrap;
		color: var(--ink-3);
	}

	.mark {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		flex: 0 0 24px;
		color: var(--ink-3);
	}

	.note {
		font-size: 0.75rem;
		letter-spacing: 0.08em;
	}

	.bottom .note:last-child {
		margin-left: auto;
	}

	@media (max-width: 720px) {
		.cols {
			grid-template-columns: 1fr 1fr;
		}
		.bottom .note:last-child {
			margin-left: 0;
		}
	}

	@media (hover: none), (pointer: coarse) {
		.col a {
			display: inline-flex;
			align-items: center;
			min-height: 44px;
		}

		.cols ul {
			gap: 0;
		}
	}
</style>
