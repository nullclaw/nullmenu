<script>
	import { site, products } from '$lib/site';
	import Logo from './Logo.svelte';

	const isMenu = site.kind === 'menu';
	const year = new Date().getFullYear();
</script>

<footer>
	<div class="container">
		<div class="signoff">
			<p class="serif-i big">Bon appétit.</p>
			<p class="sub">
				Autonomous AI, à la carte — single-binary Zig tools that run on your own hardware.
			</p>
		</div>

		<div class="cols">
			<div class="col">
				<h3 class="label">The menu</h3>
				<ul>
					{#each products as p}
						<li>
							<a href="https://{p.domain}" class="mono">{p.name}</a>
						</li>
					{/each}
				</ul>
			</div>

			<div class="col">
				<h3 class="label">Kitchen</h3>
				<ul>
					<li><a href={isMenu ? '/products/' : 'https://nullmenu.ai/products/'}>All products</a></li>
					<li><a href="/docs/">Documentation</a></li>
					<li><a href="/llms.txt" class="mono">llms.txt</a></li>
					<li><a href="/llms-full.txt" class="mono">llms-full.txt</a></li>
				</ul>
			</div>

			<div class="col">
				<h3 class="label">Source</h3>
				<ul>
					<li><a href={site.github} target="_blank" rel="noopener">GitHub &nearr;</a></li>
					<li>
						<a href="https://github.com/nullclaw" target="_blank" rel="noopener"
							>nullclaw org &nearr;</a
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
			<span class="mark"><Logo size={18} /></span>
			<span class="mono note">© {year} the Null ecosystem</span>
			<span class="mono note">cooked with Zig 0.16</span>
			<span class="mono note">local-first · no cloud</span>
		</div>
	</div>
</footer>

<style>
	footer {
		border-top: 1px solid var(--line);
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

	.col a:hover {
		color: var(--accent);
	}

	.dim {
		color: var(--ink-3);
		font-size: var(--text-sm);
	}

	.bottom {
		border-top: 1px solid var(--line);
		padding-top: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1.75rem;
		flex-wrap: wrap;
		color: var(--ink-3);
	}

	.mark {
		color: var(--ink-3);
	}

	.note {
		font-size: 0.7rem;
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
</style>
