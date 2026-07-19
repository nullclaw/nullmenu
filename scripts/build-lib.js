import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { finalizeStaticSecurity, validateStaticSecurity } from './security-policy.js';
import { requireSite } from './site-targets.js';

const runtimeFonts = new Set([
	'Geist-normal-300_700-latin.woff2',
	'GeistMono-normal-400_600-latin.woff2',
	'InstrumentSerif-italic-400-latin.woff2',
	'InstrumentSerif-normal-400-latin.woff2',
	'LICENSE.md'
]);

/**
 * These ceilings cover every immutable client chunk and the separately loaded
 * Pagefind runtime/index rather than only today's entry chunk. That makes both
 * route-wide and lazy-search regressions visible in CI. WOFF2 files are already
 * compressed, so they are counted as-is in the transfer budget.
 */
export const buildBudgets = Object.freeze({
	indexHtml: 112 * 1024,
	immutableJavaScript: 210 * 1024,
	immutableCss: 92 * 1024,
	runtimeFonts: 96 * 1024,
	initialTransfer: 215 * 1024,
	largestJavaScript: 64 * 1024,
	largestCss: 40 * 1024,
	immutableResources: 36,
	pagefindRuntime: 260 * 1024,
	pagefindIndex: 104 * 1024,
	pagefindPayload: 360 * 1024,
	largestPagefindAsset: 88 * 1024,
	pagefindResources: 40
});

function filesBelow(directory) {
	const files = [];
	const visit = (current) => {
		for (const entry of readdirSync(current, { withFileTypes: true })) {
			const path = resolve(current, entry.name);
			if (entry.isDirectory()) visit(path);
			else files.push(path);
		}
	};
	visit(directory);
	return files;
}

const sum = (values) => values.reduce((total, value) => total + value, 0);

export function measureBuildAssets(root) {
	const immutable = filesBelow(resolve(root, '_app/immutable'));
	const scripts = immutable.filter((file) => file.endsWith('.js'));
	const styles = immutable.filter((file) => file.endsWith('.css'));
	const fonts = filesBelow(resolve(root, 'fonts')).filter((file) => file.endsWith('.woff2'));
	const pagefind = filesBelow(resolve(root, 'pagefind'));
	const pagefindRuntime = pagefind.filter((file) => {
		const name = basename(file);
		return name === 'pagefind.js' || name === 'pagefind-worker.js' || /^wasm\..+\.pagefind$/.test(name);
	});
	const pagefindIndex = pagefind.filter((file) => !pagefindRuntime.includes(file));
	const index = readFileSync(resolve(root, 'index.html'));
	const bytes = (files) => files.map((file) => statSync(file).size);
	const compressed = (files) => files.map((file) => gzipSync(readFileSync(file)).length);

	const scriptBytes = bytes(scripts);
	const styleBytes = bytes(styles);
	const fontBytes = bytes(fonts);
	const pagefindBytes = bytes(pagefind);
	const pagefindRuntimeBytes = bytes(pagefindRuntime);
	const pagefindIndexBytes = bytes(pagefindIndex);

	return Object.freeze({
		indexHtml: index.length,
		immutableJavaScript: sum(scriptBytes),
		immutableCss: sum(styleBytes),
		runtimeFonts: sum(fontBytes),
		initialTransfer:
			gzipSync(index).length + sum(compressed(scripts)) + sum(compressed(styles)) + sum(fontBytes),
		largestJavaScript: Math.max(0, ...scriptBytes),
		largestCss: Math.max(0, ...styleBytes),
		immutableResources: immutable.length,
		pagefindRuntime: sum(pagefindRuntimeBytes),
		pagefindIndex: sum(pagefindIndexBytes),
		pagefindPayload: sum(pagefindBytes),
		largestPagefindAsset: Math.max(0, ...pagefindBytes),
		pagefindResources: pagefind.length
	});
}

export function validateBuildBudgets(id, root = resolve(`build/${id}`)) {
	const measured = measureBuildAssets(root);
	for (const [metric, ceiling] of Object.entries(buildBudgets)) {
		if (measured[metric] > ceiling) {
			throw new Error(
				`${id}: ${metric} budget exceeded (${measured[metric]} > ${ceiling}); inspect the production payload before raising the ceiling`
			);
		}
	}
	return measured;
}

function run(command, args, env = process.env) {
	execFileSync(command, args, { stdio: 'inherit', env });
}

const escapeHtml = (value) =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

