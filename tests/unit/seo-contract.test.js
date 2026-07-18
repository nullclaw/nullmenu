import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStructuredData, serializeJsonLd } from '../../src/lib/content/seo.js';
import { machineTextHeaders } from '../../src/lib/content/response-headers.js';
import { renderSitemap, sitemapEntries } from '../../src/lib/content/sitemap.js';

const product = {
	id: 'hub',
	kind: 'product',
	domain: 'hub.nullmenu.ai',
	display: 'NullHub',
	github: 'https://github.com/nullclaw/nullhub',
	license: 'MIT'
};

test('product JSON-LD includes organization, software, breadcrumbs and FAQ safely', () => {
	const data = buildStructuredData({
		site: product,
		title: 'NullHub </script><script>alert(1)</script>',
		description: 'Local control plane',
		url: 'https://hub.nullmenu.ai/',
		image: 'https://hub.nullmenu.ai/og/hub.png',
		pageType: 'software',
		version: 'v2026.5.29',
		releaseUrl: 'https://github.com/nullclaw/nullhub/releases/tag/v2026.5.29',
		operatingSystems: ['macOS', 'Linux', 'Windows'],
		breadcrumbs: [
			{ name: 'The menu', url: 'https://nullmenu.ai/products/' },
			{ name: 'NullHub', url: '/' }
		],
		faq: [{ q: 'Does it run locally?', a: 'Yes — `one binary`.' }]
	});
	const types = data['@graph'].map((entry) => entry['@type']);
	assert.deepEqual(types, ['Organization', 'SoftwareApplication', 'BreadcrumbList', 'FAQPage']);
	assert.equal(data['@graph'][1].softwareVersion, 'v2026.5.29');
	assert.equal(data['@graph'][1].operatingSystem, 'macOS, Linux, Windows');
	assert.equal(data['@graph'][3].mainEntity[0].acceptedAnswer.text, 'Yes — one binary.');
	assert.doesNotMatch(serializeJsonLd(data), /<\/script/i);
});

test('documentation JSON-LD emits a TechArticle', () => {
	const data = buildStructuredData({
		site: product,
		title: 'Install — NullHub docs',
		description: 'Install NullHub',
		url: 'https://hub.nullmenu.ai/docs/start/install/',
		image: 'https://hub.nullmenu.ai/og/hub.png',
		pageType: 'article',
		version: 'v2026.5.29',
		dateModified: '2026-07-18',
		sectionTitle: 'Start'
	});
	const article = data['@graph'].find((entry) => entry['@type'] === 'TechArticle');
	assert.equal(article.dateModified, '2026-07-18');
});

test('software JSON-LD omits unsupported platform claims', () => {
	const data = buildStructuredData({
		site: product,
		title: 'NullHub',
		description: 'Local control plane',
		url: 'https://hub.nullmenu.ai/',
		image: 'https://hub.nullmenu.ai/og/hub.png',
		pageType: 'software'
	});
	const software = data['@graph'].find((entry) => entry['@type'] === 'SoftwareApplication');
	assert.equal('operatingSystem' in software, false);
});

test('machine-readable duplicates carry canonical and noindex response intent', () => {
	const headers = machineTextHeaders({
		canonical: 'https://hub.nullmenu.ai/docs/start/install/',
		contentType: 'text/markdown; charset=utf-8',
		noindex: true
	});
	assert.equal(headers['X-Robots-Tag'], 'noindex, follow');
	assert.equal(headers.Link, '<https://hub.nullmenu.ai/docs/start/install/>; rel="canonical"');
	assert.equal(headers['X-Content-Type-Options'], 'nosniff');
});

test('product sitemap omits the menu-only catalog and includes lastmod', () => {
	const docs = [{ section: 'start', slug: 'install', path: '/content/hub/docs/start/install.md' }];
	const productEntries = sitemapEntries(product, docs, () => '2026-07-18');
	assert.equal(productEntries.some((entry) => entry.path === '/products/'), false);
	const menuEntries = sitemapEntries({ ...product, id: 'menu', kind: 'menu' }, docs, () => '2026-07-18');
	assert.equal(menuEntries.some((entry) => entry.path === '/products/'), true);
	assert.match(renderSitemap(product.domain, productEntries), /<lastmod>2026-07-18<\/lastmod>/);
});
