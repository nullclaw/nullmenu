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

async function installFakeWebGPU(
	page,
	{ delayedFirstDevice = false, nullContext = false, disabled = false } = {}
) {
	await page.addInitScript(
		({ delayedFirstDevice, nullContext, disabled }) => {
			const state = (window.__inkTest = {
				requestDeviceCalls: 0,
				configureCalls: [],
				unconfigureCalls: 0,
				configuredDevice: null,
				destroyedDevices: [],
				framesByDevice: {},
				flowStrokes: 0,
				releaseFirstDevice() {}
			});

			const nativeStroke = CanvasRenderingContext2D.prototype.stroke;
			CanvasRenderingContext2D.prototype.stroke = function (...args) {
				state.flowStrokes++;
				return nativeStroke.apply(this, args);
			};

			if (disabled) {
				Object.defineProperty(navigator, 'gpu', { configurable: true, value: undefined });
				return;
			}

			if (!globalThis.GPUBufferUsage) {
				Object.defineProperty(globalThis, 'GPUBufferUsage', {
					configurable: true,
					value: { UNIFORM: 1, COPY_DST: 2 }
				});
			}
			if (!globalThis.GPUTextureUsage) {
				Object.defineProperty(globalThis, 'GPUTextureUsage', {
					configurable: true,
					value: { TEXTURE_BINDING: 1, STORAGE_BINDING: 2, COPY_DST: 4, COPY_SRC: 8 }
				});
			}

			const fakePass = () => ({
				setPipeline() {},
				setBindGroup() {},
				dispatchWorkgroups() {},
				draw() {},
				end() {}
			});
			const fakePipeline = () => ({ getBindGroupLayout: () => ({}) });
			const makeDevice = (id) => ({
				__id: id,
				lost: new Promise(() => {}),
				queue: { writeBuffer() {}, submit() {} },
				addEventListener() {},
				removeEventListener() {},
				createShaderModule: () => ({}),
				createComputePipeline: fakePipeline,
				createRenderPipeline: fakePipeline,
				createSampler: () => ({}),
				createBuffer: () => ({ destroy() {} }),
				createTexture: () => ({ createView: () => ({}), destroy() {} }),
				createBindGroup: () => ({}),
				createCommandEncoder() {
					state.framesByDevice[id] = (state.framesByDevice[id] ?? 0) + 1;
					return {
						beginComputePass: fakePass,
						beginRenderPass: fakePass,
						finish: () => ({})
					};
				},
				destroy() {
					state.destroyedDevices.push(id);
				}
			});

			const context = {
				configure({ device }) {
					state.configureCalls.push(device.__id);
					state.configuredDevice = device.__id;
				},
				unconfigure() {
					state.unconfigureCalls++;
					state.configuredDevice = null;
				},
				getCurrentTexture() {
					if (state.configuredDevice === null) {
						throw new DOMException('context is not configured', 'InvalidStateError');
					}
					return { createView: () => ({}) };
				}
			};

			const nativeGetContext = HTMLCanvasElement.prototype.getContext;
			HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
				if (kind === 'webgpu') return nullContext ? null : context;
				return nativeGetContext.call(this, kind, ...args);
			};

			Object.defineProperty(navigator, 'gpu', {
				configurable: true,
				value: {
					getPreferredCanvasFormat: () => 'bgra8unorm',
					async requestAdapter() {
						return {
							requestDevice() {
								const id = ++state.requestDeviceCalls;
								const device = makeDevice(id);
								if (delayedFirstDevice && id === 1) {
									return new Promise((resolve) => {
										state.releaseFirstDevice = () => resolve(device);
									});
								}
								return Promise.resolve(device);
							}
						};
					}
				}
			});
		},
		{ delayedFirstDevice, nullContext, disabled }
	);
}

