import { expect, test } from '@playwright/test';

const menu = 'http://127.0.0.1:4173';
const hub = 'http://127.0.0.1:4174';

async function openStable(page, url, viewport) {
	await page.setViewportSize(viewport);
	await page.goto(url, { waitUntil: 'networkidle' });
	await page.evaluate(() => document.fonts.ready);
}

test('menu and Hub reflow without horizontal scrolling in mobile WebKit', async ({ page }) => {
	for (const url of [`${menu}/`, `${hub}/`]) {
		await openStable(page, url, { width: 390, height: 844 });
		await page.locator('details').evaluateAll((details) => {
			for (const detail of details) {
				if (detail instanceof HTMLDetailsElement) detail.open = true;
			}
		});
		const widths = await page.evaluate(() => ({
			client: document.documentElement.clientWidth,
			scroll: document.documentElement.scrollWidth
		}));
		expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
	}
});

test('mobile navigation hands focus to Search and restores its trigger in WebKit', async ({ page }) => {
	await openStable(page, `${menu}/`, { width: 390, height: 844 });
	const trigger = page.getByRole('button', { name: /navigation/i });
	await trigger.click();
	await page.keyboard.press('Control+K');
	const dialog = page.getByRole('dialog', { name: /search/i });
	await expect(dialog).toBeVisible();
	await expect(page.locator('#mobile-navigation')).toBeHidden();
	await expect(dialog.getByRole('searchbox')).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(trigger).toBeFocused();

	await trigger.click();
	await page.locator('#mobile-navigation').getByRole('button', { name: /search/i }).click();
	await expect(dialog).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(trigger).toBeFocused();
});

test('docs drawer remains bounded and keyboard-dismissable in WebKit', async ({ page }) => {
	await openStable(page, `${menu}/docs/`, { width: 390, height: 844 });
	const trigger = page.getByRole('button', { name: /docs/i }).first();
	await trigger.click();
	const navigation = page.getByRole('navigation', { name: 'Documentation' });
	await expect(navigation).toBeVisible();
	expect((await navigation.boundingBox()).height).toBeLessThanOrEqual(844);
	await page.keyboard.press('Escape');
	await expect(trigger).toBeFocused();
});

test('suggested search keeps a usable keyboard path to results in WebKit', async ({ page }) => {
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

test('alternate Windows asset updates its post-download instructions in WebKit', async ({ page }) => {
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
	const row = page.locator('.binaries li').filter({ hasText: /Windows\s+x64/ }).first();
	await row.locator('.binary-download').click();
	await row.getByRole('link', { name: 'raw .exe', exact: true }).click();
	await expect(page.locator('.run-step .hint')).toContainText(
		'.\\nullhub-windows-x86_64.exe --help'
	);
});
