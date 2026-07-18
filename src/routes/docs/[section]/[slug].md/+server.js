import { error } from '@sveltejs/kit';
import { getDoc, flatDocs } from '$lib/content/docs.js';
import { machineTextHeaders } from '$lib/content/response-headers.js';
import { site } from '$lib/site';

export const prerender = true;

export function entries() {
	return flatDocs().map((d) => ({ section: d.section, slug: d.slug }));
}

/** Markdown twin of every docs page — same URL, .md suffix. */
export function GET({ params }) {
	const doc = getDoc(params.section, params.slug);
	if (!doc) error(404, 'Page not found');

	const header = `# ${doc.title}\n\n> ${doc.description}\n> Source: https://${site.domain}/docs/${doc.section}/${doc.slug}/${doc.verified ? `\n> Verified with: ${doc.verified}` : ''}\n\n`;

	return new Response(header + doc.body, {
		headers: machineTextHeaders({
			canonical: `https://${site.domain}/docs/${doc.section}/${doc.slug}/`,
			contentType: 'text/markdown; charset=utf-8',
			noindex: true
		})
	});
}
