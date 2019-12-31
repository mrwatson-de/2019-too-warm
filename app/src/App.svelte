<script>
    import { csv } from 'd3-fetch';
    import { timeFormat } from 'd3-time-format';

    import { beforeUpdate, onMount, tick } from 'svelte';
    import { maxDate, msg, language, minDate, contextMinYear, contextMaxYear } from './stores';

    import DataLoaded from './DataLoaded.svelte';
    import LanguageSelect from './partials/LanguageSelect.svelte';
    import StationInfo from './partials/StationInfo.svelte';
    import StationSelect from './partials/StationSelect.svelte';
    import TimeSelect from './partials/TimeSelect.svelte';
    import TemperatureDay from './TemperatureDay.svelte';

    const tfmtIntro = timeFormat($msg.introDateFormat);

    $: introLong = $msg.introLong
        .replace('%station%', station ? station.name : '...')
        .replace('%minDate%', tfmtIntro($minDate))
        .replace('%maxDate%', tfmtIntro($maxDate));

    let data;

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
        promise = csv(`/data/stations/${station.id}.csv`, parseRow)
            .then(res => {
                data = res;
                return data;
            })
    };

    let _station;
    let station;

    $: dailyMaxDec18 = data ? data.find(d => d.dateRaw === '2019-12-18').tMax : '...';

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

    }

    header {
        margin-bottom: 20px;
    }

    main {
        --hotter-color: #d00;
        --normal-color: #777;
        --colder-color: #09d;
        --def-color: #c30;
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

<header id="header" class="story">
  <div id="logo">
    <i class="im im-code"></i>
  </div>
  <h1><a href="/blog">vis4.net</a></h1>
  <p style="color: #555">Hi, I'm Gregor. I write about data visualization, cartography, colors, data journalism and some of my open source hacks. This is my blog.</p>
  <hr>
</header>

<main lang="{$language}" class="story">

    <!-- <LanguageSelect />
 -->
    <h2 lang="de">Das Jahr 2019 war wärmer als "normal" — aber was heißt das eigentlich?</h2>
    <h2 lang="en">Third-hottest year in Germany since 1881</h2>

    <p lang="de">Laut Deutschem Wetterdienst (DWD) war 2019 das <a href="https://www.dwd.de/DE/presse/pressemitteilungen/DE/2019/20191230_deutschlandwetter_jahr2019.pdf?__blob=publicationFile&v=3">drittwärmste Jahr in Deutschland</a> seit Beginn der regelmäßigen Messungen 1881 (hinter 2014 und 2018). Am 25. Juli wurde mit <b>42,6°C</b> ein neuer deutscher Hitzerekord aufgestellt, und lokale Rekorde wurden in fast allen Wetterstationen gemessen.</p>

    <p lang="en">According to the Deutsche Wetterdienst (DWD) 2019 was the third hottest year in Germany since beginning of  Deutschlands drittwärmstes Jahr seit Beginn der regelmäßigen Messungen 1881. Der Temperaturdurchschnitt im Jahr lag bei 10,2°C, gleich hinter 2014 (10,3°C) und 2018 (10,5°C).</p>

    <p lang="de">Auch abseits von Rekordwerten war 2019 laut DWD "zu trocken, zu sonnig und vor allem wärmer als üblich". Aber wer sagt eigentlich was übliche oder "normale" Temperaturen sind?</p>

    <p lang="de">Als Rechenbeispiel nehmen wir uns den 18. Dezember an der Wetterstation {station ? station.name : '...'}. Die Tageshöchsttemperatur lag an diesem Tag bei <b>{dailyMaxDec18}°C</b>. Um zu bestimmen welche Temperaturen "normal" für einen bestimmten Tag sind, berechnen Meterologen die Mittelwerte aus den Höchst- und tiefsttemperaturen am selben Datum in einem Vergleichszeitraum, z.B. {$contextMinYear} bis  {$contextMaxYear-1}.</p>

    {#if data}
    <h3>Wie sich der "normale" Temperaturbereich errechnet</h3>
    <p class="text-muted text-small">Jeder Balken zeigt die Temperaturspanne am 18.12. im jeweiligen Jahr (gemessen an der Wetterstation {station.name}). Tipp: Du kannst den Vergleichszeitraum nach links und rechts verschieben.</p>
    <TemperatureDay {data} />
    {/if}

    <p>Ob ein Temperaturwert nun "höher als normal" ist, hängt also davon ab, mit welchem Zeitraum wir vergleichen. Doch wie wir den Zeitraum auch verändern, ein Tageshoch von <b>{dailyMaxDec18}°C</b> am 18.12. ist und bleibt zu hoch.</p>

    <p>Das Problem ist, dass der 18. Dezember bei weitem kein Einzelfall ist. Die folgende Grafik zeigt die Temperaturwerte für</p>

    <h3>Zu heiße Tage und Rekordtemperaturen über das ganze Jahr</h3>
    <p class="text-muted text-small">{@html introLong}</p>
</main>


<main class="full-width">
    {#if promise}
        {#await promise}
            <!-- promise is pending -->
            <p>Daten werden geladen...</p>
        {:then data}
            <DataLoaded {data} {station} />
        {:catch error}
            <!-- promise was rejected -->
            <p>Something went wrong: {error.message}</p>
        {/await}
    {/if}

</main>

<main class="story">
    <TimeSelect />
    <p class="text-small text-muted">Schau dir gerne auch einen anderen Zeitraum an!</p>

    <p><b>{@html $msg.intro}</b></p>
    <p><img style="max-width: 100%;margin-bottom: 20px" src="key-{$language}.svg"></p>


    <p>Die ... ist kein ganz neues Phänomen. Auch die vergangengen Jahre sehen ähnlich aus.</p>



    <p>Du kannst die Grafiken und Beispiele in diesem Artikel auch mit einer anderen Wetterstation ausprobieren</p>
    <div class="shadow-sm p-3 mb-5 bg-white rounded">
        <StationSelect bind:station />
    </div>
</main>