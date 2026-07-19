const paths = {
	search:
		'<circle cx="10.5" cy="10.5" r="5.75"></circle><path d="m14.8 14.8 4.7 4.7"></path>',
	external: '<path d="M8 16 16 8"></path><path d="M10 8h6v6"></path>',
	close: '<path d="m7 7 10 10"></path><path d="M17 7 7 17"></path>',
	'arrow-up': '<path d="m7.5 12 4.5-4.5 4.5 4.5"></path><path d="M12 7.5v9"></path>',
	'arrow-down': '<path d="m7.5 12 4.5 4.5 4.5-4.5"></path><path d="M12 16.5v-9"></path>',
	enter:
		'<path d="M18 6v5.5a3 3 0 0 1-3 3H7"></path><path d="m10 10.5-4 4 4 4"></path>',
	plus: '<path d="M12 6.5v11"></path><path d="M6.5 12h11"></path>',
	check: '<path d="m6.5 12.5 3.5 3.5 7.5-8"></path>',
	'arrow-left': '<path d="m10.5 7-5 5 5 5"></path><path d="M6 12h12.5"></path>',
	'arrow-right': '<path d="m13.5 7 5 5-5 5"></path><path d="M18 12H5.5"></path>'
};

function escapeAttribute(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * Return the one canonical functional-icon SVG used by both Svelte UI and
 * Markdown-generated HTML. Product marks intentionally live in their own set.
 */
export function functionalIconMarkup(
	name,
	{ size = 18, label = '', className = '' } = {}
) {
	const body = paths[name];
	if (!body) throw new TypeError(`Unknown functional icon: ${name}`);
	const iconSize = Number.isFinite(Number(size)) ? Math.max(12, Math.min(48, Number(size))) : 18;
	const classNames = ['functional-icon', className].filter(Boolean).join(' ');
	const accessible = label
		? `role="img" aria-label="${escapeAttribute(label)}"`
		: 'aria-hidden="true" focusable="false"';

	return `<svg class="${escapeAttribute(classNames)}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ${accessible}><g stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
}
