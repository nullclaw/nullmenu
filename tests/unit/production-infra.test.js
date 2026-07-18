import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { buildRedirectSite } from '../../scripts/make-redirects.js';
import { deploymentTargets, siteIds } from '../../scripts/site-targets.js';

test('site and deployment targets come from the structured registry', () => {
	assert.equal(siteIds.length, 11);
	assert.equal(deploymentTargets.length, 10);
	assert.deepEqual(
		deploymentTargets.map(({ id }) => id),
		siteIds.filter((id) => id !== 'menu')
	);
	assert.equal(new Set(deploymentTargets.map(({ repository }) => repository)).size, 10);
});

test('legacy bundles express real permanent HTTP redirects without HTML refreshes', () => {
	const root = mkdtempSync(join(tmpdir(), 'nullmenu-redirect-test-'));
	try {
		const map = join(root, 'example.json');
		const output = join(root, 'output');
		writeFileSync(
			map,
			JSON.stringify({ '/old/': 'https://new.example/docs/', '*': 'https://new.example/' })
		);
		buildRedirectSite(map, output);

		assert.match(readFileSync(join(output, '_redirects'), 'utf8'), /\/old\/ .* 308/);
		assert.match(readFileSync(join(output, '_worker.js'), 'utf8'), /Response\.redirect\(.+, 308\)/);
		assert.ok(
			JSON.parse(readFileSync(join(output, 'vercel.json'), 'utf8')).redirects.every(
				(redirect) => redirect.permanent
			)
		);
		assert.doesNotMatch(
			readFileSync(join(output, 'index.html'), 'utf8'),
			/http-equiv\s*=\s*["']?refresh|location\.(?:replace|assign)/i
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('Ink keeps steady-state GPU work allocation-free outside required frame objects', () => {
	const source = readFileSync(resolve('src/lib/components/Ink.svelte'), 'utf8');
	const frame = source.slice(source.indexOf('\t\tfunction frame(ts)'), source.indexOf('\n\t\tlet intersecting'));

	assert.equal((frame.match(/beginComputePass/g) ?? []).length, 1);
	assert.equal((frame.match(/beginRenderPass/g) ?? []).length, 1);
	assert.doesNotMatch(frame, /createBindGroup|new Float32Array|\.map\(|\.reverse\(/);
	assert.equal((frame.match(/createView\(/g) ?? []).length, 1);
	assert.match(source, /device\.lost\.then/);
	assert.match(source, /pageVisible && intersecting/);
});

test('quiet border tokens retain 3:1 contrast across every card surface', () => {
	const source = readFileSync(resolve('src/app.css'), 'utf8');
	const dark = source.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
	const light = source.match(/:root\[data-theme='light'\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

	const hex = (block, token) => {
		const value = block.match(new RegExp(`--${token}:\\s*#([a-f0-9]{6})`, 'i'))?.[1];
		assert.ok(value, `missing --${token}`);
		return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
	};
	const rgba = (block, token) => {
		const values = block
			.match(new RegExp(`--${token}:\\s*rgba\\(([^)]+)\\)`, 'i'))?.[1]
			.split(',')
			.map((value) => Number(value.trim()));
		assert.equal(values?.length, 4, `missing --${token}`);
		return values;
	};
	const luminance = (rgb) =>
		rgb
			.map((channel) => {
				const value = channel / 255;
				return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
			})
			.reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
	const contrast = (first, second) => {
		const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
		return (values[0] + 0.05) / (values[1] + 0.05);
	};

	for (const [name, block] of [
		['dark', dark],
		['light', light]
	]) {
		const [red, green, blue, alpha] = rgba(block, 'line');
		for (const surface of ['bg', 'bg-2', 'bg-3']) {
			const background = hex(block, surface);
			const composited = [red, green, blue].map(
				(channel, index) => channel * alpha + background[index] * (1 - alpha)
			);
			assert.ok(
				contrast(background, composited) >= 3,
				`${name} --line must remain at least 3:1 against --${surface}`
			);
		}
	}
});

test('the root route resolves one build-specific homepage implementation', () => {
	const route = readFileSync(resolve('src/routes/+page.svelte'), 'utf8');
	const config = readFileSync(resolve('svelte.config.js'), 'utf8');
	assert.match(route, /import Home from '\$site-home'/);
	assert.doesNotMatch(route, /MenuHome|ProductHome/);
	assert.match(config, /site === 'menu'/);
});
