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
>
	{#if id === 'claw'}
		<!-- the chef — three claw strokes -->
		<path d="M9 6 C7 14 7 20 10 26" />
		<path d="M17 4.5 C15 13 15 20 18 27.5" />
		<path d="M25 6 C23 14 23 20 26 26" />
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
		<!-- the thermometer — concentric attention -->
		<circle cx="16" cy="16" r="11" />
		<circle cx="16" cy="16" r="6.5" opacity="0.7" />
		<circle cx="16" cy="16" r="1.75" fill={stroke} stroke="none" />
		<path d="M16 5v3.5" />
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
		<!-- the cloche — lid over the plate -->
		<path d="M6 21a10 10 0 0 1 20 0" />
		<path d="M4 21h24" />
		<path d="M16 8.5v2.5" />
	{:else if id === 'desk'}
		<!-- the service bell — ring for the front of house -->
		<path d="M8 20.5a8 8 0 0 1 16 0" />
		<path d="M16 9v3.5" />
		<circle cx="16" cy="7.25" r="1.6" fill={stroke} stroke="none" />
		<path d="M10 20.5h12" />
		<path d="M5 24.5h22" />
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
