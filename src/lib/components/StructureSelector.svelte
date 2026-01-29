<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { StructureType } from '$lib/model/structure';

	const dispatch = createEventDispatcher();

	let selected: StructureType | null = null;

	function select(type: StructureType) {
		selected = type;
		dispatch('change', type);
	}
</script>

<fieldset class="structure">
	<legend>Choose archival structure</legend>

	<label>
		<input
			type="radio"
			name="structure"
			value="hierarchical"
			checked={selected === 'hierarchical'}
			on:change={() => select('hierarchical')}
		/>
		<strong>Series → File → Item</strong>
		<div class="hint">Use when records are grouped into folders or files.</div>
	</label>

	<label>
		<input
			type="radio"
			name="structure"
			value="flat"
			checked={selected === 'flat'}
			on:change={() => select('flat')}
		/>
		<strong>Series → Item (flat)</strong>
		<div class="hint">Use when there is no folder or file level.</div>
	</label>

	<p class="note">“File” refers to an archival folder, not a computer file.</p>
</fieldset>

<style>
	.structure {
		margin-top: 2rem;
		padding: 1rem;
		border: 1px solid #ccc;
	}

	label {
		display: block;
		margin-bottom: 1rem;
		cursor: pointer;
	}

	.hint {
		margin-left: 1.5rem;
		font-size: 0.9em;
		color: #555;
	}

	.note {
		margin-top: 1rem;
		font-size: 0.85em;
		color: #666;
	}
</style>
