#!/usr/bin/env node
/** Restore promoted gh-pages refs without overwriting another publisher. */
import { execFileSync, spawnSync } from 'node:child_process';
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const [rawManifest = 'build/deployment/subdomains.json'] = process.argv.slice(2);
const manifest = JSON.parse(readFileSync(resolve(rawManifest), 'utf8'));
const token = process.env.NULLMENU_DEPLOY_TOKEN;
if (!token) throw new Error('NULLMENU_DEPLOY_TOKEN is required for rollback');

const temp = mkdtempSync(join(tmpdir(), 'nullmenu-rollback-'));
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

function git(cwd, args, capture = false) {
	return execFileSync('git', args, {
		cwd,
		env: gitEnv,
		stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
		encoding: capture ? 'utf8' : undefined
	})?.trim();
}

const failures = [];
try {
	for (const [index, target] of [...manifest.targets].reverse().entries()) {
		const cwd = join(temp, String(index));
		mkdirSync(cwd);
		git(cwd, ['init', '--quiet', '--initial-branch', 'rollback']);
		git(cwd, ['remote', 'add', 'origin', `https://github.com/${target.repository}.git`]);

		const probe = spawnSync(
			'git',
			['ls-remote', '--exit-code', '--heads', 'origin', manifest.branch],
			{ cwd, env: gitEnv, encoding: 'utf8' }
		);
		if (probe.status !== 0 && probe.status !== 2) {
			failures.push(`${target.domain} (could not inspect current ref)`);
			continue;
		}
		const currentSha = probe.status === 0 ? probe.stdout.trim().split(/\s+/)[0] : null;
		if (currentSha === target.previousSha) {
			console.log(`already restored ${target.domain}`);
			continue;
		}
		if (!currentSha && !target.previousSha) {
			console.log(`already removed ${target.domain}`);
			continue;
		}
		if (currentSha !== target.nextSha) {
			failures.push(`${target.domain} (ref changed externally; rollback refused)`);
			continue;
		}

		try {
			let refspec;
			if (target.previousSha) {
				git(cwd, ['fetch', '--quiet', '--depth=1', 'origin', target.previousSha]);
				refspec = `${target.previousSha}:refs/heads/${manifest.branch}`;
			} else {
				refspec = `:refs/heads/${manifest.branch}`;
			}
			git(cwd, [
				'push',
				`--force-with-lease=refs/heads/${manifest.branch}:${target.nextSha}`,
				'origin',
				refspec
			]);
			console.log(`rolled back ${target.domain}`);
		} catch {
			failures.push(`${target.domain} (lease-protected push failed)`);
		}
	}
} finally {
	rmSync(temp, { recursive: true, force: true });
}

if (failures.length) throw new Error(`rollback failed for ${failures.join(', ')}`);
console.log(`restored ${manifest.targets.length} product refs after deployment failure`);
