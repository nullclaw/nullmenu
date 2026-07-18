#!/usr/bin/env node
/**
 * Best-effort transactional deploy for the ten product repositories.
 *
 * Every orphan commit is prepared before the first branch moves. Pushes are
 * serialized; if one fails, already-moved branches are force-restored to the
 * exact SHA observed during preparation. Cross-repository Git refs cannot be
 * changed atomically, but this prevents the old parallel matrix from leaving
 * an arbitrary mix of releases after an ordinary push failure.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import {
	cpSync,
	existsSync,
	mkdtempSync,
	mkdirSync,
	readdirSync,
	rmSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { deploymentTargets } from './site-targets.js';
import { validateSiteBuild } from './build-lib.js';

const branch = 'gh-pages';
const validateOnly = process.argv.includes('--validate-only');
const sourceSha = process.env.GITHUB_SHA ?? 'local';
const manifestIndex = process.argv.indexOf('--manifest');
const manifestFile = resolve(
	manifestIndex >= 0 ? process.argv[manifestIndex + 1] : 'build/deployment/subdomains.json'
);
const candidateBranch = `nullmenu-candidate-${String(process.env.GITHUB_RUN_ID ?? sourceSha)
	.replace(/[^a-zA-Z0-9-]/g, '-')
	.slice(0, 32)}-${process.env.GITHUB_RUN_ATTEMPT ?? '1'}`;

function git(cwd, args, env, options = {}) {
	return execFileSync('git', args, {
		cwd,
		env,
		stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
		encoding: options.capture ? 'utf8' : undefined
	})?.trim();
}

function copyBuild(source, destination) {
	for (const name of readdirSync(source)) {
		cpSync(join(source, name), join(destination, name), { recursive: true });
	}
}

function validateInputs() {
	for (const target of deploymentTargets) {
		const root = resolve(`build/${target.id}`);
		if (!existsSync(root)) throw new Error(`${target.id}: missing ${root}`);
		validateSiteBuild(target.id, root);
	}
	console.log(`validated ${deploymentTargets.length} product deployment payloads`);
}

validateInputs();
if (validateOnly) process.exit(0);

if (!process.env.NULLMENU_DEPLOY_TOKEN) {
	throw new Error('NULLMENU_DEPLOY_TOKEN is required for deployment');
}

const temp = mkdtempSync(join(tmpdir(), 'nullmenu-deploy-'));
const askpass = join(temp, 'askpass.sh');
writeFileSync(
	askpass,
	'#!/bin/sh\ncase "$1" in *Username*) printf "%s\\n" "x-access-token" ;; *) printf "%s\\n" "$NULLMENU_DEPLOY_TOKEN" ;; esac\n',
	{ mode: 0o700 }
);
const gitEnv = {
	...process.env,
	GIT_ASKPASS: askpass,
	GIT_TERMINAL_PROMPT: '0'
};

const prepared = [];
const staged = [];
const pushed = [];
let cleaned = false;

function remoteBranchSha(target, name = branch) {
	return (
		git(target.cwd, ['ls-remote', '--heads', 'origin', name], gitEnv, { capture: true })
			.split(/\s+/)[0] || null
	);
}

function rollbackPromoted() {
	const failures = [];
	for (const target of [...pushed].reverse()) {
		try {
			const currentSha = remoteBranchSha(target);
			if (currentSha === target.previousSha || (!currentSha && !target.previousSha)) {
				console.error(`already restored ${target.domain}`);
				continue;
			}
			if (currentSha !== target.nextSha) {
				throw new Error(`${target.domain}: refusing to overwrite externally changed ${branch}`);
			}
			const refspec = target.previousSha
				? `${target.previousSha}:refs/heads/${branch}`
				: `:refs/heads/${branch}`;
			git(
				target.cwd,
				['push', `--force-with-lease=refs/heads/${branch}:${target.nextSha}`, 'origin', refspec],
				gitEnv
			);
			console.error(`rolled back ${target.domain}`);
		} catch {
			failures.push(target.domain);
		}
	}
	return failures;
}

function cleanup() {
	if (cleaned) return;
	cleaned = true;
	for (const target of staged) {
		try {
			git(target.cwd, ['push', 'origin', `:refs/heads/${candidateBranch}`], gitEnv);
		} catch {
			console.error(`warning: could not delete ${candidateBranch} from ${target.repository}`);
		}
	}
	rmSync(temp, { recursive: true, force: true });
}

function onSignal(signal) {
	console.error(`received ${signal}; rolling back promoted product refs`);
	const failures = rollbackPromoted();
	cleanup();
	if (failures.length) console.error(`rollback also failed for ${failures.join(', ')}`);
	process.exit(signal === 'SIGINT' ? 130 : 143);
}

process.once('SIGINT', onSignal);
process.once('SIGTERM', onSignal);

try {
	// Phase one: fetch every prior ref and create every release commit locally.
	for (const target of deploymentTargets) {
		const cwd = join(temp, target.id);
		mkdirSync(cwd);
		git(cwd, ['init', '--initial-branch', 'prepared'], gitEnv);
		git(cwd, ['remote', 'add', 'origin', `https://github.com/${target.repository}.git`], gitEnv);

		const probe = spawnSync('git', ['ls-remote', '--exit-code', '--heads', 'origin', branch], {
			cwd,
			env: gitEnv,
			encoding: 'utf8'
		});
		if (probe.status !== 0 && probe.status !== 2) {
			throw new Error(`${target.repository}: could not inspect ${branch}`);
		}
		const previousSha = probe.status === 0 ? probe.stdout.trim().split(/\s+/)[0] : null;
		if (previousSha) {
			git(cwd, ['fetch', '--depth=1', 'origin', previousSha], gitEnv);
		}

		copyBuild(resolve(`build/${target.id}`), cwd);
		writeFileSync(join(cwd, 'CNAME'), `${target.domain}\n`);
		writeFileSync(join(cwd, '.nojekyll'), '');
		writeFileSync(
			join(cwd, '.nullmenu-release.json'),
			`${JSON.stringify({ site: target.id, source: sourceSha }, null, 2)}\n`
		);
		git(cwd, ['add', '--all'], gitEnv);
		git(
			cwd,
			[
				'-c',
				'user.name=github-actions[bot]',
				'-c',
				'user.email=41898282+github-actions[bot]@users.noreply.github.com',
				'commit',
				'--quiet',
				'-m',
				`deploy: ${target.domain} from nullmenu@${sourceSha}`
			],
			gitEnv
		);
		const nextSha = git(cwd, ['rev-parse', 'HEAD'], gitEnv, { capture: true });
		prepared.push({ ...target, cwd, previousSha, nextSha });
		console.log(`prepared ${target.domain} (${nextSha.slice(0, 12)})`);
	}

	// Phase two: put every candidate commit on its destination remote before
	// any public gh-pages ref moves. A staging failure cannot create skew.
	for (const target of prepared) {
		git(
			target.cwd,
			['push', 'origin', `+${target.nextSha}:refs/heads/${candidateBranch}`],
			gitEnv
		);
		const remoteCandidate = git(
			target.cwd,
			['ls-remote', '--heads', 'origin', candidateBranch],
			gitEnv,
			{ capture: true }
		)
			.split(/\s+/)[0];
		if (remoteCandidate !== target.nextSha) {
			throw new Error(`${target.repository}: candidate ref verification failed`);
		}
		staged.push(target);
		console.log(`staged ${target.domain} on ${candidateBranch}`);
	}

	// Phase three: promote one branch at a time only after all candidates exist.
	for (const target of prepared) {
		const lease = `--force-with-lease=refs/heads/${branch}:${target.previousSha ?? ''}`;
		// Track the target before the synchronous push. If the runner receives a
		// signal after the remote accepts the update but before git returns, the
		// signal handler still knows which lease-protected ref to restore.
		pushed.push(target);
		git(
			target.cwd,
			['push', lease, 'origin', `${target.nextSha}:refs/heads/${branch}`],
			gitEnv
		);
		console.log(`deployed ${target.domain}`);
	}

	mkdirSync(dirname(manifestFile), { recursive: true });
	writeFileSync(
		manifestFile,
		`${JSON.stringify(
			{
				source: sourceSha,
				branch,
				targets: prepared.map(({ id, repository, domain, previousSha, nextSha }) => ({
					id,
					repository,
					domain,
					previousSha,
					nextSha
				}))
			},
			null,
			2
		)}\n`
	);
} catch (error) {
	const rollbackFailures = rollbackPromoted();
	if (rollbackFailures.length) {
		throw new Error(`${error.message}; rollback also failed for ${rollbackFailures.join(', ')}`);
	}
	throw error;
} finally {
	cleanup();
	process.removeListener('SIGINT', onSignal);
	process.removeListener('SIGTERM', onSignal);
}

console.log(`deployed ${prepared.length} product sites from ${sourceSha}`);
