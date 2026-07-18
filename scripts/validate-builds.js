#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateSiteBuild } from './build-lib.js';
import { siteIds } from './site-targets.js';

for (const id of siteIds) validateSiteBuild(id);

const redirectRoot = resolve('build/redirects');
if (!existsSync(redirectRoot)) throw new Error('missing build/redirects');
for (const domain of readdirSync(redirectRoot)) {
	const root = resolve(redirectRoot, domain);
	const rules = readFileSync(resolve(root, '_redirects'), 'utf8')
		.trim()
		.split('\n');
	if (!rules.length || rules.some((rule) => !/\s308$/.test(rule))) {
		throw new Error(`${domain}: every edge redirect must return 308`);
	}
	const worker = readFileSync(resolve(root, '_worker.js'), 'utf8');
	if (!/Response\.redirect\([^,]+, 308\)/.test(worker)) {
		throw new Error(`${domain}: Cloudflare worker does not return 308`);
	}
	const fallback = readFileSync(resolve(root, 'index.html'), 'utf8');
	if (/http-equiv\s*=\s*["']?refresh|location\.(?:replace|assign)|location\s*=/i.test(fallback)) {
		throw new Error(`${domain}: HTML redirect behavior is forbidden`);
	}
	const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
	if (vercel.redirects.some((redirect) => redirect.permanent !== true)) {
		throw new Error(`${domain}: Vercel redirect is not permanent`);
	}
}

console.log(`Production build validation passed: ${siteIds.length} searchable sites and HTTP redirect bundles.`);
