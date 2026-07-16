import matter from 'gray-matter';
import { site } from '$lib/site';
import { renderMarkdown } from './markdown.js';

/**
 * Docs content lives at content/<site>/docs/<section>/<slug>.md
 * with frontmatter: { title, description, order, verified? }.
 * Section order and labels come from the site's docsSections config.
 */
const files = import.meta.glob('/content/*/docs/*/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});

function parsePath(path) {
	const m = path.match(/^\/content\/([^/]+)\/docs\/([^/]+)\/([^/]+)\.md$/);
	if (!m) return null;
	return { siteId: m[1], section: m[2], slug: m[3] };
}

/** All parsed docs for the current site build. */
export function allDocs() {
	const docs = [];
	for (const [path, raw] of Object.entries(files)) {
		const loc = parsePath(path);
		if (!loc || loc.siteId !== site.id) continue;
		const { data, content } = matter(raw);
		docs.push({
			...loc,
			path,
			title: data.title ?? loc.slug,
			description: data.description ?? '',
			order: data.order ?? 99,
			verified: data.verified ?? null,
			body: content
		});
	}
	return docs;
}

/** Sidebar tree: sections (in config order) → pages (by order). */
export function docsTree() {
	const docs = allDocs();
	return (site.docsSections ?? [])
		.map((section) => ({
			...section,
			pages: docs
				.filter((d) => d.section === section.slug)
				.sort((a, b) => a.order - b.order)
				.map(({ body, ...meta }) => meta)
		}))
		.filter((s) => s.pages.length > 0);
}

/** Flat reading order across sections, for prev/next. */
export function flatDocs() {
	return docsTree().flatMap((s) =>
		s.pages.map((p) => ({ ...p, sectionTitle: s.title }))
	);
}

export function getDoc(section, slug) {
	return allDocs().find((d) => d.section === section && d.slug === slug) ?? null;
}

export async function renderDoc(doc) {
	const { html, toc } = await renderMarkdown(doc.body, { accent: site.accent });
	return { ...doc, html, toc };
}
