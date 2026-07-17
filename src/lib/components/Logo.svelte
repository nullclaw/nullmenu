<script>
	/**
	 * The ∅ plate — a circle (the plate) crossed by a knife-slash.
	 * The empty set is the null mark; the accent slash makes it a place setting.
	 */
	let { size = 26, slash = 'var(--accent)' } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 32 32"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<circle cx="16" cy="16" r="10.5" stroke="currentColor" stroke-width="1.75" />
	<line
		class="slash"
		x1="7"
		y1="27"
		x2="25"
		y2="5"
		stroke={slash}
		stroke-width="1.75"
		stroke-linecap="round"
	/>
</svg>
