import assert from 'node:assert/strict';
import test from 'node:test';
import { validateContent } from '../../scripts/validate-content.js';

test('site registry, product content, assets, docs and deployment targets stay aligned', () => {
	assert.deepEqual(validateContent(), []);
});
