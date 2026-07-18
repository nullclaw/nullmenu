import adapter from '@sveltejs/adapter-static';
import { fileURLToPath } from 'node:url';

const site = process.env.PUBLIC_SITE || 'menu';
const home = fileURLToPath(
	new URL(
		site === 'menu' ? './src/lib/home/MenuHome.svelte' : './src/lib/home/ProductHome.svelte',
		import.meta.url
	)
);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// PUBLIC_SITE is fixed for each static build. Resolving the homepage here
		// keeps the other, sizeable homepage implementation out of the module graph.
		alias: {
			'$site-home': home
		},
		adapter: adapter({
			pages: `build/${site}`,
			assets: `build/${site}`,
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		prerender: {
			handleHttpError: 'fail',
			handleMissingId: 'warn'
		}
	}
};

export default config;
