/**
 * Build-time fetch of a repo's latest release — the download menu is baked
 * into the static page. The deploy workflow rebuilds weekly, so it stays
 * close to fresh without any client-side API calls.
 */

const PLATFORMS = [
	{ match: 'macos-aarch64', os: 'mac', label: 'macOS', arch: 'Apple Silicon' },
	{ match: 'macos-x86_64', os: 'mac', label: 'macOS', arch: 'Intel' },
	{ match: 'linux-x86_64', os: 'linux', label: 'Linux', arch: 'x86-64' },
	{ match: 'linux-aarch64', os: 'linux', label: 'Linux', arch: 'ARM64' },
	{ match: 'linux-riscv64', os: 'linux', label: 'Linux', arch: 'RISC-V' },
	{ match: 'linux-arm32-gnu', os: 'linux', label: 'Linux', arch: 'ARM32 · glibc' },
	{ match: 'linux-arm32-musl', os: 'linux', label: 'Linux', arch: 'ARM32 · musl' },
	{ match: 'windows-x86_64.exe', os: 'windows', label: 'Windows', arch: 'x64' },
	{ match: 'windows-aarch64.exe', os: 'windows', label: 'Windows', arch: 'ARM64' },
	{ match: 'android-aarch64', os: 'android', label: 'Android', arch: 'ARM64' },
	{ match: 'android-armv7', os: 'android', label: 'Android', arch: 'ARMv7' },
	{ match: 'android-x86_64', os: 'android', label: 'Android', arch: 'x86-64' }
];

function fmtSize(bytes) {
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function fetchRelease(repo) {
	try {
		const headers = { Accept: 'application/vnd.github+json' };
		if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
		const res = await fetch(`https://api.github.com/repos/nullclaw/${repo}/releases/latest`, {
			headers
		});
		if (!res.ok) return null;
		const release = await res.json();

		const binaries = [];
		for (const p of PLATFORMS) {
			const asset = release.assets.find((a) => a.name.includes(p.match));
			if (!asset) continue;
			binaries.push({
				...p,
				name: asset.name,
				size: fmtSize(asset.size),
				bytes: asset.size,
				url: `https://github.com/nullclaw/${repo}/releases/latest/download/${asset.name}`
			});
		}

		return binaries.length
			? {
					tag: release.tag_name,
					date: release.published_at?.slice(0, 10) ?? null,
					url: release.html_url,
					binaries
				}
			: null;
	} catch {
		return null;
	}
}
