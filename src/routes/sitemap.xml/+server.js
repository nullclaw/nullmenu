import { site } from '$lib/site';
import { flatDocs } from '$lib/content/docs.js';

export const prerender = true;

export function GET() {
	const urls = [
		'/',
		'/products/',
		'/docs/',
		...flatDocs().map((d) => `/docs/${d.section}/${d.slug}/`)
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `\t<url><loc>https://${site.domain}${u}</loc></url>`).join('\n')}
</urlset>
`;

	return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
