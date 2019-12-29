<script>
    import { csv } from 'd3-fetch';

    import { beforeUpdate, onMount, tick } from 'svelte';
    import { maxDate, msg, language } from './stores';

    import DataLoaded from './DataLoaded.svelte';
    import LanguageSelect from './partials/LanguageSelect.svelte';
    import StationInfo from './partials/StationInfo.svelte';
    import StationSelect from './partials/StationSelect.svelte';

    const parseRow = d => ({
        date: new Date(d.date),
        dateRaw: d.date,
        tMin: +d.TNK,
        tAvg: +d.TMK,
        tMax: +d.TXK
    });

    let promise;
    const load = () => {
        if (!station) return;
        promise = csv(`/data/stations/${station.id}.csv`, parseRow);
    };

    let _station;
    let station;

    beforeUpdate(() => {
        if (station !== _station) {
            // new station selected!
            _station = station;
            load();
        }
    });
</script>

<style>
    h1 {
        letter-spacing: 0.01em;
        font-size: 1rem;
        line-height: 2rem;
        font-style: normal;
        font-weight: 400;
        color: #999;
        margin-top: 0;
        margin-bottom: 0;
    }

    header {
        margin-bottom: 20px;
    }

    main {
        padding: 1em;
        margin: 0 auto;
    }

    @media (max-width: 400px) {
        main {
            padding: 1ex;
        }
    }

    .custom-select {
        margin-bottom: 0;
    }
</style>

<header class="container-fluid">
    <div class="row">
        <div class="col">
            <h1>
                <span>weather.</span>
                vis4.net
            </h1>
        </div>
        <div class="col-auto">
            <LanguageSelect />
        </div>
    </div>
</header>

<div class="container-fluid">
    <div class="row">
        <div class="col-sm">
            <StationInfo {station} />
        </div>
        <div class="col-sm-4">
            <div class="form-row">
                <div class="col-lg">
                    <StationSelect bind:station />
                </div>
            </div>
        </div>
    </div>
</div>
<main>
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
