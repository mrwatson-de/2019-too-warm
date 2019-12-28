<script>
    export let xScale;
    export let yScale;
    export let data;
    export let grouped;

    import { minDate, maxDate, normalRange, showAnomalies } from '../stores';

    import { quantileSorted, mean } from 'd3-array';
    import Steps from './Steps.svelte';

    $: normalRangeData = grouped;
</script>

<style>
    g :global(path) {
        fill: #888;
        opacity: 0.5;
    }
    g.faint :global(path) {
        opacity: 0.25;
    }
</style>

<g class="normal-temp-range" class:faint={$showAnomalies}>
    <Steps {xScale} {yScale} data={normalRangeData} />
</g>
