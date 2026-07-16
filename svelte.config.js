import adapter from '@sveltejs/adapter-static';

const site = process.env.PUBLIC_SITE || 'menu';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
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
