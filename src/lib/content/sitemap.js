function escapeXml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export function sitemapEntries(site, docs, lastmodFor) {
	const docSources = docs.map((doc) => doc.path.replace(/^\//, ''));
	const entries = [
		{
			path: '/',
			lastmod: lastmodFor([
				site.kind === 'menu'
					? 'src/lib/home/MenuHome.svelte'
					: 'src/lib/home/ProductHome.svelte',
				...(site.kind === 'menu' ? [] : [`content/${site.id}/product.json`]),
				'src/lib/site/sites.js'
			])
		}
	];

	// /products/ is canonical only on nullmenu.ai. Product builds contain the
	// shared route for navigation compatibility, but must not advertise it.
	if (site.kind === 'menu') {
		entries.push({
			path: '/products/',
			lastmod: lastmodFor(['src/routes/products/+page.svelte', 'src/lib/site/sites.js'])
		});
	}

	entries.push({
		path: '/docs/',
		lastmod: lastmodFor([
			'src/routes/docs/+page.svelte',
			'src/routes/docs/+layout.svelte',
			'src/lib/site/sites.js',
			...docSources
		])
	});
	for (const doc of docs) {
		entries.push({
			path: `/docs/${doc.section}/${doc.slug}/`,
			lastmod: lastmodFor([
				doc.path.replace(/^\//, ''),
				'src/routes/docs/[section]/[slug]/+page.svelte',
				'src/lib/content/markdown.js'
			])
		});
	}
	return entries;
}

export function renderSitemap(domain, entries) {
	const urls = entries
		.map(
			(entry) =>
				`\t<url><loc>${escapeXml(`https://${domain}${entry.path}`)}</loc><lastmod>${escapeXml(entry.lastmod)}</lastmod></url>`
		)
		.join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
