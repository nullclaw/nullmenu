/**
 * Three-mode theme state. `system` follows the operating-system preference;
 * `light` and `dark` are explicit choices. The effective theme remains in
 * `current` so visual components do not need to understand preference modes.
 */

const STORAGE_KEY = 'nullmenu-theme';
const MODES = new Set(['system', 'light', 'dark']);

function validMode(value) {
	return MODES.has(value) ? value : null;
}

function cookieMode() {
	if (typeof document === 'undefined') return null;
	try {
		const row = document.cookie
			.split(';')
			.map((part) => part.trim())
			.find((part) => part.startsWith(`${STORAGE_KEY}=`));
		if (!row) return null;
		try {
			return validMode(decodeURIComponent(row.slice(STORAGE_KEY.length + 1)));
		} catch {
			return null;
		}
	} catch {
		return null;
	}
}

function localMode() {
	if (typeof localStorage === 'undefined') return null;
	try {
		return validMode(localStorage.getItem(STORAGE_KEY));
	} catch {
		return null;
	}
}

function storedMode() {
	// The cookie is shared by nullmenu.ai and every product subdomain, so it is
	// authoritative when an origin still has an older localStorage value.
	return cookieMode() ?? localMode() ?? 'system';
}

function systemTheme() {
	return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches
		? 'light'
		: 'dark';
}

function updateThemeColor(theme) {
	document
		.querySelector('meta[name="theme-color"]:not([media])')
		?.setAttribute('content', theme === 'light' ? '#f2ead8' : '#0c0a08');
}

function applyMode(mode) {
	const safeMode = validMode(mode) ?? 'system';
	const current = safeMode === 'system' ? systemTheme() : safeMode;
	themeState.mode = safeMode;
	themeState.current = current;
	document.documentElement.dataset.themeMode = safeMode;
	document.documentElement.dataset.theme = current;
	updateThemeColor(current);
}

function persistMode(mode) {
	try {
		localStorage.setItem(STORAGE_KEY, mode);
	} catch {
		/* storage can be unavailable in hardened/private contexts */
	}

	try {
		const host = location.hostname.toLowerCase();
		const sharedDomain = host === 'nullmenu.ai' || host.endsWith('.nullmenu.ai')
			? '; Domain=.nullmenu.ai'
			: '';
		const secure = location.protocol === 'https:' ? '; Secure' : '';
		document.cookie = `${STORAGE_KEY}=${encodeURIComponent(mode)}; Max-Age=31536000; Path=/; SameSite=Lax${sharedDomain}${secure}`;
	} catch {
		/* cookies may be blocked; localStorage still covers the current origin */
	}
}

const initialMode =
	typeof document !== 'undefined'
		? validMode(document.documentElement.dataset.themeMode) ?? storedMode()
		: 'system';
const initialTheme =
	typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light'
		? 'light'
		: 'dark';

export const themeState = $state({
	mode: initialMode,
	current: initialTheme
});

export function nextThemeMode() {
	if (themeState.mode === 'system') return 'light';
	return themeState.mode === 'light' ? 'dark' : 'system';
}

export function themeToggleLabel() {
	const detail = themeState.mode === 'system' ? `system (${themeState.current})` : themeState.mode;
	return `Theme: ${detail}. Switch to ${nextThemeMode()} theme`;
}

export function setThemeMode(mode) {
	const safeMode = validMode(mode) ?? 'system';
	applyMode(safeMode);
	persistMode(safeMode);
}

export function toggleTheme() {
	setThemeMode(nextThemeMode());
}

export function syncTheme() {
	if (typeof document === 'undefined') return () => {};
	const media = matchMedia('(prefers-color-scheme: light)');

	function syncExternalPreference() {
		const next = storedMode();
		if (next !== themeState.mode) applyMode(next);
	}

	function onSystemChange() {
		if (themeState.mode === 'system') applyMode('system');
	}

	function onStorage(event) {
		if (!event.key || event.key === STORAGE_KEY) syncExternalPreference();
	}

	function onVisibility() {
		if (document.visibilityState === 'visible') syncExternalPreference();
	}

	const mode = validMode(document.documentElement.dataset.themeMode) ?? storedMode();
	applyMode(mode);
	persistMode(mode); // migrate older local-only choices to the shared cookie

	media.addEventListener('change', onSystemChange);
	window.addEventListener('storage', onStorage);
	window.addEventListener('focus', syncExternalPreference);
	document.addEventListener('visibilitychange', onVisibility);

	return () => {
		media.removeEventListener('change', onSystemChange);
		window.removeEventListener('storage', onStorage);
		window.removeEventListener('focus', syncExternalPreference);
		document.removeEventListener('visibilitychange', onVisibility);
	};
}
