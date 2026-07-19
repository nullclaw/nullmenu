#!/usr/bin/env node
/**
 * Generate deterministic 1200×630 social cards for every site.
 *
 * Each product owns a short editorial line and the same mark used in-product;
 * cards never crop registry prose or fall back to a generic plate identity.
 * Usage: node scripts/make-og.js
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const { sites } = await import(join(here, '../src/lib/site/sites.js'));

export const socialCopy = Object.freeze({
	menu: ['Autonomous AI,', 'served à la carte.'],
	hub: ['One local console for', 'your entire agent stack.'],
	claw: ['An always-on AI agent', 'in one tiny binary.'],
	boiler: ['Durable workflows for', 'fleets of AI agents.'],
	tickets: ['Task truth for agents', 'that run for days.'],
	watch: ['Every span and verdict.', 'Every dollar kept local.'],
	pantry: ['Private memory,', 'answers you can trace.'],
	clw: ['A complete local agent', 'in about one megabyte.'],
	desk: ['Review every agent change', 'inside the editor.'],
	cap: ['Live cue cards,', 'through your own gateway.'],
	builder: ['One release kitchen for', 'the whole Null family.']
});

const esc = (value) =>
	String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Keep this geometry in lockstep with ProductMark.svelte's 32px/1.75 system. */
export function markBody(id, fill) {
	switch (id) {
		case 'claw':
			return `<path d="M5.5 25.5C10 22 14 13 17 5"/><path d="M12.5 27C17 22 21 14 24 7"/><path d="M20.5 25C24 21 26 17 27 12"/>`;
		case 'hub':
			return `<circle cx="16" cy="16" r="10.5"/><path d="M16 16l4.6-6.2" stroke-width="2.2"/><circle cx="16" cy="16" r="1.6" fill="${fill}" stroke="none"/><path d="M16 2.5v2M29.5 16h-2M16 29.5v-2M2.5 16h2" opacity=".7"/>`;
		case 'pantry':
			return `<rect x="6.5" y="4.5" width="19" height="23" rx="2"/><path d="M16 4.5v23"/><path d="M12.9 14.5v3M19.1 14.5v3" stroke-width="2"/>`;
		case 'boiler':
			return `<path d="M8 16h16v7.5a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z"/><path d="M8 18.5H4.5M24 18.5h3.5M6.5 16h19"/><path d="M12.5 11.5c-1.4-1.6 1.4-2.7 0-4.4M19.5 11.5c-1.4-1.6 1.4-2.7 0-4.4" opacity=".75"/>`;
		case 'watch':
			return `<path d="M10.5 17.5V7.25a3.5 3.5 0 0 1 7 0V17.5a6 6 0 1 1-7 0Z"/><path d="M14 9.5v11"/><circle cx="14" cy="22" r="2.25" fill="${fill}" stroke="none"/><path d="M21 8.5h6M21 13h4M21 17.5h6" opacity=".78"/>`;
		case 'tickets':
			return `<path d="M4 7h24M9 7v18.5l2.4-2 2.3 2 2.3-2 2.3 2 2.3-2 2.4 2V7"/><path d="M13 13h6M13 17.5h6" opacity=".8"/>`;
		case 'clw':
			return `<path d="M12.75 15.5V4.5l6.5 6.75v4.25zM11.5 15.5h9"/><path d="M16 15.5V28.5" stroke-width="2.6"/>`;
		case 'cap':
			return `<path d="M5.5 6.5h21v14h-9l-5.5 5v-5H5.5z"/><path d="M10 11h12M10 15.5h8" opacity=".82"/>`;
		case 'desk':
			return `<rect x="4.5" y="5.5" width="23" height="18" rx="2"/><path d="M4.5 10h23M10.5 10v13.5" opacity=".78"/><path d="M14.5 14h7M14.5 18h4M20.5 19l2 2 4-5M12 27h8M16 23.5V27"/>`;
		case 'builder':
			return `<path d="M11 6L5 16l6 10M21 6l6 10-6 10"/><circle cx="16" cy="16" r="1.75" fill="${fill}" stroke="none"/>`;
		default:
			return `<circle cx="16" cy="16" r="10.5"/><line x1="7" y1="27" x2="25" y2="5"/>`;
	}
}

