import { Marked } from 'marked';
import { functionalIconMarkup } from '../components/functional-icons.js';
import { getHighlighter } from './highlight.js';

export function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Keep ordinary relative links plus the small set of schemes used by the docs.
 * The compact copy catches control-character and whitespace-obfuscated schemes;
 * the original value is escaped before it is written into an attribute.
 */
export function safeHref(value) {
	const href = String(value ?? '').trim();
	if (!href) return null;
	const compact = href.replace(/[\u0000-\u0020\u007f]+/g, '');
	const scheme = compact.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
	if (scheme && !['http', 'https', 'mailto'].includes(scheme)) return null;
	return href;
}

function plainInline(html) {
	return String(html)
		.replace(/<[^>]*>/g, '')
		.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => {
			return { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }[entity];
		});
}

export function slugify(text) {
	return String(text)
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
	const usedIds = new Set();

	function uniqueId(rawBase) {
		const base = rawBase || 'section';
		let id = base;
		let suffix = 1;
		while (usedIds.has(id)) id = `${base}-${suffix++}`;
		usedIds.add(id);
		return id;
	}

	const marked = new Marked({
		async: true,
		gfm: true,
		renderer: {
			heading({ tokens, depth }) {
				const text = this.parser.parseInline(tokens);
				const plain = plainInline(text);
				const id = uniqueId(slugify(text));
				if (depth === 2 || depth === 3) toc.push({ id, text: plain, depth });
				const labelId = uniqueId(`heading-label-${id}`);
				const anchor =
					depth > 1
						? `<a class="heading-anchor" href="#${id}" aria-label="Permalink to ${escapeHtml(plain)}" data-pagefind-ignore><span aria-hidden="true">#</span></a>`
						: '';
				// aria-labelledby isolates the heading name from the adjacent permalink,
				// while the permalink remains a normal keyboard-focusable link.
				return `<h${depth} id="${id}" aria-labelledby="${labelId}"><span id="${labelId}">${text}</span>${anchor}</h${depth}>\n`;
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
					highlighted = `<pre class="shiki"><code>${escapeHtml(text)}</code></pre>`;
				}
				return `<figure class="code-figure" data-lang="${escapeHtml(language)}">${highlighted}<button class="code-copy" type="button" data-code data-pagefind-ignore aria-live="polite">copy</button></figure>\n`;
			},
			table(token) {
				let head = '';
				for (const cell of token.header) head += this.tablecell(cell);
				const rows = token.rows
					.map((row) => this.tablerow({ text: row.map((cell) => this.tablecell(cell)).join('') }))
					.join('');
				const columns = token.header
					.map((cell) => plainInline(this.parser.parseInline(cell.tokens)))
					.filter(Boolean)
					.slice(0, 3)
					.join(', ');
				const label = columns ? `Data table: ${columns}` : 'Data table';
				return `<div class="table-scroll" role="region" aria-label="${escapeHtml(label)}" tabindex="0"><table>\n<thead>\n${this.tablerow({ text: head })}</thead>\n${rows ? `<tbody>${rows}</tbody>\n` : ''}</table>\n</div>\n`;
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
				const safe = safeHref(href);
				if (!safe) return text;
				const external = /^(?:https?:)?\/\//i.test(safe);
				const accessibleLabel = external
					? `${plainInline(text)} (opens in a new tab)`
					: '';
				const attrs = [
					`href="${escapeHtml(safe)}"`,
					title ? `title="${escapeHtml(title)}"` : '',
					external ? 'target="_blank" rel="noopener"' : '',
					external ? `aria-label="${escapeHtml(accessibleLabel)}"` : ''
				]
					.filter(Boolean)
					.join(' ');
				const externalIcon = external
					? functionalIconMarkup('external', { size: 16, className: 'external-icon' })
					: '';
				return `<a ${attrs}>${text}${externalIcon}</a>`;
			},
			image({ href, title, text }) {
				const safe = safeHref(href);
				if (!safe) return escapeHtml(text || '');
				const attrs = [
					`src="${escapeHtml(safe)}"`,
					`alt="${escapeHtml(text || '')}"`,
					title ? `title="${escapeHtml(title)}"` : '',
					'loading="lazy"',
					'decoding="async"'
				]
					.filter(Boolean)
					.join(' ');
				return `<img ${attrs}>`;
			},
			html({ text }) {
				// Documentation is data, not a template surface. Showing raw HTML as
				// text is both safer and less surprising than maintaining a partial
				// allowlist that can drift as Marked evolves.
				return escapeHtml(text);
			}
		}
	});

	const html = await marked.parse(md);
	return { html, toc };
}
