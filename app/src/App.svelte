<script>
    export let name;
    import { csv } from 'd3-fetch';
    import { group } from 'd3-array';
    import { beforeUpdate } from 'svelte';
    import { maxDate } from './stores';
    import { timeFormat } from 'd3-time-format';

    import DataLoaded from './DataLoaded.svelte';

    const tfmt = timeFormat('%Y%m%d');

    const parseRow = d => ({
        date: new Date(d.date),
        dateRaw: d.date,
        tMin: +d.TNK,
        tAvg: +d.TMK,
        tMax: +d.TXK
    });

    const parseStations = d => ({
        ...d,
        from: new Date(d.from),
        to: new Date(d.to),
        altitude: +d.altitude
    });

    let _station;
    let station;
    let stations = [];
    $: groupedStations = Array.from(group(stations, d => d.state))
        .map(([k,v]) => v)
        .sort((a,b) => a[0].state > b[0].state ? 1 : a[0].state < b[0].state ? -1 : 0);
    let promise;
    let stationId = '00430';

    let loadStations = csv('/data/stations.csv', parseStations)
        .then(res => {
            stations = res
                .filter(d => d.from.getFullYear() <= 1980 && d.to.getFullYear() >= 2019)
                .sort((a,b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
        });

    const load = () => {
        promise = csv(`/data/stations/${station.id}.csv`, parseRow);
    };

    $: {
        window.location.hash = station ? `#/${station.id}/${station.name.toLowerCase().split('(')[0].trim().replace(/[^a-z-]/g, '')}/${tfmt($maxDate)}` : '';
    }

    beforeUpdate(() => {
        if (station !== _station) {
            // new station selected!
            _station = station;
            load();
        }
    });
</script>

<main>

    {#await loadStations then res}

        <select bind:value={station}>
            {#each groupedStations as stations}
            <optgroup label="{stations[0].state}">
                {#each stations as s}
                <option value="{s}">{s.name} ({s.from.getFullYear()} - {s.to.getFullYear()})</option>
                {/each}
            </optgroup>
            {/each}
        </select>
    {:catch error}
        <!-- promise was rejected -->
        <p>Something went wrong: {error.message}</p>
    {/await}

    {#if promise}
        {#await promise}
            <!-- promise is pending -->
            <p>Daten werden geladen...</p>
        {:then data}
            <DataLoaded {data} />
        {:catch error}
            <!-- promise was rejected -->
            <p>Something went wrong: {error.message}</p>
        {/await}
    {/if}
</main>

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
