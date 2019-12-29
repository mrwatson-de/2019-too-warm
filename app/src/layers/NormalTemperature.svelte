<script>
    export let xScale;
    export let yScale;
    export let grouped;

    import { normalRange } from '../stores';

    import { mean, quantileSorted } from 'd3-array';
    import { line, curveBasis, curveStep } from 'd3-shape';
    import Steps from './Steps.svelte';

    $: pathData = path(grouped);

    $: path = line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.tAvg))
        .curve(curveBasis);
</script>

<style>
    path {
        stroke: #000;
        stroke-linejoin: round;
        fill: none;
    }
    path.buffer {
        stroke: #000;
        opacity: 0.1;
        stroke-width: 6;
    }
</style>

<g class="normal-temp">
    <!-- <path class="buffer" d="{pathData}" /> -->
    <path d={pathData} />
</g>
