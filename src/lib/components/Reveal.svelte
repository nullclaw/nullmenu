<script>
	/**
	 * Scroll reveal as progressive enhancement. Server-rendered markup stays
	 * visible, so no-JS visitors and hydration always start from the same DOM.
	 * Once mounted, capable browsers opt into a CSS view timeline; the rest use
	 * a one-shot IntersectionObserver. Reduced-motion CSS makes both no-ops.
	 */
	let { delay = 0, children, class: className = '' } = $props();

	function reveal(node) {
		// Never make content disappear after it was already painted in-view. This
		// matters on slow hydration, restored scroll positions and anchor jumps.
		const rect = node.getBoundingClientRect();
		if (rect.bottom > 0 && rect.top < innerHeight * 0.92) return;

		if (typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')) {
			node.classList.add('sda');
			return {
				destroy() {
					node.classList.remove('sda');
				}
			};
		}

		// A missing observer is not a reason to hide content.
		if (typeof IntersectionObserver === 'undefined') return;
		node.classList.add('reveal');
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
		return {
			destroy() {
				io.disconnect();
				node.classList.remove('reveal', 'is-visible');
			}
		};
	}
</script>

<div
	use:reveal
	class={className}
	style:--reveal-delay={`${delay}ms`}
>
	{@render children?.()}
</div>
