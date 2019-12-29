<script>
    import { csv } from 'd3-fetch';
    import { group } from 'd3-array';
    import { beforeUpdate, onMount, tick } from 'svelte';
    import { maxDate, msg, language } from './stores';
    import { timeFormat } from 'd3-time-format';

    import DataLoaded from './DataLoaded.svelte';
    import LanguageSelect from './partials/LanguageSelect.svelte';
    import StationInfo from './partials/StationInfo.svelte';

    const tfmt = timeFormat('%Y/%m/%d');

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

    let loadStations = csv('/data/stations.csv', parseStations)
        .then(async res => {
            stations = res
                .filter(d => d.from.getFullYear() <= 1980 && d.to.getFullYear() >= 2019)
                .sort((a,b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);

            await tick();
            hashChange();
        });

    const load = () => {
        if (!station) return;
        promise = csv(`/data/stations/${station.id}.csv`, parseRow);
    };

    $: {
        if (station && station.name) {
            window.location.hash = `#/${$language}/${station.id}/${station.name.toLowerCase().split('(')[0].trim().replace(/[^a-z-]/g, '')}${tfmt($maxDate) < tfmt(new Date()) ? `/${tfmt($maxDate)}` : ''}`;
        }

    }

    beforeUpdate(() => {
        if (station !== _station) {
            // new station selected!
            _station = station;
            load();
        }
    });

    function hashChange() {
        const match = window.location.hash.match(/^#\/(de|en)\/(\d{5})\/[^\/]+(?:\/(\d{4}\/\d{2}\/\d{2}))?/);
        if (match) {
            const [lang,sid,date] = match.slice(1);
            if (lang) $language = lang;

            if (!station || sid !== station.id) {
                station = stations.find(d => d.id === sid);
            }

            if (date) {
                // restore maxDate
                $maxDate = new Date(date);
            }
        }

    }
</script>

<svelte:window on:hashchange="{hashChange}" />

<header class="container-fluid">
    <div class="row">
        <div class="col">
            <h1><span>weather.</span>vis4.net</h1>
        </div>
        <div class="col-auto">
            <LanguageSelect />
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
                {#await loadStations then res}
                    <small class="form-text text-muted">{$msg.selectStation}</small>
                    <select class="custom-select" bind:value={station}>
                        <option value={null}>(select station)</option>
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
