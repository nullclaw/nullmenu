<script>
	import { functionalIconMarkup } from './functional-icons.js';

	let { name, size = 18, label = '', class: className = '' } = $props();
</script>

{@html functionalIconMarkup(name, { size, label, className })}
