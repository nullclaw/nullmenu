#!/usr/bin/env node
/**
 * Generate a static redirect site for a retired domain.
 * Usage: node scripts/make-redirects.js redirects/nullclaw.io.json out-dir/
 *
 * The JSON map: { "/old/path/": "https://new.example/path/", ... }
 * "*" is the fallback for unknown paths (also written as 404.html).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [mapFile, outDir] = process.argv.slice(2);
if (!mapFile || !outDir) {
	console.error('usage: make-redirects.js <map.json> <out-dir>');
	process.exit(1);
}

const map = JSON.parse(readFileSync(mapFile, 'utf8'));

const page = (to) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Moved</title>
<link rel="canonical" href="${to}">
<meta http-equiv="refresh" content="0; url=${to}">
<meta name="robots" content="noindex">
<style>body{background:#0c0a08;color:#ece5d8;font:16px/1.6 system-ui;display:grid;place-items:center;min-height:100vh;margin:0}</style>
</head>
<body><p>This page moved to <a href="${to}" style="color:#e8ddc9">${to}</a></p>
<script>location.replace(${JSON.stringify(to)} + location.hash)</script>
</body>
</html>
`;

let count = 0;
for (const [from, to] of Object.entries(map)) {
	if (from === '*') {
		writeFileSync(join(outDir, '404.html'), page(to));
		continue;
	}
	const file = from.endsWith('/') ? `${from}index.html` : `${from}/index.html`;
	const path = join(outDir, file);
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, page(to));
	count++;
}
writeFileSync(join(outDir, '.nojekyll'), '');
console.log(`wrote ${count} redirect pages + 404.html to ${outDir}`);
