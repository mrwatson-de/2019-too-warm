<script>
    import BaseChart from './BaseChart.svelte';
    import RecordTemperatures from './layers/RecordTemperatures.svelte';
    import NormalTemperature from './layers/NormalTemperature.svelte';
    import NormalTemperatureRange from './layers/NormalTemperatureRange.svelte';
    import CurrentTemperatures from './layers/CurrentTemperatures.svelte';
    import Switch from './components/Switch.svelte';
    import Checkbox from './components/Checkbox.svelte';
    import { timeFormat } from 'd3-time-format';

    $: layerRecord = true;
    $: layerNormal = true;
    $: layerNormalRange = true;

    $: layers = [
        ...(layerRecord ? [RecordTemperatures] : []),
        ...(layerNormalRange ? [NormalTemperatureRange] : []),
        CurrentTemperatures,
        ...(layerNormal ? [NormalTemperature] : [])
    ];

    import {
        msg,
        language,
        minDate,
        maxDate,
        contextMinYear,
        contextMaxYear,
        contextRange,
        normalRange,
        showAnomalies,
        smoothNormalRangeWidth
    } from './stores';

    export let data;

    $: globalMinYear = data[data.length - 1].date.getFullYear();
    $: globalMaxYear = data[0].date.getFullYear();

    let repeat;

    function changeDate(prop, offset, delay = 300) {
        let d = new Date($maxDate);
        d[`set${prop}`](d[`get${prop}`]() + offset);
        if (d >= new Date()) d = new Date();
        $maxDate = d;
        stop();
        repeat = setTimeout(() => changeDate(prop, offset, 0), delay);
    }

    const prevDay = () => changeDate('Date', -1);
    const nextDay = () => changeDate('Date', +1);
    const prevMonth = () => changeDate('Month', -1);
    const nextMonth = () => changeDate('Month', +1);
    const prevYear = () => changeDate('FullYear', -1);
    const nextYear = () => changeDate('FullYear', +1);

    const tfmt = timeFormat('%Y-%m-%d');

    $: maxDateStr = tfmt($maxDate);

    function stop() {
        clearInterval(repeat);
    }

    function switchLanguage() {
        $language = $language === 'de' ? 'en' : 'de';
    }

    function handleDateChange(event) {
        $maxDate = new Date(event.target.value);
    }
</script>

<style>
    input[type='number'] {
        width: 5em;
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        /* display: none; <- Crashes Chrome on hover */
        -webkit-appearance: none;
        margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
    }

    input[type=number] {
        -moz-appearance:textfield; /* Firefox */
    }
    .form-group .form-control {
        margin-bottom: 0;
    }
    .form-text {
        margin-top: 0;
    }
    .form-inline + .form-inline {
        margin-top: 10px;
    }
</style>

<!-- promise was fulfilled -->
<svelte:window on:mouseup={stop} />
<BaseChart {data} {layers} />


<div class="row justify-content-between">
    <div class="col-auto">
        {$msg.source}: <a href="https://www.dwd.de/{$language.toUpperCase()}" target="_blank">Deutscher Wetterdienst</a> / <a target="_blank" href="{$msg.cdcUrl}">Climate Data Center</a>
    </div>
    <div class="col-auto">
        <div class="form-row">
            <div class="col-auto">
                <div class="btn-group btn-group-toggle" data-toggle="buttons">
                    <button class="btn btn-outline-secondary" on:mousedown={prevYear}>◂◂◂</button>
                    <button class="btn btn-outline-secondary" on:mousedown={prevMonth}>◂◂</button>
                    <button class="btn btn-outline-secondary" on:mousedown={prevDay}>◂</button>
                </div>
            </div>
            <div class="col-auto form-group">
                <!-- <button class="btn btn-sm btn-outline-secondary" on:mousedown={prevYear}>&minus;</button> -->
                <input class="form-control" type="date" value="{maxDateStr}" required on:change="{handleDateChange}">

            </div>

            <div class="col-auto">
                <div class="btn-group btn-group-toggle" data-toggle="buttons">
                    <button class="btn btn-outline-secondary" on:mousedown={nextDay}>▸</button>
                    <button class="btn btn-outline-secondary" on:mousedown={nextMonth}>▸▸</button>
                    <button class="btn btn-outline-secondary" on:mousedown={nextYear}>▸▸▸</button>
                </div>
            </div>
            <div class="col-auto">
                <button class="btn btn-outline-secondary" on:mousedown={() => ($maxDate = new Date())}>{$msg.today}</button>
            </div>
        </div>
    </div>

</div>

<div class="row">

    <div class="col-md-3">
        <Checkbox label="Absolute Höchst- und Tiefstwerte" bind:value={layerRecord} />
        <p class="text-muted">Bezogen auf gesamten verfügbaren Zeitraum</p>
    </div>
    <div class="col-md-6">
        <div class="form-inline">
            <Checkbox label="Mittlere Höchst und Tiefstwerte" bind:value={layerNormalRange} />
            <Checkbox label="Mittlere Tagesmitteltemperatur" bind:value={layerNormal} />
            <Checkbox label="Anomalien hervorheben" bind:value={$showAnomalies} />
        </div>
        <p class="text-muted">Gemittelte Werte beziehen sich auf den Vergleichszeitraum <b>{$contextMinYear} - {$contextMaxYear - 1}</b>. Anomalien bezeichnen Tagestemperaturen ober- und unterhalb der gemittelten Tageshöchst- und Tiefstwerte</p>

        <div class="form-inline">
            <label class="my-1 mr-2">Vergleichszeitraum ändern:</label>
            <select bind:value={$contextRange} class="custom-select custom-select-sm">
                {#each [5,10,15,20,25,30,35,40,50,60,70,80] as yr}
                <option value="{yr}">{yr}</option>
                {/each}
            </select>
            <label class="my-1 mr-1 ml-1 text-muted">Jahre ab</label>
            <input
                    type="number"
                    class="form-control form-control-sm"
                    min={globalMinYear}
                    max={globalMaxYear - $contextRange}
                    bind:value={$contextMinYear} />
        </div>

        <div class="form-inline">
            <label class="my-1 mr-2">Normalbereich:</label>
            <select bind:value={$normalRange} class="custom-select custom-select-sm">
                <option value="{50}">Median (Tiefst- u. Höchstwert)</option>
                <option value="{35}">35pct. Tiefst - 65pct Höchst</option>
                <option value="{25}">25pct. Tiefst - 75pct Höchst</option>
                <option value="{100}">keiner</option>
            </select>
        </div>

        <div class="form-inline">
            <label class="my-1 mr-2"><small>Glättung: &plusmn;</small></label>
            <select bind:value={$smoothNormalRangeWidth} class="custom-select custom-select-sm">
                {#each [0,1,2,3,4,5,7,15] as dy}
                <option value="{dy}">{dy}</option>
                {/each}
            </select>
            <label class="my-1 mr-1 ml-1 text-muted"><small>Tage</small></label>
        </div>
    </div>

</div>