/** Add a useful fallback to adapter-static's otherwise empty SPA 404 shell. */
export function enhanceFallback404(id, root = resolve(`build/${id}`)) {
	const site = requireSite(id);
	const file = resolve(root, '404.html');
	let html = readFileSync(file, 'utf8');
	if (html.includes('data-static-404')) return;

	const title = `Page not found — ${site.display}`;
	html = html.replace(
		'</head>',
		`<title>${escapeHtml(title)}</title>\n\t\t<meta name="robots" content="noindex" />\n\t</head>`
	);
	html = html.replace(
		/(<body\b[^>]*>)/,
		`$1
		<noscript>
			<style>
				.static-404{min-height:100vh;display:grid;place-items:center;padding:2rem;background:#0c0a08;color:#ece5d8;font:400 16px/1.6 system-ui,sans-serif}
				.static-404__inner{max-width:38rem}.static-404__mark{color:#b0a695;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase}
				.static-404 h1{margin:.7rem 0;font:400 clamp(3rem,12vw,6rem)/1 Georgia,serif}.static-404 p{color:#b0a695;max-width:32rem}
				.static-404 a{display:inline-flex;margin-top:1.5rem;padding:.75rem 1.1rem;border:1px solid #8a8173;color:#ece5d8;text-decoration:none}
				@media(prefers-color-scheme:light){.static-404{background:#f2ead8;color:#26211a}.static-404 p,.static-404__mark{color:#52483a}.static-404 a{color:#26211a;border-color:#665c4a}}
			</style>
			<main class="static-404" data-static-404>
				<div class="static-404__inner">
					<p class="static-404__mark">Error 404 · ${escapeHtml(site.display)}</p>
					<h1>Page not found.</h1>
					<p>We could not find this page. It may have moved, or the address may be incorrect.</p>
					<a href="/">Go to ${escapeHtml(site.display)} home</a>
				</div>
			</main>
		</noscript>`
	);
	writeFileSync(file, html);
}

export function optimizeBuildAssets(id, root = resolve(`build/${id}`)) {
	requireSite(id);
	const ogDir = resolve(root, 'og');
	for (const name of readdirSync(ogDir)) {
		if (name !== `${id}.png`) rmSync(resolve(ogDir, name), { force: true });
	}

	const fontsDir = resolve(root, 'fonts');
	for (const name of readdirSync(fontsDir)) {
		if (!runtimeFonts.has(name)) rmSync(resolve(fontsDir, name), { force: true });
	}

	/* The site has a custom search UI and only imports Pagefind's core runtime.
	   The generator also emits three unused UI bundles and a highlighting helper. */
	const unusedPagefindAssets = new Set([
		'pagefind-component-ui.css',
		'pagefind-component-ui.js',
		'pagefind-highlight.js',
		'pagefind-modular-ui.css',
		'pagefind-modular-ui.js',
		'pagefind-ui.css',
		'pagefind-ui.js'
	]);
	const pagefindDir = resolve(root, 'pagefind');
	for (const name of readdirSync(pagefindDir)) {
		if (unusedPagefindAssets.has(name)) rmSync(resolve(pagefindDir, name), { force: true });
	}
}

export function validateSiteBuild(id, root = resolve(`build/${id}`)) {
	requireSite(id);
	const required = [
		'index.html',
		'404.html',
		'pagefind/pagefind.js',
		'pagefind/pagefind-entry.json',
		`og/${id}.png`,
		...Array.from(runtimeFonts, (name) => `fonts/${name}`)
	];
	const missing = required.filter((file) => !existsSync(resolve(root, file)));
	if (missing.length) throw new Error(`${id}: incomplete production build: ${missing.join(', ')}`);

	const ogFiles = readdirSync(resolve(root, 'og'));
	if (ogFiles.length !== 1 || ogFiles[0] !== `${id}.png`) {
		throw new Error(`${id}: expected only og/${id}.png, found ${ogFiles.join(', ')}`);
	}
	const fontFiles = readdirSync(resolve(root, 'fonts')).sort();
	const expectedFonts = [...runtimeFonts].sort();
	if (fontFiles.join('\0') !== expectedFonts.join('\0')) {
		throw new Error(`${id}: unexpected font payload: ${fontFiles.join(', ')}`);
	}
	if (!readFileSync(resolve(root, '404.html'), 'utf8').includes('data-static-404')) {
		throw new Error(`${id}: 404.html has no no-JavaScript fallback`);
	}
	validateStaticSecurity(root);
	validateBuildBudgets(id, root);

	if (existsSync(resolve(root, 'llms-full.txt'))) {
		throw new Error(`${id}: llms-full.txt is a duplicate without enforceable noindex headers`);
	}
	const rawDocs = filesBelow(resolve(root, 'docs')).filter((path) => path.endsWith('.md'));
	if (rawDocs.length) {
		throw new Error(`${id}: raw Markdown twins cannot be safely noindexed on the static host`);
	}
}

export function buildSite(id) {
	requireSite(id);
	const root = resolve(`build/${id}`);
	console.log(`\n◑ building ${id} → ${root}\n`);
	run('pnpm', ['exec', 'vite', 'build'], { ...process.env, PUBLIC_SITE: id });
	run('pnpm', ['exec', 'pagefind', '--site', root]);
	optimizeBuildAssets(id, root);
	enhanceFallback404(id, root);
	finalizeStaticSecurity(root);
	validateSiteBuild(id, root);
}
