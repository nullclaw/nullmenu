#!/usr/bin/env node

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const [site = 'menu', rawPort = '4173'] = process.argv.slice(2);
const port = Number(rawPort);
const root = resolve(`build/${site}`);

if (!existsSync(root)) {
	console.error(`Missing ${root}. Build the ${site} site first.`);
	process.exit(1);
}

const mime = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.md': 'text/markdown; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.txt': 'text/plain; charset=utf-8',
	'.wasm': 'application/wasm',
	'.woff2': 'font/woff2',
	'.xml': 'application/xml; charset=utf-8'
};

function resolveRequest(url) {
	const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
	const relative = normalize(pathname).replace(/^([/\\])+/, '');
	let path = resolve(root, relative);
	if (path !== root && !path.startsWith(`${root}${sep}`)) return null;
	if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
	return existsSync(path) && statSync(path).isFile() ? path : null;
}

createServer((request, response) => {
	const path = resolveRequest(request.url ?? '/');
	if (!path) {
		response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
		response.end('Not found');
		return;
	}
	response.writeHead(200, {
		'cache-control': 'no-store',
		'content-type': mime[extname(path)] ?? 'application/octet-stream'
	});
	if (request.method === 'HEAD') response.end();
	else createReadStream(path).pipe(response);
}).listen(port, '127.0.0.1', () => {
	console.log(`Serving ${site} at http://127.0.0.1:${port}`);
});
