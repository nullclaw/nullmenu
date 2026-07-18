<script>
	/**
	 * The signature effect: real fluid dynamics on the GPU.
	 *
	 * A Navier–Stokes simulation in WGSL compute shaders (WebGPU) — accent
	 * ink dropped into dark water: advection, vorticity confinement, Jacobi
	 * pressure solve, then a tone-mapped dye render composited over the page.
	 * Autonomous droplets keep it alive; the pointer stirs it.
	 *
	 * Fallback chain: no WebGPU or reduced motion → FlowField (canvas 2D).
	 */
	import FlowField from './FlowField.svelte';
	import { themeState } from '$lib/theme.svelte.js';

	let { tint = '#e8ddc9', intensity = 1, class: className = '' } = $props();

	// on parchment the ink is pigment (darker than paper), not light
	const isLight = $derived(themeState.current === 'light');
	const pigmentHex = $derived.by(() => {
		const t = hexToRgb(tint);
		const ink = [0x26 / 255, 0x21 / 255, 0x1a / 255];
		const mix = t.map((c, i) => Math.round((c * 0.4 + ink[i] * 0.6) * 255));
		return '#' + mix.map((c) => c.toString(16).padStart(2, '0')).join('');
	});

	let canvas = $state();
	let webgpuFailed = $state(false);
	let reduced = $state(false);
	let bootGeneration = 0;
	const contextOwners = new WeakMap();

	function hexToRgb(hex) {
		const n = parseInt(hex.slice(1), 16);
		return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
	}

	$effect(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => (reduced = media.matches);
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	});

	$effect(() => {
		const light = themeState.current === 'light';
		if (webgpuFailed || reduced) return;
		const canvasElement = canvas;
		if (!canvasElement) return;
		if (!navigator.gpu) {
			webgpuFailed = true;
			return;
		}

		const generation = ++bootGeneration;
		let dead = false;
		let cleanup = () => {};
		const isStale = () => dead || generation !== bootGeneration;
		boot(light, isStale, canvasElement)
			.then((c) => {
				if (isStale()) c?.();
				else cleanup = c ?? (() => {});
			})
			.catch((e) => {
				if (isStale()) return;
				console.warn('[ink] webgpu unavailable:', e?.message ?? e);
				webgpuFailed = true;
			});
		return () => {
			dead = true;
			if (bootGeneration === generation) bootGeneration++;
			cleanup();
		};
	});

	async function boot(light, isStale, canvasElement) {
		const adapter = await navigator.gpu.requestAdapter();
		if (!adapter) throw new Error('no adapter');
		if (isStale()) return;
		const device = await adapter.requestDevice();
		if (isStale()) {
			device.destroy();
			return;
		}

		const onGpuError = (e) => console.warn('[ink] gpu error:', e.error?.message);
		device.addEventListener('uncapturederror', onGpuError);
		const context = canvasElement.getContext('webgpu');
		if (!context) {
			device.removeEventListener('uncapturederror', onGpuError);
			device.destroy();
			throw new Error('webgpu canvas context unavailable');
		}
		const format = navigator.gpu.getPreferredCanvasFormat();
		const contextOwner = Symbol('ink-context');
		contextOwners.set(canvasElement, contextOwner);

		try {
			context.configure({ device, format, alphaMode: 'premultiplied' });
			return initialize(
				device,
				context,
				format,
				contextOwner,
				onGpuError,
				light,
				canvasElement
			);
		} catch (error) {
			device.removeEventListener('uncapturederror', onGpuError);
			if (contextOwners.get(canvasElement) === contextOwner) {
				contextOwners.delete(canvasElement);
				try {
					context.unconfigure();
				} catch {
					/* an initialization error may leave the context unconfigured */
				}
			}
			device.destroy();
			throw error;
		}
	}

	function initialize(device, context, format, contextOwner, onGpuError, light, canvasElement) {
		const [tr, tg, tb] = hexToRgb(tint);

		// ————— sizing (smaller pots on smaller stoves) —————
		const lowTier =
			matchMedia('(pointer: coarse)').matches || matchMedia('(max-width: 720px)').matches;
		const dpr = Math.min(devicePixelRatio || 1, lowTier ? 1.5 : 2);
		const SIM_CAP = lowTier ? 224 : 320;
		const DYE_CAP = lowTier ? 640 : 896;
		const JACOBI = lowTier ? 5 : 8;
		const FRAME_MS = 1000 / (lowTier ? 24 : 30);
		let W = 8;
		let H = 8;
		let simW = 8;
		let simH = 8;
		let dyeW = 8;
		let dyeH = 8;

		// ————— WGSL —————
		const common = /* wgsl */ `
			struct Sim {
				simSize: vec2f,
				dyeSize: vec2f,
				dt: f32,
				velDiss: f32,
				dyeDiss: f32,
				curlAmt: f32,
			};
			@group(0) @binding(0) var<uniform> sim: Sim;
		`;

		const advectVel = /* wgsl */ `${common}
			@group(0) @binding(1) var smp: sampler;
			@group(0) @binding(2) var velIn: texture_2d<f32>;
			@group(0) @binding(3) var velOut: texture_storage_2d<rgba16float, write>;
			@compute @workgroup_size(8, 8)
			fn main(@builtin(global_invocation_id) id: vec3u) {
				if (id.x >= u32(sim.simSize.x) || id.y >= u32(sim.simSize.y)) { return; }
				let uv = (vec2f(id.xy) + 0.5) / sim.simSize;
				let vel = textureSampleLevel(velIn, smp, uv, 0.0).xy;
				let back = uv - sim.dt * vel / sim.simSize;
				let v = textureSampleLevel(velIn, smp, back, 0.0).xy * sim.velDiss;
				textureStore(velOut, id.xy, vec4f(v, 0.0, 1.0));
			}
		`;

		const advectDye = /* wgsl */ `${common}
			@group(0) @binding(1) var smp: sampler;
			@group(0) @binding(2) var velIn: texture_2d<f32>;
			@group(0) @binding(3) var dyeIn: texture_2d<f32>;
			@group(0) @binding(4) var dyeOut: texture_storage_2d<rgba16float, write>;
			@compute @workgroup_size(8, 8)
			fn main(@builtin(global_invocation_id) id: vec3u) {
				if (id.x >= u32(sim.dyeSize.x) || id.y >= u32(sim.dyeSize.y)) { return; }
				let uv = (vec2f(id.xy) + 0.5) / sim.dyeSize;
				let vel = textureSampleLevel(velIn, smp, uv, 0.0).xy;
				let back = uv - sim.dt * vel / sim.simSize;
				let d = textureSampleLevel(dyeIn, smp, back, 0.0).rgb * sim.dyeDiss;
				textureStore(dyeOut, id.xy, vec4f(d, 1.0));
			}
		`;

		// one splat shader reused for velocity (additive vec2) and dye (additive rgb)
		const splat = /* wgsl */ `${common}
			struct Splat {
				pos: vec2f,      // uv
				value: vec4f,    // velocity in xy, or color in rgb
				radius: f32,     // uv units
				isDye: f32,
			};
			@group(0) @binding(1) var<uniform> sp: Splat;
			@group(0) @binding(2) var fieldIn: texture_2d<f32>;
			@group(0) @binding(3) var fieldOut: texture_storage_2d<rgba16float, write>;
			@compute @workgroup_size(8, 8)
			fn main(@builtin(global_invocation_id) id: vec3u) {
				let size = select(sim.simSize, sim.dyeSize, sp.isDye > 0.5);
				if (id.x >= u32(size.x) || id.y >= u32(size.y)) { return; }
				let uv = (vec2f(id.xy) + 0.5) / size;
				var p = uv - sp.pos;
				p.x = p.x * (size.x / size.y);
				let g = exp(-dot(p, p) / (sp.radius * sp.radius));
				let base = textureLoad(fieldIn, id.xy, 0);
				let added = clamp(base + sp.value * g, vec4f(-400.0), vec4f(400.0));
				textureStore(fieldOut, id.xy, vec4f(added.xyz, 1.0));
			}
		`;

		const curlShader = /* wgsl */ `${common}
			@group(0) @binding(1) var velIn: texture_2d<f32>;
			@group(0) @binding(2) var curlOut: texture_storage_2d<rgba16float, write>;
			@compute @workgroup_size(8, 8)
			fn main(@builtin(global_invocation_id) id: vec3u) {
				let sz = vec2i(sim.simSize);
				if (id.x >= u32(sz.x) || id.y >= u32(sz.y)) { return; }
				let i = vec2i(id.xy);
				let l = textureLoad(velIn, clamp(i + vec2i(-1, 0), vec2i(0), sz - 1), 0).y;
				let r = textureLoad(velIn, clamp(i + vec2i( 1, 0), vec2i(0), sz - 1), 0).y;
				let b = textureLoad(velIn, clamp(i + vec2i(0, -1), vec2i(0), sz - 1), 0).x;
				let t = textureLoad(velIn, clamp(i + vec2i(0,  1), vec2i(0), sz - 1), 0).x;
				textureStore(curlOut, id.xy, vec4f(0.5 * ((r - l) - (t - b)), 0.0, 0.0, 1.0));
			}
		`;

		const vorticity = /* wgsl */ `${common}
			@group(0) @binding(1) var velIn: texture_2d<f32>;
			@group(0) @binding(2) var curlIn: texture_2d<f32>;
			@group(0) @binding(3) var velOut: texture_storage_2d<rgba16float, write>;
			@compute @workgroup_size(8, 8)
			fn main(@builtin(global_invocation_id) id: vec3u) {
				let sz = vec2i(sim.simSize);
				if (id.x >= u32(sz.x) || id.y >= u32(sz.y)) { return; }
				let i = vec2i(id.xy);
				let l = abs(textureLoad(curlIn, clamp(i + vec2i(-1, 0), vec2i(0), sz - 1), 0).x);
				let r = abs(textureLoad(curlIn, clamp(i + vec2i( 1, 0), vec2i(0), sz - 1), 0).x);
				let b = abs(textureLoad(curlIn, clamp(i + vec2i(0, -1), vec2i(0), sz - 1), 0).x);
				let t = abs(textureLoad(curlIn, clamp(i + vec2i(0,  1), vec2i(0), sz - 1), 0).x);
				let c = textureLoad(curlIn, i, 0).x;
				var force = 0.5 * vec2f(t - b, l - r);
				force = force / (length(force) + 0.0001);
				force = force * sim.curlAmt * c * vec2f(1.0, -1.0);
				let v = textureLoad(velIn, i, 0).xy + force * sim.dt;
				textureStore(velOut, id.xy, vec4f(clamp(v, vec2f(-1000.0), vec2f(1000.0)), 0.0, 1.0));
			}
		`;

		const divergence = /* wgsl */ `${common}
			@group(0) @binding(1) var velIn: texture_2d<f32>;
			@group(0) @binding(2) var divOut: texture_storage_2d<rgba16float, write>;
			@compute @workgroup_size(8, 8)
			fn main(@builtin(global_invocation_id) id: vec3u) {
				let sz = vec2i(sim.simSize);
				if (id.x >= u32(sz.x) || id.y >= u32(sz.y)) { return; }
				let i = vec2i(id.xy);
				let l = textureLoad(velIn, clamp(i + vec2i(-1, 0), vec2i(0), sz - 1), 0).x;
				let r = textureLoad(velIn, clamp(i + vec2i( 1, 0), vec2i(0), sz - 1), 0).x;
				let b = textureLoad(velIn, clamp(i + vec2i(0, -1), vec2i(0), sz - 1), 0).y;
				let t = textureLoad(velIn, clamp(i + vec2i(0,  1), vec2i(0), sz - 1), 0).y;
				textureStore(divOut, id.xy, vec4f(0.5 * (r - l + t - b), 0.0, 0.0, 1.0));
			}
		`;

		const jacobi = /* wgsl */ `${common}
			@group(0) @binding(1) var prsIn: texture_2d<f32>;
			@group(0) @binding(2) var divIn: texture_2d<f32>;
			@group(0) @binding(3) var prsOut: texture_storage_2d<rgba16float, write>;
			@compute @workgroup_size(8, 8)
			fn main(@builtin(global_invocation_id) id: vec3u) {
				let sz = vec2i(sim.simSize);
				if (id.x >= u32(sz.x) || id.y >= u32(sz.y)) { return; }
				let i = vec2i(id.xy);
				let l = textureLoad(prsIn, clamp(i + vec2i(-1, 0), vec2i(0), sz - 1), 0).x;
				let r = textureLoad(prsIn, clamp(i + vec2i( 1, 0), vec2i(0), sz - 1), 0).x;
				let b = textureLoad(prsIn, clamp(i + vec2i(0, -1), vec2i(0), sz - 1), 0).x;
				let t = textureLoad(prsIn, clamp(i + vec2i(0,  1), vec2i(0), sz - 1), 0).x;
				let d = textureLoad(divIn, i, 0).x;
				textureStore(prsOut, id.xy, vec4f((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0));
			}
		`;

		const gradient = /* wgsl */ `${common}
			@group(0) @binding(1) var prsIn: texture_2d<f32>;
			@group(0) @binding(2) var velIn: texture_2d<f32>;
			@group(0) @binding(3) var velOut: texture_storage_2d<rgba16float, write>;
			@compute @workgroup_size(8, 8)
			fn main(@builtin(global_invocation_id) id: vec3u) {
				let sz = vec2i(sim.simSize);
				if (id.x >= u32(sz.x) || id.y >= u32(sz.y)) { return; }
				let i = vec2i(id.xy);
				let l = textureLoad(prsIn, clamp(i + vec2i(-1, 0), vec2i(0), sz - 1), 0).x;
				let r = textureLoad(prsIn, clamp(i + vec2i( 1, 0), vec2i(0), sz - 1), 0).x;
				let b = textureLoad(prsIn, clamp(i + vec2i(0, -1), vec2i(0), sz - 1), 0).x;
				let t = textureLoad(prsIn, clamp(i + vec2i(0,  1), vec2i(0), sz - 1), 0).x;
				let v = textureLoad(velIn, i, 0).xy - 0.5 * vec2f(r - l, t - b);
				textureStore(velOut, id.xy, vec4f(v, 0.0, 1.0));
			}
		`;

		// dye → screen: ink over dark slate, faux depth from density gradient
		const render = /* wgsl */ `
			struct VOut {
				@builtin(position) pos: vec4f,
				@location(0) uv: vec2f,
			};
			@vertex
			fn vs(@builtin(vertex_index) vi: u32) -> VOut {
				var p = array<vec2f, 3>(vec2f(-1.0, -3.0), vec2f(-1.0, 1.0), vec2f(3.0, 1.0));
				var out: VOut;
				out.pos = vec4f(p[vi], 0.0, 1.0);
				out.uv = vec2f(p[vi].x * 0.5 + 0.5, 0.5 - p[vi].y * 0.5);
				return out;
			}
			@group(0) @binding(0) var smp: sampler;
			@group(0) @binding(1) var dye: texture_2d<f32>;
			@fragment
			fn fs(in: VOut) -> @location(0) vec4f {
				let d = textureSampleLevel(dye, smp, in.uv, 0.0).rgb;
				let lum = dot(d, vec3f(0.299, 0.587, 0.114));
				let t = lum / (0.55 + lum); // soft rolloff, hue preserved
				let hue = d / max(lum, 0.001);
				${light
					? `// pigment soaking into paper: deepens with density
				var col = hue * (0.78 - 0.34 * t);
				let a = clamp(pow(t, 0.9) * 1.45, 0.0, 0.85);`
					: `var col = hue * (0.32 + 0.75 * t);
				// dense cores settle slightly deeper, like pooled ink
				col = col * (1.0 - 0.22 * smoothstep(0.55, 1.0, t));
				let a = clamp(pow(t, 0.9) * 1.6, 0.0, 0.92);`}
				// premultiplied output over transparent canvas
				return vec4f(col * a, a);
			}
		`;

		// ————— pipelines —————
		const mk = (code) =>
			device.createComputePipeline({
				layout: 'auto',
				compute: { module: device.createShaderModule({ code }), entryPoint: 'main' }
			});

		const pAdvVel = mk(advectVel);
		const pAdvDye = mk(advectDye);
		const pSplat = mk(splat);
		const pCurl = mk(curlShader);
		const pVort = mk(vorticity);
		const pDiv = mk(divergence);
		const pJacobi = mk(jacobi);
		const pGrad = mk(gradient);

		const renderModule = device.createShaderModule({ code: render });
		const pRender = device.createRenderPipeline({
			layout: 'auto',
			vertex: { module: renderModule, entryPoint: 'vs' },
			fragment: {
				module: renderModule,
				entryPoint: 'fs',
				targets: [
					{
						format,
						blend: {
							color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
							alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' }
						}
					}
				]
			},
			primitive: { topology: 'triangle-list' }
		});

		const sampler = device.createSampler({
			magFilter: 'linear',
			minFilter: 'linear',
			addressModeU: 'clamp-to-edge',
			addressModeV: 'clamp-to-edge'
		});

		// ————— buffers —————
		const simUniform = device.createBuffer({
			size: 32,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		});
		// The landing gesture needs at most eleven splats in one command buffer.
		// Keep a small fixed pool so uniforms never alias within that submission.
		const splatPool = Array.from({ length: 16 }, () =>
			device.createBuffer({ size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
		);
		const simValues = new Float32Array(8);
		const splatValues = new Float32Array(12);
		let splatsThisEncoder = 0;
		const u = { buffer: simUniform };

		// ————— textures and binding cache (recreated only on resize) —————
		let tex = null;
		let bindings = null;
		let velRead = 0;
		let dyeRead = 0;
		let prsRead = 0;
		let gSimX = 1;
		let gSimY = 1;
		let gDyeX = 1;
		let gDyeY = 1;

		function makeTex(w, h) {
			return device.createTexture({
				size: { width: w, height: h },
				format: 'rgba16float',
				usage:
					GPUTextureUsage.TEXTURE_BINDING |
					GPUTextureUsage.STORAGE_BINDING |
					GPUTextureUsage.COPY_DST |
					GPUTextureUsage.COPY_SRC
			});
		}

		function bind(pipeline, resources) {
			return device.createBindGroup({
				layout: pipeline.getBindGroupLayout(0),
				entries: resources.map((resource, binding) => ({ binding, resource }))
			});
		}

		function allocate() {
			tex?.all.forEach((t) => t.destroy());
			const all = [];
			const t = (w, h) => {
				const x = makeTex(w, h);
				all.push(x);
				return x;
			};
			tex = {
				vel: [t(simW, simH), t(simW, simH)],
				dye: [t(dyeW, dyeH), t(dyeW, dyeH)],
				prs: [t(simW, simH), t(simW, simH)],
				div: t(simW, simH),
				curl: t(simW, simH),
				all
			};
			const view = {
				vel: tex.vel.map((texture) => texture.createView()),
				dye: tex.dye.map((texture) => texture.createView()),
				prs: tex.prs.map((texture) => texture.createView()),
				div: tex.div.createView(),
				curl: tex.curl.createView()
			};
			const pair = (pipeline, fixed, fields) =>
				[0, 1].map((read) => bind(pipeline, [...fixed, fields[read], fields[read ^ 1]]));

			bindings = {
				advVel: pair(pAdvVel, [u, sampler], view.vel),
				curl: [0, 1].map((read) => bind(pCurl, [u, view.vel[read], view.curl])),
				vort: [0, 1].map((read) =>
					bind(pVort, [u, view.vel[read], view.curl, view.vel[read ^ 1]])
				),
				div: [0, 1].map((read) => bind(pDiv, [u, view.vel[read], view.div])),
				jacobi: [0, 1].map((read) =>
					bind(pJacobi, [u, view.prs[read], view.div, view.prs[read ^ 1]])
				),
				grad: [0, 1].map((pressure) =>
					[0, 1].map((velocity) =>
						bind(pGrad, [
							u,
							view.prs[pressure],
							view.vel[velocity],
							view.vel[velocity ^ 1]
						])
					)
				),
				advDye: [0, 1].map((velocity) =>
					[0, 1].map((dye) =>
						bind(pAdvDye, [u, sampler, view.vel[velocity], view.dye[dye], view.dye[dye ^ 1]])
					)
				),
				render: [0, 1].map((dye) => bind(pRender, [sampler, view.dye[dye]])),
				splat: {
					vel: splatPool.map((buffer) =>
						[0, 1].map((read) =>
							bind(pSplat, [u, { buffer }, view.vel[read], view.vel[read ^ 1]])
						)
					),
					dye: splatPool.map((buffer) =>
						[0, 1].map((read) =>
							bind(pSplat, [u, { buffer }, view.dye[read], view.dye[read ^ 1]])
						)
					)
				}
			};
			velRead = 0;
			dyeRead = 0;
			prsRead = 0;
			gSimX = Math.ceil(simW / 8);
			gSimY = Math.ceil(simH / 8);
			gDyeX = Math.ceil(dyeW / 8);
			gDyeY = Math.ceil(dyeH / 8);
		}

		function resize() {
			const rect = parent.getBoundingClientRect();
			const nW = Math.max(8, Math.round(rect.width * dpr));
			const nH = Math.max(8, Math.round(rect.height * dpr));
			// ResizeObserver fires once on observe — don't nuke the fields for a no-op
			if (nW === W && nH === H) return;
			W = nW;
			H = nH;
			canvasElement.width = W;
			canvasElement.height = H;
			canvasElement.style.width = `${rect.width}px`;
			canvasElement.style.height = `${rect.height}px`;
			const simScale = SIM_CAP / Math.max(W, H);
			simW = Math.max(8, Math.round(W * Math.min(1, simScale)));
			simH = Math.max(8, Math.round(H * Math.min(1, simScale)));
			const dyeScale = DYE_CAP / Math.max(W, H);
			dyeW = Math.max(8, Math.round(W * Math.min(1, dyeScale)));
			dyeH = Math.max(8, Math.round(H * Math.min(1, dyeScale)));
			allocate();
			simValues[0] = simW;
			simValues[1] = simH;
			simValues[2] = dyeW;
			simValues[3] = dyeH;
			simValues[4] = 0.016;
			simValues[5] = 0.9992;
			simValues[6] = 0.9988;
			simValues[7] = 24;
			device.queue.writeBuffer(simUniform, 0, simValues);
		}

		// ————— dispatch helpers —————
		function dispatch(pass, pipeline, binding, gx, gy) {
			pass.setPipeline(pipeline);
			pass.setBindGroup(0, binding);
			pass.dispatchWorkgroups(gx, gy);
		}

		function doSplat(pass, x, y, vx, vy, vz, radius, isDye) {
			if (splatsThisEncoder >= splatPool.length) return;
			const poolIndex = splatsThisEncoder++;
			splatValues.fill(0);
			splatValues[0] = x;
			splatValues[1] = y;
			splatValues[4] = vx;
			splatValues[5] = vy;
			splatValues[6] = vz;
			splatValues[8] = radius;
			splatValues[9] = isDye ? 1 : 0;
			device.queue.writeBuffer(splatPool[poolIndex], 0, splatValues);
			if (isDye) {
				dispatch(pass, pSplat, bindings.splat.dye[poolIndex][dyeRead], gDyeX, gDyeY);
				dyeRead ^= 1;
			} else {
				dispatch(pass, pSplat, bindings.splat.vel[poolIndex][velRead], gSimX, gSimY);
				velRead ^= 1;
			}
		}

		// ————— frame —————
		let raf = 0;
		let running = false;
		let last = 0;
		let lastFrame = 0;
		let time = 0;
		const pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, active: false };

		// dye palette: accent leads; garnish is cream at night, sepia by day.
		// very light spices (the menu's cream) become sepia ink on paper.
		const tooLight = 0.299 * tr + 0.587 * tg + 0.114 * tb > 0.68;
		const base = light && tooLight ? [0.42, 0.33, 0.2] : [tr, tg, tb];
		const palette = light
			? [base, [base[0] * 0.55, base[1] * 0.5, base[2] * 0.45], [0.3, 0.24, 0.16]]
			: [
					[tr, tg, tb],
					[tr * 0.6, tg * 0.5, tb * 0.45],
					[0.93, 0.9, 0.85]
				];

		/**
		 * The single gesture: a thin stream poured from above — like sauce
		 * finished tableside — that lands, blooms into one slow vortex and
		 * marbles for the better part of a minute. One pour at a time,
		 * the next one only after the plate has gone quiet.
		 */
		let pour = null;
		let pourCount = 0;
		let nextPour = 0.4;
		const easeOut = (k) => 1 - Math.pow(1 - k, 3);

		function beginPour() {
			const first = pourCount === 0;
			pour = {
				x: first ? 0.72 : 0.58 + Math.random() * 0.28,
				yTo: first ? 0.4 : 0.3 + Math.random() * 0.2,
				t0: time,
				dur: 1.15,
				col: palette[pourCount % palette.length],
				s: (first ? 1.5 : 0.9 + Math.random() * 0.5) * intensity,
				spin: pourCount % 2 ? 1 : -1
			};
			pourCount++;
		}

		function stepPour(pass) {
			const k = (time - pour.t0) / pour.dur;
			if (k < 1) {
				// the falling stream — dye laid down along an easing path
				const y = 0.02 + (pour.yTo - 0.02) * easeOut(k);
				const c = pour.col;
				const w = 0.014 * pour.s * (1 + 0.3 * Math.sin(k * 9)); // living stream width
				doSplat(pass, pour.x, y, c[0] * 1.1, c[1] * 1.1, c[2] * 1.1, w, true);
				doSplat(pass, pour.x, y, 0, 34 * pour.s, 0, 0.016 * pour.s, false);
				return;
			}
			// landing: the pool receives the pour, then one slow vortex bloom
			const { x, yTo: y, s, spin, col } = pour;
			doSplat(pass, x, y, col[0] * 0.55, col[1] * 0.55, col[2] * 0.55, 0.05 * s, true);
			for (let i = 0; i < 6; i++) {
				const a = (i / 6) * Math.PI * 2;
				const rx = x + Math.cos(a) * 0.024 * s;
				const ry = y + Math.sin(a) * 0.024 * s;
				const tx = -Math.sin(a) * spin;
				const ty = Math.cos(a) * spin;
				doSplat(
					pass,
					rx,
					ry,
					(Math.cos(a) * 0.4 + tx) * 52 * s,
					(Math.sin(a) * 0.4 + ty) * 52 * s,
					0,
					0.02 * s,
					false
				);
			}
			// three dots of sauce, set just so — the chef's signature
			for (let i = 0; i < 3; i++) {
				const c = palette[i % palette.length];
				doSplat(
					pass,
					x - 0.1 - i * 0.05,
					y + 0.16,
					c[0] * 0.55,
					c[1] * 0.55,
					c[2] * 0.55,
					0.01,
					true
				);
			}
			pour = null;
			nextPour = time + 38 + Math.random() * 22;
		}

		/** @type {GPURenderPassColorAttachment} */
		const renderAttachment = {
			view: context.getCurrentTexture().createView(),
			clearValue: { r: 0, g: 0, b: 0, a: 0 },
			loadOp: 'clear',
			storeOp: 'store'
		};
		/** @type {GPURenderPassDescriptor} */
		const renderDescriptor = { colorAttachments: [renderAttachment] };
		/** @type {GPUCommandBuffer[]} */
		const submission = [];

		function frame(ts) {
			if (!running) return;
			raf = requestAnimationFrame(frame);
			if (ts - lastFrame < FRAME_MS) return;
			lastFrame = ts;
			const dt = Math.min((ts - last) / 1000, 1 / 30) || 1 / 60;
			last = ts;
			time += dt;

			const enc = device.createCommandEncoder();
			// All simulation dispatches share one compute pass. Bind groups and
			// texture views were cached at allocation time, so a steady frame only
			// creates the command encoder and the required swap-chain view.
			const compute = enc.beginComputePass();

			if (pour) stepPour(compute);
			else if (time > nextPour) beginPour();

			// pointer stirring — gentle, never painting
			if (pointer.active && (Math.abs(pointer.dx) + Math.abs(pointer.dy)) > 0.0005) {
				doSplat(compute, pointer.x, pointer.y, pointer.dx * 900, pointer.dy * 900, 0, 0.025, false);
				pointer.dx = 0;
				pointer.dy = 0;
			}

			// advect velocity
			dispatch(compute, pAdvVel, bindings.advVel[velRead], gSimX, gSimY);
			velRead ^= 1;
			// vorticity confinement
			dispatch(compute, pCurl, bindings.curl[velRead], gSimX, gSimY);
			dispatch(compute, pVort, bindings.vort[velRead], gSimX, gSimY);
			velRead ^= 1;
			// pressure projection
			dispatch(compute, pDiv, bindings.div[velRead], gSimX, gSimY);
			for (let i = 0; i < JACOBI; i++) {
				dispatch(compute, pJacobi, bindings.jacobi[prsRead], gSimX, gSimY);
				prsRead ^= 1;
			}
			dispatch(compute, pGrad, bindings.grad[prsRead][velRead], gSimX, gSimY);
			velRead ^= 1;
			// advect dye
			dispatch(compute, pAdvDye, bindings.advDye[velRead][dyeRead], gDyeX, gDyeY);
			dyeRead ^= 1;
			compute.end();

			// render
			renderAttachment.view = context.getCurrentTexture().createView();
			const pass = enc.beginRenderPass(renderDescriptor);
			pass.setPipeline(pRender);
			pass.setBindGroup(0, bindings.render[dyeRead]);
			pass.draw(3);
			pass.end();

			submission[0] = enc.finish();
			device.queue.submit(submission);
			splatsThisEncoder = 0;
		}

		let intersecting = false;
		let pageVisible = !document.hidden;
		let disposed = false;
		function start() {
			if (running || disposed) return;
			running = true;
			last = performance.now();
			lastFrame = last - FRAME_MS;
			raf = requestAnimationFrame(frame);
		}

		function stop() {
			running = false;
			cancelAnimationFrame(raf);
			raf = 0;
		}

		function syncRunning() {
			if (pageVisible && intersecting) start();
			else stop();
		}

		function onPointer(e) {
			const rect = canvasElement.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = (e.clientY - rect.top) / rect.height;
			if (pointer.active) {
				pointer.dx += x - pointer.x;
				pointer.dy += y - pointer.y;
			}
			pointer.x = x;
			pointer.y = y;
			pointer.active = true;
		}

		function onLeave() {
			pointer.active = false;
		}

		let ro;
		let io;
		let onVis;
		let parent;

		function shutdown(destroyDevice = true) {
			if (disposed) return;
			disposed = true;
			stop();
			ro?.disconnect();
			io?.disconnect();
			if (onVis) document.removeEventListener('visibilitychange', onVis);
			parent?.removeEventListener('pointermove', onPointer);
			parent?.removeEventListener('pointerleave', onLeave);
			tex?.all.forEach((t) => t.destroy());
			simUniform.destroy();
			splatPool.forEach((buffer) => buffer.destroy());
			device.removeEventListener('uncapturederror', onGpuError);
			if (contextOwners.get(canvasElement) === contextOwner) {
				contextOwners.delete(canvasElement);
				context.unconfigure();
			}
			if (destroyDevice) device.destroy();
		}

		try {
			parent = canvasElement.parentElement;
			if (!parent) throw new Error('ink canvas has no layout parent');
			resize();

			ro = new ResizeObserver(() => resize());
			ro.observe(parent);
			io = new IntersectionObserver(([e]) => {
				intersecting = e.isIntersecting;
				syncRunning();
			});
			io.observe(canvasElement);
			onVis = () => {
				pageVisible = !document.hidden;
				syncRunning();
			};
			document.addEventListener('visibilitychange', onVis);
			parent.addEventListener('pointermove', onPointer, { passive: true });
			parent.addEventListener('pointerleave', onLeave, { passive: true });

			device.lost.then((info) => {
				if (disposed) return;
				console.warn(`[ink] gpu device lost (${info.reason}): ${info.message || 'no detail'}`);
				shutdown(false);
				webgpuFailed = true;
			});
		} catch (error) {
			shutdown(false);
			throw error;
		}

		return () => shutdown(true);
	}
</script>

{#if webgpuFailed || reduced}
	<FlowField tint={isLight ? pigmentHex : tint} light={isLight} class={className} />
{:else}
	<canvas bind:this={canvas} class={className} aria-hidden="true"></canvas>
{/if}

<style>
	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		-webkit-mask-image: radial-gradient(118% 112% at 82% 30%, black 36%, transparent 68%);
		mask-image: radial-gradient(118% 112% at 82% 30%, black 36%, transparent 68%);
	}
</style>
