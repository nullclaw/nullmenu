/**
 * Registry of every site in the Null ecosystem.
 *
 * One codebase builds them all: `PUBLIC_SITE=<id> vite build` produces
 * `build/<id>` ready to deploy to `<subdomain>.nullmenu.ai` (or the apex
 * for `menu`). Theme, nav, docs structure and catalog copy live here.
 *
 * Each product carries a "spice" — its accent color — and a role in the
 * kitchen metaphor that runs through the whole family. Every claim below
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
		title: 'NullHub — one console for your whole agent stack',
		description:
			'A single Zig binary with an embedded dashboard that installs, supervises, monitors and updates the Null ecosystem. Everything local, under ~/.nullhub.',
		accent: '#e3a93c',
		accentDim: '#96702a',
		github: `${GH}/nullhub`,
		repo: 'nullhub',
		course: 'the sous-chef',
		group: 'mains',
		status: 'beta',
		license: 'MIT',
		version: 'v2026.5.29',
		line: 'One binary that installs, supervises and updates your whole agent stack.',
		stat: '1 binary · 7 platforms',
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
		title: 'NullClaw — a fully autonomous AI agent in 678 KB',
		description:
			'Autonomous AI assistant infrastructure written in Zig. 50+ model providers, 19 chat channels, ~1 MB RAM, boots in milliseconds. One static binary, no cloud.',
		accent: '#ff4f30',
		accentDim: '#a83a24',
		github: `${GH}/nullclaw`,
		repo: 'nullclaw',
		course: 'the chef',
		group: 'mains',
		status: 'beta',
		license: 'MIT',
		version: 'v2026.5.29',
		line: 'A fully autonomous AI agent in a 678 KB static binary.',
		stat: '678 KB · ~1 MB RAM',
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
			'Graph-based workflow engine for AI agents: checkpoints, fan-out, interrupts, replay. Dispatches to any worker over webhook, A2A, MQTT or Redis Streams.',
		accent: '#d97742',
		accentDim: '#94512d',
		github: `${GH}/nullboiler`,
		repo: 'nullboiler',
		course: 'the stockpot',
		group: 'mains',
		status: 'beta',
		license: 'MIT',
		version: 'v2026.5.29',
		line: 'Workflow graphs — checkpoints, fan-out, interrupts, replay — compiled native.',
		stat: '7 node types · 355 tests',
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
		title: 'NullTickets — durable task state for agent fleets',
		description:
			'Headless task tracker and lease coordinator: agents claim work by role, report progress, transition FSM pipelines. One binary, vendored SQLite.',
		accent: '#b78ce0',
		accentDim: '#7d5f9a',
		github: `${GH}/nulltickets`,
		repo: 'nulltickets',
		course: 'the ticket rail',
		group: 'mains',
		status: 'beta',
		license: 'MIT',
		version: 'v2026.5.29',
		line: 'Durable task state: lease-based claiming, FSM pipelines, retries.',
		stat: 'OpenAPI 3.1 · SQLite',
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
			'A sub-megabyte local OTLP sink with evals built in: spans, verdicts, token usage and cost stored as JSONL under ~/.nullwatch. Nothing leaves your machine.',
		accent: '#5e9ecf',
		accentDim: '#3f6b8c',
		github: `${GH}/nullwatch`,
		repo: 'nullwatch',
		course: 'the thermometer',
		group: 'small-plates',
		status: 'early',
		license: null,
		version: 'v2026.5.29',
		line: 'A sub-megabyte local OTLP sink with evals built in.',
		stat: '313–653 KB binaries',
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
			'Headless knowledge base and long-term agent memory: permission-aware retrieval, knowledge graph, citation-backed answers. UI-less by design.',
		accent: '#8fb573',
		accentDim: '#5f7a4c',
		github: `${GH}/nullpantry`,
		repo: 'nullpantry',
		course: 'the larder',
		group: 'small-plates',
		status: 'early',
		license: null,
		version: 'v2026.06.09',
		line: 'Knowledge, memory and citation-backed RAG behind one API.',
		stat: '14+ memory backends',
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
		title: 'nllclw — a complete AI assistant in under 1 MB',
		description:
			'A tiny local-first assistant in readable Zig: OpenAI-compatible providers, memory, capability-gated tools, Telegram and WebSocket. 385/385 tests.',
		accent: '#ff8a5c',
		accentDim: '#b05f3f',
		github: `${GH}/nllclw`,
		repo: 'nllclw',
		course: 'the paring knife',
		group: 'small-plates',
		status: 'early',
		license: 'MIT',
		version: 'v2026.6.1',
		line: 'A complete AI assistant in under 1 MB — 21k lines of readable Zig.',
		stat: '795 KB stripped',
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
		title: 'NullDesk — the operations desk for humans running agents',
		description:
			'Agents propose, you approve: side-by-side diff review, risk-classified command approval, append-only audit trail. Local-first, pre-release.',
		accent: '#d4b483',
		accentDim: '#8f7a58',
		github: `${GH}/nulldesk`,
		repo: 'nulldesk',
		course: 'the pass',
		group: 'test-kitchen',
		status: 'pre-release',
		license: null,
		version: null,
		line: 'Agents propose, you approve: diff review, command approval, audit trail.',
		stat: 'GUI · TUI · web',
		docsSections: [{ slug: 'start', title: 'Start' }]
	},

	cap: {
		id: 'cap',
		kind: 'product',
		domain: 'cap.nullmenu.ai',
		name: 'nullcap',
		display: 'NullCap',
		title: 'NullCap — a local-first meeting copilot',
		description:
			'Desktop overlay for meetings, sales calls and demos: live cue cards and transcripts, everything routed through your own local NullHub. Experimental.',
		accent: '#4fc4b8',
		accentDim: '#37877f',
		github: `${GH}/nullcap`,
		repo: 'nullcap',
		course: 'the cloche',
		group: 'test-kitchen',
		status: 'experimental',
		license: null,
		version: null,
		line: 'A local-first meeting copilot, routed through your own NullHub.',
		stat: 'experimental',
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
			'Reusable GitHub Actions workflows: tests, nightlies and releases cross-compiled to 12 targets across 5 OS families. Maintainer infrastructure.',
		accent: '#9aa3ad',
		accentDim: '#6a7079',
		github: `${GH}/nullbuilder`,
		repo: 'nullbuilder',
		course: 'mise en place',
		group: 'test-kitchen',
		status: 'infra',
		license: null,
		version: null,
		line: 'One YAML block, twelve targets: shared CI for the whole family.',
		stat: '12 targets · 5 OS families',
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
	{ id: 'mains', title: 'Mains', note: 'released, documented, ready to serve' },
	{ id: 'small-plates', title: 'Small plates', note: 'young, useful, growing fast' },
	{ id: 'test-kitchen', title: 'The test kitchen', note: 'early — taste at your own risk' }
];

export const products = menuOrder.map((id) => sites[id]);
