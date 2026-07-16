import { site } from '$lib/site';
import { docsTree, allDocs } from '$lib/content/docs.js';

export const prerender = true;

/** Entire documentation set as one Markdown file. */
export function GET() {
	const docs = allDocs();
	const tree = docsTree();
	const parts = [`# ${site.display} — full documentation`, '', `> ${site.description}`, ''];

	for (const section of tree) {
		for (const p of section.pages) {
			const doc = docs.find((d) => d.section === section.slug && d.slug === p.slug);
			if (!doc) continue;
			parts.push('---', '', `# ${section.title}: ${doc.title}`, '');
			if (doc.description) parts.push(`> ${doc.description}`, '');
			parts.push(doc.body.trim(), '');
		}
	}

	return new Response(parts.join('\n') + '\n', {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
}
