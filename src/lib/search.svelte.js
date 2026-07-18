/** Shared open/closed state for the docs search modal. */
export const searchState = $state({ open: false, opening: false });

/**
 * Give any active drawer one frame to close and restore focus before the
 * search dialog snapshots its invoker. This also guarantees a single modal
 * layer instead of overlapping focus traps.
 */
export function requestSearch() {
	if (typeof window === 'undefined' || searchState.open || searchState.opening) return;
	searchState.opening = true;
	window.dispatchEvent(new CustomEvent('nullmenu:search-opening'));
	requestAnimationFrame(() => {
		if (!searchState.opening) return;
		searchState.opening = false;
		searchState.open = true;
	});
}