export function card(site) {
	const lines = socialCopy[site.id];
	if (!lines || lines.length !== 2) throw new Error(`${site.id}: missing two-line social copy`);
	const suffix = site.kind === 'menu' ? 'menu' : site.id;
	const mark = markBody(site.id, site.accent);
	const serviceLine =
		site.kind === 'menu'
			? 'THE NULL ECOSYSTEM'
			: `${site.status.toUpperCase()} · ${site.role.toUpperCase()}`;

	return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<radialGradient id="glow" cx=".86" cy=".18" r=".72">
			<stop offset="0" stop-color="${site.accent}" stop-opacity=".2"/>
			<stop offset=".62" stop-color="${site.accent}" stop-opacity="0"/>
		</radialGradient>
		<pattern id="grain-lines" width="32" height="32" patternUnits="userSpaceOnUse">
			<path d="M0 31.5h32" stroke="#ece5d8" stroke-opacity=".025"/>
		</pattern>
	</defs>
	<rect width="1200" height="630" fill="#0c0a08"/>
	<rect width="1200" height="630" fill="url(#glow)"/>
	<rect width="1200" height="630" fill="url(#grain-lines)"/>

	<!-- shared Null wordmark -->
	<circle cx="96" cy="108" r="26" stroke="#ece5d8" stroke-width="4.5" fill="none"/>
	<line x1="74" y1="135" x2="118" y2="81" stroke="${site.accent}" stroke-width="4.5" stroke-linecap="round"/>
	<text x="148" y="124" font-family="Geist Mono" font-size="46" font-weight="500" fill="#ece5d8" letter-spacing="1">null</text>
	<text x="258" y="124" font-family="Instrument Serif" font-style="italic" font-size="50" fill="${site.accent}">·${esc(suffix)}</text>

	<!-- a product-owned service seal, using the in-product mark rather than ∅ -->
	<g aria-hidden="true">
		<circle cx="980" cy="340" r="156" fill="#121009" stroke="#2a251f" stroke-width="2"/>
		<circle cx="980" cy="340" r="131" fill="none" stroke="${site.accent}" stroke-opacity=".24" stroke-width="2" stroke-dasharray="3 10"/>
		<g data-product-mark="${site.id}" transform="translate(868 228) scale(7)" fill="none" stroke="${site.accent}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
			${mark}
		</g>
	</g>

	<!-- bespoke, intentionally written two-line headline: never auto-truncated -->
	<text x="92" y="348" font-family="Instrument Serif" font-size="58" fill="#ece5d8">${esc(lines[0])}</text>
	<text x="92" y="416" font-family="Instrument Serif" font-style="italic" font-size="58" fill="${site.accent}">${esc(lines[1])}</text>
	<text x="92" y="480" font-family="Geist Mono" font-size="19" fill="#8a8173" letter-spacing="3">${esc(site.course.toUpperCase())}</text>

	<!-- publication line -->
	<line x1="92" y1="548" x2="1108" y2="548" stroke="#2a251f" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>
	<text x="92" y="590" font-family="Geist Mono" font-size="23" fill="#a2998b" letter-spacing="3">${esc(site.domain.toUpperCase())}</text>
	<text x="1108" y="590" text-anchor="end" font-family="Geist Mono" font-size="18" fill="${site.accent}" letter-spacing="2">${esc(serviceLine)}</text>
</svg>`;
}

const fontFiles = [
	join(here, 'fonts/GeistMono-500.ttf'),
	join(here, 'fonts/InstrumentSerif-regular.ttf'),
	join(here, 'fonts/InstrumentSerif-italic.ttf')
];

export function renderCard(site) {
	const rendered = new Resvg(card(site), {
		font: { loadSystemFonts: false, fontFiles }
	});
	return Buffer.from(rendered.render().asPng());
}

export function generateCards(out = join(here, '../static/og')) {
	mkdirSync(out, { recursive: true });
	for (const site of Object.values(sites)) {
		writeFileSync(join(out, `${site.id}.png`), renderCard(site));
		console.log(`og/${site.id}.png`);
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	generateCards();
}
