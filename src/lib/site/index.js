import { PUBLIC_SITE } from '$env/static/public';
import { sites } from './sites.js';

/** The site this build is for. Set via PUBLIC_SITE env var; defaults to `menu`. */
export const site = sites[PUBLIC_SITE || 'menu'] ?? sites.menu;

export { sites, menuOrder, products, groups } from './sites.js';
