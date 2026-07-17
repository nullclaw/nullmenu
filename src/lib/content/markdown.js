import { Marked } from 'marked';
import { getHighlighter } from './highlight.js';

export function slugify(text) {
	return text
		.toLowerCase()
		.replace(/<[^>]*>/g, '')
		.replace(/&[a-z]+;/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
}

const CALLOUTS = {
	NOTE: { title: 'Note', kind: 'note' },
	TIP: { title: 'Tip', kind: 'tip' },
	WARNING: { title: 'Warning', kind: 'warning' },
	DANGER: { title: 'Danger', kind: 'danger' }
};

/**
 * Render markdown → { html, toc } with the kitchen pipeline:
 * shiki code blocks with copy buttons, slugged headings with anchors,
 * GitHub-style [!NOTE] callouts, external links opening in new tabs.
 */
export async function renderMarkdown(md, { accent = '#e8ddc9' } = {}) {
	const highlighter = await getHighlighter(accent);
	const toc = [];
	const seen = new Map();

	const marked = new Marked({
		async: true,
		gfm: true,
		renderer: {
			heading({ tokens, depth }) {
				const text = this.parser.parseInline(tokens);
				let id = slugify(text);
				const n = seen.get(id) ?? 0;
				seen.set(id, n + 1);
				if (n > 0) id = `${id}-${n}`;
				if (depth === 2 || depth === 3) toc.push({ id, text: text.replace(/<[^>]*>/g, ''), depth });
				const anchor =
					depth > 1
						? `<a class="heading-anchor" href="#${id}" aria-label="Link to this section">#</a>`
						: '';
				return `<h${depth} id="${id}">${text}${anchor}</h${depth}>\n`;
			},
			code({ text, lang }) {
				const language = (lang || 'text').split(/\s/)[0];
				let highlighted;
				try {
					highlighted = highlighter.codeToHtml(text, {
						lang: highlighter.getLoadedLanguages().includes(language) ? language : 'text',
						theme: 'null-kitchen'
					});
				} catch {
					highlighted = `<pre class="shiki"><code>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code></pre>`;
				}
				return `<figure class="code-figure" data-lang="${language}">${highlighted}<button class="code-copy" type="button" data-code>copy</button></figure>\n`;
			},
			blockquote({ tokens }) {
				const body = this.parser.parse(tokens);
				const m = body.match(/^<p>\[!(NOTE|TIP|WARNING|DANGER)\]\s*(?:<br\s*\/?>)?/);
				if (m) {
					const kind = CALLOUTS[m[1]];
					const rest = body.replace(m[0], '<p>').replace(/^<p>\s*<\/p>/, '');
					return `<aside class="callout callout--${kind.kind}"><div class="callout-title">${kind.title}</div>${rest}</aside>\n`;
				}
				return `<blockquote>${body}</blockquote>\n`;
			},
			link({ href, title, tokens }) {
				const text = this.parser.parseInline(tokens);
				const external = /^https?:\/\//.test(href);
				const attrs = [
					`href="${href}"`,
					title ? `title="${title}"` : '',
					external ? 'target="_blank" rel="noopener"' : ''
				]
					.filter(Boolean)
					.join(' ');
				return `<a ${attrs}>${text}</a>`;
			}
		}
	});

	const html = await marked.parse(md);
	return { html, toc };
}
