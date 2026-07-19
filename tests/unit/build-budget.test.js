import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
	buildBudgets,
	measureBuildAssets,
	validateBuildBudgets
} from '../../scripts/build-lib.js';

function fixture() {
	const root = mkdtempSync(join(tmpdir(), 'nullmenu-build-budget-'));
	mkdirSync(join(root, '_app/immutable/chunks'), { recursive: true });
	mkdirSync(join(root, '_app/immutable/assets'), { recursive: true });
	mkdirSync(join(root, 'fonts'), { recursive: true });
	mkdirSync(join(root, 'pagefind/index'), { recursive: true });
	writeFileSync(join(root, 'index.html'), '<!doctype html><title>Null</title>');
	writeFileSync(join(root, '_app/immutable/chunks/app.js'), 'export const ready = true;');
	writeFileSync(join(root, '_app/immutable/assets/app.css'), ':root{color-scheme:dark light}');
	writeFileSync(join(root, 'fonts/site.woff2'), Buffer.alloc(64));
	writeFileSync(join(root, 'pagefind/pagefind.js'), 'export const search = () => [];');
	writeFileSync(join(root, 'pagefind/pagefind-worker.js'), 'self.onmessage = () => {};');
	writeFileSync(join(root, 'pagefind/wasm.en.pagefind'), Buffer.alloc(64));
	writeFileSync(join(root, 'pagefind/index/en_test.pf_index'), Buffer.alloc(32));
	return root;
}

test('production asset budgets measure every immutable resource and font', () => {
	const root = fixture();
	try {
		const measured = validateBuildBudgets('fixture', root);
		assert.equal(measured.immutableResources, 2);
		assert.equal(measured.runtimeFonts, 64);
		assert.equal(measured.pagefindResources, 4);
		assert.equal(measured.pagefindIndex, 32);
		assert.ok(measured.initialTransfer > 64);
		assert.deepEqual(measured, measureBuildAssets(root));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('production asset budgets fail closed on an oversized lazy search payload', () => {
	const root = fixture();
	try {
		writeFileSync(
			join(root, 'pagefind/index/en_oversized.pf_index'),
			Buffer.alloc(buildBudgets.pagefindIndex + 1)
		);
		assert.throws(
			() => validateBuildBudgets('fixture', root),
			/pagefindIndex budget exceeded/
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('production asset budgets fail closed on an oversized client chunk', () => {
	const root = fixture();
	try {
		writeFileSync(
			join(root, '_app/immutable/chunks/oversized.js'),
			Buffer.alloc(buildBudgets.largestJavaScript + 1)
		);
		assert.throws(
			() => validateBuildBudgets('fixture', root),
			/largestJavaScript budget exceeded/
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
