import { error } from '@sveltejs/kit';
import { getDoc, renderDoc, flatDocs } from '$lib/content/docs.js';
import { repositoryLastmod } from '$lib/server/lastmod.js';
import { site } from '$lib/site';

export function entries() {
	return flatDocs().map((d) => ({ section: d.section, slug: d.slug }));
}

export async function load({ params }) {
	const doc = getDoc(params.section, params.slug);
	if (!doc) error(404, 'Page not found');

	const rendered = await renderDoc(doc);
	const flat = flatDocs();
	const i = flat.findIndex((d) => d.section === params.section && d.slug === params.slug);

	return {
		doc: rendered,
		raw: doc.body,
		dateModified: repositoryLastmod([
			`content/${site.id}/docs/${doc.section}/${doc.slug}.md`
		]),
		sectionTitle: flat[i]?.sectionTitle ?? params.section,
		prev: i > 0 ? flat[i - 1] : null,
		next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : null
	};
}
