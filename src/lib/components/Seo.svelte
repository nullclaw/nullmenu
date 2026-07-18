<script>
	import { page } from '$app/state';
	import { buildStructuredData, serializeJsonLd } from '$lib/content/seo.js';
	import { site } from '$lib/site';

	let {
		title = site.title,
		description = site.description,
		canonical = null,
		pageType = 'website',
		version = null,
		releaseUrl = null,
		operatingSystems = [],
		dateModified = null,
		sectionTitle = null,
		breadcrumbs = [],
		faq = []
	} = $props();

	const url = $derived(canonical ?? `https://${site.domain}${page.url.pathname}`);
	const image = `https://${site.domain}/og/${site.id}.png`;
	const imageAlt = $derived(`Social preview for ${site.display}: ${title}`);
	const ogType = $derived(pageType === 'article' ? 'article' : 'website');
	const jsonLd = $derived(
		serializeJsonLd(
			buildStructuredData({
				site,
				title,
				description,
				url,
				image,
				pageType,
				version,
				releaseUrl,
				operatingSystems,
				dateModified,
				sectionTitle,
				breadcrumbs,
				faq
			})
		)
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={site.display} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	<meta property="og:image:alt" content={imageAlt} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={imageAlt} />
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>
