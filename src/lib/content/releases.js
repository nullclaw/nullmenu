/**
 * Build-time GitHub release catalogue.
 *
 * API metadata for the site's selected release is preferred, but a pinned,
 * last-known-good manifest keeps
 * downloads useful when GitHub is unavailable or rate-limited. Product pages
 * without a published version never call this module (see +page.server.js).
 */

import { trustedAsset, trustedRelease } from './release-trust.js';

const OWNER = 'nullclaw';
const API_TIMEOUT_MS = 8_000;
const MANIFEST_REF = /^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? '')
	? process.env.GITHUB_SHA
	: 'main';
const MANIFEST_URL = `https://github.com/nullclaw/nullmenu/blob/${MANIFEST_REF}/src/lib/content/release-digests.json`;

const PLATFORMS = [
	{ target: 'macos-aarch64', os: 'mac', label: 'macOS', arch: 'Apple Silicon', kind: 'binary' },
	{ target: 'macos-x86_64', os: 'mac', label: 'macOS', arch: 'Intel', kind: 'binary' },
	{ target: 'linux-x86_64', os: 'linux', label: 'Linux', arch: 'x86-64', kind: 'binary' },
	{ target: 'linux-aarch64', os: 'linux', label: 'Linux', arch: 'ARM64', kind: 'binary' },
	{ target: 'linux-riscv64', os: 'linux', label: 'Linux', arch: 'RISC-V', kind: 'binary' },
	{
		target: 'linux-arm32-gnu',
		os: 'linux',
		label: 'Linux',
		arch: 'ARM32 · glibc',
		kind: 'binary'
	},
	{
		target: 'linux-arm32-musl',
		os: 'linux',
		label: 'Linux',
		arch: 'ARM32 · musl',
		kind: 'binary'
	},
	{ target: 'windows-x86_64', os: 'windows', label: 'Windows', arch: 'x64', kind: 'windows' },
	{ target: 'windows-aarch64', os: 'windows', label: 'Windows', arch: 'ARM64', kind: 'windows' },
	{ target: 'android-aarch64', os: 'android', label: 'Android', arch: 'ARM64', kind: 'binary' },
	{ target: 'android-armv7', os: 'android', label: 'Android', arch: 'ARMv7', kind: 'binary' },
	{ target: 'android-x86_64', os: 'android', label: 'Android', arch: 'x86-64', kind: 'binary' }
];

const CORE_TARGETS = [
	'macos-aarch64',
	'macos-x86_64',
	'linux-x86_64',
	'linux-aarch64',
	'linux-riscv64',
	'windows-x86_64',
	'windows-aarch64'
];

const ALL_TARGETS = PLATFORMS.map((platform) => platform.target);

/**
 * Checked against the published GitHub releases on 2026-07-17. These links
 * are deliberately tag-pinned: they cannot change to a different release
 * while a cached page still displays the older tag.
 */
