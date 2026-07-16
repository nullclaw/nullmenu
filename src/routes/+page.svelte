<script>
	import { site } from '$lib/site';
	import MenuHome from '$lib/home/MenuHome.svelte';
	import ProductHome from '$lib/home/ProductHome.svelte';

	let { data } = $props();
</script>

{#if data.kind === 'menu'}
	<MenuHome {data} />
{:else}
	<ProductHome {data} />
{/if}
