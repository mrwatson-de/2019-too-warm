<script>
    import { csv } from 'd3-fetch';
    import { timeFormat } from 'd3-time-format';

    import { beforeUpdate } from 'svelte';
    import { maxDate, msg, language, minDate, contextMinYear, contextMaxYear } from './stores';

    import DataLoaded from './DataLoaded.svelte';
    import StationSelect from './partials/StationSelect.svelte';
    import TimeSelect from './partials/TimeSelect.svelte';
    import TemperatureDay from './TemperatureDay.svelte';
    import MonthlyAnomalies from './MonthlyAnomalies.svelte';
    import YearlyAnomalies from './YearlyAnomalies.svelte';

    const tfmtIntro = timeFormat($msg.introDateFormat);

    let data;

    $: stationShort = station ? station.name : '...';

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
        promise = csv(`/data/stations/${station.id}.csv`, parseRow).then(res => {
            data = res;
            return data;
        });
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
        --tick-line: #d0d2d5;
        --tick: #6c757d;
    }

    @media (max-width: 400px) {
        main {
            padding: 1ex;
        }
    }
</style>

<header id="header" class="story">
    <div id="logo">
        <i class="im im-code" />
    </div>
    <h1>
        <a href="/blog">vis4.net</a>
    </h1>
    <p style="color: #555">
        Hi, I'm Gregor. I write about data visualization, cartography, colors, data journalism and
        some of my open source hacks. This is my blog.
    </p>
    <hr />
</header>

