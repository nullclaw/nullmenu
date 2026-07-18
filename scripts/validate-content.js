#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { pinnedReleaseSnapshots } from '../src/lib/content/releases.js';
import { groups, menuOrder, sites } from '../src/lib/site/sites.js';
import { deploymentTargets } from './site-targets.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function isRecord(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readJson(path, errors) {
	try {
		return JSON.parse(readFileSync(path, 'utf8'));
	} catch (error) {
		errors.push(`${path}: ${error.message}`);
		return null;
	}
}

function requireString(value, path, errors) {
	if (typeof value !== 'string' || value.trim() === '') errors.push(`${path} must be a non-empty string`);
}

function requireRecordArray(value, path, fields, errors, allowEmpty = false) {
	if (!Array.isArray(value)) {
		errors.push(`${path} must be an array`);
		return;
	}
	if (!allowEmpty && value.length === 0) errors.push(`${path} must not be empty`);
	value.forEach((item, index) => {
		if (!isRecord(item)) {
			errors.push(`${path}[${index}] must be an object`);
			return;
		}
		for (const field of fields) requireString(item[field], `${path}[${index}].${field}`, errors);
	});
}

export function validateContent() {
	const errors = [];
	const ids = Object.keys(sites);
	const productIds = ids.filter((id) => id !== 'menu');
	const groupIds = new Set(groups.map((group) => group.id));
	const releaseByRepo = new Map(
		pinnedReleaseSnapshots().map(({ repo, release }) => [repo, release])
	);

	if (new Set(menuOrder).size !== menuOrder.length) errors.push('menuOrder contains duplicate ids');
	if (menuOrder.length !== productIds.length) {
		errors.push(`menuOrder has ${menuOrder.length} products, registry has ${productIds.length}`);
	}

	for (const id of productIds) {
		if (!menuOrder.includes(id)) errors.push(`registry product "${id}" is missing from menuOrder`);
	}
	for (const id of menuOrder) {
		if (!sites[id] || sites[id].kind !== 'product') errors.push(`menuOrder references unknown product "${id}"`);
	}

	const uniqueFields = ['domain', 'name'];
	for (const field of uniqueFields) {
		const values = ids.map((id) => sites[id][field]);
		if (new Set(values).size !== values.length) errors.push(`site ${field} values must be unique`);
	}

	for (const [id, site] of Object.entries(sites)) {
		if (site.id !== id) errors.push(`sites.${id}.id must equal its registry key`);
		for (const field of ['id', 'kind', 'domain', 'name', 'display', 'title', 'description', 'accent', 'github', 'repo']) {
			requireString(site[field], `sites.${id}.${field}`, errors);
		}
		if (!/^#[0-9a-f]{6}$/i.test(site.accent)) errors.push(`sites.${id}.accent must be a six-digit hex color`);
		if (!Array.isArray(site.docsSections) || site.docsSections.length === 0) {
			errors.push(`sites.${id}.docsSections must contain at least one section`);
		} else {
			const sectionSlugs = site.docsSections.map((section) => section.slug);
			if (new Set(sectionSlugs).size !== sectionSlugs.length) {
				errors.push(`sites.${id}.docsSections contains duplicate slugs`);
			}
			for (const [index, section] of site.docsSections.entries()) {
				requireString(section.slug, `sites.${id}.docsSections[${index}].slug`, errors);
				requireString(section.title, `sites.${id}.docsSections[${index}].title`, errors);
			}
		}
		if (!existsSync(join(root, 'static', 'og', `${id}.png`))) errors.push(`missing static/og/${id}.png`);

		if (site.kind !== 'product') continue;
		if (!groupIds.has(site.group)) errors.push(`sites.${id}.group references unknown group "${site.group}"`);
		if (site.version) {
			const release = releaseByRepo.get(site.repo);
			if (!release || release.status === 'unavailable') {
				errors.push(`sites.${id}.version has no complete repository-anchored release manifest`);
			} else if (release.tag !== site.version) {
				errors.push(
					`sites.${id}.version (${site.version}) must match the trusted release tag (${release.tag})`
				);
			}
		}

		const productPath = join(root, 'content', id, 'product.json');
		const product = readJson(productPath, errors);
		if (!product) continue;

		if (!isRecord(product.hero)) errors.push(`${id}.product.hero must be an object`);
		else {
			requireString(product.hero.kicker, `${id}.product.hero.kicker`, errors);
			requireString(product.hero.title, `${id}.product.hero.title`, errors);
			requireString(product.hero.sub, `${id}.product.hero.sub`, errors);
		}

		if (!isRecord(product.plain)) errors.push(`${id}.product.plain must be an object`);
		else {
			for (const field of ['what', 'why', 'when']) {
				requireString(product.plain[field], `${id}.product.plain.${field}`, errors);
			}
			if (product.plain.fit !== undefined) {
				requireString(product.plain.fit, `${id}.product.plain.fit`, errors);
			}
		}

		requireRecordArray(product.metrics, `${id}.product.metrics`, ['label', 'value'], errors);
		requireRecordArray(product.features, `${id}.product.features`, ['title', 'body'], errors);
		requireRecordArray(product.useCases, `${id}.product.useCases`, ['title', 'body'], errors);
		requireRecordArray(product.faq, `${id}.product.faq`, ['q', 'a'], errors);
		for (const [field, records] of [
			['useCases', product.useCases],
			['how.steps', product.how?.steps]
		]) {
			for (const [index, record] of (records ?? []).entries()) {
				if (record?.code !== undefined) {
					requireString(record.code, `${id}.product.${field}[${index}].code`, errors);
				}
			}
		}

		if (!isRecord(product.how)) errors.push(`${id}.product.how must be an object`);
		else {
			if (product.how.intro !== undefined) {
				requireString(product.how.intro, `${id}.product.how.intro`, errors);
			}
			requireRecordArray(product.how.steps, `${id}.product.how.steps`, ['title', 'body'], errors);
		}

		if (!Array.isArray(product.inside)) errors.push(`${id}.product.inside must be an array`);
		else {
			product.inside.forEach((group, index) => {
				if (!isRecord(group)) {
					errors.push(`${id}.product.inside[${index}] must be an object`);
					return;
				}
				requireString(group.title, `${id}.product.inside[${index}].title`, errors);
				if (group.note !== undefined) {
					requireString(group.note, `${id}.product.inside[${index}].note`, errors);
				}
				if (!Array.isArray(group.items) || group.items.length === 0) {
					errors.push(`${id}.product.inside[${index}].items must be a non-empty array`);
				} else {
					group.items.forEach((item, itemIndex) =>
						requireString(item, `${id}.product.inside[${index}].items[${itemIndex}]`, errors)
					);
				}
			});
		}

		if (!isRecord(product.install) || !isRecord(product.install?.primary)) {
			errors.push(`${id}.product.install.primary must be an object`);
		} else {
			requireString(product.install.primary.label, `${id}.product.install.primary.label`, errors);
			requireString(product.install.primary.code, `${id}.product.install.primary.code`, errors);
			requireRecordArray(
				product.install.alts ?? [],
				`${id}.product.install.alts`,
				['label', 'code'],
				errors,
				true
			);
		}
		requireString(product.quickstart, `${id}.product.quickstart`, errors);
		if (!Array.isArray(product.pairs)) errors.push(`${id}.product.pairs must be an array`);
		else if (new Set(product.pairs).size !== product.pairs.length) {
			errors.push(`${id}.product.pairs contains duplicates`);
		}
		for (const pair of product.pairs ?? []) {
			if (!sites[pair] || pair === id || sites[pair].kind !== 'product') {
				errors.push(`${id}.product.pairs references invalid product "${pair}"`);
			}
		}

		for (const section of site.docsSections ?? []) {
			const sectionDir = join(root, 'content', id, 'docs', section.slug);
			if (!existsSync(sectionDir)) errors.push(`missing docs section ${id}/${section.slug}`);
		}
	}

	const contentProducts = readdirSync(join(root, 'content'), { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && existsSync(join(root, 'content', entry.name, 'product.json')))
		.map((entry) => entry.name)
		.sort();
	const registryProducts = [...productIds].sort();
	if (JSON.stringify(contentProducts) !== JSON.stringify(registryProducts)) {
		errors.push(
			`product registry/content mismatch: registry=${registryProducts.join(',')} content=${contentProducts.join(',')}`
		);
	}

	const actualDeployTargets = deploymentTargets
		.map(({ id, repository, domain }) => `${id}|${repository}|${domain}`)
		.sort();
	const expectedDeployTargets = registryProducts
		.map((id) => {
			const githubRepo = new URL(sites[id].github).pathname.replace(/^\/|\/$/g, '');
			return `${id}|${githubRepo}|${sites[id].domain}`;
		})
		.sort();
	if (JSON.stringify(actualDeployTargets) !== JSON.stringify(expectedDeployTargets)) {
		errors.push('structured deploy site/repository/domain targets must exactly match the registry');
	}

	return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const errors = validateContent();
	if (errors.length) {
		console.error(`Content validation failed (${errors.length}):`);
		for (const error of errors) console.error(`  - ${error}`);
		process.exitCode = 1;
	} else {
		console.log(`Content validation passed: ${Object.keys(sites).length} sites, ${menuOrder.length} products.`);
	}
}
