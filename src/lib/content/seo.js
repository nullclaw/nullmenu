const ORGANIZATION_ID = 'https://nullmenu.ai/#organization';

function cleanText(value) {
	return String(value ?? '')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/[`*_~]+/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function absoluteUrl(domain, value) {
	if (/^https?:\/\//i.test(value)) return value;
	return new URL(value || '/', `https://${domain}`).href;
}

function withoutEmpty(value) {
	return Object.fromEntries(
		Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined && entry !== '')
	);
}

/** JSON safe to place inside an HTML script element. */
export function serializeJsonLd(value) {
	return JSON.stringify(value)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}

/** Build one @graph so shared Organization identity stays consistent everywhere. */
export function buildStructuredData({
	site,
	title,
	description,
	url,
	image,
	pageType = 'website',
	version = null,
	releaseUrl = null,
	operatingSystems = [],
	dateModified = null,
	sectionTitle = null,
	breadcrumbs = [],
	faq = []
}) {
	/** @type {Array<Record<string, any>>} */
	const graph = [
		{
			'@type': 'Organization',
			'@id': ORGANIZATION_ID,
			name: 'Null ecosystem',
			url: 'https://nullmenu.ai/',
			sameAs: ['https://github.com/nullclaw']
		}
	];

	if (pageType === 'software') {
		graph.push(
			withoutEmpty({
				'@type': 'SoftwareApplication',
				'@id': `${url}#software`,
				name: site.display,
				description,
				url,
				image,
				applicationCategory: 'DeveloperApplication',
				operatingSystem: operatingSystems.length ? operatingSystems.join(', ') : null,
				softwareVersion: version,
				downloadUrl: releaseUrl,
				codeRepository: site.github,
				license: site.license === 'MIT' ? 'https://spdx.org/licenses/MIT.html' : null,
				author: { '@id': ORGANIZATION_ID }
			})
		);
	}

	if (pageType === 'article') {
		graph.push(
			withoutEmpty({
				'@type': 'TechArticle',
				'@id': `${url}#article`,
				headline: title,
				description,
				url,
				image,
				inLanguage: 'en',
				articleSection: sectionTitle,
				version,
				dateModified,
				mainEntityOfPage: url,
				author: { '@id': ORGANIZATION_ID },
				publisher: { '@id': ORGANIZATION_ID }
			})
		);
	}

	const breadcrumbItems = breadcrumbs
		.filter((item) => item?.name && item?.url)
		.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: cleanText(item.name),
			item: absoluteUrl(site.domain, item.url)
		}));
	if (breadcrumbItems.length > 1) {
		graph.push({
			'@type': 'BreadcrumbList',
			'@id': `${url}#breadcrumbs`,
			itemListElement: breadcrumbItems
		});
	}

	const questions = faq
		.filter((item) => item?.q && item?.a)
		.map((item) => ({
			'@type': 'Question',
			name: cleanText(item.q),
			acceptedAnswer: {
				'@type': 'Answer',
				text: cleanText(item.a)
			}
		}));
	if (questions.length) {
		graph.push({
			'@type': 'FAQPage',
			'@id': `${url}#faq`,
			mainEntity: questions
		});
	}

	return { '@context': 'https://schema.org', '@graph': graph };
}
