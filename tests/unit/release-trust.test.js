import assert from 'node:assert/strict';
import test from 'node:test';
import {
	downloadCommand,
	runCommand,
	verificationCommand
} from '../../src/lib/content/release-commands.js';
import { pinnedReleaseAssetList } from '../../src/lib/content/releases.js';
import { releaseDigestManifest, trustedAsset } from '../../src/lib/content/release-trust.js';
import { validateDigestManifest } from '../../scripts/update-release-digests.js';

const sha256 = 'a'.repeat(64);

test('release manifest covers every pinned primary and alternate asset', () => {
	const manifest = releaseDigestManifest();
	assert.deepEqual(validateDigestManifest(manifest), []);
	assert.equal(pinnedReleaseAssetList().length, 71);
	for (const asset of pinnedReleaseAssetList()) {
		assert.ok(trustedAsset(asset.repo, asset.tag, asset.name), `${asset.repo}/${asset.name}`);
	}
});

test('verification commands use the native SHA-256 tool for each operating system', () => {
	const base = { name: 'tool.bin', url: 'https://example.test/tool.bin', sha256 };
	assert.match(verificationCommand({ ...base, os: 'mac' }), /shasum -a 256 -c -/);
	assert.match(verificationCommand({ ...base, os: 'linux' }), /sha256sum -c -/);
	assert.match(verificationCommand({ ...base, os: 'windows' }), /Get-FileHash -Algorithm SHA256/);
	assert.match(downloadCommand({ ...base, os: 'linux' }), /curl -fL[\s\S]+sha256sum -c -/);
	assert.match(downloadCommand({ ...base, os: 'windows' }), /Invoke-WebRequest[\s\S]+SHA-256 mismatch/);
	assert.equal(runCommand({ ...base, os: 'linux' }), 'chmod +x tool.bin && ./tool.bin --help');
});