const LAST_KNOWN_GOOD = {
	nullhub: {
		tag: 'v2026.5.29',
		targets: CORE_TARGETS,
		windows: {
			'windows-x86_64': {
				primary: 'nullhub-windows-x86_64.zip',
				executable: 'nullhub.exe',
				alternate: 'nullhub-windows-x86_64.exe'
			},
			'windows-aarch64': {
				primary: 'nullhub-windows-aarch64.zip',
				executable: 'nullhub.exe',
				alternate: 'nullhub-windows-aarch64.exe'
			}
		}
	},
	nullclaw: {
		tag: 'v2026.5.29',
		targets: ALL_TARGETS,
		windows: {
			'windows-x86_64': {
				primary: 'nullclaw-windows-x86_64.zip',
				executable: 'nullclaw.exe',
				alternate: 'nullclaw-windows-x86_64.exe'
			},
			'windows-aarch64': {
				primary: 'nullclaw-windows-aarch64.zip',
				executable: 'nullclaw.exe',
				alternate: 'nullclaw-windows-aarch64.exe'
			}
		}
	},
	nullboiler: {
		tag: 'v2026.5.29',
		targets: CORE_TARGETS,
		windows: {
			'windows-x86_64': {
				primary: 'nullboiler-windows-x86_64.zip',
				executable: 'nullboiler.exe',
				alternate: 'nullboiler-windows-x86_64.exe'
			},
			'windows-aarch64': {
				primary: 'nullboiler-windows-aarch64.zip',
				executable: 'nullboiler.exe',
				alternate: 'nullboiler-windows-aarch64.exe'
			}
		}
	},
	nulltickets: {
		tag: 'v2026.5.29',
		targets: CORE_TARGETS,
		windows: {
			'windows-x86_64': {
				primary: 'nulltickets-windows-x86_64.exe',
				executable: 'nulltickets-windows-x86_64.exe'
			},
			'windows-aarch64': {
				primary: 'nulltickets-windows-aarch64.exe',
				executable: 'nulltickets-windows-aarch64.exe'
			}
		}
	},
	nullwatch: {
		tag: 'v2026.5.29',
		targets: CORE_TARGETS,
		windows: {
			'windows-x86_64': {
				primary: 'nullwatch-windows-x86_64.zip',
				executable: 'nullwatch.exe',
				alternate: 'nullwatch-windows-x86_64.exe'
			},
			'windows-aarch64': {
				primary: 'nullwatch-windows-aarch64.zip',
				executable: 'nullwatch.exe',
				alternate: 'nullwatch-windows-aarch64.exe'
			}
		}
	},
	nullpantry: {
		tag: 'v2026.06.09',
		targets: CORE_TARGETS,
		windows: {
			'windows-x86_64': {
				primary: 'nullpantry-windows-x86_64.zip',
				executable: 'nullpantry.exe',
				alternate: 'nullpantry-windows-x86_64.exe'
			},
			'windows-aarch64': {
				primary: 'nullpantry-windows-aarch64.zip',
				executable: 'nullpantry.exe',
				alternate: 'nullpantry-windows-aarch64.exe'
			}
		}
	},
	nllclw: {
		tag: 'v2026.6.1',
		targets: ALL_TARGETS,
		windows: {
			'windows-x86_64': {
				primary: 'nllclw-windows-x86_64.zip',
				executable: 'nllclw.exe',
				alternate: 'nllclw-windows-x86_64.exe'
			},
			'windows-aarch64': {
				primary: 'nllclw-windows-aarch64.zip',
				executable: 'nllclw.exe',
				alternate: 'nllclw-windows-aarch64.exe'
			}
		}
	}
};