async function waitForAnimationFrames(page, count = 4) {
	await page.evaluate(
		(frameCount) =>
			new Promise((resolve) => {
				let remaining = frameCount;
				const next = () => {
					remaining--;
					if (remaining === 0) resolve();
					else requestAnimationFrame(next);
				};
				requestAnimationFrame(next);
			}),
		count
	);
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
			const mobileViewport = { width: 390, height: 844 };
			await openStable(page, `${productOrigins[site]}/`, mobileViewport);
			const mobileHeight = await page.evaluate(() => document.documentElement.scrollHeight);
			// Express the budget as complete viewports: cumulative Linux and macOS
			// font metrics differ slightly across a page this long.
			expect(mobileHeight / mobileViewport.height).toBeLessThanOrEqual(14);

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
		await expect(dialog.getByRole('combobox')).toBeFocused();

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
		const trigger = page.locator('.burger');
		await trigger.click();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		const dialog = page.getByRole('dialog', { name: 'Navigation' });
		await expect(dialog.getByRole('button', { name: 'Close navigation' })).toBeFocused();
		await dialog.getByRole('button', { name: 'Close navigation' }).click();
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect(trigger).toBeFocused();
		await trigger.click();
		await page.keyboard.press('Escape');
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect(trigger).toBeFocused();
	});

	test('suggested searches return focus to the input before results arrive', async ({ page }) => {
		await openStable(page, `${menu}/docs/`, { width: 1280, height: 900 });
		await page.getByRole('button', { name: /search docs/i }).first().click();
		const dialog = page.getByRole('dialog', { name: /search/i });
		const input = dialog.getByRole('combobox');
		await dialog.getByRole('button', { name: 'install' }).click();
		await expect(input).toBeFocused();
		const firstResult = dialog.locator('[data-search-result]').first();
		await expect(firstResult).toBeVisible();
		await page.keyboard.press('ArrowDown');
		await expect(input).toBeFocused();
		await expect(input).toHaveAttribute('aria-activedescendant', 'search-result-0');
		await expect(firstResult).toHaveAttribute('aria-selected', 'true');
	});

	test('docs mobile menu behaves as a bounded dialog and restores focus', async ({ page }) => {
		await openStable(page, `${menu}/docs/`, { width: 390, height: 844 });
		const trigger = page.locator('.nav-toggle');
		await trigger.click();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		const docsNavigation = page.getByRole('dialog', { name: 'Documentation', exact: true });
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
		await expect(dialog.getByRole('combobox')).toBeFocused();
		expect(
			await page
				.locator('main')
				.evaluate(
					(element) =>
						/** @type {HTMLElement} */ (element).inert || element.getAttribute('aria-hidden') === 'true'
				)
		).toBe(true);

		await dialog.getByRole('combobox').fill('install');
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
			const targets = await page.locator(selector).evaluateAll((elements) =>
				elements.map((element) => {
					const { width, height } = element.getBoundingClientRect();
					return { width, height };
				})
			);
			expect(targets.length).toBeGreaterThan(0);
			expect(Math.min(...targets.map(({ width }) => width)), `${selector} width`).toBeGreaterThanOrEqual(
				43.5
			);
			expect(
				Math.min(...targets.map(({ height }) => height)),
				`${selector} height`
			).toBeGreaterThanOrEqual(43.5);
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

test.describe('WebGPU lifecycle contracts', () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
	});

	test('a stale delayed boot cannot unconfigure the active themed instance', async ({ page }) => {
		await installFakeWebGPU(page, { delayedFirstDevice: true });
		await page.goto(`${menu}/`, { waitUntil: 'networkidle' });
		await page.waitForFunction(() => window.__inkTest?.requestDeviceCalls === 1);

		await page.locator('.theme-toggle').click();
		await page.waitForFunction(
			() =>
				window.__inkTest?.requestDeviceCalls === 2 &&
				window.__inkTest?.configuredDevice === 2
		);
		await page.evaluate(() => window.__inkTest.releaseFirstDevice());
		await page.waitForFunction(() => window.__inkTest?.destroyedDevices.includes(1));

		const state = await page.evaluate(() => ({
			configureCalls: window.__inkTest.configureCalls,
			unconfigureCalls: window.__inkTest.unconfigureCalls,
			configuredDevice: window.__inkTest.configuredDevice,
			destroyedDevices: window.__inkTest.destroyedDevices
		}));
		expect(state).toEqual({
			configureCalls: [2],
			unconfigureCalls: 0,
			configuredDevice: 2,
			destroyedDevices: [1]
		});
	});

	test('a missing WebGPU canvas context destroys the partially initialized device', async ({
		page
	}) => {
		await installFakeWebGPU(page, { nullContext: true });
		await page.goto(`${menu}/`, { waitUntil: 'networkidle' });
		await page.waitForFunction(() => window.__inkTest?.destroyedDevices.includes(1));

		const state = await page.evaluate(() => ({
			requestDeviceCalls: window.__inkTest.requestDeviceCalls,
			configureCalls: window.__inkTest.configureCalls,
			destroyedDevices: window.__inkTest.destroyedDevices
		}));
		expect(state).toEqual({ requestDeviceCalls: 1, configureCalls: [], destroyedDevices: [1] });
	});

	test('enabling reduced motion stops an active Ink GPU loop', async ({ page }) => {
		await installFakeWebGPU(page);
		await page.goto(`${menu}/`, { waitUntil: 'networkidle' });
		await page.waitForFunction(() => (window.__inkTest?.framesByDevice[1] ?? 0) >= 3);

		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.waitForFunction(() => window.__inkTest?.destroyedDevices.includes(1));
		const stoppedAt = await page.evaluate(() => window.__inkTest.framesByDevice[1]);
		await waitForAnimationFrames(page);
		expect(await page.evaluate(() => window.__inkTest.framesByDevice[1])).toBe(stoppedAt);
	});

	test('enabling reduced motion stops the live FlowField fallback', async ({ page }) => {
		await installFakeWebGPU(page, { disabled: true });
		await page.goto(`${menu}/`, { waitUntil: 'networkidle' });
		await page.waitForFunction(() => (window.__inkTest?.flowStrokes ?? 0) >= 400);
		const animatedAt = await page.evaluate(() => window.__inkTest.flowStrokes);

		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.waitForFunction(
			(previous) => window.__inkTest?.flowStrokes > previous,
			animatedAt
		);
		await waitForAnimationFrames(page, 2);
		const stoppedAt = await page.evaluate(() => window.__inkTest.flowStrokes);
		await waitForAnimationFrames(page);
		expect(await page.evaluate(() => window.__inkTest.flowStrokes)).toBe(stoppedAt);
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
		await dialog.getByRole('combobox').fill('install');
		await expect(dialog.locator('[data-search-result]').first()).toBeVisible();
		expect(await wcagViolations(page)).toEqual([]);
	});
});

