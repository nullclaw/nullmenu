import { execFileSync } from 'node:child_process';

const cache = new Map();

function gitDate(args) {
	try {
		const value = execFileSync('git', args, {
			cwd: process.cwd(),
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		}).trim();
		return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
	} catch {
		return null;
	}
}

const fallbackDate =
	gitDate(['show', '-s', '--format=%cs', 'HEAD']) ?? new Date().toISOString().slice(0, 10);

function pathDate(path) {
	if (!path || path.startsWith('/') || path.split(/[\\/]/).includes('..')) return null;
	if (!cache.has(path)) {
		cache.set(path, gitDate(['log', '-1', '--format=%cs', '--', path]));
	}
	return cache.get(path);
}

/** Latest source-control date among the files that materially produce a URL. */
export function repositoryLastmod(paths) {
	return paths.map(pathDate).filter(Boolean).sort().at(-1) ?? fallbackDate;
}
