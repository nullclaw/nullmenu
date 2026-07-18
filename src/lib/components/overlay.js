const scrollLocks = new Set();
let previousOverflow = '';

const focusableSelector = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(',');

/** Keep independently mounted drawers and dialogs from unlocking one another. */
export function lockPageScroll(owner) {
	if (typeof document === 'undefined') return () => {};
	if (scrollLocks.size === 0) previousOverflow = document.body.style.overflow;
	scrollLocks.add(owner);
	document.body.style.overflow = 'hidden';

	let released = false;
	return () => {
		if (released) return;
		released = true;
		scrollLocks.delete(owner);
		if (scrollLocks.size === 0) document.body.style.overflow = previousOverflow;
	};
}

/** Temporarily remove background regions from pointer, keyboard, and accessibility navigation. */
export function inertElements(elements) {
	const snapshots = elements.filter(Boolean).map((element) => ({
		element,
		inert: element.inert,
		hadAriaHidden: element.hasAttribute('aria-hidden'),
		ariaHidden: element.getAttribute('aria-hidden')
	}));

	for (const { element } of snapshots) {
		element.inert = true;
		element.setAttribute('aria-hidden', 'true');
	}

	return () => {
		for (const { element, inert, hadAriaHidden, ariaHidden } of snapshots) {
			element.inert = inert;
			if (hadAriaHidden) element.setAttribute('aria-hidden', ariaHidden);
			else element.removeAttribute('aria-hidden');
		}
	};
}

export function focusablesWithin(root) {
	if (!root) return [];
	return [...root.querySelectorAll(focusableSelector)].filter(
		(element) => !element.hidden && element.getClientRects().length > 0
	);
}

export function trapTab(event, root) {
	const focusables = focusablesWithin(root);
	if (!focusables.length) {
		event.preventDefault();
		root?.focus?.();
		return;
	}

	const first = focusables[0];
	const last = focusables[focusables.length - 1];
	if (event.shiftKey && document.activeElement === first) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first.focus();
	}
}

export function searchShortcutLabel() {
	if (typeof navigator === 'undefined') return 'Ctrl K';
	const platform = `${navigator.platform ?? ''} ${navigator.userAgent ?? ''}`;
	return /Mac|iPhone|iPad|iPod/i.test(platform) ? '⌘K' : 'Ctrl K';
}
