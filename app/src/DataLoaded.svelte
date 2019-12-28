<script>
    import BaseChart from './BaseChart.svelte';
    import RecordTemperatures from './layers/RecordTemperatures.svelte';
    import NormalTemperature from './layers/NormalTemperature.svelte';
    import NormalTemperatureRange from './layers/NormalTemperatureRange.svelte';
    import CurrentTemperatures from './layers/CurrentTemperatures.svelte';

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

    function stop() {
        clearInterval(repeat);
    }

    function switchLanguage() {
        $language = $language === 'de' ? 'en' : 'de';
    }
</script>

<style>
    input[type='number'] {
        width: 5em;
    }
</style>

<!-- promise was fulfilled -->
<BaseChart {data} {layers} />
<svelte:window on:mouseup={stop} />

<p>
    {$msg.year}:
    <button on:mousedown={prevYear}>&minus;</button>
    <button on:mousedown={nextYear}>&plus;</button>
    {$msg.month}:
    <button on:mousedown={prevMonth}>&minus;</button>
    <button on:mousedown={nextMonth}>&plus;</button>
    {$msg.day}:
    <button on:mousedown={prevDay}>&minus;</button>
    <button on:mousedown={nextDay}>&plus;</button>

    <button on:mousedown={() => ($maxDate = new Date())}>{$msg.today}</button>
</p>

<button on:click={switchLanguage}>{$language === 'de' ? 'en' : 'de'}</button>

<div>
    <label>
        <input type="checkbox" bind:checked={layerRecord} />
        Absolute Höchst- und Tiefstwerte
    </label>

    <label>
        <input type="checkbox" bind:checked={layerNormalRange} />
        Mittlere Höchst und Tiefstwerte
    </label>
    <label>
        <input type="checkbox" bind:checked={layerNormal} />
        Mittlere Tagesmitteltemperatur
    </label>
    <label>
        <input type="checkbox" bind:checked={$showAnomalies} />
        Anomalien hervorheben
    </label>

    {#if layerNormal || layerNormalRange}
        <p>
            <b>Vergleichszeitraum:</b>
            <input type="number" min="5" max="40" bind:value={$contextRange} />
            Jahre ab
            <input
                type="number"
                min={globalMinYear}
                max={globalMaxYear - $contextRange}
                bind:value={$contextMinYear} />
            ({$contextMinYear} - {$contextMaxYear - 1})
        </p>
        <p>
            <b>Normalbereich:</b>
            <input type="range" min="25" max="50" step="1" bind:value={$normalRange} />
            bis {100 - $normalRange} Prozentil
        </p>
    {/if}
    Smooth &plusmn; {$smoothNormalRangeWidth} day{$smoothNormalRangeWidth !== 1 ? 's' : ''}
    <input type="range" min="0" max="13" bind:value={$smoothNormalRangeWidth} />

</div>
