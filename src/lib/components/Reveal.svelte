<script>
	/** Scroll-into-view reveal wrapper. No-op under prefers-reduced-motion (CSS). */
	let { delay = 0, children, class: className = '' } = $props();

	function reveal(node) {
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

<div use:reveal class="reveal {className}" style:transition-delay="{delay}ms">
	{@render children?.()}
</div>