function fmtSize(bytes) {
	if (!Number.isFinite(bytes) || bytes <= 0) return null;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function assetUrl(repo, tag, name) {
	return `https://github.com/${OWNER}/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`;
}

function releaseUrl(repo, tag = null) {
	return tag
		? `https://github.com/${OWNER}/${repo}/releases/tag/${encodeURIComponent(tag)}`
		: `https://github.com/${OWNER}/${repo}/releases`;
}

function expectedNames(repo, platform) {
	if (platform.kind === 'windows') {
		return [`${repo}-${platform.target}.zip`, `${repo}-${platform.target}.exe`];
	}
	return [`${repo}-${platform.target}.bin`];
}

function findExact(assets, names) {
	for (const name of names) {
		const asset = assets.find((candidate) => candidate?.name === name);
		if (asset) return asset;
	}
	return null;
}

function findVerification(assets, binaryName) {
	const checksum = findExact(assets, [
		`${binaryName}.sha256`,
		`${binaryName}.sha256sum`,
		`${binaryName}.sha256.txt`,
		'SHA256SUMS',
		'SHA256SUMS.txt',
		'checksums.txt',
		'checksums.sha256'
	]);
	const signature = findExact(assets, [
		`${binaryName}.sig`,
		`${binaryName}.minisig`,
		`${binaryName}.asc`,
		'SHA256SUMS.sig',
		'SHA256SUMS.minisig',
		'SHA256SUMS.asc'
	]);

	return {
		checksum: checksum?.browser_download_url
			? { name: checksum.name, url: checksum.browser_download_url, label: 'SHA-256' }
			: null,
		signature: signature?.browser_download_url
			? { name: signature.name, url: signature.browser_download_url, label: 'signature' }
			: null
	};
}

function binaryFromAsset(repo, tag, platform, asset, assets) {
	const trust = trustedAsset(repo, tag, asset.name);
	if (!trust || (Number.isFinite(asset.size) && asset.size !== trust.bytes)) return null;
	// GitHub's asset metadata cannot prove the filename *inside* a ZIP. Live ZIP
	// instructions therefore stay generic; pinned snapshots record inspected names.
	const executableName = asset.name.endsWith('.zip') ? null : asset.name;
	const rawWindowsAsset =
		platform.kind === 'windows' && asset.name.endsWith('.zip')
			? findExact(assets, [`${repo}-${platform.target}.exe`])
			: null;
	const candidateRawWindowsTrust = rawWindowsAsset
		? trustedAsset(repo, tag, rawWindowsAsset.name)
		: null;
	const rawWindowsTrust =
		candidateRawWindowsTrust &&
		(!Number.isFinite(rawWindowsAsset.size) || rawWindowsAsset.size === candidateRawWindowsTrust.bytes)
			? candidateRawWindowsTrust
			: null;

	return {
		...platform,
		name: asset.name,
		executableName,
		package: asset.name.endsWith('.zip') ? 'zip' : 'binary',
		size: fmtSize(trust.bytes),
		bytes: trust.bytes,
		sha256: trust.sha256,
		url: asset.browser_download_url,
		alternates: rawWindowsAsset?.browser_download_url && rawWindowsTrust
			? [
					{
						label: 'raw .exe',
						name: rawWindowsAsset.name,
						url: rawWindowsAsset.browser_download_url,
						bytes: rawWindowsTrust.bytes,
						sha256: rawWindowsTrust.sha256,
						...findVerification(assets, rawWindowsAsset.name)
					}
				]
			: [],
		...findVerification(assets, asset.name)
	};
}

/** Convert a GitHub release response into the stable page contract. */
export function normaliseRelease(repo, release) {
	if (!release?.tag_name || !Array.isArray(release.assets)) return null;
	if (!trustedRelease(repo, release.tag_name)) return null;

	const binaries = [];
	for (const platform of PLATFORMS) {
		const asset = findExact(release.assets, expectedNames(repo, platform));
		if (!asset?.browser_download_url) continue;
		const binary = binaryFromAsset(repo, release.tag_name, platform, asset, release.assets);
		if (binary) binaries.push(binary);
	}

	if (!binaries.length) return null;
	const expectedTargets = LAST_KNOWN_GOOD[repo]?.targets;
	if (expectedTargets?.some((target) => !binaries.some((binary) => binary.target === target))) {
		// A partially published release is not a safe upgrade recommendation: one
		// failed matrix job must not silently remove a platform from the site.
		return null;
	}
	return {
		tag: release.tag_name,
		date: release.published_at?.slice(0, 10) ?? null,
		url: release.html_url || releaseUrl(repo, release.tag_name),
		manifestUrl: MANIFEST_URL,
		binaries,
		status: 'live'
	};
}

function fallbackBinary(repo, tag, platform, snapshot) {
	const windowsAsset = platform.kind === 'windows' ? snapshot.windows?.[platform.target] : null;
	if (platform.kind === 'windows' && !windowsAsset) return null;
	const name = windowsAsset?.primary ?? `${repo}-${platform.target}.bin`;
	const trust = trustedAsset(repo, tag, name);
	if (!trust) return null;
	const executableName = windowsAsset?.executable ?? name;
	const alternateTrust = windowsAsset?.alternate
		? trustedAsset(repo, tag, windowsAsset.alternate)
		: null;
	const alternates = windowsAsset?.alternate && alternateTrust
		? [
				{
					label: 'raw .exe',
					name: windowsAsset.alternate,
					url: assetUrl(repo, tag, windowsAsset.alternate),
					bytes: alternateTrust.bytes,
					sha256: alternateTrust.sha256,
					checksum: null,
					signature: null
				}
			]
		: [];

	return {
		...platform,
		name,
		executableName,
		package: name.endsWith('.zip') ? 'zip' : 'binary',
		size: fmtSize(trust.bytes),
		bytes: trust.bytes,
		sha256: trust.sha256,
		url: assetUrl(repo, tag, name),
		alternates,
		checksum: null,
		signature: null
	};
}

function fallbackRelease(repo, fallbackTag) {
	const snapshot = LAST_KNOWN_GOOD[repo];
	if (snapshot) {
		const binaries = PLATFORMS.filter((platform) => snapshot.targets.includes(platform.target))
			.map((platform) => fallbackBinary(repo, snapshot.tag, platform, snapshot))
			.filter(Boolean);
		if (binaries.length !== snapshot.targets.length) {
			return fallbackTag
				? {
						tag: fallbackTag,
						date: null,
						url: releaseUrl(repo, fallbackTag),
						manifestUrl: MANIFEST_URL,
						binaries: [],
						status: 'unavailable',
						note: 'This release is not offered here until every binary has a repository-anchored SHA-256 digest.'
					}
				: null;
		}
		return {
			tag: snapshot.tag,
			date: null,
			url: releaseUrl(repo, snapshot.tag),
			manifestUrl: MANIFEST_URL,
			binaries,
			status: 'cached',
			note: 'Live release details are temporarily unavailable. Downloads are pinned to the last verified release.'
		};
	}

	if (!fallbackTag) return null;
	return {
		tag: fallbackTag,
		date: null,
		url: releaseUrl(repo, fallbackTag),
		manifestUrl: MANIFEST_URL,
		binaries: [],
		status: 'unavailable',
		note: 'GitHub could not be reached during this build. Open the pinned release to choose an asset.'
	};
}

/** Fresh copies of every release snapshot used when GitHub's API is unavailable. */
export function pinnedReleaseSnapshots() {
	return Object.keys(LAST_KNOWN_GOOD).map((repo) => ({
		repo,
		release: fallbackRelease(repo, null)
	}));
}

/** Asset inventory used to generate and independently re-check the digest manifest. */
export function pinnedReleaseAssetList() {
	return Object.entries(LAST_KNOWN_GOOD).flatMap(([repo, snapshot]) =>
		PLATFORMS.filter((platform) => snapshot.targets.includes(platform.target)).flatMap((platform) => {
			const windowsAsset = platform.kind === 'windows' ? snapshot.windows?.[platform.target] : null;
			const primary = windowsAsset?.primary ?? `${repo}-${platform.target}.bin`;
			const names = [primary, ...(windowsAsset?.alternate ? [windowsAsset.alternate] : [])];
			return names.map((name) => ({
				repo,
				tag: snapshot.tag,
				name,
				url: assetUrl(repo, snapshot.tag, name)
			}));
		})
	);
}

/**
 * Fetch the site's selected published release (or latest when no tag is given).
 * Failures never turn a released product
 * into a false "coming soon" page: a pinned snapshot or release-page CTA is
 * returned instead.
 */
export async function fetchRelease(repo, { fallbackTag = null, fetchImpl = fetch } = {}) {
	const headers = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28'
	};
	if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

	try {
		const endpoint = fallbackTag
			? `https://api.github.com/repos/${OWNER}/${repo}/releases/tags/${encodeURIComponent(fallbackTag)}`
			: `https://api.github.com/repos/${OWNER}/${repo}/releases/latest`;
		const res = await fetchImpl(endpoint, {
			headers,
			signal: AbortSignal.timeout(API_TIMEOUT_MS)
		});
		if (!res.ok) {
			console.warn(`[releases] ${repo}: GitHub API returned ${res.status}; using pinned fallback`);
			return fallbackRelease(repo, fallbackTag);
		}

		const live = normaliseRelease(repo, await res.json());
		if (live && fallbackTag && live.tag !== fallbackTag) {
			console.warn(
				`[releases] ${repo}: API returned ${live.tag}, expected ${fallbackTag}; using pinned fallback`
			);
			return fallbackRelease(repo, fallbackTag);
		}
		if (live) return live;
		console.warn(
			`[releases] ${repo}: release is incomplete, untrusted or has no recognised binaries; using pinned fallback`
		);
		return fallbackRelease(repo, fallbackTag);
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		console.warn(`[releases] ${repo}: ${detail}; using pinned fallback`);
		return fallbackRelease(repo, fallbackTag);
	}
}
