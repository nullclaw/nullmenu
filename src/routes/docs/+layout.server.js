import { docsTree } from '$lib/content/docs.js';

export function load() {
	return { tree: docsTree() };
}
