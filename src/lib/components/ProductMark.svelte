<script>
	/**
	 * Per-product ornament — one consistent 32px stroke system,
	 * a distinct mark for each dish on the menu.
	 */
	let { id, size = 32, stroke = 'currentColor' } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 32 32"
	fill="none"
	stroke={stroke}
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
	focusable="false"
	data-product-mark={id}
>
	{#if id === 'claw'}
		<!-- the chef — three diagonal claw scratches, kept apart from steam/activity -->
		<path d="M5.5 25.5C10 22 14 13 17 5" />
		<path d="M12.5 27C17 22 21 14 24 7" />
		<path d="M20.5 25C24 21 26 17 27 12" />
	{:else if id === 'hub'}
		<!-- the sous-chef — the oven dial that runs every station -->
		<circle cx="16" cy="16" r="10.5" />
		<path d="M16 16l4.6-6.2" stroke-width="2.2" />
		<circle cx="16" cy="16" r="1.6" fill={stroke} stroke="none" />
		<path d="M16 2.5v2M29.5 16h-2M16 29.5v-2M2.5 16h2" opacity="0.7" />
	{:else if id === 'pantry'}
		<!-- the larder — a stocked cupboard -->
		<rect x="6.5" y="4.5" width="19" height="23" rx="2" />
		<path d="M16 4.5v23" />
		<path d="M12.9 14.5v3M19.1 14.5v3" stroke-width="2" />
	{:else if id === 'boiler'}
		<!-- the stockpot — lid, handles, simmer -->
		<path d="M8 16h16v7.5a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" />
		<path d="M8 18.5H4.5M24 18.5h3.5" />
		<path d="M6.5 16h19" />
		<path d="M12.5 11.5c-1.4-1.6 1.4-2.7 0-4.4M19.5 11.5c-1.4-1.6 1.4-2.7 0-4.4" opacity="0.75" />
	{:else if id === 'watch'}
		<!-- the thermometer — one measured trace, not a generic radar target -->
		<path d="M10.5 17.5V7.25a3.5 3.5 0 0 1 7 0V17.5a6 6 0 1 1-7 0Z" />
		<path d="M14 9.5v11" />
		<circle cx="14" cy="22" r="2.25" fill={stroke} stroke="none" />
		<path d="M21 8.5h6M21 13h4M21 17.5h6" opacity="0.78" />
	{:else if id === 'tickets'}
		<!-- the ticket rail — an order slip on the rail -->
		<path d="M4 7h24" />
		<path d="M9 7v18.5l2.4-2 2.3 2 2.3-2 2.3 2 2.3-2 2.4 2V7" />
		<path d="M13 13h6M13 17.5h6" opacity="0.8" />
	{:else if id === 'clw'}
		<!-- the paring knife — small angled blade, most of it handle -->
		<path d="M12.75 15.5V4.5l6.5 6.75v4.25z" />
		<path d="M11.5 15.5h9" />
		<path d="M16 15.5V28.5" stroke-width="2.6" />
	{:else if id === 'cap'}
		<!-- the call copilot — a cue card floating over the conversation -->
		<path d="M5.5 6.5h21v14h-9l-5.5 5v-5H5.5z" />
		<path d="M10 11h12M10 15.5h8" opacity="0.82" />
	{:else if id === 'desk'}
		<!-- the supervision desk — editor pane, diff rail and approval -->
		<rect x="4.5" y="5.5" width="23" height="18" rx="2" />
		<path d="M4.5 10h23M10.5 10v13.5" opacity="0.78" />
		<path d="M14.5 14h7M14.5 18h4" />
		<path d="m20.5 19 2 2 4-5" />
		<path d="M12 27h8M16 23.5V27" />
	{:else if id === 'builder'}
		<!-- mise en place — everything in brackets, ready -->
		<path d="M11 6 L5 16l6 10" />
		<path d="M21 6l6 10-6 10" />
		<circle cx="16" cy="16" r="1.75" fill={stroke} stroke="none" />
	{:else}
		<!-- the menu — ∅ -->
		<circle cx="16" cy="16" r="10.5" />
		<line x1="7" y1="27" x2="25" y2="5" />
	{/if}
</svg>
