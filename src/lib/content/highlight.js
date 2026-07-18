import { createHighlighter } from 'shiki';

/**
 * One code theme per site: a warm monochrome base where only the
 * site's accent (its spice) carries the melody. Generated, not hand-picked,
 * so every subdomain gets its own code voice for free.
 */
export function makeTheme(accent) {
	const warm = {
		fg: '#d9d1c3',
		comment: '#877e6f',
		string: '#c9b795',
		number: '#d9a441',
		punct: '#8d8375'
	};
	return {
		name: 'null-kitchen',
		type: /** @type {'dark'} */ ('dark'),
		fg: warm.fg,
		bg: '#0a0806',
		colors: {
			'editor.background': '#0a0806',
			'editor.foreground': warm.fg
		},
		settings: [
			{ settings: { foreground: warm.fg, background: '#0a0806' } },
			{ scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: warm.comment, fontStyle: 'italic' } },
			{ scope: ['string', 'string.quoted', 'punctuation.definition.string'], settings: { foreground: warm.string } },
			{ scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: warm.number } },
			{ scope: ['keyword', 'storage.type', 'storage.modifier', 'keyword.control'], settings: { foreground: accent } },
			{ scope: ['entity.name.function', 'support.function', 'meta.function-call.generic'], settings: { foreground: '#ece5d8' } },
			{ scope: ['entity.name.type', 'support.type', 'support.class', 'entity.name.tag'], settings: { foreground: accent } },
			{ scope: ['variable', 'variable.other', 'variable.parameter'], settings: { foreground: warm.fg } },
			{ scope: ['punctuation', 'meta.brace'], settings: { foreground: warm.punct } },
			{ scope: ['markup.heading'], settings: { foreground: accent } },
			{ scope: ['markup.bold'], settings: { fontStyle: 'bold' } },
			{ scope: ['support.type.property-name.json', 'meta.object-literal.key'], settings: { foreground: '#ece5d8' } }
		]
	};
}

let highlighterPromise;

export function getHighlighter(accent) {
	highlighterPromise ??= createHighlighter({
		themes: [makeTheme(accent)],
		langs: [
			'bash',
			'shell',
			'json',
			'jsonc',
			'yaml',
			'toml',
			'ini',
			'zig',
			'javascript',
			'typescript',
			'python',
			'docker',
			'markdown',
			'diff',
			'html',
			'svelte'
		]
	});
	return highlighterPromise;
}
