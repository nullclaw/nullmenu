import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { menuOrder, sites } from '../../src/lib/site/sites.js';

const menu = 'http://127.0.0.1:4173';
const productOrigins = Object.fromEntries(
	menuOrder.map((site, index) => [site, `http://127.0.0.1:${4174 + index}`])
);
const hub = productOrigins.hub;
const fullProductSites = menuOrder.filter((id) => !sites[id].comingSoon);
const releasedProductSites = fullProductSites.filter((id) => sites[id].version);

async function openStable(page, url, viewport) {
	await page.setViewportSize(viewport);
	await page.goto(url, { waitUntil: 'networkidle' });
	await page.evaluate(() => document.fonts.ready);
}

async function expandDetails(page) {
	await page.locator('details').evaluateAll((details) => {
		for (const detail of details) {
			if (detail instanceof HTMLDetailsElement) detail.open = true;
		}
	});
}

async function wcagViolations(page) {
	return (
		await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze()
	).violations;
}

async function overflowEvidence(page) {
	return page.evaluate(() => {
		const width = document.documentElement.clientWidth;
		return [...document.querySelectorAll('body *')]
			.map((element) => {
				const rect = element.getBoundingClientRect();
				return {
					tag: element.tagName.toLowerCase(),
					class: typeof element.className === 'string' ? element.className : '',
					left: Math.round(rect.left),
					right: Math.round(rect.right),
					scrollWidth: element.scrollWidth
				};
			})
			.filter((item) => item.left < -1 || item.right > width + 1)
			.slice(0, 12);
	});
}

test.describe('responsive visual contracts', () => {
	for (const target of [
		{ name: 'menu home at 320px', url: `${menu}/`, viewport: { width: 320, height: 844 } },
		{ name: 'product catalog at 320px', url: `${menu}/products/`, viewport: { width: 320, height: 844 } },
		{ name: 'menu docs at 320px', url: `${menu}/docs/`, viewport: { width: 320, height: 844 } },
		{
			name: 'Hub home at 320px',
			url: `${hub}/`,
			viewport: { width: 320, height: 844 },
			expand: true
		},
		{
			name: 'Hub home at 390px',
			url: `${hub}/`,
			viewport: { width: 390, height: 844 },
			expand: true
		},
		{ name: 'Hub docs at 390px', url: `${hub}/docs/`, viewport: { width: 390, height: 844 } }
	]) {
		test(`${target.name} never creates page-level horizontal scrolling`, async ({ page }) => {
			await openStable(page, target.url, target.viewport);
			if (target.expand) await expandDetails(page);
			const layout = await page.evaluate(() => ({
				clientWidth: document.documentElement.clientWidth,
				scrollWidth: document.documentElement.scrollWidth
			}));
			expect(layout.scrollWidth, JSON.stringify(await overflowEvidence(page), null, 2)).toBeLessThanOrEqual(
				layout.clientWidth + 1
			);
		});
	}

	for (const site of menuOrder.filter((id) => id !== 'hub')) {
		test(`${site} home reflows at 320px`, async ({ page }) => {
			await openStable(page, `${productOrigins[site]}/`, { width: 320, height: 844 });
			await expandDetails(page);
			const layout = await page.evaluate(() => ({
				clientWidth: document.documentElement.clientWidth,
				scrollWidth: document.documentElement.scrollWidth
			}));
			expect(layout.scrollWidth, JSON.stringify(await overflowEvidence(page), null, 2)).toBeLessThanOrEqual(
				layout.clientWidth + 1
			);
		});
	}

	for (const site of menuOrder) {
		test(`${site} primary action is fully visible in the first mobile viewport`, async ({ page }) => {
			await openStable(page, `${productOrigins[site]}/`, { width: 390, height: 844 });
			const primary = page.locator('.hero .cta a').first();
			await expect(primary).toBeVisible();
			const box = await primary.boundingBox();
			expect(box).not.toBeNull();
			expect(box.y + box.height).toBeLessThanOrEqual(820);
		});
	}
});

