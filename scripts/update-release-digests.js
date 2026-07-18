#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pinnedReleaseAssetList } from '../src/lib/content/releases.js';

const manifestUrl = new URL('../src/lib/content/release-digests.json', import.meta.url);
const concurrency = 5;

function keyFor(repo, tag) {
	return `${repo}@${tag}`;
}

async function readManifest() {
	return JSON.parse(await readFile(manifestUrl, 'utf8'));
}

async function hashAsset(asset) {
	let lastError;
	for (let attempt = 1; attempt <= 2; attempt += 1) {
		try {
			const response = await fetch(asset.url, {
				headers: { Accept: 'application/octet-stream' },
				redirect: 'follow',
				signal: AbortSignal.timeout(90_000)
			});
			if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

			const hash = createHash('sha256');
			let bytes = 0;
			for await (const chunk of response.body) {
				bytes += chunk.byteLength;
				hash.update(chunk);
			}
			return { ...asset, bytes, sha256: hash.digest('hex') };
		} catch (error) {
			lastError = error;
			if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, 600));
		}
	}
	throw new Error(`${asset.repo}/${asset.name}: ${lastError?.message ?? lastError}`);
}

/** @param {(asset: any, done: number, total: number) => void} [onAsset] */
async function hashInventory(onAsset = (_asset, _done, _total) => {}) {
	const inventory = pinnedReleaseAssetList().sort((a, b) =>
		`${a.repo}/${a.name}`.localeCompare(`${b.repo}/${b.name}`)
	);
	const results = new Array(inventory.length);
	let cursor = 0;
	let completed = 0;
	async function worker() {
		while (cursor < inventory.length) {
			const index = cursor;
			cursor += 1;
			results[index] = await hashAsset(inventory[index]);
			completed += 1;
			onAsset(results[index], completed, inventory.length);
		}
	}
	await Promise.all(Array.from({ length: concurrency }, () => worker()));
	return results;
}

export function validateDigestManifest(manifest) {
	const errors = [];
	if (manifest?.schema !== 1) errors.push('manifest.schema must be 1');
	for (const asset of pinnedReleaseAssetList()) {
		const entry = manifest?.releases?.[keyFor(asset.repo, asset.tag)]?.assets?.[asset.name];
		if (!entry) {
			errors.push(`missing ${asset.repo}@${asset.tag}/${asset.name}`);
			continue;
		}
		if (!/^[a-f0-9]{64}$/.test(entry.sha256 ?? '')) {
			errors.push(`invalid SHA-256 for ${asset.repo}@${asset.tag}/${asset.name}`);
		}
		if (!Number.isSafeInteger(entry.bytes) || entry.bytes <= 0) {
			errors.push(`invalid byte size for ${asset.repo}@${asset.tag}/${asset.name}`);
		}
	}
	const expected = new Set(
		pinnedReleaseAssetList().map((asset) => `${keyFor(asset.repo, asset.tag)}/${asset.name}`)
	);
	for (const [releaseKey, release] of Object.entries(manifest?.releases ?? {})) {
		for (const name of Object.keys(release.assets ?? {})) {
			if (!expected.has(`${releaseKey}/${name}`)) errors.push(`unexpected ${releaseKey}/${name}`);
		}
	}
	return errors;
}

export async function generateDigestManifest() {
	const results = await hashInventory((asset, done, total) => {
		console.log(`[${done}/${total}] ${asset.repo}/${asset.name} ${asset.sha256.slice(0, 12)}…`);
	});
	const releases = {};
	for (const asset of results) {
		const key = keyFor(asset.repo, asset.tag);
		releases[key] ??= { repo: asset.repo, tag: asset.tag, assets: {} };
		releases[key].assets[asset.name] = { sha256: asset.sha256, bytes: asset.bytes };
	}
	const manifest = {
		schema: 1,
		verifiedAt: new Date().toISOString().slice(0, 10),
		releases
	};
	await writeFile(manifestUrl, `${JSON.stringify(manifest, null, '\t')}\n`);
	console.log(`Wrote ${fileURLToPath(manifestUrl)} with ${results.length} verified assets.`);
}

export async function verifyPublishedDigests() {
	const manifest = await readManifest();
	const structuralErrors = validateDigestManifest(manifest);
	if (structuralErrors.length) throw new Error(structuralErrors.join('\n'));
	const mismatches = [];
	await hashInventory((actual, done, total) => {
		const expected = manifest.releases[keyFor(actual.repo, actual.tag)].assets[actual.name];
		if (actual.sha256 !== expected.sha256 || actual.bytes !== expected.bytes) {
			mismatches.push(
				`${actual.repo}/${actual.name}: expected ${expected.sha256}/${expected.bytes}, got ${actual.sha256}/${actual.bytes}`
			);
		}
		console.log(`[${done}/${total}] verified ${actual.repo}/${actual.name}`);
	});
	if (mismatches.length) throw new Error(mismatches.join('\n'));
}

async function main() {
	const mode = process.argv[2] ?? '--generate';
	if (mode === '--generate') {
		await generateDigestManifest();
		return;
	}
	if (mode === '--verify') {
		await verifyPublishedDigests();
		console.log('Published release digests match the committed manifest.');
		return;
	}
	if (mode === '--check') {
		const errors = validateDigestManifest(await readManifest());
		if (errors.length) throw new Error(errors.join('\n'));
		console.log(`Release digest manifest covers ${pinnedReleaseAssetList().length} assets.`);
		return;
	}
	throw new Error(`Unknown mode ${mode}; use --generate, --check or --verify.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
}
