import { site, products } from '$lib/site';
import { docsTree } from '$lib/content/docs.js';
import { machineTextHeaders } from '$lib/content/response-headers.js';

export const prerender = true;

/** https://llmstxt.org — index of this site for AI agents. */
export function GET() {
	const tree = docsTree();
	const lines = [
		`# ${site.display}`,
		'',
		`> ${site.description}`,
		'',
		`Part of the Null ecosystem (https://nullmenu.ai) — single-binary Zig tools for running AI agents on your own hardware. All components are pre-1.0 with CalVer releases. The links below point to canonical documentation pages.`,
		''
	];

	for (const section of tree) {
		lines.push(`## ${section.title}`, '');
		for (const p of section.pages) {
			lines.push(
					`- [${p.title}](https://${site.domain}/docs/${section.slug}/${p.slug}/): ${p.description}`
			);
		}
		lines.push('');
	}

	if (site.kind === 'menu') {
		lines.push('## Products', '');
		for (const p of products) {
			lines.push(`- [${p.display}](https://${p.domain}/llms.txt): ${p.line}`);
		}
		lines.push('');
	}

	lines.push('## Source', '');
	lines.push(`- [GitHub](${site.github})`);

	return new Response(lines.join('\n') + '\n', {
		headers: machineTextHeaders()
	});
}
