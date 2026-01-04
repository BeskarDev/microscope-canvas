<script lang="ts">
	import { onMount } from 'svelte';

	// Star positions use normalized coordinates (0-1) so they stay consistent
	// regardless of viewport size changes
	interface Star {
		xNorm: number; // Normalized x position (0-1)
		yNorm: number; // Normalized y position (0-1)
		size: number;
		opacity: number;
		twinkleDelay: number;
	}

	let canvas: HTMLCanvasElement;
	let stars: Star[] = [];
	let animationFrame: number;

	const STAR_COUNT = 200;
	const MIN_SIZE = 0.5;
	const MAX_SIZE = 2;
	const SEED = 12345; // Fixed seed for consistent star generation

	/**
	 * Seeded pseudo-random number generator using the mulberry32 algorithm.
	 * This algorithm was chosen because:
	 * - It's fast and lightweight (single 32-bit state)
	 * - Produces good statistical distribution
	 * - Deterministic: same seed always produces same sequence
	 * - Works well in browsers without needing crypto APIs
	 *
	 * @param seed Initial seed value
	 * @returns Function that returns pseudo-random numbers in [0, 1)
	 */
	function createSeededRandom(seed: number) {
		return function () {
			let t = (seed += 0x6d2b79f5);
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	/**
	 * Generate stars with normalized coordinates using seeded random
	 * Stars are generated once and their positions scale with viewport
	 */
	function generateStars(): Star[] {
		const random = createSeededRandom(SEED);
		const newStars: Star[] = [];
		for (let i = 0; i < STAR_COUNT; i++) {
			newStars.push({
				xNorm: random(),
				yNorm: random(),
				size: MIN_SIZE + random() * (MAX_SIZE - MIN_SIZE),
				opacity: 0.3 + random() * 0.7,
				twinkleDelay: random() * 4000
			});
		}
		return newStars;
	}

	function drawStars(ctx: CanvasRenderingContext2D, time: number) {
		const width = ctx.canvas.width;
		const height = ctx.canvas.height;

		// Clear canvas with deep space gradient
		const gradient = ctx.createRadialGradient(
			width * 0.5,
			height * 0.3,
			0,
			width * 0.5,
			height * 0.5,
			Math.max(width, height)
		);
		// Very subtle nebula-like gradient
		gradient.addColorStop(0, 'oklch(12% 0.02 280)');
		gradient.addColorStop(0.4, 'oklch(9% 0.015 265)');
		gradient.addColorStop(0.7, 'oklch(8% 0.02 290)');
		gradient.addColorStop(1, 'oklch(6% 0.015 265)');

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		// Draw stars with twinkle effect
		// Convert normalized coordinates to actual pixels
		stars.forEach((star) => {
			const x = star.xNorm * width;
			const y = star.yNorm * height;
			const twinkle = Math.sin((time + star.twinkleDelay) / 1500) * 0.3 + 0.7;
			const finalOpacity = star.opacity * twinkle;

			ctx.beginPath();
			ctx.arc(x, y, star.size, 0, Math.PI * 2);
			ctx.fillStyle = `oklch(98% 0.02 265 / ${finalOpacity})`;
			ctx.fill();

			// Add a subtle glow to larger stars
			if (star.size > 1.5) {
				ctx.beginPath();
				ctx.arc(x, y, star.size * 2, 0, Math.PI * 2);
				ctx.fillStyle = `oklch(98% 0.02 265 / ${finalOpacity * 0.2})`;
				ctx.fill();
			}
		});
	}

	function animate(time: number) {
		const ctx = canvas?.getContext('2d');
		if (ctx) {
			drawStars(ctx, time);
		}
		animationFrame = requestAnimationFrame(animate);
	}

	function updateCanvasSize() {
		if (canvas) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}
	}

	function handleResize() {
		// Just update canvas size - stars use normalized coords so no regeneration needed
		updateCanvasSize();
	}

	onMount(() => {
		// Generate stars once on mount with consistent seeded random
		stars = generateStars();
		updateCanvasSize();
		animationFrame = requestAnimationFrame(animate);

		window.addEventListener('resize', handleResize);

		return () => {
			cancelAnimationFrame(animationFrame);
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<canvas bind:this={canvas} class="starry-background" aria-hidden="true"></canvas>

<style>
	.starry-background {
		position: fixed;
		inset: 0;
		z-index: -1;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
</style>
