<script>
	/**
	 * Platform-aware, architecture-explicit release downloads. We detect only
	 * the operating system: guessing a CPU can offer a binary that cannot run.
	 */
	import { site } from '$lib/site';
	import Reveal from './Reveal.svelte';

	let { release } = $props();

	let detectedOs = $state(null);
	let selectedName = $state(null);
	let copiedName = $state('');

	const detectedLabel = $derived(
		detectedOs ? release.binaries.find((binary) => binary.os === detectedOs)?.label : null
	);
	const platformChoices = $derived(
		detectedOs ? release.binaries.filter((binary) => binary.os === detectedOs) : []
	);
	const selected = $derived.by(() => {
		for (const binary of release.binaries) {
			if (binary.name === selectedName) return binary;
			const alternate = binary.alternates?.find((asset) => asset.name === selectedName);
			if (alternate) {
				return {
					...binary,
					name: alternate.name,
					url: alternate.url,
					package: alternate.name.endsWith('.zip') ? 'zip' : 'binary',
					executableName: alternate.name.endsWith('.exe') ? alternate.name : null,
					size: null,
					bytes: null,
					alternates: [],
					checksum: alternate.checksum,
					signature: alternate.signature
				};
			}
		}
		return null;
	});

	$effect(() => {
		const ua = navigator.userAgent;
		const platform = navigator.platform ?? '';
		if (/android/i.test(ua)) detectedOs = 'android';
		else if (/mac/i.test(platform) || /Macintosh/.test(ua)) detectedOs = 'mac';
		else if (/win/i.test(platform) || /Windows/.test(ua)) detectedOs = 'windows';
		else if (/linux/i.test(platform) || /Linux/.test(ua)) detectedOs = 'linux';
	});

	function shellQuote(value) {
		return `'${String(value).replaceAll("'", "'\\''")}'`;
	}

	function powershellQuote(value) {
		return `'${String(value).replaceAll("'", "''")}'`;
	}

	function installCommand(binary) {
		if (binary.os === 'windows') {
			return `Invoke-WebRequest -Uri ${powershellQuote(binary.url)} -OutFile ${powershellQuote(binary.name)}`;
		}
		return `curl -fL ${shellQuote(binary.url)} -o ${shellQuote(binary.name)} && chmod +x ${shellQuote(binary.name)}`;
	}

	function runHint(binary) {
		if (binary.os === 'windows' && binary.package === 'zip') {
			return binary.executableName
				? `Unzip ${binary.name}, then run .\\${binary.executableName} --help`
				: `Unzip ${binary.name}, then run the included .exe with --help`;
		}
		if (binary.os === 'windows') return `.\\${binary.name} --help`;
		return `chmod +x ${binary.name} && ./${binary.name} --help`;
	}

	async function copyInstall(binary) {
		try {
			await navigator.clipboard.writeText(installCommand(binary));
			copiedName = binary.name;
			const status = document.getElementById('sr-status');
			if (status) status.textContent = 'Install command copied';
			setTimeout(() => (copiedName = ''), 1600);
		} catch {
			const status = document.getElementById('sr-status');
			if (status) status.textContent = 'Clipboard unavailable';
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

		{#if release.status !== 'live'}
			<Reveal>
				<div class="release-note" role="status">
					<span class="pulse" aria-hidden="true"></span>
					<p>{release.note}</p>
					<a href={release.url} target="_blank" rel="noopener">Open pinned release &nearr;</a>
				</div>
			</Reveal>
		{/if}

		{#if platformChoices.length}
			<Reveal>
				<div class="chooser">
					<div class="chooser-copy">
						<p class="eyebrow mono">Detected · {detectedLabel}</p>
						<h3 class="serif">Choose your processor.</h3>
						<p>We recognise your operating system, but leave the architecture to you.</p>
					</div>
					<div class="choices" aria-label="{detectedLabel} downloads">
						{#each platformChoices as binary}
							<a
								class="choice"
								class:chosen={selectedName === binary.name}
								href={binary.url}
								download
								onclick={() => (selectedName = binary.name)}
							>
								<span class="serif-i">{binary.arch}</span>
								<span class="mono">
									{binary.package === 'zip' ? 'ZIP' : 'binary'}{#if binary.size} · {binary.size}{/if}
								</span>
							</a>
						{/each}
					</div>
				</div>

				{#if selected}
					<div class="after-download">
						<span class="mono">After download</span>
						<code class="hint mono">{runHint(selected)}</code>
						<button class="copy mono" onclick={() => copyInstall(selected)}>
							{copiedName === selected.name
								? 'Copied'
								: selected.os === 'windows'
									? 'Copy PowerShell'
									: 'Copy curl'}
						</button>
					</div>
				{/if}
			</Reveal>
		{:else if !release.binaries.length}
			<Reveal>
				<div class="release-fallback">
					<div>
						<p class="eyebrow mono">Pinned · {release.tag}</p>
						<h3 class="serif">Release assets remain available.</h3>
						<p>Choose the file for your operating system and processor on GitHub.</p>
					</div>
					<a class="btn btn--solid" href={release.url} target="_blank" rel="noopener">
						Browse release assets &nearr;
					</a>
				</div>
			</Reveal>
		{/if}

		{#if release.binaries.length}
			<Reveal class="download-list">
				<div class="menu-head mono">
					<span>{site.name} · {release.tag}{#if release.date}&nbsp;· {release.date}{/if}</span>
					<a href={release.url} target="_blank" rel="noopener">release notes &nearr;</a>
				</div>
				<ul class="binaries">
					{#each release.binaries as binary}
						<li
							class:current={selectedName === binary.name ||
								binary.alternates?.some((alternate) => alternate.name === selectedName)}
						>
							<div class="binary-row">
								<a
									class="binary-download"
									href={binary.url}
									download
									onclick={() => (selectedName = binary.name)}
								>
									<span class="os mono">{binary.label}</span>
									<span class="arch serif-i">{binary.arch}</span>
									<span class="leaders" aria-hidden="true"></span>
									{#if binary.size}<span class="bsize mono">{binary.size}</span>{/if}
								</a>
								<button
									class="copy mono"
									onclick={() => copyInstall(binary)}
									aria-label="Copy {binary.os === 'windows' ? 'PowerShell' : 'curl'} command for {binary.label} {binary.arch}"
								>
									{copiedName === binary.name
										? 'copied'
										: binary.os === 'windows'
											? 'ps'
											: 'curl'}
								</button>
							</div>
							<div class="asset-meta mono">
								<span>{binary.name}</span>
								{#each binary.alternates ?? [] as alternate}
								<a
									href={alternate.url}
									download
									onclick={() => (selectedName = alternate.name)}>{alternate.label}</a
								>
									{#if alternate.checksum}
										<a href={alternate.checksum.url} download title={alternate.checksum.name}>
											{alternate.label} SHA-256
										</a>
									{/if}
									{#if alternate.signature}
										<a href={alternate.signature.url} download title={alternate.signature.name}>
											{alternate.label} signature
										</a>
									{/if}
								{/each}
								{#if binary.checksum}
									<a href={binary.checksum.url} download title={binary.checksum.name}>
										{binary.checksum.label}
									</a>
								{/if}
								{#if binary.signature}
									<a href={binary.signature.url} download title={binary.signature.name}>
										{binary.signature.label}
									</a>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
				<p class="verification mono">
					When a release publishes a SHA-256 file or signature, its verification link appears beside
					the asset.
				</p>
			</Reveal>
		{/if}
	</div>
</section>

<style>
	/* The asset list is a primary task, not decoration: never soften or delay it. */
	:global(.download-list.reveal),
	:global(.download-list.sda) {
		opacity: 1;
		transform: none;
		filter: none;
		transition: none;
		animation: none;
	}

	h2 {
		font-size: clamp(1.9rem, 4.4vw, 2.8rem);
		font-weight: 400;
		line-height: 1.12;
		margin-top: 1rem;
	}

	h3 {
		font-size: clamp(1.35rem, 3vw, 1.85rem);
		font-weight: 400;
		line-height: 1.08;
	}

	.sub {
		color: var(--ink-2);
		margin-top: 1rem;
		max-width: 34rem;
	}

	.release-note {
		align-items: center;
		background: color-mix(in srgb, var(--accent) 7%, var(--bg-2));
		border: 1px solid color-mix(in srgb, var(--accent) 28%, var(--line));
		display: grid;
		gap: 0.75rem;
		grid-template-columns: auto minmax(0, 1fr) auto;
		margin-top: 2.25rem;
		padding: 0.85rem 1rem;
	}

	.release-note p {
		color: var(--ink-2);
		font-size: var(--text-sm);
	}

	.release-note a {
		color: var(--accent);
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.pulse {
		background: var(--accent);
		border-radius: 50%;
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 13%, transparent);
		height: 0.42rem;
		width: 0.42rem;
	}

	.chooser,
	.release-fallback {
		align-items: end;
		background: var(--bg-2);
		border: 1px solid var(--line);
		display: grid;
		gap: clamp(1.5rem, 4vw, 3.5rem);
		grid-template-columns: minmax(12rem, 0.75fr) minmax(0, 1.25fr);
		margin-top: 2.5rem;
		padding: clamp(1.25rem, 3vw, 2rem);
	}

	.release-fallback {
		align-items: center;
	}

	.chooser-copy > p:last-child,
	.release-fallback p:last-child {
		color: var(--ink-3);
		font-size: var(--text-sm);
		margin-top: 0.65rem;
		max-width: 24rem;
	}

	.eyebrow {
		color: var(--accent);
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		margin-bottom: 0.7rem;
		text-transform: uppercase;
	}

	.choices {
		display: grid;
		gap: 0.6rem;
		grid-template-columns: repeat(auto-fit, minmax(min(9rem, 100%), 1fr));
		min-width: 0;
	}

	.choice {
		background: var(--bg);
		border: 1px solid var(--line);
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
		padding: 1rem;
		transition: border-color 0.2s var(--ease-out), background 0.2s var(--ease-out);
	}

	.choice:hover,
	.choice.chosen {
		background: color-mix(in srgb, var(--accent) 6%, var(--bg));
		border-color: var(--accent);
	}

	.choice .serif-i {
		font-size: 1.1rem;
	}

	.choice .mono {
		color: var(--ink-3);
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.after-download {
		align-items: center;
		border: 1px solid var(--line);
		border-top: 0;
		display: grid;
		gap: 0.85rem;
		grid-template-columns: auto minmax(0, 1fr) auto;
		padding: 0.8rem 1rem;
	}

	.after-download > span,
	.hint {
		color: var(--ink-3);
		font-size: var(--text-xs);
		letter-spacing: 0.02em;
	}

	.hint {
		background: transparent;
		overflow-wrap: anywhere;
		white-space: normal;
	}

	.menu-head {
		align-items: baseline;
		display: flex;
		font-size: var(--text-xs);
		justify-content: space-between;
		letter-spacing: 0.08em;
		margin-top: 2.75rem;
		padding-bottom: 0.75rem;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.menu-head a,
	.asset-meta a {
		color: var(--ink-2);
		transition: color 0.2s;
	}

	.menu-head a:hover,
	.asset-meta a:hover {
		color: var(--accent);
	}

	.binaries {
		border-top: 1px solid var(--line);
		display: grid;
		gap: 0 3rem;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.binaries li {
		border-bottom: 1px solid var(--line);
		min-width: 0;
	}

	.binary-row {
		display: flex;
		min-width: 0;
	}

	.binary-download {
		align-items: baseline;
		display: flex;
		flex: 1;
		gap: 0.8rem;
		min-width: 0;
		padding: 0.72rem 0.4rem 0.35rem;
		transition: background 0.2s var(--ease-out);
	}

	.binary-download:hover {
		background: var(--bg-2);
	}

	.current .os,
	.binary-download:hover .os {
		color: var(--accent);
	}

	.copy {
		border-left: 1px solid var(--line);
		color: var(--ink-3);
		font-size: 0.66rem;
		letter-spacing: 0.09em;
		padding: 0 0.8rem;
		text-transform: uppercase;
		transition: color 0.2s var(--ease-out), background 0.2s var(--ease-out);
		white-space: nowrap;
	}

	.copy:hover {
		background: var(--bg-2);
		color: var(--accent);
	}

	.os {
		color: var(--ink);
		font-size: var(--text-sm);
		font-weight: 500;
		min-width: 5.5rem;
	}

	.arch {
		color: var(--ink-3);
		font-size: 0.95rem;
	}

	.leaders {
		border-bottom: 1px dotted var(--line);
		flex: 1;
		min-width: 0.75rem;
	}

	.bsize {
		color: var(--ink-2);
		font-size: var(--text-xs);
		white-space: nowrap;
	}

	.asset-meta {
		color: var(--ink-3);
		display: flex;
		font-size: 0.63rem;
		gap: 0.7rem;
		letter-spacing: 0.03em;
		min-width: 0;
		padding: 0 0.4rem 0.6rem;
	}

	.asset-meta span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.asset-meta a {
		flex: none;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.verification {
		color: var(--ink-3);
		font-size: var(--text-xs);
		line-height: 1.55;
		margin-top: 0.9rem;
		max-width: 42rem;
	}

	@media (max-width: 860px) {
		.chooser,
		.release-fallback {
			align-items: start;
			grid-template-columns: minmax(0, 1fr);
		}

		.binaries {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (max-width: 560px) {
		.release-note,
		.after-download {
			align-items: start;
			grid-template-columns: auto minmax(0, 1fr);
		}

		.release-note a,
		.after-download .copy {
			grid-column: 2;
			justify-self: start;
		}

		.after-download > span {
			grid-column: 1 / -1;
		}

		.after-download .hint {
			grid-column: 1 / -1;
		}

		.after-download .copy {
			border: 1px solid var(--line);
			grid-column: 1 / -1;
			min-height: 2.75rem;
		}

		.menu-head {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.45rem;
		}

		.binary-download {
			align-items: flex-start;
			flex-wrap: wrap;
			gap: 0.25rem 0.65rem;
		}

		.os {
			min-width: 4.5rem;
		}

		.leaders {
			display: none;
		}

		.bsize {
			width: 100%;
		}
	}
</style>
