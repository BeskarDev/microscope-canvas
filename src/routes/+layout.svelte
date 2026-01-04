<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import StarryBackground from '$lib/components/StarryBackground.svelte';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#0f0f14" />
	<title>Microscope Canvas</title>
</svelte:head>

<StarryBackground />
<div class="app-container">
	<Header />
	<main class="main-content">
		{@render children()}
	</main>
</div>
<Toaster position="bottom-right" />

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
</style>
