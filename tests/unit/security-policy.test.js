import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
	contentSecurityPolicy,
	finalizeStaticSecurity,
	inlineScriptHashes,
	secureHtml,
	validateStaticSecurity
} from '../../scripts/security-policy.js';

test('prerendered HTML pins every inline script with a CSP hash', () => {
	const script = 'document.documentElement.dataset.ready = "true";';
	const html = `<!doctype html><html><head><meta charset="utf-8"><script>${script}</script></head></html>`;
	const digest = createHash('sha256').update(script).digest('base64');
	const secured = secureHtml(html);

	assert.match(secured, /http-equiv="content-security-policy"/);
	assert.match(secured, new RegExp(`sha256-${digest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
	assert.match(secured, /name="referrer" content="strict-origin-when-cross-origin"/);
	assert.equal(secureHtml(secured), secured, 'security finalization should be idempotent');
	assert.deepEqual(inlineScriptHashes(html), [`sha256-${digest}`]);
	const scriptDirective = contentSecurityPolicy([`sha256-${digest}`])
		.split('; ')
		.find((directive) => directive.startsWith('script-src '));
	assert.match(scriptDirective, /'wasm-unsafe-eval'/, 'Pagefind main-thread fallback needs WASM');
	assert.doesNotMatch(scriptDirective, /'unsafe-inline'/);
	assert.doesNotMatch(scriptDirective, /(?:^|\s)'unsafe-eval'(?:\s|$)/);
	assert.doesNotMatch(
		contentSecurityPolicy(),
		/upgrade-insecure-requests/,
		'production assets are already same-origin HTTPS; upgrading local HTTP breaks WebKit QA'
	);
});

test('static security finalizer validates every prerendered page', () => {
	const root = mkdtempSync(join(tmpdir(), 'nullmenu-security-policy-'));
	try {
		mkdirSync(join(root, 'docs'), { recursive: true });
		writeFileSync(join(root, 'index.html'), '<!doctype html><meta charset="utf-8"><script>0</script>');
		writeFileSync(join(root, 'docs/index.html'), '<!doctype html><meta charset="utf-8"><p>Docs</p>');

		assert.deepEqual(finalizeStaticSecurity(root), { htmlFiles: 2 });
		assert.deepEqual(validateStaticSecurity(root), { htmlFiles: 2 });
		assert.match(readFileSync(join(root, 'index.html'), 'utf8'), /data-null-security-policy/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
