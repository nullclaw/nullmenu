#!/usr/bin/env node

import { verifyPublishedDigests } from './update-release-digests.js';

try {
	await verifyPublishedDigests();
	console.log('Pinned release smoke test passed: all published bytes match the committed SHA-256 manifest.');
} catch (error) {
	console.error('Pinned release smoke test failed:');
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
}
