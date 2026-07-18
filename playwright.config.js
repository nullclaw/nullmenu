import { defineConfig } from '@playwright/test';
import { menuOrder } from './src/lib/site/sites.js';

const family = ['menu', ...menuOrder];
const firstPort = 4173;

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'line',
	use: {
		colorScheme: 'dark',
		reducedMotion: 'reduce',
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			testMatch: /experience-contracts\.spec\.js/,
			use: { browserName: 'chromium' }
		},
		{
			name: 'webkit-core',
			testMatch: /webkit-core\.spec\.js/,
			use: { browserName: 'webkit' }
		}
	],
	webServer: family.map((site, index) => {
		const port = firstPort + index;
		return {
			command: `node scripts/serve-build.js ${site} ${port}`,
			url: `http://127.0.0.1:${port}/`,
			reuseExistingServer: false
		};
	})
});
