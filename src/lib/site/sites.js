/**
 * Registry of every site in the Null ecosystem.
 *
 * One codebase builds them all: `PUBLIC_SITE=<id> vite build` produces
 * `build/<id>` ready to deploy to `<subdomain>.nullmenu.ai` (or the apex
 * for `menu`). Theme, nav, docs structure and catalog copy live here.
 *
 * Each product carries its own accent color and a short catalog role. Every claim below
 * is grounded in the repos as of July 2026; don't add adjectives the
 * README can't back.
 */

const GH = 'https://github.com/nullclaw';

export const sites = {
	menu: {
		id: 'menu',
		kind: 'menu',
		domain: 'nullmenu.ai',
		name: 'nullmenu',
		display: 'Null',
		title: 'Null — autonomous AI, à la carte',
		description:
			'A family of single-binary Zig tools for running AI agents on your own hardware. Install NullHub, add components as you need them. No cloud, no runtime dependencies.',
		accent: '#e8ddc9',
		accentDim: '#8f8574',
		github: `${GH}`,
		repo: 'nullmenu',
		course: 'the menu',
		role: 'ecosystem index',
		docsSections: [
			{ slug: 'start', title: 'Start' },
			{ slug: 'recipes', title: 'Recipes' },
			{ slug: 'operate', title: 'Operate' },
			{ slug: 'reference', title: 'Reference' },
			{ slug: 'develop', title: 'Develop' }
		]
	},

	hub: {
		id: 'hub',
		kind: 'product',
		domain: 'hub.nullmenu.ai',
		name: 'nullhub',
		display: 'NullHub',
		title: 'NullHub — one console and API for your whole agent stack',
		description:
			'A single Zig binary with an embedded dashboard that installs, supervises and updates the Null stack — and proxies agent chat, memory and cron through one API. Everything local, under ~/.nullhub.',
		accent: '#e3a93c',
		accentDim: '#96702a',
		github: `${GH}/nullhub`,
		repo: 'nullhub',
		course: 'the sous-chef',
		role: 'control plane',
		group: 'mains',
		status: 'beta',
		license: 'MIT',
		version: 'v2026.5.29',
		line: 'A web console in one binary that installs, runs and updates the Null stack through one API.',
		stat: '108 API routes · 0 deps',
		docsSections: [
			{ slug: 'start', title: 'Start' },
			{ slug: 'guides', title: 'Guides' },
			{ slug: 'operate', title: 'Operate' },
			{ slug: 'reference', title: 'Reference' }
		]
	},

	claw: {
		id: 'claw',
		kind: 'product',
		domain: 'claw.nullmenu.ai',
		name: 'nullclaw',
		display: 'NullClaw',
		title: 'NullClaw — an always-on AI agent in one static binary',
		description:
			'Self-hosted AI agent runtime written in Zig. ~60 model providers, 26 channels, 39 built-in tools, hybrid memory, sandboxed by default. One 4.4–6.5 MB static binary, no cloud.',
		accent: '#ff4f30',
		accentDim: '#a83a24',
		github: `${GH}/nullclaw`,
		repo: 'nullclaw',
		course: 'the chef',
		role: 'agent runtime',
		group: 'mains',
		status: 'beta',
		license: 'MIT',
		version: 'v2026.5.29',
		line: 'An AI agent runtime in one binary — message it from Telegram, Slack and 24 more channels.',
		stat: '4.4–6.5 MB · 26 channels',
		docsSections: [
			{ slug: 'start', title: 'Start' },
			{ slug: 'configure', title: 'Configure' },
			{ slug: 'operate', title: 'Operate' },
			{ slug: 'reference', title: 'Reference' }
		]
	},

	boiler: {
		id: 'boiler',
		kind: 'product',
		domain: 'boiler.nullmenu.ai',
		name: 'nullboiler',
		display: 'NullBoiler',
		title: 'NullBoiler — agent workflow orchestration in one native binary',
		description:
			'Graph-based workflow engine for AI agents: checkpoints, replay, fork, fan-out, interrupts. Dispatches to workers over webhook, OpenAI-compatible chat or A2A. One ~2 MB binary, SQLite embedded.',
		accent: '#d97742',
		accentDim: '#94512d',
		github: `${GH}/nullboiler`,
		repo: 'nullboiler',
		course: 'the stockpot',
		role: 'workflow orchestration',
		group: 'mains',
		status: 'beta',
		license: 'MIT',
		version: 'v2026.5.29',
		line: 'An orchestration engine for AI agents — decides what runs, when, and which worker executes it.',
		stat: '7 node types · ~2 MB binary',
		docsSections: [
			{ slug: 'start', title: 'Start' },
			{ slug: 'guides', title: 'Guides' },
			{ slug: 'reference', title: 'Reference' }
		]
	},

	tickets: {
		id: 'tickets',
		kind: 'product',
		domain: 'tickets.nullmenu.ai',
		name: 'nulltickets',
		display: 'NullTickets',
		title: 'NullTickets — durable task state for AI agents',
		description:
			'Task tracker for AI agents: lease-based claiming by role, pipeline state machines, retries with dead letters, idempotent writes. One Zig binary, vendored SQLite.',
		accent: '#b78ce0',
		accentDim: '#7d5f9a',
		github: `${GH}/nulltickets`,
		repo: 'nulltickets',
		course: 'the ticket rail',
		role: 'durable task state',
		group: 'mains',
		status: 'beta',
		license: 'MIT',
		version: 'v2026.5.29',
		line: 'A task tracker for AI agents: one SQLite-backed binary; agents claim work and report over HTTP.',
		stat: '33 endpoints · 7 targets',
		docsSections: [
			{ slug: 'start', title: 'Start' },
			{ slug: 'guides', title: 'Guides' },
			{ slug: 'reference', title: 'Reference' }
		]
	},

	watch: {
		id: 'watch',
		kind: 'product',
		domain: 'watch.nullmenu.ai',
		name: 'nullwatch',
		display: 'NullWatch',
		title: 'NullWatch — tracing, evals and cost for your agent runs',
		description:
			'A sub-megabyte observability service for agent runs: span, eval and OTLP trace ingest over a JSON HTTP API and offline CLI, stored as append-only JSONL under ~/.nullwatch. Nothing leaves your machine.',
		accent: '#5e9ecf',
		accentDim: '#3f6b8c',
		github: `${GH}/nullwatch`,
		repo: 'nullwatch',
		course: 'the thermometer',
		role: 'observability',
		group: 'small-plates',
		status: 'early',
		license: null,
		version: 'v2026.5.29',
		line: 'Observability service for AI agent runs: spans, evals and cost in one tiny binary, HTTP or CLI.',
		stat: '313–653 KB · 7 targets',
		docsSections: [
			{ slug: 'start', title: 'Start' },
			{ slug: 'reference', title: 'Reference' }
		]
	},

	pantry: {
		id: 'pantry',
		kind: 'product',
		domain: 'pantry.nullmenu.ai',
		name: 'nullpantry',
		display: 'NullPantry',
		title: 'NullPantry — knowledge and memory for the Null ecosystem',
		description:
			'Headless knowledge base and long-term agent memory: a 197-route /v1 API, permission-aware hybrid retrieval, citation-backed answers, 17 memory backends. UI-less by design.',
		accent: '#8fb573',
		accentDim: '#5f7a4c',
		github: `${GH}/nullpantry`,
		repo: 'nullpantry',
		course: 'the larder',
		role: 'knowledge & memory',
		group: 'small-plates',
		status: 'early',
		license: null,
		version: 'v2026.06.09',
		line: 'A single-binary knowledge and agent-memory server: permission-aware search that cites sources.',
		stat: '197 API routes · 17 memory backends',
		docsSections: [
			{ slug: 'start', title: 'Start' },
			{ slug: 'guides', title: 'Guides' },
			{ slug: 'reference', title: 'Reference' }
		]
	},

	clw: {
		id: 'clw',
		kind: 'product',
		domain: 'clw.nullmenu.ai',
		name: 'nllclw',
		display: 'nllclw',
		title: 'nllclw — a complete AI assistant in about 1 MB',
		description:
			'A local-first assistant in dependency-free Zig: OpenAI-compatible providers, six channels, and capability-gated tools that go read-only after untrusted web output.',
		accent: '#ff8a5c',
		accentDim: '#b05f3f',
		github: `${GH}/nllclw`,
		repo: 'nllclw',
		course: 'the paring knife',
		role: 'compact assistant',
		group: 'small-plates',
		status: 'early',
		license: 'MIT',
		version: 'v2026.6.1',
		line: 'A complete AI agent in ~1 MB of readable Zig — small enough to learn from, easy to fork.',
		stat: 'from 842 KiB · 0 deps',
		docsSections: [
			{ slug: 'start', title: 'Start' },
			{ slug: 'guides', title: 'Guides' },
			{ slug: 'reference', title: 'Reference' }
		]
	},

	desk: {
		id: 'desk',
		kind: 'product',
		domain: 'desk.nullmenu.ai',
		name: 'nulldesk',
		display: 'NullDesk',
		title: 'NullDesk — an agent-supervision desk inside a working code editor',
		description:
			'Agents propose, you approve — inside a real editor: LSP for 14 languages, git workbench, Zed extension support, Blake3 hash-chained audit log. One Zig binary, pre-release.',
		accent: '#d4b483',
		accentDim: '#8f7a58',
		github: `${GH}/nulldesk`,
		repo: 'nulldesk',
		course: 'the pass',
		role: 'agent supervision',
		group: 'test-kitchen',
		status: 'coming soon',
		comingSoon: true,
		license: null,
		version: null,
		line: 'An agent-supervision desk and code editor in one local app: review diffs, approve commands.',
		stat: '3 frontends · 1,533 tests',
		docsSections: [{ slug: 'start', title: 'Start' }]
	},

	cap: {
		id: 'cap',
		kind: 'product',
		domain: 'cap.nullmenu.ai',
		name: 'nullcap',
		display: 'NullCap',
		title: 'NullCap — a local-first call copilot',
		description:
			'Native desktop overlay for interviews, meetings, sales calls and demos: live cue cards and local transcripts, every AI request routed through your own local NullHub. Experimental.',
		accent: '#4fc4b8',
		accentDim: '#37877f',
		github: `${GH}/nullcap`,
		repo: 'nullcap',
		course: 'the cloche',
		role: 'call copilot',
		group: 'test-kitchen',
		status: 'coming soon',
		comingSoon: true,
		license: null,
		version: null,
		line: 'Desktop overlay with live cue cards for interviews and calls; talks only to one local gateway.',
		stat: '~90 commands · 3 platforms',
		docsSections: [{ slug: 'start', title: 'Start' }]
	},

	builder: {
		id: 'builder',
		kind: 'product',
		domain: 'builder.nullmenu.ai',
		name: 'nullbuilder',
		display: 'NullBuilder',
		title: 'NullBuilder — shared CI for the whole Null family',
		description:
			'Reusable GitHub Actions workflows: tests, deduped nightlies and tag releases ' +
			'cross-compiled to 12 targets across 4 OS families. Maintainer infrastructure.',
		accent: '#9aa3ad',
		accentDim: '#6a7079',
		github: `${GH}/nullbuilder`,
		repo: 'nullbuilder',
		course: 'mise en place',
		role: 'release infrastructure',
		group: 'test-kitchen',
		status: 'infra',
		license: null,
		version: null,
		line: 'Reusable GitHub Actions workflows: CI, nightlies, 12-target releases for Zig repos.',
		stat: '12 targets · 3 workflows',
		docsSections: [
			{ slug: 'start', title: 'Start' },
			{ slug: 'reference', title: 'Reference' }
		]
	}
};

/** Order in which products appear on the menu. */
export const menuOrder = [
	'hub',
	'claw',
	'boiler',
	'tickets',
	'watch',
	'pantry',
	'clw',
	'desk',
	'cap',
	'builder'
];

export const groups = [
	{ id: 'mains', title: 'Core products', note: 'released and documented' },
	{ id: 'small-plates', title: 'Focused tools', note: 'smaller components, growing fast' },
	{ id: 'test-kitchen', title: 'Early projects', note: 'in active development' }
];

export const products = menuOrder.map((id) => sites[id]);
