import { site } from '$lib/site';

export const prerender = true;

export function GET() {
	const body = `User-agent: *\nAllow: /\n\nSitemap: https://${site.domain}/sitemap.xml\n`;
	return new Response(body, {
		headers: {
			'Cache-Control': 'public, max-age=3600',
			'Content-Type': 'text/plain; charset=utf-8',
			'X-Content-Type-Options': 'nosniff'
		}
	});
}
