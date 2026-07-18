import { site } from '$lib/site';
import { flatDocs } from '$lib/content/docs.js';
import { renderSitemap, sitemapEntries } from '$lib/content/sitemap.js';
import { repositoryLastmod } from '$lib/server/lastmod.js';

export const prerender = true;

export function GET() {
	const body = renderSitemap(site.domain, sitemapEntries(site, flatDocs(), repositoryLastmod));
	return new Response(body, {
		headers: {
			'Cache-Control': 'public, max-age=3600',
			'Content-Type': 'application/xml; charset=utf-8',
			'X-Content-Type-Options': 'nosniff'
		}
	});
}
