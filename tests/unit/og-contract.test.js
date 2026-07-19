import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { card, renderCard, socialCopy } from '../../scripts/make-og.js';
import { sites } from '../../src/lib/site/sites.js';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

test('every social card has bespoke complete copy and its own product mark', () => {
	assert.deepEqual(Object.keys(socialCopy).sort(), Object.keys(sites).sort());

	for (const site of Object.values(sites)) {
		const svg = card(site);
		const lines = socialCopy[site.id];
		assert.equal(lines.length, 2, `${site.id}: copy is intentionally two lines`);
		assert.ok(lines.every((line) => line.length > 8 && line.length <= 28), `${site.id}: editorial fit`);
		assert.doesNotMatch(lines.join(' '), /…|\.\.\./, `${site.id}: copy must never be truncated`);
		assert.match(svg, new RegExp(`data-product-mark="${site.id}"`));
		for (const line of lines) assert.ok(svg.includes(line), `${site.id}: missing “${line}”`);
	}
});

test('committed PNGs are deterministic renderings of the generator', () => {
	for (const site of Object.values(sites)) {
		const committed = readFileSync(join(root, 'static', 'og', `${site.id}.png`));
		const first = renderCard(site);
		const second = renderCard(site);
		assert.deepEqual(first, second, `${site.id}: repeated renders differ`);
		assert.deepEqual(committed, first, `${site.id}: static card is stale; run node scripts/make-og.js`);

		assert.equal(committed.readUInt32BE(16), 1200, `${site.id}: PNG width`);
		assert.equal(committed.readUInt32BE(20), 630, `${site.id}: PNG height`);
	}
});
