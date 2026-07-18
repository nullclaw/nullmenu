import { site } from '$lib/site';
import { renderMarkdown } from '$lib/content/markdown.js';
import { fetchRelease } from '$lib/content/releases.js';

/** @type {Record<string, any>} */
const productData = import.meta.glob('/content/*/product.json', {
	eager: true,
	import: 'default'
});

const bash = (code) => `\`\`\`bash\n${code}\n\`\`\``;

export async function load() {
	const md = (s) => renderMarkdown(s, { accent: site.accent });

	if (site.kind === 'menu') {
		const [seat, order, service, solo] = await Promise.all([
			md(
				bash(
					`docker run --rm -p 19800:19800 \\\n  -v nullhub-data:/nullhub-data \\\n  ghcr.io/nullclaw/nullhub:latest\n# dashboard → http://nullhub.localhost:19800`
				)
			),
			md(
				bash(
					`nullhub install nullclaw      # the agent\nnullhub install nullboiler    # orchestration\nnullhub install nulltickets   # durable tasks\nnullhub install nullwatch     # observability`
				)
			),
			md(bash(`nullhub start-all && nullhub status`)),
			md(bash(`brew install nullclaw && nullclaw onboard`))
		]);
		return {
			kind: 'menu',
			code: { seat: seat.html, order: order.html, service: service.html, solo: solo.html }
		};
	}

	const data = productData[`/content/${site.id}/product.json`];
	if (!data) {
		return { kind: 'product', product: null, release: null };
	}

	const [release, installPrimary, quickstart, ...alts] = await Promise.all([
		// A version marks a product with published release assets. Pre-release
		// projects keep their source-only presentation even if GitHub is down.
		site.version ? fetchRelease(site.repo, { fallbackTag: site.version }) : null,
		md(bash(data.install.primary.code)),
		md(data.quickstart),
		...(data.install.alts ?? []).map((a) => md(bash(a.code)))
	]);

	return {
		kind: 'product',
		product: data,
		release,
		code: {
			installPrimary: installPrimary.html,
			quickstart: quickstart.html,
			alts: (data.install.alts ?? []).map((a, i) => ({ label: a.label, html: alts[i].html }))
		}
	};
}
