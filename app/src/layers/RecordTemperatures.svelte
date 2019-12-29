<script>
    export let xScale;
    export let yScale;
    export let data;
    export let grouped;

    import Steps from './Steps.svelte';

    $: records = grouped.map(d => {
        return {
            date: d.date,
            tMin: d.tMinAbs,
            tMax: d.tMaxAbs
        };
    });
</script>

<style>
    g :global(path) {
        fill: #bbb;
        opacity: 0.3;
    }
</style>

<g>
    <Steps {xScale} {yScale} data={records} />
</g>
