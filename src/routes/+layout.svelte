<script>
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Ggwave - High Fidelity Audio</title>
	<meta name="description" content="Experience high fidelity audio streaming with Ggwave, your destination for cutting-edge sound technology." />
</svelte:head>

{@render children()}
