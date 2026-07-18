#!/usr/bin/env node
/**
 * Build every site in the family: PUBLIC_SITE=<id> vite build → build/<id>.
 * Usage: node scripts/build-all.js [siteId ...]  (defaults to all)
 */
import { buildSite } from './build-lib.js';
import { requireSite, siteIds } from './site-targets.js';

const targets = process.argv.slice(2).length ? process.argv.slice(2) : siteIds;

for (const id of targets) {
	requireSite(id);
	buildSite(id);
}

console.log(`\n∅ done — built: ${targets.join(', ')}`);
