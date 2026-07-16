import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// default site for dev/CI runs that don't set one
process.env.PUBLIC_SITE ||= 'menu';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: { allow: ['content'] }
	}
});
