#!/usr/bin/env node
/** Build one complete, searchable production site. */
import { buildSite } from './build-lib.js';

const id = process.argv[2] ?? process.env.PUBLIC_SITE ?? 'menu';
buildSite(id);
console.log(`\n∅ done — built: ${id}`);
