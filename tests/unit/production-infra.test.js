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

test('the root route resolves one build-specific homepage implementation', () => {
	const route = readFileSync(resolve('src/routes/+page.svelte'), 'utf8');
	const config = readFileSync(resolve('svelte.config.js'), 'utf8');
	assert.match(route, /import Home from '\$site-home'/);
	assert.doesNotMatch(route, /MenuHome|ProductHome/);
	assert.match(config, /site === 'menu'/);
});
