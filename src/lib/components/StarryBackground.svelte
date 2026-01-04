<script lang="ts">
	import { onMount } from 'svelte';

	interface Star {
		x: number;
		y: number;
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

	function generateStars(width: number, height: number): Star[] {
		const newStars: Star[] = [];
		for (let i = 0; i < STAR_COUNT; i++) {
			newStars.push({
				x: Math.random() * width,
				y: Math.random() * height,
				size: MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE),
				opacity: 0.3 + Math.random() * 0.7,
				twinkleDelay: Math.random() * 4000
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
		stars.forEach((star) => {
			const twinkle = Math.sin((time + star.twinkleDelay) / 1500) * 0.3 + 0.7;
			const finalOpacity = star.opacity * twinkle;

			ctx.beginPath();
			ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
			ctx.fillStyle = `oklch(98% 0.02 265 / ${finalOpacity})`;
			ctx.fill();

			// Add a subtle glow to larger stars
			if (star.size > 1.5) {
				ctx.beginPath();
				ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
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

	function handleResize() {
		if (canvas) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			stars = generateStars(canvas.width, canvas.height);
		}
	}

	onMount(() => {
		handleResize();
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
