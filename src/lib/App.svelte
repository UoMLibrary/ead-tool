<script lang="ts">
	import ExcelDropZone from '$lib/components/ExcelDropZone.svelte';
	import StructureSelector from '$lib/components/StructureSelector.svelte';

	import { buildHierarchy } from '$lib/structure/buildHierarchy';
	import { buildFlat } from '$lib/structure/buildFlat';
	import { buildEadXml } from '$lib/ead/eadXmlBuilder';

	import { readExcel } from '$lib/excel/excelReader';
	import { normaliseRows } from '$lib/excel/normaliseRows';
	import type { StructureType } from '$lib/model/structure';

	import { downloadXml } from '$lib/ead/downloadXml';
	import { makeEadFilename } from '$lib/ead/filename';

	const version = import.meta.env.VITE_APP_VERSION;

	let tree = null;
	let result = null;
	let structure: StructureType | null = null;
	let error = null;
	let xmlDoc = null;

	// ✅ NEW
	let warnings: string[] = [];

	// -----------------------------
	// Build structure (Step 5)
	// -----------------------------
	$: if (result && structure) {
		warnings = [];

		if (structure === 'hierarchical') {
			const hierarchy = buildHierarchy(result.series, result.nodes);
			tree = hierarchy.root;
			warnings = hierarchy.warnings;
		} else {
			tree = buildFlat(result.series, result.nodes);
		}
	}

	// -----------------------------
	// Build XML (Step 6)
	// -----------------------------
	$: if (tree && result && structure) {
		xmlDoc = buildEadXml(tree);
	}

	// -----------------------------
	// Download (Step 7)
	// -----------------------------
	function handleDownload() {
		if (!xmlDoc || !result) return;

		const filename = makeEadFilename(result.series.id);
		downloadXml(xmlDoc, filename);
	}

	// -----------------------------
	// File upload (reset state)
	// -----------------------------
	async function handleFile(e) {
		// 🔁 Reset all derived state
		error = null;
		result = null;
		structure = null;
		tree = null;
		xmlDoc = null;
		warnings = [];

		try {
			const rows = await readExcel(e.detail);
			result = normaliseRows(rows);
		} catch (err) {
			error = err.message;
		}
	}

	function handleStructure(e) {
		structure = e.detail;
	}
</script>

<main>
	<header class="intro">
		<h1>
			Excel to EAD XML Converter
			<span class="version">v{version}</span>
		</h1>
		<p>
			This tool transforms structured Excel spreadsheets into Encoded Archival Description (EAD)
			XML. Upload your spreadsheet, select the desired structure, review any validation warnings,
			and download a ready-to-deposit EAD file.
		</p>
		<p>Supports:</p>
		<ul>
			<li>Hierarchical Series → File → Item structures</li>
			<li>Flat Series → Item structures</li>
			<li>Row validation and skipped row reporting</li>
			<li>Pre-download conversion summary</li>
		</ul>
	</header>
	<ExcelDropZone on:file={handleFile} />

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if result}
		<p>Series: {result.series.id}</p>
		<p>Descriptive rows: {result.nodes.length}</p>

		{#if result.skippedRows > 0}
			<p class="warning">
				Skipped {result.skippedRows} rows with no &lt;c level&gt;
			</p>
		{/if}

		<StructureSelector on:change={handleStructure} />
	{/if}

	{#if structure}
		<p>
			Selected structure:
			<strong>{structure}</strong>
		</p>
	{/if}

	{#if result && structure}
		<section class="summary">
			<h2>Conversion summary</h2>

			<ul>
				<li>
					<strong>Series:</strong>
					{result.series.id}
				</li>
				<li>
					<strong>Structure:</strong>
					{structure === 'hierarchical' ? 'Series → File → Item' : 'Series → Item (flat)'}
				</li>
				<li>
					<strong>Descriptive rows:</strong>
					{result.nodes.length}
				</li>

				{#if result.skippedRows > 0}
					<li>
						<strong>Skipped rows:</strong>
						{result.skippedRows} (no &lt;c level&gt;)
					</li>
				{/if}
			</ul>
		</section>
	{/if}

	{#if warnings.length > 0}
		<section class="warnings">
			<h3>Warnings</h3>
			<ul>
				{#each warnings as warning}
					<li>{warning}</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if xmlDoc}
		<button class="primary" on:click={handleDownload} disabled={!xmlDoc}> Download EAD XML </button>
	{/if}
</main>

<style>
	.intro {
		margin-bottom: 2rem;
		max-width: 800px;
	}

	.intro h1 {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.version {
		font-size: 0.8rem;
		font-weight: 400;
		color: #888;
		background: #f2f2f2;
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
	}

	.intro p {
		margin-bottom: 0.75rem;
		color: #444;
	}
</style>
