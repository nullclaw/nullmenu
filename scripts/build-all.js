#!/usr/bin/env node
/**
 * Build every site in the family: PUBLIC_SITE=<id> vite build → build/<id>.
 * Usage: node scripts/build-all.js [siteId ...]  (defaults to all)
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const registry = readFileSync(new URL('../src/lib/site/sites.js', import.meta.url), 'utf8');
const all = [...registry.matchAll(/^\t(\w+): \{$/gm)].map((m) => m[1]);

const targets = process.argv.slice(2).length ? process.argv.slice(2) : all;

for (const id of targets) {
	if (!all.includes(id)) {
		console.error(`Unknown site "${id}". Known: ${all.join(', ')}`);
		process.exit(1);
	}
	console.log(`\n◑ building ${id} → build/${id}\n`);
	execSync('pnpm exec vite build', {
		stdio: 'inherit',
		env: { ...process.env, PUBLIC_SITE: id }
	});
}

console.log(`\n∅ done — built: ${targets.join(', ')}`);