test.describe('premium interaction accessibility contracts', () => {
	test('iPadOS desktop-class user agents never receive macOS binaries', async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperties(Navigator.prototype, {
				platform: { configurable: true, get: () => 'MacIntel' },
				maxTouchPoints: { configurable: true, get: () => 5 },
				userAgent: {
					configurable: true,
					get: () =>
						'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'
				}
			});
		});

		await openStable(page, `${hub}/`, { width: 1024, height: 768 });
		await expect(page.locator('#download .chooser')).toHaveCount(0);
		await expect(page.getByText(/Detected · mac/i)).toHaveCount(0);
		await expect(page.getByText('Detected · iPadOS')).toBeVisible();
		await expect(page.getByText(/native iPadOS build is not published/i)).toBeVisible();
	});

	test('a download choice exposes current state, a named region, and a polite update', async ({
		page
	}) => {
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

		const choice = page.locator('#download .choice').first();
		await choice.click();
		await expect(choice).toHaveAttribute('aria-current', 'true');
		await expect(page.getByRole('region', { name: 'Download instructions' })).toBeVisible();
		await expect(page.locator('#download .sr-only[role="status"]')).toContainText(
			/selected.*instructions are ready/i
		);
	});

	test('clipboard failures stay visible and support retry in downloads and Markdown', async ({
		page
	}) => {
		await openStable(page, `${hub}/`, { width: 1280, height: 900 });
		await page.evaluate(() => {
			Object.defineProperty(navigator, 'clipboard', {
				configurable: true,
				value: { writeText: () => Promise.reject(new Error('clipboard blocked')) }
			});
		});

		const downloadCopy = page.locator('#download .binaries .copy').first();
		await downloadCopy.click();
		await expect(downloadCopy).toContainText(/copy failed · retry/i);
		await expect(downloadCopy).toHaveAttribute('aria-label', /Copy failed\. Retry/i);

		await openStable(page, `${menu}/docs/start/install-nullhub/`, { width: 1280, height: 900 });
		await page.evaluate(() => {
			Object.defineProperty(navigator, 'clipboard', {
				configurable: true,
				value: { writeText: () => Promise.reject(new Error('clipboard blocked')) }
			});
		});
		const markdownCopy = page.locator('.code-copy').first();
		await markdownCopy.click();
		await expect(markdownCopy).toHaveText('copy failed · retry');
		await expect(markdownCopy).toHaveClass(/copy-error/);
		const pageMarkdownCopy = page.locator('.meta button.meta-link');
		await pageMarkdownCopy.click();
		await expect(pageMarkdownCopy).toHaveText('copy failed · retry');
		await expect(pageMarkdownCopy).toHaveClass(/copy-error/);
		await expect(pageMarkdownCopy).toHaveAttribute('aria-label', /Copy failed\. Retry/i);

		await page.evaluate(() => {
			navigator.clipboard.writeText = () => Promise.resolve();
		});
		await markdownCopy.click();
		await expect(markdownCopy).toHaveText('copied');
		await expect(markdownCopy).not.toHaveClass(/copy-error/);
		await pageMarkdownCopy.click();
		await expect(pageMarkdownCopy).toContainText('copied');
		await expect(pageMarkdownCopy).not.toHaveClass(/copy-error/);
	});

	test('unknown compound searches recover cleanly and results have no implicit selection', async ({
		page
	}) => {
		await openStable(page, `${menu}/docs/`, { width: 1280, height: 900 });
		await page.getByRole('button', { name: /search docs/i }).first().click();
		const dialog = page.getByRole('dialog', { name: /search/i });
		const input = dialog.getByRole('combobox');

		await input.fill('definitely-no-such-setting');
		await expect(dialog.getByText('Nothing matched “definitely-no-such-setting”.')).toBeVisible();
		await expect(dialog.locator('[data-search-result]')).toHaveCount(0);
		await expect(dialog.getByRole('button', { name: 'Clear search' })).toBeVisible();
		await expect(dialog.getByRole('link', { name: 'Browse docs' })).toBeVisible();

		await input.fill('install');
		const firstResult = dialog.locator('[data-search-result]').first();
		await expect(firstResult).toBeVisible();
		await expect(dialog.locator('[data-search-result].selected')).toHaveCount(0);
		await expect(input).toBeFocused();
		const beforeEnter = page.url();
		await page.keyboard.press('Enter');
		expect(page.url()).toBe(beforeEnter);
		await expect(dialog).toBeVisible();
		await page.keyboard.press('ArrowDown');
		await expect(input).toBeFocused();
		await expect(input).toHaveAttribute('aria-activedescendant', 'search-result-0');
		await expect(firstResult).toHaveAttribute('aria-selected', 'true');

		await input.fill('configuring nullhub');
		await expect(dialog.getByRole('option', { name: /Configuration and environment/i })).toBeVisible();
		await input.fill('macOS arm64');
		await expect(dialog.getByRole('option', { name: /Compatibility matrix/i })).toBeVisible();
	});

	test('a failed search index offers human recovery and performs a fresh retry', async ({ page }) => {
		let attempts = 0;
		await page.route('**/pagefind/pagefind.js*', async (route) => {
			attempts += 1;
			await route.abort();
		});
		await openStable(page, `${menu}/docs/`, { width: 1280, height: 900 });
		await page.getByRole('button', { name: /search docs/i }).first().click();
		const dialog = page.getByRole('dialog', { name: /search/i });
		await dialog.getByRole('combobox').fill('install');
		await expect(dialog.getByText('Search is taking a pause.')).toBeVisible();
		await expect(dialog.getByRole('link', { name: 'Browse docs' })).toBeVisible();

		await dialog.getByRole('button', { name: 'Retry search' }).click();
		await expect.poll(() => attempts).toBeGreaterThan(1);
		await expect(dialog.getByRole('combobox')).toBeFocused();
	});

	test('Pagefind remains available when Web Workers are unavailable', async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(window, 'Worker', { configurable: true, value: undefined });
		});
		await openStable(page, `${menu}/docs/`, { width: 1280, height: 900 });
		await page.getByRole('button', { name: /search docs/i }).first().click();
		const dialog = page.getByRole('dialog', { name: /search/i });
		await dialog.getByRole('combobox').fill('install');
		await expect(
			dialog.locator('[data-search-result]').filter({ hasText: /^Install NullHub/ }).first()
		).toBeVisible();
	});

	test('global and docs drawers isolate their page shell and trap focus inside the panel', async ({
		page
	}) => {
		await openStable(page, `${menu}/`, { width: 390, height: 844 });
		const menuTrigger = page.getByRole('button', { name: /navigation/i });
		await menuTrigger.click();
		const menuDialog = page.getByRole('dialog', { name: 'Navigation' });
		await expect(menuDialog).toHaveAttribute('aria-modal', 'true');
		expect(
			await page
				.locator('header .inner')
				.evaluate((element) => /** @type {HTMLElement} */ (element).inert)
		).toBe(true);
		expect(
			await page
				.locator('main')
				.evaluate((element) => /** @type {HTMLElement} */ (element).inert)
		).toBe(true);
		const menuControls = menuDialog.locator('a, button');
		await expect(menuControls.first()).toBeFocused();
		await page.keyboard.press('Shift+Tab');
		await expect(menuControls.last()).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(menuTrigger).toBeFocused();

		await openStable(page, `${menu}/docs/`, { width: 390, height: 844 });
		const docsTrigger = page.getByRole('button', { name: /docs/i }).first();
		await docsTrigger.click();
		const docsDialog = page.getByRole('dialog', { name: 'Documentation', exact: true });
		await expect(docsDialog).toHaveAttribute('aria-modal', 'true');
		expect(
			await page
				.locator('.brand')
				.evaluate(
					(element) => /** @type {HTMLElement} */ (element.closest('header')).inert
				)
		).toBe(true);
		expect(
			await page
				.locator('.content')
				.evaluate((element) => /** @type {HTMLElement} */ (element).inert)
		).toBe(true);
		const docsControls = docsDialog.locator('a, button');
		await expect(docsControls.first()).toBeFocused();
		await page.keyboard.press('Shift+Tab');
		await expect(docsControls.last()).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(docsTrigger).toBeFocused();
	});

	test('wide documentation tables form a named keyboard-scrollable region', async ({ page }) => {
		await openStable(page, `${hub}/docs/reference/manifests/`, { width: 320, height: 844 });
		const tableRegion = page.getByRole('region', {
			name: /Data table: Field, Type, Required/
		}).first();
		await expect(tableRegion).toHaveAttribute('tabindex', '0');
		const dimensions = await tableRegion.evaluate((element) => ({
			clientWidth: element.clientWidth,
			scrollWidth: element.scrollWidth
		}));
		expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);

		await tableRegion.focus();
		await page.keyboard.press('ArrowRight');
		await expect.poll(() => tableRegion.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
	});

	test('primary download controls meet a 44px coarse-pointer target', async ({ page }) => {
		await openStable(page, `${hub}/`, { width: 390, height: 844 });
		const targets = await page
			.locator(
				'#download .trust-guide > a, #download .menu-head a, #download .binary-download, #download .binaries .copy, #download .asset-meta a'
			)
			.evaluateAll((elements) =>
				elements.map((element) => {
					const { width, height } = element.getBoundingClientRect();
					return { width, height, text: element.textContent?.trim() };
				})
			);
		expect(targets.length).toBeGreaterThan(4);
		for (const target of targets) {
			expect(target.width, target.text).toBeGreaterThanOrEqual(43.5);
			expect(target.height, target.text).toBeGreaterThanOrEqual(43.5);
		}
	});
});

