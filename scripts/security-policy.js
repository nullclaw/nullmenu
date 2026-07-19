import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const META_MARKER = 'data-null-security-policy';

function filesBelow(directory) {
	const files = [];
	const visit = (current) => {
		for (const entry of readdirSync(current, { withFileTypes: true })) {
			const path = resolve(current, entry.name);
			if (entry.isDirectory()) visit(path);
			else files.push(path);
		}
	};
	visit(directory);
	return files;
}

const quote = (value) => `'${value}'`;
const htmlAttribute = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

export function inlineScriptHashes(html) {
	const hashes = new Set();
	for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
		if (/\bsrc\s*=/i.test(match[1])) continue;
		const digest = createHash('sha256').update(match[2]).digest('base64');
		hashes.add(`sha256-${digest}`);
	}
	return [...hashes].sort();
}

export function contentSecurityPolicy(scriptHashes = []) {
	const scripts = [quote('self'), quote('wasm-unsafe-eval'), ...scriptHashes.map(quote)];
	const directives = [
		['default-src', quote('self')],
		['base-uri', quote('self')],
		['connect-src', quote('self'), 'https://api.github.com'],
		['font-src', quote('self')],
		['form-action', quote('self')],
		['frame-src', quote('none')],
		['img-src', quote('self'), 'data:'],
		['manifest-src', quote('self')],
		['media-src', quote('self')],
		['object-src', quote('none')],
		['script-src', ...scripts],
		['script-src-attr', quote('none')],
		['style-src', quote('self'), quote('unsafe-inline')],
		['worker-src', quote('self'), 'blob:']
	];
	return directives.map((directive) => directive.join(' ')).join('; ');
}

export function secureHtml(html) {
	const withoutExisting = html.replace(
		new RegExp(`\\s*<meta[^>]+${META_MARKER}[^>]*>`, 'gi'),
		''
	);
	const policy = contentSecurityPolicy(inlineScriptHashes(withoutExisting));
	const tags = [
		`<meta http-equiv="content-security-policy" content="${htmlAttribute(policy)}" ${META_MARKER}>`,
		`<meta name="referrer" content="strict-origin-when-cross-origin" ${META_MARKER}>`
	].join('\n\t\t');

	if (/<meta\s+name=["']referrer["']/i.test(withoutExisting)) {
		throw new Error('security policy generator found an unmanaged referrer meta tag');
	}
	if (!/<meta\s+charset=/i.test(withoutExisting)) {
		throw new Error('security policy generator requires an explicit charset before CSP');
	}
	return withoutExisting.replace(/(<meta\s+charset=[^>]+>)/i, `$1\n\t\t${tags}`);
}

export function finalizeStaticSecurity(root) {
	const htmlFiles = filesBelow(root).filter((file) => file.endsWith('.html'));
	for (const file of htmlFiles) writeFileSync(file, secureHtml(readFileSync(file, 'utf8')));
	return { htmlFiles: htmlFiles.length };
}

export function validateStaticSecurity(root) {
	const htmlFiles = filesBelow(root).filter((file) => file.endsWith('.html'));
	for (const file of htmlFiles) {
		const html = readFileSync(file, 'utf8');
		const hashes = inlineScriptHashes(html);
		const meta = html.match(
			/<meta\s+http-equiv="content-security-policy"\s+content="([^"]+)"\s+data-null-security-policy>/i
		)?.[1];
		if (!meta) throw new Error(`${file}: missing generated content security policy`);
		const decoded = meta.replaceAll('&quot;', '"').replaceAll('&amp;', '&');
		for (const hash of hashes) {
			if (!decoded.includes(quote(hash))) throw new Error(`${file}: CSP does not cover every inline script`);
		}
		if (
			!/<meta\s+name="referrer"\s+content="strict-origin-when-cross-origin"\s+data-null-security-policy>/i.test(
				html
			)
		) {
			throw new Error(`${file}: missing referrer policy`);
		}
	}
	return { htmlFiles: htmlFiles.length };
}
