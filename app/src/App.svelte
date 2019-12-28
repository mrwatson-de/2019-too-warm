<script>
    export let name;
    import { csv } from 'd3-fetch';

    import DataLoaded from './DataLoaded.svelte';

    const parseRow = d => ({
        date: new Date(d.date),
        dateRaw: d.date,
        tMin: +d.TNK,
        tAvg: +d.TMK,
        tMax: +d.TXK
    });
</script>

<style>
    main {
        text-align: center;
        padding: 1em;
        margin: 0 auto;
    }

    h1 {
        color: #ff3e00;
        font-size: 4em;
        font-weight: 100;
    }

    @media (max-width: 400px) {
        main {
            padding: 1ex;
        }
    }
</style>

<main>
    {#await csv('/data/430-temp.csv', parseRow)}
        <!-- promise is pending -->
        <p>Daten werden geladen...</p>
    {:then data}
        <DataLoaded {data} />
    {:catch error}
        <!-- promise was rejected -->
        <p>Something went wrong: {error.message}</p>
    {/await}
</main>
