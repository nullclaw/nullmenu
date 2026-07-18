import { site } from '$lib/site';

export const prerender = true;

export function GET() {
	// GitHub Pages cannot preserve X-Robots-Tag from prerendered endpoints, so
	// duplicate machine-readable documents are also excluded at crawl discovery.
	const body = `User-agent: *\nAllow: /\nDisallow: /llms-full.txt\nDisallow: /docs/*.md$\n\nSitemap: https://${site.domain}/sitemap.xml\n`;
	return new Response(body, {
		headers: {
			'Cache-Control': 'public, max-age=3600',
			'Content-Type': 'text/plain; charset=utf-8',
			'X-Content-Type-Options': 'nosniff'
		}
	});
}