test.describe('editorial length contracts', () => {
	for (const site of fullProductSites) {
		test(`${site} keeps the complete product story within a deliberate reading length`, async ({
			page
		}) => {
			await openStable(page, `${productOrigins[site]}/`, { width: 390, height: 844 });
			const mobileHeight = await page.evaluate(() => document.documentElement.scrollHeight);
			expect(mobileHeight).toBeLessThanOrEqual(11_500);

			await openStable(page, `${productOrigins[site]}/`, { width: 1440, height: 900 });
			const desktopHeight = await page.evaluate(() => document.documentElement.scrollHeight);
			expect(desktopHeight).toBeLessThanOrEqual(9_500);
		});
	}

	for (const site of releasedProductSites) {
		test(`${site} puts the download task before the deep product ledger`, async ({ page }) => {
			await openStable(page, `${productOrigins[site]}/`, { width: 390, height: 844 });
			const downloadTop = await page
				.locator('#download')
				.evaluate((element) => /** @type {HTMLElement} */ (element).offsetTop);
			expect(downloadTop).toBeLessThanOrEqual(5_000);
		});
	}
});

test.describe('download interaction contracts', () => {
	test('choosing the raw Windows executable replaces ZIP-specific instructions', async ({ page }) => {
		await openStable(page, `${hub}/`, { width: 1280, height: 900 });
		await page.evaluate(() => {
			document.addEventListener(
				'click',
				(event) => {
					if (event.target instanceof Element && event.target.closest('#download a[download]')) {
						event.preventDefault();
					}
				},
				{ capture: true }
			);
		});

		const windowsX64 = page.locator('.binaries li').filter({ hasText: /Windows\s+x64/ }).first();
		await windowsX64.locator('.binary-download').click();
		await expect(page.locator('.run-step .hint')).toContainText(
			'Unzip nullhub-windows-x86_64.zip'
		);

		await windowsX64.getByRole('link', { name: 'raw .exe', exact: true }).click();
		await expect(page.locator('.run-step .hint')).toContainText(
			'.\\nullhub-windows-x86_64.exe --help'
		);
		await expect(page.locator('.after-download').getByRole('button')).toHaveText(
			'Copy download + verify'
		);
	});
});

