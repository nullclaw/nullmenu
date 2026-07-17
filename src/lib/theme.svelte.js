/**
 * Theme: evening service (dark, cast iron) / day service (light, parchment).
 * The initial value is set before paint by the inline script in app.html;
 * this module mirrors it reactively for components (the Ink pigments care).
 */
export const themeState = $state({ current: 'dark' });

export function syncTheme() {
	themeState.current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function toggleTheme() {
	const next = themeState.current === 'dark' ? 'light' : 'dark';
	themeState.current = next;
	document.documentElement.dataset.theme = next;
	try {
		localStorage.setItem('nullmenu-theme', next);
	} catch {
		/* private mode */
	}
	document
		.querySelector('meta[name="theme-color"]:not([media])')
		?.setAttribute('content', next === 'light' ? '#f2ead8' : '#0c0a08');
}
