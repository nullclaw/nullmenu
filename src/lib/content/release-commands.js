export function shellQuote(value) {
	return `'${String(value).replaceAll("'", "'\\''")}'`;
}

export function powershellQuote(value) {
	return `'${String(value).replaceAll("'", "''")}'`;
}

export function verificationCommand(binary) {
	if (!binary?.sha256) return null;
	if (binary.os === 'windows') {
		const file = powershellQuote(binary.name);
		const digest = powershellQuote(binary.sha256);
		return `$expected = ${digest}; $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath ${file}).Hash.ToLowerInvariant(); if ($actual -ne $expected) { Remove-Item -LiteralPath ${file} -ErrorAction SilentlyContinue; throw 'SHA-256 mismatch' }`;
	}

	const checker = binary.os === 'mac' ? 'shasum -a 256' : 'sha256sum';
	return `printf '%s  %s\\n' ${shellQuote(binary.sha256)} ${shellQuote(binary.name)} | ${checker} -c -`;
}

export function downloadCommand(binary) {
	const verify = verificationCommand(binary);
	if (binary.os === 'windows') {
		const download = `$ErrorActionPreference = 'Stop'; Invoke-WebRequest -Uri ${powershellQuote(binary.url)} -OutFile ${powershellQuote(binary.name)}`;
		return verify ? `${download}; ${verify}` : download;
	}

	const download = `curl -fL ${shellQuote(binary.url)} -o ${shellQuote(binary.name)}`;
	return verify ? `${download} && ${verify}` : download;
}

export function runCommand(binary) {
	if (binary.os === 'windows' && binary.package === 'zip') {
		return binary.executableName
			? `Unzip ${binary.name}, then run .\\${binary.executableName} --help`
			: `Unzip ${binary.name}, then run the included .exe with --help`;
	}
	if (binary.os === 'windows') return `.\\${binary.name} --help`;
	return `chmod +x ${binary.name} && ./${binary.name} --help`;
}