test.describe('keyboard navigation contracts', () => {
	test('search replaces the mobile navigation layer and restores the burger', async ({ page }) => {
		await openStable(page, `${menu}/`, { width: 390, height: 844 });
		const trigger = page.getByRole('button', { name: /navigation/i });
		await trigger.click();
		await page.keyboard.press('Control+K');

		const dialog = page.getByRole('dialog', { name: /search/i });
		await expect(dialog).toBeVisible();
		await expect(page.locator('#mobile-navigation')).toBeHidden();
		await expect(dialog.getByRole('searchbox')).toBeFocused();

		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(trigger).toBeFocused();

		await trigger.click();
		await page.locator('#mobile-navigation').getByRole('button', { name: /search/i }).click();
		await expect(dialog).toBeVisible();
		await expect(page.locator('#mobile-navigation')).toBeHidden();
		await page.keyboard.press('Escape');
		await expect(trigger).toBeFocused();
	});

	test('global mobile menu closes with Escape and restores focus', async ({ page }) => {
		await openStable(page, `${menu}/`, { width: 390, height: 844 });
		const trigger = page.getByRole('button', { name: /navigation/i });
		await trigger.click();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await page.keyboard.press('Escape');
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect(trigger).toBeFocused();
	});

	test('suggested searches return focus to the input before results arrive', async ({ page }) => {
		await openStable(page, `${menu}/docs/`, { width: 1280, height: 900 });
		await page.getByRole('button', { name: /search docs/i }).first().click();
		const dialog = page.getByRole('dialog', { name: /search/i });
		const input = dialog.getByRole('searchbox');
		await dialog.getByRole('button', { name: 'install' }).click();
		await expect(input).toBeFocused();
		const firstResult = dialog.locator('[data-search-result]').first();
		await expect(firstResult).toBeVisible();
		await page.keyboard.press('ArrowDown');
		await expect(firstResult).toBeFocused();
	});

	test('docs mobile menu behaves as a bounded dialog and restores focus', async ({ page }) => {
		await openStable(page, `${menu}/docs/`, { width: 390, height: 844 });
		const trigger = page.getByRole('button', { name: /docs/i }).first();
		await trigger.click();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		const docsNavigation = page.getByRole('navigation', { name: 'Documentation' });
		await expect(docsNavigation).toBeVisible();
		expect((await docsNavigation.boundingBox()).height).toBeLessThanOrEqual(844);
		await page.keyboard.press('Escape');
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect(trigger).toBeFocused();

		await trigger.click();
		await page.keyboard.press('Control+K');
		const search = page.getByRole('dialog', { name: /search/i });
		await expect(search).toBeVisible();
		await expect(docsNavigation).toBeHidden();
		await page.keyboard.press('Escape');
		await expect(trigger).toBeFocused();
	});

	test('search isolates the page, restores focus and preserves native link activation', async ({ page }) => {
		await openStable(page, `${menu}/docs/`, { width: 1280, height: 900 });
		const trigger = page.getByRole('button', { name: /search docs/i }).first();
		await trigger.click();

		const dialog = page.getByRole('dialog', { name: /search/i });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('searchbox')).toBeFocused();
		expect(
			await page
				.locator('main')
				.evaluate(
					(element) =>
						/** @type {HTMLElement} */ (element).inert || element.getAttribute('aria-hidden') === 'true'
				)
		).toBe(true);

		await dialog.getByRole('searchbox').fill('install');
		const results = dialog.locator('a[href]');
		await expect(results.first()).toBeVisible();
		const target = results.nth(1);
		await target.focus();
		const href = await target.getAttribute('href');
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(new RegExp(`${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));

		await page.goBack({ waitUntil: 'networkidle' });
		await trigger.click();
		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(trigger).toBeFocused();
	});
});

test.describe('progressive enhancement and preference contracts', () => {
	test('server-rendered reveal content stays visible without JavaScript', async ({ browser }) => {
		const context = await browser.newContext({
			javaScriptEnabled: false,
			colorScheme: 'dark',
			viewport: { width: 1280, height: 900 }
		});
		const page = await context.newPage();
		try {
			await page.goto(`${menu}/`, { waitUntil: 'load' });
			await expect(
				page.getByRole('heading', { name: 'Install once, then add what you need.' })
			).toBeVisible();
			expect(await page.locator('.reveal, .sda').count()).toBe(0);
		} finally {
			await context.close();
		}
	});

	test('mobile navigation and documentation remain reachable without JavaScript', async ({ browser }) => {
		const context = await browser.newContext({
			javaScriptEnabled: false,
			colorScheme: 'dark',
			viewport: { width: 390, height: 844 }
		});
		const page = await context.newPage();
		try {
			await page.goto(`${menu}/`, { waitUntil: 'load' });
			const mainMenu = page.locator('.nojs-navigation');
			await expect(mainMenu.locator('summary')).toBeVisible();
			await mainMenu.locator('summary').click();
			await expect(mainMenu.getByRole('link', { name: 'The menu' })).toBeVisible();

			await page.goto(`${menu}/docs/start/install-nullhub/`, { waitUntil: 'load' });
			const docsMenu = page.locator('.nojs-docs-navigation');
			await expect(docsMenu.locator('summary')).toBeVisible();
			await docsMenu.locator('summary').click();
			await expect(docsMenu.getByRole('link', { name: 'Docs home' })).toBeVisible();
			await expect(docsMenu.getByRole('link', { name: 'Run your first agent' })).toBeVisible();
		} finally {
			await context.close();
		}
	});

	test('unknown routes provide a useful branded 404 without JavaScript', async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		try {
			const response = await page.goto(`${menu}/definitely-missing/`, { waitUntil: 'load' });
			expect(response.status()).toBe(404);
			await expect(page.getByRole('heading', { name: 'Page not found.' })).toBeVisible();
			await expect(page.getByRole('link', { name: 'Go to Null home' })).toBeVisible();
		} finally {
			await context.close();
		}
	});

	test('docs expose a compact TOC below 1200px with practical 44px targets', async ({ page }) => {
		await openStable(page, `${menu}/docs/start/install-nullhub/`, { width: 1000, height: 900 });

		const mobileToc = page.locator('.mobile-toc');
		await expect(mobileToc).toBeVisible();
		await expect(page.locator('aside.toc')).toBeHidden();
		const summary = mobileToc.locator('summary');
		expect((await summary.boundingBox()).height).toBeGreaterThanOrEqual(44);
		await summary.click();

		for (const selector of ['.mobile-toc a', '.meta-link', '.heading-anchor']) {
			const heights = await page.locator(selector).evaluateAll((elements) =>
				elements.map((element) => element.getBoundingClientRect().height)
			);
			expect(heights.length).toBeGreaterThan(0);
			expect(Math.min(...heights), selector).toBeGreaterThanOrEqual(43.5);
		}

		await openStable(page, `${menu}/docs/start/install-nullhub/`, { width: 1280, height: 900 });
		const sidebarHeights = await page.locator('.sidebar li a').evaluateAll((elements) =>
			elements.map((element) => element.getBoundingClientRect().height)
		);
		expect(sidebarHeights.length).toBeGreaterThan(0);
		expect(Math.min(...sidebarHeights)).toBeGreaterThanOrEqual(43.5);
	});

	test('theme cycles system to light to dark and shares the pinned mode across products', async ({ page }) => {
		await openStable(page, `${menu}/`, { width: 1280, height: 900 });
		const root = page.locator('html');
		const toggle = page.locator('.theme-toggle');

		await expect(root).toHaveAttribute('data-theme-mode', 'system');
		await expect(root).toHaveAttribute('data-theme', 'dark');
		await toggle.click();
		await expect(root).toHaveAttribute('data-theme-mode', 'light');
		await expect(root).toHaveAttribute('data-theme', 'light');

		await openStable(page, `${hub}/`, { width: 1280, height: 900 });
		await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'light');
		await page.locator('.theme-toggle').click();
		await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'dark');
		await page.locator('.theme-toggle').click();
		await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'system');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

		await openStable(page, `${menu}/`, { width: 1280, height: 900 });
		await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'system');
	});

	test('a malformed shared theme cookie falls back without blocking first paint', async ({
		context,
		page
	}) => {
		await context.addCookies([{ name: 'nullmenu-theme', value: '%', url: menu }]);
		await page.addInitScript(() => localStorage.setItem('nullmenu-theme', 'dark'));
		await page.goto(`${menu}/`, { waitUntil: 'domcontentloaded' });
		await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'dark');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('The menu keeps same-tab navigation in both menu and product headers', async ({ page }) => {
		await openStable(page, `${menu}/`, { width: 1280, height: 900 });
		await expect(page.locator('header').getByRole('link', { name: 'The menu' })).not.toHaveAttribute(
			'target',
			'_blank'
		);

		await openStable(page, `${hub}/`, { width: 1280, height: 900 });
		await expect(page.locator('header').getByRole('link', { name: 'The menu' })).not.toHaveAttribute(
			'target',
			'_blank'
		);
	});
});

test.describe('automated accessibility gate', () => {
	for (const target of [
		{ name: 'menu home', url: `${menu}/` },
		{ name: 'product catalog', url: `${menu}/products/` },
		{ name: 'menu documentation', url: `${menu}/docs/` },
		...menuOrder.map((site) => ({ name: `${site} home`, url: `${productOrigins[site]}/` }))
	]) {
		test(`${target.name} has no automated WCAG violations`, async ({ page }) => {
			await openStable(page, target.url, { width: 1280, height: 900 });
			if (target.name.endsWith(' home') && target.name !== 'menu home') {
				await expandDetails(page);
			}
			expect(await wcagViolations(page)).toEqual([]);
		});
	}

	test('light mobile menu has no automated WCAG violations', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
		await openStable(page, `${menu}/`, { width: 390, height: 844 });
		expect(await wcagViolations(page)).toEqual([]);
	});

	test('expanded mobile product content has no automated WCAG violations', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
		await openStable(page, `${hub}/`, { width: 390, height: 844 });
		await expandDetails(page);
		expect(await wcagViolations(page)).toEqual([]);
	});

	test('mobile navigation layer has no automated WCAG violations', async ({ page }) => {
		await openStable(page, `${menu}/`, { width: 390, height: 844 });
		await page.getByRole('button', { name: /navigation/i }).click();
		expect(await wcagViolations(page)).toEqual([]);
	});

	test('docs drawer has no automated WCAG violations', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
		await openStable(page, `${menu}/docs/`, { width: 390, height: 844 });
		await page.getByRole('button', { name: /docs/i }).first().click();
		expect(await wcagViolations(page)).toEqual([]);
	});

	test('mobile search dialog has no automated WCAG violations', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
		await openStable(page, `${menu}/docs/`, { width: 390, height: 844 });
		await page.keyboard.press('Control+K');
		const dialog = page.getByRole('dialog', { name: /search/i });
		await expect(dialog).toBeVisible();
		expect(await wcagViolations(page)).toEqual([]);
		await dialog.getByRole('searchbox').fill('install');
		await expect(dialog.locator('[data-search-result]').first()).toBeVisible();
		expect(await wcagViolations(page)).toEqual([]);
	});
});
