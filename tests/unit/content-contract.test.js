import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { validateContent } from '../../scripts/validate-content.js';

test('site registry, product content, assets, docs and deployment targets stay aligned', () => {
	assert.deepEqual(validateContent(), []);
});

test('NullTickets Linux examples keep the release asset extension in download and run commands', () => {
	const product = readFileSync(resolve('content/tickets/product.json'), 'utf8');
	assert.match(product, /nulltickets-linux-x86_64\.bin/);
	assert.doesNotMatch(product, /nulltickets-linux-x86_64(?!\.bin)/);
});
