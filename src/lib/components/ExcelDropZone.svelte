<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let isDragging = false;
	let fileError: string | null = null;

	function isExcelFile(file: File): boolean {
		return (
			file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
			file.name.toLowerCase().endsWith('.xlsx')
		);
	}

	function handleFile(file: File) {
		fileError = null;

		if (!isExcelFile(file)) {
			fileError = 'Please upload a valid .xlsx Excel file';
			return;
		}

		dispatch('file', file);
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		const file = event.dataTransfer?.files?.[0];
		if (file) handleFile(file);
	}

	function onChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files?.[0]) handleFile(input.files[0]);
	}
</script>

<div
	class="dropzone"
	class:dragging={isDragging}
	on:dragover|preventDefault={() => (isDragging = true)}
	on:dragleave={() => (isDragging = false)}
	on:drop={onDrop}
>
	<input type="file" accept=".xlsx" on:change={onChange} />

	<p>
		Drag an Excel (.xlsx) file here<br />
		or click to select
	</p>
</div>

{#if fileError}
	<p class="error">{fileError}</p>
{/if}

<style>
	.dropzone {
		border: 2px dashed #999;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		cursor: pointer;
		position: relative;
	}

	.dropzone.dragging {
		border-color: #333;
		background: #f5f5f5;
	}

	input[type='file'] {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.error {
		color: #b00020;
		margin-top: 0.5rem;
	}
</style>
