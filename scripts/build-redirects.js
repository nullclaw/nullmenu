#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { buildRedirectSite } from './make-redirects.js';

const source = resolve('redirects');
const output = resolve('build/redirects');
const maps = readdirSync(source)
	.filter((name) => name.endsWith('.json'))
	.sort();

for (const name of maps) {
	buildRedirectSite(resolve(source, name), resolve(output, basename(name, '.json')));
}

console.log(`∅ done — built redirect bundles: ${maps.length}`);
