import assert from 'node:assert/strict';
import test from 'node:test';
import { renderMarkdown, safeHref } from '../../src/lib/content/markdown.js';

test('markdown escapes raw HTML and rejects executable URL schemes', async () => {
	const { html } = await renderMarkdown(`
<script>alert('xss')</script>
<img src=x onerror="alert(1)">

[unsafe](javascript:alert(1))
[data](data:text/html;base64,PHNjcmlwdD4=)
![bad image](javascript:alert(2))
[safe](/docs/start/install/ "quoted title")
`);

	assert.doesNotMatch(html, /<script|<img src=x|javascript:|data:text\/html/i);
	assert.match(html, /&lt;script&gt;/);
	assert.match(html, /&lt;img src=x onerror=/);
	assert.match(html, /href="\/docs\/start\/install\/"/);
	assert.equal(safeHref('java\nscript:alert(1)'), null);
	assert.equal(safeHref('vbscript:msgbox(1)'), null);
	assert.equal(safeHref('data:text/html,boom'), null);
	assert.equal(safeHref('/docs/'), '/docs/');
});

test('heading permalinks remain accessible and every generated DOM id is unique', async () => {
	const { html, toc } = await renderMarkdown(
		'## Install `NullHub`\n\n## Install `NullHub`\n\n## Install NullHub 1\n\n## Heading label install-nullhub'
	);

	assert.match(
		html,
		/<h2 id="install-nullhub" aria-labelledby="heading-label-install-nullhub"><span id="heading-label-install-nullhub">/
	);
	assert.match(
		html,
		/<a class="heading-anchor" href="#install-nullhub" aria-label="Permalink to Install NullHub" data-pagefind-ignore>/
	);
	assert.match(html, /id="install-nullhub-1"/);
	assert.match(html, /id="install-nullhub-1-1"/);
	const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
	assert.equal(new Set(ids).size, ids.length, 'heading and label ids never collide');
	assert.deepEqual(
		toc.map(({ id, text }) => ({ id, text })),
		[
			{ id: 'install-nullhub', text: 'Install NullHub' },
			{ id: 'install-nullhub-1', text: 'Install NullHub' },
			{ id: 'install-nullhub-1-1', text: 'Install NullHub 1' },
			{ id: 'heading-label-install-nullhub-2', text: 'Heading label install-nullhub' }
		]
	);
});
