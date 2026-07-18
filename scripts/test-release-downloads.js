#!/usr/bin/env node

import assert from 'node:assert/strict';
import { fetchRelease, normaliseRelease } from '../src/lib/content/releases.js';

const asset = (name, size = 1_500_000) => ({
	name,
	size,
	browser_download_url: `https://github.com/nullclaw/nullhub/releases/download/v9.4.2/${name}`
});

const completeCoreAssets = [
	'nullhub-macos-aarch64.bin',
	'nullhub-macos-x86_64.bin',
	'nullhub-linux-x86_64.bin',
	'nullhub-linux-aarch64.bin',
	'nullhub-linux-riscv64.bin',
	'nullhub-windows-x86_64.zip',
	'nullhub-windows-aarch64.zip'
].map((name) => asset(name));

const live = normaliseRelease('nullhub', {
	tag_name: 'v9.4.2',
	published_at: '2026-07-17T12:00:00Z',
	html_url: 'https://github.com/nullclaw/nullhub/releases/tag/v9.4.2',
	assets: [
		// These similarly named files must never be mistaken for the binary.
		asset('prefix-nullhub-linux-x86_64.bin'),
		asset('nullhub-linux-x86_64.bin.sha256'),
		asset('SHA256SUMS.minisig'),
		...completeCoreAssets,
		asset('nullhub-windows-x86_64.exe'),
		asset('nullhub-windows-x86_64.exe.sha256')
	]
});

assert.ok(live, 'a recognised release is normalised');
assert.equal(live.status, 'live');
assert.equal(live.tag, 'v9.4.2');
assert.equal(live.date, '2026-07-17');

const linux = live.binaries.find((binary) => binary.target === 'linux-x86_64');
assert.equal(linux.name, 'nullhub-linux-x86_64.bin', 'asset matching is exact');
assert.match(linux.url, /\/releases\/download\/v9\.4\.2\//, 'the API browser URL stays tag-pinned');
assert.equal(linux.checksum.name, 'nullhub-linux-x86_64.bin.sha256');
assert.equal(linux.signature.name, 'SHA256SUMS.minisig');

const windows = live.binaries.find((binary) => binary.target === 'windows-x86_64');
assert.equal(windows.name, 'nullhub-windows-x86_64.zip', 'Windows prefers the packaged ZIP');
assert.equal(windows.executableName, null, 'live API metadata does not invent ZIP contents');
assert.equal(windows.alternates[0].name, 'nullhub-windows-x86_64.exe');
assert.equal(windows.alternates[0].checksum.name, 'nullhub-windows-x86_64.exe.sha256');

const partial = normaliseRelease('nullhub', {
	tag_name: 'v9.4.3',
	assets: [asset('nullhub-linux-x86_64.bin')]
});
assert.equal(partial, null, 'a partial release cannot silently remove supported platforms');

let requestOptions;
const partialFallback = await fetchRelease('nullhub', {
	fallbackTag: 'v2026.5.29',
	fetchImpl: async (_url, options) => {
		requestOptions = options;
		return {
			ok: true,
			status: 200,
			json: async () => ({ tag_name: 'v9.4.3', assets: [asset('nullhub-linux-x86_64.bin')] })
		};
	}
});
assert.equal(partialFallback.status, 'cached');
assert.equal(requestOptions.headers['X-GitHub-Api-Version'], '2022-11-28');
assert.ok(requestOptions.signal instanceof AbortSignal, 'GitHub requests carry a timeout signal');

const rateLimited = await fetchRelease('nullhub', {
	fallbackTag: 'v2026.5.29',
	fetchImpl: async () => ({ ok: false, status: 429 })
});
assert.equal(rateLimited.status, 'cached');
assert.equal(rateLimited.tag, 'v2026.5.29');
assert.ok(rateLimited.binaries.length > 0, 'rate limits retain last-known-good downloads');
assert.ok(
	rateLimited.binaries.every((binary) => binary.url.includes('/releases/download/v2026.5.29/')),
	'fallback downloads are tag-pinned'
);
const cachedWindows = rateLimited.binaries.find((binary) => binary.target === 'windows-x86_64');
assert.equal(cachedWindows.name, 'nullhub-windows-x86_64.zip');
assert.equal(cachedWindows.executableName, 'nullhub.exe', 'inspected ZIP contents are explicit');
assert.equal(cachedWindows.alternates[0].name, 'nullhub-windows-x86_64.exe');

const ticketsFallback = await fetchRelease('nulltickets', {
	fallbackTag: 'v2026.5.29',
	fetchImpl: async () => ({ ok: false, status: 403 })
});
const ticketsWindows = ticketsFallback.binaries.find(
	(binary) => binary.target === 'windows-x86_64'
);
assert.equal(ticketsWindows.name, 'nulltickets-windows-x86_64.exe');
assert.equal(ticketsWindows.package, 'binary');
assert.deepEqual(ticketsWindows.alternates, [], 'fallback never invents an unverified ZIP or EXE');

for (const [repo, tag, count] of [
	['nullhub', 'v2026.5.29', 7],
	['nullclaw', 'v2026.5.29', 12],
	['nullboiler', 'v2026.5.29', 7],
	['nulltickets', 'v2026.5.29', 7],
	['nullwatch', 'v2026.5.29', 7],
	['nullpantry', 'v2026.06.09', 7],
	['nllclw', 'v2026.6.1', 12]
]) {
	const fallback = await fetchRelease(repo, {
		fallbackTag: tag,
		fetchImpl: async () => ({ ok: false, status: 503 })
	});
	assert.equal(fallback.tag, tag, `${repo} keeps its verified tag`);
	assert.equal(fallback.binaries.length, count, `${repo} keeps its complete platform matrix`);
	assert.equal(
		new Set(fallback.binaries.map((binary) => binary.target)).size,
		count,
		`${repo} fallback targets stay unique`
	);
	assert.ok(
		fallback.binaries.every((binary) => binary.url.includes(`/releases/download/${tag}/`)),
		`${repo} fallback links stay tag-pinned`
	);
}

const unavailable = await fetchRelease('future-tool', {
	fallbackTag: 'v1.2.3',
	fetchImpl: async () => {
		throw new Error('offline');
	}
});
assert.equal(unavailable.status, 'unavailable');
assert.equal(unavailable.binaries.length, 0);
assert.match(unavailable.url, /\/releases\/tag\/v1\.2\.3$/);

const unreleased = await fetchRelease('future-tool', {
	fetchImpl: async () => ({ ok: false, status: 404 })
});
assert.equal(unreleased, null, 'an explicitly unversioned project stays unreleased');

console.log('release downloads: exact matching, packaging and fallbacks verified');
