#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, join, relative, resolve } from 'node:path';
import { readRedirectMap } from './make-redirects.js';
import { deploymentTargets, siteIds } from './site-targets.js';

const PUBLISHED_CONTENT_EXTENSIONS = new Set(['.json', '.md']);
const FULL_COMMIT_SHA = /^[a-f0-9]{40}$/i;

function publishedContentFiles(directory) {
	return readdirSync(directory, { withFileTypes: true })
		.sort((a, b) => a.name.localeCompare(b.name))
		.flatMap((entry) => {
			const path = join(directory, entry.name);
			if (entry.isDirectory()) return publishedContentFiles(path);
			return PUBLISHED_CONTENT_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
		});
}

function sourceLine(source, offset) {
	return source.slice(0, offset).split('\n').length;
}

export function findUnsafePublishedWorkflowReferences(source, sourcePath = '<content>') {
	const errors = [];
	const reported = new Set();
	const usesPattern = /\buses:\s*["']?([^\s"'`\\]+)/g;
	const actionReferencePattern = /\b([a-z0-9_.-]+\/[a-z0-9_.-]+(?:\/[a-z0-9_./-]+)?@([a-z0-9_.-]+))/gi;
	const reportMutableReference = (reference, revision, offset) => {
		if (FULL_COMMIT_SHA.test(revision)) return;
		const line = sourceLine(source, offset);
		const key = `${line}:${reference}`;
		if (reported.has(key)) return;
		reported.add(key);
		errors.push(`${sourcePath}:${line}: published action is not SHA-pinned: ${reference}`);
	};

	for (const match of source.matchAll(usesPattern)) {
		const reference = match[1];
		if (reference.startsWith('./')) continue;

		const separator = reference.lastIndexOf('@');
		const revision = separator >= 0 ? reference.slice(separator + 1) : '';
		reportMutableReference(reference, revision, match.index);
	}

	for (const match of source.matchAll(actionReferencePattern)) {
		reportMutableReference(match[1], match[2], match.index);
	}

	for (const match of source.matchAll(/\bsecrets:\s*inherit\b/g)) {
		errors.push(
			`${sourcePath}:${sourceLine(source, match.index)}: published workflow must not inherit all caller secrets`
		);
	}

	return errors;
}

export function validatePublishedContentReferences(contentRoot = resolve('content')) {
	return publishedContentFiles(contentRoot).flatMap((path) =>
		findUnsafePublishedWorkflowReferences(
			readFileSync(path, 'utf8'),
			relative(resolve(), path) || path
		)
	);
}

export function validateInfrastructure() {
	const errors = validatePublishedContentReferences();
	const unique = (values) => new Set(values).size === values.length;

	if (siteIds.length !== 11 || siteIds[0] !== 'menu') {
		errors.push(`expected menu plus ten products, found ${siteIds.join(', ')}`);
	}
	if (deploymentTargets.length !== siteIds.length - 1) {
		errors.push(`expected ${siteIds.length - 1} product deploy targets`);
	}
	for (const key of ['id', 'repository', 'domain']) {
		if (!unique(deploymentTargets.map((target) => target[key]))) {
			errors.push(`duplicate deployment ${key}`);
		}
	}

	for (const file of readdirSync(resolve('redirects')).filter((name) => name.endsWith('.json'))) {
		try {
			readRedirectMap(resolve('redirects', file));
		} catch (error) {
			errors.push(error.message);
		}
	}

	const workflow = readFileSync(resolve('.github/workflows/deploy.yml'), 'utf8');
	for (const match of workflow.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)) {
		const reference = match[1];
		if (reference.startsWith('./')) continue;
		if (!/@[a-f0-9]{40}$/.test(reference)) errors.push(`action is not SHA-pinned: ${reference}`);
	}
	if (!workflow.includes('node scripts/deploy-subdomains.js')) {
		errors.push('workflow does not use the transactional subdomain deployer');
	}
	if (!workflow.includes('node scripts/rollback-subdomains.js')) {
		errors.push('workflow cannot roll product refs back after a release failure');
	}
	if (!workflow.includes("if: (failure() || cancelled()) && hashFiles('build/deployment/subdomains.json') != ''")) {
		errors.push('product refs are not rolled back after handoff, apex or cancellation failure');
	}
	const deployer = readFileSync(resolve('scripts/deploy-subdomains.js'), 'utf8');
	const rollback = readFileSync(resolve('scripts/rollback-subdomains.js'), 'utf8');
	if (!deployer.includes('--force-with-lease=refs/heads/${branch}:')) {
		errors.push('product promotion is not protected against concurrent ref changes');
	}
	if (
		!deployer.includes('currentSha !== target.nextSha') ||
		!rollback.includes('currentSha !== target.nextSha') ||
		!rollback.includes('--force-with-lease=refs/heads/${manifest.branch}:${target.nextSha}')
	) {
		errors.push('rollback can overwrite a ref changed by another publisher');
	}
	if (!deployer.includes("process.once('SIGTERM', onSignal)")) {
		errors.push('transactional deploy does not roll back when the runner is terminated');
	}
	const releaseJob = workflow.match(/\n  deploy-release:\n([\s\S]*?)(?=\n  [a-z][a-z0-9-]+:\n)/)?.[1] ?? '';
	const productStep = releaseJob.indexOf('node scripts/deploy-subdomains.js');
	const apexStep = releaseJob.indexOf('uses: actions/deploy-pages@');
	const rollbackStep = releaseJob.indexOf('node scripts/rollback-subdomains.js');
	if (!releaseJob.includes('environment:\n      name: github-pages')) {
		errors.push('the protected Pages environment must gate the release before product refs move');
	}
	if (!releaseJob.includes('permissions:\n      contents: read\n      pages: write\n      id-token: write')) {
		errors.push('the release job must retain checkout access while using least-privilege Pages permissions');
	}
	if (productStep < 0 || apexStep < productStep || rollbackStep < apexStep) {
		errors.push('release order must be product promotion, apex deployment, then rollback finalizer');
	}
	if (
		!releaseJob.includes(
			"if: github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main')"
		)
	) {
		errors.push('scheduled or non-main manual verification must not deploy a production release');
	}

	return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const errors = validateInfrastructure();
	if (errors.length) {
		console.error(errors.map((error) => `- ${error}`).join('\n'));
		process.exitCode = 1;
	} else {
		console.log(
			`Infrastructure validation passed: ${siteIds.length} builds, ${deploymentTargets.length} transactional deploy targets, immutable action and published-content pins.`
		);
	}
}