test.describe('premium visual regression contracts', () => {
	for (const target of [
		{ name: 'menu', url: `${menu}/` },
		...menuOrder.map((id) => ({ name: id, url: `${productOrigins[id]}/` }))
	]) {
		test(`${target.name} hero preserves the editorial space across split spans`, async ({ page }) => {
			await openStable(page, target.url, { width: 1280, height: 900 });
			const intro = page.locator('.hero .sub').first();
			const copy = await intro.evaluate((element) => {
				const normalise = (value) => value.replace(/\s+/g, ' ').trim();
				const lead = normalise(element.querySelector('.hero-lead')?.textContent ?? '');
				const tail = normalise(element.querySelector('.hero-tail')?.textContent ?? '');
				return {
					actual: normalise(element.textContent ?? ''),
					expected: [lead, tail].filter(Boolean).join(' '),
					hasTail: Boolean(tail)
				};
			});
			expect(copy.hasTail).toBe(true);
			expect(copy.actual).toBe(copy.expected);
		});
	}

	test('390px product actions use one primary row and two balanced secondary columns', async ({
		page
	}) => {
		await openStable(page, `${hub}/`, { width: 390, height: 844 });
		const geometry = await page.locator('.hero .cta').evaluate((element) => {
			const bounds = element.getBoundingClientRect();
			const buttons = [...element.querySelectorAll('a')].map((button) => {
				const rect = button.getBoundingClientRect();
				return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
			});
			return { width: bounds.width, buttons };
		});

		expect(geometry.buttons).toHaveLength(3);
		expect(Math.abs(geometry.buttons[0].width - geometry.width)).toBeLessThanOrEqual(1);
		expect(geometry.buttons[1].y).toBeCloseTo(geometry.buttons[2].y, 0);
		expect(geometry.buttons[1].y).toBeGreaterThan(geometry.buttons[0].y + geometry.buttons[0].height);
		expect(Math.abs(geometry.buttons[1].width - geometry.buttons[2].width)).toBeLessThanOrEqual(1);
	});

	test('overflowing install tabs advertise and reveal their horizontal continuation', async ({ page }) => {
		await openStable(page, `${hub}/`, { width: 390, height: 844 });
		const shell = page.locator('.tabs-shell');
		const tabs = shell.locator('.tabs');
		await expect(shell).toHaveClass(/has-overflow/);
		const before = await tabs.evaluate((element) => ({
			clientWidth: element.clientWidth,
			scrollWidth: element.scrollWidth,
			fade: getComputedStyle(element.parentElement, '::after').opacity
		}));
		expect(before.scrollWidth).toBeGreaterThan(before.clientWidth);
		expect(Number(before.fade)).toBeGreaterThan(0.9);

		await shell.locator('.tab').last().click();
		await expect(shell).toHaveClass(/at-end/);
		await expect(shell.locator('.tab').last()).toHaveAttribute('aria-pressed', 'true');
		await expect
			.poll(async () =>
				Number(await shell.evaluate((element) => getComputedStyle(element, '::after').opacity))
			)
			.toBeLessThan(0.1);
	});

	test('visible brand marks never render below the 24px optical standard', async ({ page }) => {
		await openStable(page, `${menu}/`, { width: 1280, height: 900 });
		const marks = await page.locator('header .brand > svg, footer .bottom .mark > svg').evaluateAll(
			(elements) =>
				elements.map((element) => {
					const rect = element.getBoundingClientRect();
					return {
						width: rect.width,
						height: rect.height,
						widthAttribute: element.getAttribute('width'),
						heightAttribute: element.getAttribute('height')
					};
				})
		);
		expect(marks).toHaveLength(2);
		for (const mark of marks) {
			expect(mark.width).toBeGreaterThanOrEqual(24);
			expect(mark.height).toBeGreaterThanOrEqual(24);
			expect(mark.widthAttribute).toBe('24');
			expect(mark.heightAttribute).toBe('24');
		}
	});

	test('all ten product marks stay distinct at 16, 24 and 30px without clipping', async ({
		page
	}) => {
		await openStable(page, `${menu}/products/`, { width: 1280, height: 900 });
		const markLocator = page.locator('.row svg[data-product-mark]');
		for (const size of [16, 24, 30]) {
			const marks = await markLocator.evaluateAll(async (elements, renderedSize) =>
				Promise.all(
					elements.map(async (element) => {
						element.setAttribute('width', String(renderedSize));
						element.setAttribute('height', String(renderedSize));
						const rect = element.getBoundingClientRect();
						const box = /** @type {SVGGraphicsElement} */ (element).getBBox();
						const clone = /** @type {SVGElement} */ (element.cloneNode(true));
						clone.setAttribute('style', 'color:#111');
						clone.setAttribute('stroke', '#111');
						const source = new XMLSerializer().serializeToString(clone);
						const image = new Image();
						image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
						await image.decode();
						const canvas = document.createElement('canvas');
						canvas.width = renderedSize;
						canvas.height = renderedSize;
						const context = canvas.getContext('2d', { willReadFrequently: true });
						context.drawImage(image, 0, 0, renderedSize, renderedSize);
						const pixels = context.getImageData(0, 0, renderedSize, renderedSize).data;
						let visiblePixels = 0;
						let silhouetteHash = 2166136261;
						for (let index = 3; index < pixels.length; index += 4) {
							const visible = pixels[index] > 24 ? 1 : 0;
							visiblePixels += visible;
							silhouetteHash = Math.imul(silhouetteHash ^ visible, 16777619) >>> 0;
						}
						return {
							id: element.getAttribute('data-product-mark'),
							width: element.getAttribute('width'),
							height: element.getAttribute('height'),
							viewBox: element.getAttribute('viewBox'),
							strokeWidth: element.getAttribute('stroke-width'),
							ariaHidden: element.getAttribute('aria-hidden'),
							focusable: element.getAttribute('focusable'),
							rendered: { width: rect.width, height: rect.height },
							box: { x: box.x, y: box.y, width: box.width, height: box.height },
							visiblePixels,
							silhouetteHash
						};
					})
				),
				size
			);
			expect(marks.map(({ id }) => id)).toEqual(menuOrder);
			expect(new Set(marks.map(({ silhouetteHash }) => silhouetteHash)).size).toBe(menuOrder.length);
			for (const mark of marks) {
				expect(mark.width, mark.id).toBe(String(size));
				expect(mark.height, mark.id).toBe(String(size));
				expect(mark.rendered.width, mark.id).toBeCloseTo(size, 0);
				expect(mark.rendered.height, mark.id).toBeCloseTo(size, 0);
				expect(mark.viewBox).toBe('0 0 32 32');
				expect(mark.strokeWidth).toBe('1.75');
				expect(mark.ariaHidden).toBe('true');
				expect(mark.focusable).toBe('false');
				expect(mark.box.x, mark.id).toBeGreaterThanOrEqual(2);
				expect(mark.box.y, mark.id).toBeGreaterThanOrEqual(2);
				expect(mark.box.x + mark.box.width, mark.id).toBeLessThanOrEqual(30);
				expect(mark.box.y + mark.box.height, mark.id).toBeLessThanOrEqual(30);
				expect(mark.visiblePixels, `${mark.id} at ${size}px`).toBeGreaterThan(size);
				expect(mark.visiblePixels, `${mark.id} at ${size}px`).toBeLessThan(size * size * 0.65);
			}
		}
	});

	test('full-page and print modes keep editorial content readable', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await openStable(page, `${hub}/`, { width: 1280, height: 900 });
		const screenReveal = await page.locator('.reveal, .sda').evaluateAll((elements) =>
			elements.map((element) => Number(getComputedStyle(element).opacity))
		);
		expect(screenReveal.length).toBeGreaterThan(10);
		expect(Math.min(...screenReveal)).toBeGreaterThanOrEqual(0.99);

		await page.emulateMedia({ media: 'print', reducedMotion: 'no-preference' });
		const printState = await page.evaluate(() => ({
			header: getComputedStyle(document.querySelector('header')).display,
			grain: getComputedStyle(document.querySelector('.grain')).display,
			canvas: getComputedStyle(document.querySelector('canvas')).display,
			mainPadding: getComputedStyle(document.querySelector('main')).paddingTop,
			reveals: [...document.querySelectorAll('.reveal, .sda')].map((element) => ({
				opacity: getComputedStyle(element).opacity,
				transform: getComputedStyle(element).transform,
				filter: getComputedStyle(element).filter
			}))
		}));
		expect(printState.header).toBe('none');
		expect(printState.grain).toBe('none');
		expect(printState.canvas).toBe('none');
		expect(printState.mainPadding).toBe('0px');
		expect(printState.reveals.every(({ opacity }) => opacity === '1')).toBe(true);
		expect(printState.reveals.every(({ transform }) => transform === 'none')).toBe(true);
		expect(printState.reveals.every(({ filter }) => filter === 'none')).toBe(true);
	});

	test('no-JavaScript visitors inherit the operating-system light palette', async ({ browser }) => {
		const context = await browser.newContext({
			javaScriptEnabled: false,
			colorScheme: 'light',
			viewport: { width: 390, height: 844 }
		});
		const page = await context.newPage();
		try {
			await page.goto(`${menu}/`, { waitUntil: 'load' });
			const palette = await page.evaluate(() => ({
				theme: document.documentElement.getAttribute('data-theme'),
				colorScheme: getComputedStyle(document.documentElement).colorScheme,
				background: getComputedStyle(document.body).backgroundColor,
				ink: getComputedStyle(document.body).color
			}));
			expect(palette).toEqual({
				theme: null,
				colorScheme: 'light',
				background: 'rgb(242, 234, 216)',
				ink: 'rgb(38, 33, 26)'
			});
		} finally {
			await context.close();
		}
	});
});
