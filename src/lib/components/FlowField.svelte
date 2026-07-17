<script>
	/**
	 * Signature ambient effect: smoke / steam drifting through a curl-noise
	 * flow field, tinted with the site accent. Canvas 2D, additive strokes,
	 * destination-out fading so the canvas stays transparent.
	 *
	 * Respects prefers-reduced-motion (renders a single still frame),
	 * pauses when offscreen or when the tab is hidden.
	 */
	let {
		tint = '#e8ddc9',
		density = 1,
		speed = 1,
		opacity = 0.5,
		light = false,
		class: className = ''
	} = $props();

	let canvas = $state();

	// — tiny value-noise (deterministic, no deps) —
	function makeNoise(seed) {
		const perm = new Uint8Array(512);
		let s = seed >>> 0;
		const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
		const p = Array.from({ length: 256 }, (_, i) => i);
		for (let i = 255; i > 0; i--) {
			const j = (rand() * (i + 1)) | 0;
			[p[i], p[j]] = [p[j], p[i]];
		}
		for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
		const grad = (h, x, y) => ((h & 1 ? -x : x) + (h & 2 ? -y : y)) * 0.7071;
		const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
		return (x, y) => {
			const X = Math.floor(x) & 255;
			const Y = Math.floor(y) & 255;
			x -= Math.floor(x);
			y -= Math.floor(y);
			const u = fade(x);
			const v = fade(y);
			const a = perm[X] + Y;
			const b = perm[X + 1] + Y;
			const g00 = grad(perm[a], x, y);
			const g10 = grad(perm[b], x - 1, y);
			const g01 = grad(perm[a + 1], x, y - 1);
			const g11 = grad(perm[b + 1], x - 1, y - 1);
			return g00 + u * (g10 - g00) + v * (g01 - g00 + u * (g11 - g10 - (g01 - g00)));
		};
	}

	function hexToRgb(hex) {
		const n = parseInt(hex.slice(1), 16);
		return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	}

	$effect(() => {
		if (!canvas) return;

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const ctx = canvas.getContext('2d');
		const noise = makeNoise(1337);
		const [tr, tg, tb] = hexToRgb(tint);

		let w = 0;
		let h = 0;
		let dpr = Math.min(devicePixelRatio || 1, 2);
		let particles = [];
		let raf = 0;
		let running = false;
		let time = Math.random() * 100;
		let mouse = { x: -1e4, y: -1e4 };

		function resize() {
			const rect = canvas.parentElement.getBoundingClientRect();
			const nw = Math.max(1, rect.width);
			const nh = Math.max(1, rect.height);
			// setting canvas.width clears the buffer — skip no-op resizes
			if (nw === w && nh === h) return;
			w = nw;
			h = nh;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			const target = Math.min(900, Math.round(((w * h) / 2600) * density));
			particles = Array.from({ length: target }, () => spawn(true));
			if (reduced) drawStillFrame();
		}

		function drawStillFrame() {
			// long faint streamlines instead of animation
			ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
			for (const p of particles.slice(0, 260)) {
				let { x, y } = p;
				ctx.strokeStyle = `rgba(${tr},${tg},${tb},${0.05 * opacity})`;
				ctx.lineWidth = p.weight;
				ctx.beginPath();
				ctx.moveTo(x, y);
				for (let i = 0; i < 26; i++) {
					const [vx, vy] = field(x, y, 0);
					x += vx * 0.55;
					y += vy * 0.55;
					ctx.lineTo(x, y);
				}
				ctx.stroke();
			}
		}

		function spawn(anywhere = false) {
			return {
				x: Math.random() * w,
				y: anywhere ? Math.random() * h : h + 10 + Math.random() * 40,
				px: 0,
				py: 0,
				life: 0,
				max: 240 + Math.random() * 320,
				weight: 0.5 + Math.random() * 1.1
			};
		}

		const SCALE = 0.0016;
		const EPS = 0.75;

		function field(x, y, t) {
			// curl of scalar noise → divergence-free swirl, plus upward draft
			const nx = x * SCALE;
			const ny = y * SCALE;
			const dx = (noise(nx, ny + EPS * SCALE * 40 + t) - noise(nx, ny - EPS * SCALE * 40 + t)) * 2;
			const dy = (noise(nx + EPS * SCALE * 40, ny + t) - noise(nx - EPS * SCALE * 40, ny + t)) * 2;
			let vx = dx * 22;
			let vy = -dy * 22 - 5.5; // steam rises

			// gentle pointer swirl
			const mdx = x - mouse.x;
			const mdy = y - mouse.y;
			const md2 = mdx * mdx + mdy * mdy;
			if (md2 < 32400) {
				const f = (1 - Math.sqrt(md2) / 180) * 14;
				vx += (-mdy / 180) * f;
				vy += (mdx / 180) * f;
			}
			return [vx, vy];
		}

		function step(dt) {
			// fade previous frame, preserving transparency
			ctx.globalCompositeOperation = 'destination-out';
			ctx.fillStyle = `rgba(0,0,0,${reduced ? 1 : 0.055})`;
			ctx.fillRect(0, 0, w, h);
			ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
			ctx.lineCap = 'round';

			for (const p of particles) {
				const [vx, vy] = field(p.x, p.y, time);
				p.px = p.x;
				p.py = p.y;
				p.x += vx * dt * speed;
				p.y += vy * dt * speed;
				p.life++;

				const frac = p.life / p.max;
				if (frac >= 1 || p.x < -20 || p.x > w + 20 || p.y < -30) {
					Object.assign(p, spawn());
					continue;
				}
				const a = Math.sin(frac * Math.PI) * 0.16 * opacity;
				ctx.strokeStyle = `rgba(${tr},${tg},${tb},${a})`;
				ctx.lineWidth = p.weight;
				ctx.beginPath();
				ctx.moveTo(p.px, p.py);
				ctx.lineTo(p.x, p.y);
				ctx.stroke();
			}
			time += dt * 0.045 * speed;
		}

		let last = 0;
		function frame(ts) {
			raf = requestAnimationFrame(frame);
			const dt = Math.min((ts - last) / 16.6, 3) || 1;
			last = ts;
			step(dt);
		}

		function start() {
			if (running || reduced) return;
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
			mouse.x = e.clientX - rect.left;
			mouse.y = e.clientY - rect.top;
		}

		function onLeave() {
			mouse.x = -1e4;
			mouse.y = -1e4;
		}

		resize();

		const ro = new ResizeObserver(resize);
		ro.observe(canvas.parentElement);

		const io = new IntersectionObserver(([entry]) => {
			entry.isIntersecting ? start() : stop();
		});
		io.observe(canvas);

		const onVisibility = () => (document.hidden ? stop() : start());
		document.addEventListener('visibilitychange', onVisibility);
		canvas.parentElement.addEventListener('pointermove', onPointer, { passive: true });
		canvas.parentElement.addEventListener('pointerleave', onLeave, { passive: true });

		return () => {
			stop();
			ro.disconnect();
			io.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			canvas.parentElement?.removeEventListener('pointermove', onPointer);
			canvas.parentElement?.removeEventListener('pointerleave', onLeave);
		};
	});
</script>

<canvas bind:this={canvas} class={className} aria-hidden="true"></canvas>

<style>
	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
</style>
