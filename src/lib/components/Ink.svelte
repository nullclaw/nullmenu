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

	let { tint = '#e8ddc9', intensity = 1, class: className = '' } = $props();

	let canvas = $state();
	let webgpuFailed = $state(false);
	let reduced = $state(false);

	function hexToRgb(hex) {
		const n = parseInt(hex.slice(1), 16);
		return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
	}

	$effect(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced || !navigator.gpu) {
			webgpuFailed = true;
			return;
		}
		let dead = false;
		let cleanup = () => {};
		boot()
			.then((c) => {
				if (dead) c?.();
				else cleanup = c ?? (() => {});
			})
			.catch((e) => {
				console.warn('[ink] webgpu unavailable:', e?.message ?? e);
				webgpuFailed = true;
			});
		return () => {
			dead = true;
			cleanup();
		};
	});

	async function boot() {
		const adapter = await navigator.gpu.requestAdapter();
		if (!adapter) throw new Error('no adapter');
		const device = await adapter.requestDevice();
		device.addEventListener('uncapturederror', (e) =>
			console.warn('[ink] gpu error:', e.error?.message)
		);
		const context = canvas.getContext('webgpu');
		const format = navigator.gpu.getPreferredCanvasFormat();
		context.configure({ device, format, alphaMode: 'premultiplied' });

		const [tr, tg, tb] = hexToRgb(tint);

		// ————— sizing —————
		const dpr = Math.min(devicePixelRatio || 1, 2);
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
				var col = hue * (0.32 + 0.75 * t);
				// dense cores settle slightly deeper, like pooled ink
				col = col * (1.0 - 0.22 * smoothstep(0.55, 1.0, t));
				let a = clamp(pow(t, 0.9) * 1.6, 0.0, 0.92);
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
		// pool of splat-uniform buffers: writeBuffer lands before submit, so
		// every splat recorded into one encoder needs its own buffer. If an
		// encoder ever wants more, we drop the extras — never alias.
		const splatPool = Array.from({ length: 128 }, () =>
			device.createBuffer({ size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
		);
		let splatIdx = 0;
		let splatsThisEncoder = 0;

		// ————— textures (recreated on resize) —————
		let tex = null;

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
		}

		function resize() {
			const rect = canvas.parentElement.getBoundingClientRect();
			const nW = Math.max(8, Math.round(rect.width * dpr));
			const nH = Math.max(8, Math.round(rect.height * dpr));
			// ResizeObserver fires once on observe — don't nuke the fields for a no-op
			if (nW === W && nH === H) return;
			W = nW;
			H = nH;
			canvas.width = W;
			canvas.height = H;
			canvas.style.width = `${rect.width}px`;
			canvas.style.height = `${rect.height}px`;
			const simScale = 384 / Math.max(W, H);
			simW = Math.max(8, Math.round(W * Math.min(1, simScale)));
			simH = Math.max(8, Math.round(H * Math.min(1, simScale)));
			const dyeScale = 1024 / Math.max(W, H);
			dyeW = Math.max(8, Math.round(W * Math.min(1, dyeScale)));
			dyeH = Math.max(8, Math.round(H * Math.min(1, dyeScale)));
			allocate();
			device.queue.writeBuffer(
				simUniform,
				0,
				new Float32Array([simW, simH, dyeW, dyeH, 0.016, 0.999, 0.998, 36.0])
			);
		}

		// ————— dispatch helpers —————
		const groups = (w, h) => [Math.ceil(w / 8), Math.ceil(h / 8)];

		function computePass(enc, pipeline, entries, [gx, gy]) {
			const pass = enc.beginComputePass();
			pass.setPipeline(pipeline);
			pass.setBindGroup(
				0,
				device.createBindGroup({
					layout: pipeline.getBindGroupLayout(0),
					entries: entries.map((resource, i) => ({ binding: i, resource }))
				})
			);
			pass.dispatchWorkgroups(gx, gy);
			pass.end();
		}

		const u = { buffer: simUniform };

		function doSplat(enc, pos, value, radius, isDye) {
			if (splatsThisEncoder >= splatPool.length) return;
			splatsThisEncoder++;
			const buf = splatPool[splatIdx++ % splatPool.length];
			device.queue.writeBuffer(
				buf,
				0,
				new Float32Array([
					pos[0], pos[1], 0, 0,
					value[0], value[1], value[2] ?? 0, 0,
					radius, isDye ? 1 : 0, 0, 0
				])
			);
			const field = isDye ? tex.dye : tex.vel;
			const size = isDye ? [dyeW, dyeH] : [simW, simH];
			computePass(
				enc,
				pSplat,
				[{ buffer: simUniform }, { buffer: buf }, field[0].createView(), field[1].createView()],
				groups(...size)
			);
			field.reverse();
		}

		// ————— frame —————
		let raf = 0;
		let running = false;
		let last = 0;
		let time = 0;
		let nextDrop = 0.6;
		const pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, active: false };

		// dye palette: accent, deeper accent, cream — layered ink feels dimensional
		const palette = [
			[tr, tg, tb],
			[tr, tg, tb],
			[tr * 0.6, tg * 0.5, tb * 0.45],
			[0.93, 0.9, 0.85]
		];

		function drop(enc, x, y, sizeMul = 1) {
			const col = palette[(Math.random() * palette.length) | 0];
			const s = (0.5 + Math.random() * 0.8) * sizeMul * intensity;
			doSplat(enc, [x, y], [col[0] * 0.44 * s, col[1] * 0.44 * s, col[2] * 0.44 * s], 0.042 * s, true);
			// vortex ring — six tangential impulses shear the ink into tendrils
			const spin = Math.random() < 0.5 ? 1 : -1;
			for (let k = 0; k < 6; k++) {
				const a = (k / 6) * Math.PI * 2 + Math.random() * 0.5;
				const rx = x + Math.cos(a) * 0.026 * s;
				const ry = y + Math.sin(a) * 0.026 * s;
				const tx = -Math.sin(a) * spin;
				const ty = Math.cos(a) * spin;
				doSplat(enc, [rx, ry], [(Math.cos(a) * 0.5 + tx) * 130 * s, (Math.sin(a) * 0.5 + ty) * 130 * s], 0.018 * s, false);
			}
			// satellite droplets — vortex pairs make the marbling
			for (let k = 0; k < 2; k++) {
				const a = Math.random() * Math.PI * 2;
				const d = 0.05 + Math.random() * 0.04;
				const sx = x + Math.cos(a) * d;
				const sy = y + Math.sin(a) * d;
				const sc = palette[(Math.random() * palette.length) | 0];
				doSplat(enc, [sx, sy], [sc[0] * 0.28 * s, sc[1] * 0.28 * s, sc[2] * 0.28 * s], 0.02 * s, true);
				doSplat(enc, [sx, sy], [Math.cos(a + 2) * 90 * s, Math.sin(a + 2) * 90 * s], 0.02 * s, false);
			}
		}

		function frame(ts) {
			raf = requestAnimationFrame(frame);
			const dt = Math.min((ts - last) / 1000, 1 / 30) || 1 / 60;
			last = ts;
			time += dt;

			const enc = device.createCommandEncoder();

			// autonomous droplets — unhurried, biased right so the type breathes
			if (time > nextDrop) {
				nextDrop = time + 3.2 + Math.random() * 3.2;
				drop(enc, 0.55 + Math.random() * 0.38, 0.12 + Math.random() * 0.5, 1.5);
			}

			// pointer stirring
			if (pointer.active && (Math.abs(pointer.dx) + Math.abs(pointer.dy)) > 0.0005) {
				doSplat(
					enc,
					[pointer.x, pointer.y],
					[pointer.dx * 1600, pointer.dy * 1600],
					0.022,
					false
				);
				pointer.dx = 0;
				pointer.dy = 0;
			}

			const gSim = groups(simW, simH);
			const gDye = groups(dyeW, dyeH);

			// advect velocity
			computePass(enc, pAdvVel, [u, sampler, tex.vel[0].createView(), tex.vel[1].createView()], gSim);
			tex.vel.reverse();
			// vorticity confinement
			computePass(enc, pCurl, [u, tex.vel[0].createView(), tex.curl.createView()], gSim);
			computePass(enc, pVort, [u, tex.vel[0].createView(), tex.curl.createView(), tex.vel[1].createView()], gSim);
			tex.vel.reverse();
			// pressure projection
			computePass(enc, pDiv, [u, tex.vel[0].createView(), tex.div.createView()], gSim);
			for (let i = 0; i < 22; i++) {
				computePass(enc, pJacobi, [u, tex.prs[0].createView(), tex.div.createView(), tex.prs[1].createView()], gSim);
				tex.prs.reverse();
			}
			computePass(enc, pGrad, [u, tex.prs[0].createView(), tex.vel[0].createView(), tex.vel[1].createView()], gSim);
			tex.vel.reverse();
			// advect dye
			computePass(enc, pAdvDye, [u, sampler, tex.vel[0].createView(), tex.dye[0].createView(), tex.dye[1].createView()], gDye);
			tex.dye.reverse();

			// render
			const pass = enc.beginRenderPass({
				colorAttachments: [
					{
						view: context.getCurrentTexture().createView(),
						clearValue: { r: 0, g: 0, b: 0, a: 0 },
						loadOp: 'clear',
						storeOp: 'store'
					}
				]
			});
			pass.setPipeline(pRender);
			pass.setBindGroup(
				0,
				device.createBindGroup({
					layout: pRender.getBindGroupLayout(0),
					entries: [
						{ binding: 0, resource: sampler },
						{ binding: 1, resource: tex.dye[0].createView() }
					]
				})
			);
			pass.draw(3);
			pass.end();

			device.queue.submit([enc.finish()]);
			splatsThisEncoder = 0;
		}


		function start() {
			if (running) return;
			running = true;
			last = performance.now();
			raf = requestAnimationFrame(frame);
		}

		function stop() {
			running = false;
			cancelAnimationFrame(raf);
		}

		function onPointer(e) {
			const rect = canvas.getBoundingClientRect();
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

		resize();

		// opening pour — the hero comes alive immediately
		{
			const enc = device.createCommandEncoder();
			drop(enc, 0.72, 0.36, 2.4);
			drop(enc, 0.55, 0.68, 1.6);
			drop(enc, 0.86, 0.6, 1.2);
			device.queue.submit([enc.finish()]);
			splatsThisEncoder = 0;
		}

		const ro = new ResizeObserver(() => resize());
		ro.observe(canvas.parentElement);
		const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
		io.observe(canvas);
		const onVis = () => (document.hidden ? stop() : start());
		document.addEventListener('visibilitychange', onVis);
		const parent = canvas.parentElement;
		parent.addEventListener('pointermove', onPointer, { passive: true });
		parent.addEventListener('pointerleave', onLeave, { passive: true });

		return () => {
			stop();
			ro.disconnect();
			io.disconnect();
			document.removeEventListener('visibilitychange', onVis);
			parent.removeEventListener('pointermove', onPointer);
			parent.removeEventListener('pointerleave', onLeave);
			tex?.all.forEach((t) => t.destroy());
			device.destroy();
		};
	}
</script>

{#if webgpuFailed}
	<FlowField {tint} class={className} />
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
