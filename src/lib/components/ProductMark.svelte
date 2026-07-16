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
		<!-- the sous-chef — plate with spokes: every station in reach -->
		<circle cx="16" cy="16" r="11" />
		<circle cx="16" cy="16" r="2" fill={stroke} stroke="none" />
		<path d="M16 5v5M16 22v5M5 16h5M22 16h5M8.2 8.2l3.6 3.6M20.2 20.2l3.6 3.6M23.8 8.2l-3.6 3.6M11.8 20.2l-3.6 3.6" opacity="0.8" />
	{:else if id === 'pantry'}
		<!-- the larder — shelves, stocked -->
		<path d="M5 9.5h22M5 16.5h22M5 23.5h22" />
		<path d="M9 9.5v-4M13 16.5v-4M21 16.5v-4M17 23.5v-4M25 23.5v-4M9 23.5v-4" opacity="0.8" />
	{:else if id === 'boiler'}
		<!-- the stockpot — pot with rising steam -->
		<path d="M7 17h18l-1.5 9.5h-15z" />
		<path d="M5.5 17h21" />
		<path d="M12 12.5c-1.8-2 1.8-3.4 0-5.5M20 12.5c-1.8-2 1.8-3.4 0-5.5" opacity="0.8" />
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
		<!-- the paring knife — one small, sharp stroke -->
		<path d="M17 4.5 C15 13 15 20 18 27.5" />
		<circle cx="9.5" cy="16" r="1.5" fill={stroke} stroke="none" />
	{:else if id === 'cap'}
		<!-- the cloche — lid over the plate -->
		<path d="M6 21a10 10 0 0 1 20 0" />
		<path d="M4 21h24" />
		<path d="M16 8.5v2.5" />
	{:else if id === 'desk'}
		<!-- the pass — plate inspected, approved -->
		<path d="M4 22h24" />
		<path d="M10 22a6 6 0 0 1 12 0" opacity="0.8" />
		<path d="M13.5 13l2 2 4-4.5" />
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
