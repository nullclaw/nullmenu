#!/usr/bin/env node
/**
 * Build redirect rules for hosts that return real HTTP redirect statuses.
 *
 * `_worker.js` makes Cloudflare Pages return 308 at the edge. `_redirects`
 * and `vercel.json` express the same permanent 308 moves for other hosts. The
 * HTML file is deliberately only a human-readable fallback: no refresh or
 * JavaScript masquerading as an HTTP redirect.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function assertDestination(value, from) {
	let url;
	try {
		url = new URL(value);
	} catch {
		throw new Error(`${from}: redirect destination must be an absolute URL`);
	}
	if (url.protocol !== 'https:') throw new Error(`${from}: redirect destination must use HTTPS`);
	return url.href;
}

export function readRedirectMap(mapFile) {
	const parsed = JSON.parse(readFileSync(mapFile, 'utf8'));
	if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
		throw new Error(`${mapFile}: redirect map must be an object`);
	}
	if (!Object.hasOwn(parsed, '*')) throw new Error(`${mapFile}: missing wildcard fallback`);

	return Object.entries(parsed).map(([from, rawDestination]) => {
		if (from !== '*' && (!from.startsWith('/') || /\s/.test(from))) {
			throw new Error(`${mapFile}: invalid source path "${from}"`);
		}
		return { from, destination: assertDestination(rawDestination, from) };
	});
}

const htmlEscape = (value) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export function buildRedirectSite(mapFile, outDir) {
	const redirects = readRedirectMap(mapFile);
	const fallback = redirects.find(({ from }) => from === '*').destination;
	const exact = redirects.filter(({ from }) => from !== '*');

	rmSync(outDir, { recursive: true, force: true });
	mkdirSync(outDir, { recursive: true });

	const cloudflareRules = [
		...exact.map(({ from, destination }) => `${from} ${destination} 308`),
		`/* ${fallback} 308`
	].join('\n');
	writeFileSync(resolve(outDir, '_redirects'), `${cloudflareRules}\n`);
	writeFileSync(
		resolve(outDir, '_worker.js'),
		`const redirects = new Map(${JSON.stringify(exact.map(({ from, destination }) => [from, destination]))});
const fallback = ${JSON.stringify(fallback)};

export default {
	async fetch(request) {
		const path = new URL(request.url).pathname;
		return Response.redirect(redirects.get(path) ?? fallback, 308);
	}
};
`
	);

	const vercel = {
		redirects: [
			...exact.map(({ from, destination }) => ({
				source: from,
				destination,
				permanent: true
			})),
			{ source: '/:path*', destination: fallback, permanent: true }
		]
	};
	writeFileSync(resolve(outDir, 'vercel.json'), `${JSON.stringify(vercel, null, 2)}\n`);
	writeFileSync(
		resolve(outDir, 'redirect-manifest.json'),
		`${JSON.stringify({ status: { cloudflare: 308, vercel: 308 }, redirects }, null, 2)}\n`
	);
	writeFileSync(
		resolve(outDir, 'index.html'),
		`<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="robots" content="noindex">\n<title>Moved permanently</title>\n</head>\n<body><p>This site moved to <a href="${htmlEscape(fallback)}">${htmlEscape(fallback)}</a>.</p></body>\n</html>\n`
	);

	console.log(`wrote ${redirects.length} HTTP redirect rules to ${outDir}`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
	const [mapFile, outDir] = process.argv.slice(2);
	if (!mapFile || !outDir) {
		console.error('usage: make-redirects.js <map.json> <out-dir>');
		process.exit(1);
	}
	buildRedirectSite(resolve(mapFile), resolve(outDir));
}
