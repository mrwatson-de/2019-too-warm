<script>
    import { csv } from 'd3-fetch';
    import { group } from 'd3-array';
    import { maxDate, msg, language } from '../stores';
    import { tick } from 'svelte';
    import { timeFormat } from 'd3-time-format';

    const parseStations = d => ({
        ...d,
        from: new Date(d.from),
        to: new Date(d.to),
        altitude: +d.altitude
    });

    const tfmt = timeFormat('%Y/%m/%d');

    export let station;
    let stations = [];
    $: groupedStations = Array.from(group(stations, d => d.state))
        .map(([k, v]) => v)
        .sort((a, b) => (a[0].state > b[0].state ? 1 : a[0].state < b[0].state ? -1 : 0));

    let loadStations = csv('/data/stations.csv', parseStations).then(async res => {
        stations = res
            .filter(d => d.from.getFullYear() <= 1980 && d.to.getFullYear() >= 2019)
            .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));

        await tick();
        hashChange();
        if (!station) {
            const initStations = [
                '00433',
                '01975',
                '03668',
                '00691',
                '05792',
                '01420',
                '03987',
                '03126',
                '01270',
                '00880',
                '02667'
            ];
            const random = initStations[Math.floor(Math.random() * 0.99 * initStations.length)];
            station = stations.find(s => s.id === random);
        }
    });

    $: {
        if (station && station.name) {
            window.location.hash = `#/${$language}/${station.id}/${station.name
                .toLowerCase()
                .split('(')[0]
                .trim()
                .replace(/ö/g, 'oe')
                .replace(/ä/g, 'ae')
                .replace(/ü/g, 'ue')
                .replace(/[^a-z-]/g, '')}${
                tfmt($maxDate) < tfmt(new Date()) ? `/${tfmt($maxDate)}` : ''
            }`;
        }
    }

    function hashChange() {
        const match = window.location.hash.match(
            /^#\/(de|en)\/(\d{5})\/[^\/]+(?:\/(\d{4}\/\d{2}\/\d{2}))?/
        );
        if (match) {
            const [lang, sid, date] = match.slice(1);
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

    function latLonDist(lat1, lon1, lat2, lon2) {
        const p = 0.017453292519943295; //This is  Math.PI / 180
        const c = Math.cos;
        const a =
            0.5 -
            c((lat2 - lat1) * p) / 2 +
            (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;
        const R = 6371; //  Earth distance in km so it will return the distance in km
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    function findNearestStation() {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                console.log({ latitude, longitude });
                // compute distances
                stations.forEach(s => {
                    s.dist = latLonDist(latitude, longitude, s.lat, s.lon);
                });

                station = stations.sort((a, b) => a.dist - b.dist)[0];
            },
            () => {
                window.alert('didnt work');
            }
        );
    }
</script>

<style>
    .btn i.im {
        font-size: 16px;
        position: relative;
        top: 2px;
    }
</style>

<svelte:window on:hashchange={hashChange} />

{#await loadStations then res}
    <small class="form-text text-muted">{$msg.selectStation}</small>
    <div class="btn-group">
        <select class="custom-select" bind:value={station}>
            <option value={null}>(select station)</option>
            {#each groupedStations as stations}
                <optgroup label={stations[0].state}>
                    {#each stations as s}
                        <option value={s}>
                            {s.name} ({s.from.getFullYear()} - {s.to.getFullYear()})
                        </option>
                    {/each}
                </optgroup>
            {/each}
        </select>
        <button class="btn btn-outline-secondary" on:click={findNearestStation}>
            <i class="im im-location" />
        </button>
    </div>
{/await}
