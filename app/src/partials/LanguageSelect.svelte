<script>
	import { language } from '../stores';
	const options = ['de', 'en'];
</script>
<div class="btn-group btn-group-toggle" data-toggle="buttons">
    {#each options as opt}
    <label class="btn btn-sm btn-outline-secondary" class:active={$language === opt}>
        <input bind:group={$language} value="{opt}" type="radio" name="options"> {opt.toUpperCase()}
    </label>
    {/each}
</div>

<style>
	.btn-group {
		position: relative;
		top: 10px;
	}
</style>