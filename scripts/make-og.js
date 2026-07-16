#!/usr/bin/env node
/**
 * Generate 1200×630 social cards for every site → static/og/<id>.png
 * Design: charcoal, the ∅ plate in the site accent, wordmark, one honest line.
 * Usage: node scripts/make-og.js
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const { sites } = await import(join(here, '../src/lib/site/sites.js'));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function wrap(text, width, maxLines) {
	const words = text.replace(/\.$/, '').split(' ');
	const lines = [''];
	for (const word of words) {
		const cur = lines[lines.length - 1];
		if (cur && (cur + ' ' + word).length > width) {
			if (lines.length === maxLines) {
				lines[lines.length - 1] = cur.replace(/[,:;]?$/, ' …');
				return lines;
			}
			lines.push(word);
		} else {
			lines[lines.length - 1] = cur ? `${cur} ${word}` : word;
		}
	}
	return lines;
}

function card(site) {
	const suffix = site.kind === 'menu' ? 'menu' : site.id;
	const line = site.kind === 'menu' ? 'Autonomous AI, à la carte.' : site.line ?? site.description;
	return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
	<rect width="1200" height="630" fill="#0c0a08"/>
	<radialGradient id="glow" cx="0.85" cy="0.05" r="1">
		<stop offset="0" stop-color="${site.accent}" stop-opacity="0.14"/>
		<stop offset="0.6" stop-color="${site.accent}" stop-opacity="0"/>
	</radialGradient>
	<rect width="1200" height="630" fill="url(#glow)"/>

	<!-- the plate -->
	<circle cx="1020" cy="480" r="150" stroke="#2a251f" stroke-width="3" fill="none"/>
	<line x1="895" y1="625" x2="1145" y2="335" stroke="${site.accent}" stroke-width="10" stroke-linecap="round"/>

	<!-- wordmark -->
	<circle cx="96" cy="112" r="26" stroke="#ece5d8" stroke-width="4.5" fill="none"/>
	<line x1="74" y1="139" x2="118" y2="85" stroke="${site.accent}" stroke-width="4.5" stroke-linecap="round"/>
	<text x="148" y="128" font-family="Geist Mono" font-size="46" font-weight="500" fill="#ece5d8" letter-spacing="1">null</text>
	<text x="258" y="128" font-family="Instrument Serif" font-style="italic" font-size="50" fill="${site.accent}">·${esc(suffix)}</text>

	<!-- headline: word-wrapped to two lines max -->
	${wrap(line.split(' — ')[0], 30, 2)
		.map(
			(l, i) =>
				`<text x="92" y="${356 + i * 78}" font-family="Instrument Serif" font-size="68" fill="#ece5d8">${esc(l)}</text>`
		)
		.join('\n\t')}
	<text x="92" y="497" font-family="Instrument Serif" font-style="italic" font-size="42" fill="#8a8173">${esc(site.course)}</text>

	<!-- footer -->
	<line x1="92" y1="548" x2="820" y2="548" stroke="#2a251f" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>
	<text x="92" y="588" font-family="Geist Mono" font-size="24" fill="#8a8173" letter-spacing="3">${esc(site.domain.toUpperCase())}</text>
</svg>`;
}

const out = join(here, '../static/og');
mkdirSync(out, { recursive: true });

for (const site of Object.values(sites)) {
	const resvg = new Resvg(card(site), {
		font: {
			loadSystemFonts: false,
			fontFiles: [
				join(here, 'fonts/GeistMono-500.ttf'),
				join(here, 'fonts/InstrumentSerif-regular.ttf'),
				join(here, 'fonts/InstrumentSerif-italic.ttf')
			]
		}
	});
	writeFileSync(join(out, `${site.id}.png`), resvg.render().asPng());
	console.log(`og/${site.id}.png`);
}
