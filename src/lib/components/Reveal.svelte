<script>
	/**
	 * Scroll reveal. On engines with CSS scroll-driven animations the reveal
	 * is a pure-CSS scrubbed animation tied to the element's own view timeline
	 * (reversible, jank-free, no JS). Elsewhere it falls back to a one-shot
	 * IntersectionObserver reveal. No-op under prefers-reduced-motion.
	 */
	let { delay = 0, children, class: className = '' } = $props();

	const sda =
		typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');

	function reveal(node) {
		if (sda) return;
		// Huge top margin: anything at or above the viewport counts as "seen",
		// so instant jumps (anchors, Home/End, restored scroll) can't skip reveals.
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					node.classList.add('is-visible');
					io.disconnect();
				}
			},
			{ rootMargin: '100000px 0px -8% 0px' }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}
</script>

<div
	use:reveal
	class="{sda ? 'sda' : 'reveal'} {className}"
	style:transition-delay={sda ? undefined : `${delay}ms`}
>
	{@render children?.()}
</div>
