import { menuOrder, sites } from '../src/lib/site/sites.js';

export const siteIds = Object.freeze(Object.keys(sites));

export const deploymentTargets = Object.freeze(
	menuOrder.map((id) => {
		const site = sites[id];
		const repository = new URL(site.github).pathname.replace(/^\//, '');
		return Object.freeze({ id, repository, domain: site.domain });
	})
);

export function requireSite(id) {
	if (!Object.hasOwn(sites, id)) {
		throw new Error(`Unknown site "${id}". Known: ${siteIds.join(', ')}`);
	}
	return sites[id];
}
