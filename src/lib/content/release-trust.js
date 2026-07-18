import manifest from './release-digests.json' with { type: 'json' };

function releaseKey(repo, tag) {
	return `${repo}@${tag}`;
}

export function trustedAsset(repo, tag, name) {
	const asset = manifest.releases?.[releaseKey(repo, tag)]?.assets?.[name];
	if (!asset || !/^[a-f0-9]{64}$/.test(asset.sha256) || !Number.isSafeInteger(asset.bytes)) {
		return null;
	}
	return { sha256: asset.sha256, bytes: asset.bytes };
}

export function trustedRelease(repo, tag) {
	return manifest.releases?.[releaseKey(repo, tag)] ?? null;
}

export function releaseDigestManifest() {
	return manifest;
}