<main lang={$language} class="story">

    <!-- <LanguageSelect />
 -->
    <h2 lang="de">Das Jahr 2019 war wärmer als normal — aber was heißt hier eigentlich "normal"?</h2>
    <h2 lang="en">2019 was hotter than normal — but what does this even mean?</h2>

    <p lang="de">
        <i>
            [
            <a href="#/en">Click here to read this text in English</a>
            ]
        </i>
    </p>
    <p lang="en">
        <i>
            [
            <a href="#/de">Hier klicken um diesen Text auf deutsch zu lesen</a>
        </i>
        ]
    </p>

    <p lang="de">
        Laut Deutschem Wetterdienst (DWD) war 2019 das
        <a
            href="https://www.dwd.de/DE/presse/pressemitteilungen/DE/2019/20191230_deutschlandwetter_jahr2019.pdf?__blob=publicationFile&v=3">
            drittwärmste Jahr in Deutschland
        </a>
        seit Beginn der regelmäßigen Messungen 1881 (hinter 2014 und 2018). Am 25. Juli wurde mit
        <b>42,6°C</b>
        ein neuer deutscher Hitzerekord aufgestellt, und lokale Rekorde wurden in fast allen
        Wetterstationen gemessen.
    </p>

    <p lang="en">
        According to Deutsche Wetterdienst (DWD), 2019 was the third hottest year in Germany since
        we started to measure temperatures regularly in 1881. On July 25 a new national record of
        <b>42.6°C</b>
        was measured, along with local records in most weather stations.
    </p>

    <p lang="de">
        Auch abseits von Rekordwerten war 2019 laut DWD "zu trocken, zu sonnig und vor allem wärmer
        als üblich". Aber wer sagt eigentlich was übliche oder "normale" Temperaturen sind?
    </p>

    <p lang="en">
        Aside from record temperatures, DWD described the year 2019 as "too dry, too sunny, and most
        of all warmer than usual". But who's to say what usual or "normal" temperatures are? How are
        they defined?
    </p>

    <p lang="de">
        Als Rechenbeispiel nehmen wir uns den 18. Dezember an der Wetterstation {stationShort}.
        Die Tageshöchsttemperatur lag an diesem Tag bei
        <b>{dailyMaxDec18}°C</b>
        . Um zu bestimmen welche Temperaturen "normal" für einen bestimmten Tag sind, berechnen
        Meterologen die Mittelwerte aus den Höchst- und tiefsttemperaturen am selben Datum in einem
        <b>Vergleichszeitraum</b>
        , zum Beispiel zwischen {$contextMinYear} und {$contextMaxYear - 1}.
    </p>

    <p lang="en">
        So let's take a look at a single day, December 18, at weather station {stationShort}.
        The daily maximum temperature was at
        <b>{dailyMaxDec18}°C</b>
        . Was that hotter than normal? To answer this question, meterologists compute averages of
        maximum and minimum temperatures on the same date over a
        <b>base period</b>
        , for instance between {$contextMinYear} and {$contextMaxYear - 1}.
    </p>

    {#if data}
        <h3 lang="de">Wie sich der "normale" Temperaturbereich errechnet</h3>
        <h3 lang="en">How "normal" temperature ranges are being calculated</h3>
        <p class="text-muted text-small" lang="de">
            Jeder Balken zeigt die Temperaturspanne am 18.12. im jeweiligen Jahr (gemessen an der
            Wetterstation {stationShort}). Tipp: Du kannst den Vergleichszeitraum nach links und
            rechts verschieben.
        </p>
        <p class="text-muted text-small" lang="en">
            Each bar shows the temperature range on December 18 in a given year (measured at weather
            station {stationShort}). Hint: You can move the base period to the left and right.
        </p>
        <TemperatureDay {data} />
    {:else}
        <i class="text-small text-muted">loading data...</i>
    {/if}

    <p>
        Ob ein Temperaturwert nun "höher als normal" ist, hängt also davon ab, mit welchem Zeitraum
        wir vergleichen (der Zeitraum im Diagramm lässt sich verschieben um den Effekt zu beobachten). Doch wie wir den Zeitraum auch verändern, das Tageshoch von
        <b>{dailyMaxDec18}°C</b>
        am 18.12. ist und bleibt ein Ausreißer und damit "zu hoch".
    </p>

    <p>
        Natürlich war der 18. Dezember kein Einzelfall: Über das ganze Jahr hinweg gab es solche "zu heißen" Tage. Die folgende Grafik zeigt die an der Wetterstation {stationShort} gemessenen Temperaturwerte. Der hellgraue Bereich im Hintergrund zeigt die bisherigen Temperaturrekorde (an dieser Wetterstation) und die kleinen Pfeile weisen die neu aufgestellten Temperaturrekorde aus.
    </p>

    <h3 lang="de">Zu heiße Tage und Rekordtemperaturen über das ganze Jahr</h3>
    <h3 lang="en">Days too hot and temperature records all year round</h3>
    <p lang="de" class="text-muted text-small">
        Das Diagramm zeigt tägliche Höchst- und Tiefstwerte der Lufttemperatur an der Wetterstation {station ? station.name : '...'}
        zwischen {tfmtIntro($minDate)} und {tfmtIntro($maxDate)}. Jeder Tag wird durch einen Balken
        dargestellt; ein Kreis zeigt die Tagesmitteltemperatur.
        <span class="only-mobile">
            Tipp: drehe dein Telefon seitwärts um einen längeren Zeitraum anzusehen!
        </span>
    </p>
    <p lang="en" class="text-muted text-small">
        This chart shows daily highs and lows of air temperature at weather station {station ? station.name : '...'}
        between {tfmtIntro($minDate)} and {tfmtIntro($maxDate)}. Each day is represented by a bar,
        the daily mean temperature is displayed with a circle.
        <span class="only-mobile">Tipp: rotate your phone to see a longer time frame!</span>
    </p>
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

    <p>
        <b>
            {@html $msg.intro}
        </b>
    </p>
    <p>
        <img
            alt="reading instructions"
            style="max-width: 100%;margin-bottom: 20px"
            src="key-{$language}.svg" />
    </p>

    <p>
        Den globale Erwärmung hat freilich nicht in diesem Jahr angefangen. Was wir sehen ist nur die Fortsetzungen des Trendes der letzten Jahrzehnte. Um einen besseren Überblick auf einen längeren Zeitraum zu erhalten zeigt die folgende Grafik monatliche Temperaturanomalien (d.h. die Differenz der Monatsmitteltemperatur und dem Monatsmittel im Vergleichszeitraum) seit 1960. Die Rekordjahre 2019 und 2018 sind gut erkennbar,
        aber auch der Rekordwinter von 2006/07 fällt ins Auge.
    </p>

    {#if data}
        <h3>Zu warme Monate werden immer häufiger</h3>
        <p lang="de" class="text-muted text-small">
            Die Balken zeigen mittlere Temperaturabweichungen pro Monat gegenüber dem
            Monatsdurchschnitt im Vergleichszeitraum von {$contextMinYear} bis {$contextMaxYear - 1}).
            Rot sind "zu warme" Monate, blau sind "zu kalte" Monate.
        </p>
        <MonthlyAnomalies {data} />
    {:else}
        <i class="text-small text-muted">loading data...</i>
    {/if}

    <p>Komprimiert man die Daten weiter zu einem einzigem Mittelwer pro</p>

    {#if data}
    <h3 lang="de">Die globale Erwärmung zeigt sich auch an der Wetterstation {stationShort}</h3>
    <h3 lang="de">Global warming is visible at weather station {stationShort}, too</h3>
    <p lang="de" class="text-muted text-small">
            Die Balken zeigen mittlere Temperaturabweichungen (Temperaturanomalien) pro Jahr gegenüber dem
            Desamtdurchschnitt Vergleichszeitraum von <b>{$contextMinYear} bis {$contextMaxYear - 1}).</b>
        </p>
    <YearlyAnomalies {data} />
    {/if}

    <p>
        Alle Grafiken in diesem Artikel beziehen sich auf die Wetterstation {station ? station.name : '...'}
        in {station ? station.state : '...'}, aber da der Klimawandel sich nicht auf einzelne
        Regionen beschränkt lassen sich die selben Effekte auch in allen anderen deutschen
        Wetterstationen beobachten. Die folgende Liste enthält alle Stationen die mindestens
        tägliche Temperaturdaten zwischen 1980 und heute gesammelt haben.
    </p>
    <div class="shadow-sm p-3 mb-5 bg-white rounded" style="max-width: 30rem">
        <StationSelect bind:station />
    </div>
</main>
