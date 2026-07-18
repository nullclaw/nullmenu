#!/usr/bin/env node

import { pinnedReleaseSnapshots } from '../src/lib/content/releases.js';

const checks = pinnedReleaseSnapshots().flatMap(({ repo, release }) =>
	release.binaries.flatMap((binary) => [
		{ repo, name: binary.name, url: binary.url },
		...(binary.alternates ?? []).map((alternate) => ({
			repo,
			name: alternate.name,
			url: alternate.url
		}))
	])
);

const failures = [];
const batchSize = 6;

async function verifyAsset({ repo, name, url }) {
	let failure = 'request failed';
	for (let attempt = 0; attempt < 2; attempt += 1) {
		try {
			const response = await fetch(url, {
				method: 'HEAD',
				redirect: 'follow',
				signal: AbortSignal.timeout(20_000)
			});
			if (response.ok) return;
			failure = `HTTP ${response.status}`;
			if (response.status < 500 && response.status !== 429) break;
		} catch (error) {
			failure = error instanceof Error ? error.message : String(error);
		}
		if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 500));
	}
	failures.push(`${repo}/${name}: ${failure}`);
}

for (let index = 0; index < checks.length; index += batchSize) {
	await Promise.all(checks.slice(index, index + batchSize).map(verifyAsset));
}

if (failures.length) {
	console.error(`Pinned release smoke test failed (${failures.length}):`);
	for (const failure of failures) console.error(`  - ${failure}`);
	process.exitCode = 1;
} else {
	console.log(`Pinned release smoke test passed: ${checks.length} assets.`);
}
