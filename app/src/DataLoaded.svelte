<script>
    import BaseChart from './BaseChart.svelte';
    import RecordTemperatures from './layers/RecordTemperatures.svelte';
    import NormalTemperature from './layers/NormalTemperature.svelte';
    import NormalTemperatureRange from './layers/NormalTemperatureRange.svelte';
    import CurrentTemperatures from './layers/CurrentTemperatures.svelte';
    import Switch from './components/Switch.svelte';
    import Checkbox from './components/Checkbox.svelte';

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
        smoothNormalRangeWidth,
        labelRecordTemperatures
    } from './stores';

    export let data;
    export let station;

    $: globalMinYear = data[data.length - 1].date.getFullYear();
    $: globalMaxYear = data[0].date.getFullYear();

    function switchLanguage() {
        $language = $language === 'de' ? 'en' : 'de';
    }
</script>

<style>
    input[type='number'] {
        width: 5em;
    }
    s .form-group .form-control {
        margin-bottom: 0;
    }
    .form-text {
        margin-top: 0;
    }
    .form-inline + .form-inline {
        margin-top: 10px;
    }
    .btn i.im {
        font-size: 10px;
        margin: 0 -3px;
    }
</style>

<!-- promise was fulfilled -->
<svelte:window on:mouseup={stop} />
<BaseChart {data} {layers} />

<!-- <div class="row justify-content-between">
    <div class="col-auto mb-4">
        <span class="mr-4">
        {$msg.source}:
        <a href="https://www.dwd.de/{$language.toUpperCase()}" target="_blank">
            Deutscher Wetterdienst
        </a>
        /
        <a target="_blank" href={$msg.cdcUrl}>Climate Data Center</a>
        </span>
            {$msg.visBy}:
            <a href="https://vis4.net">Gregor Aisch</a>
    </div>
    <div class="col-auto">

    </div>

</div> -->

<!-- <div class="row">

    <div class="col-md-6 col-lg-4 col-xl-4">



    </div>
    <div class="col-md-6 col-lg-8 col-xl-8">
        <p><b>{@html $msg.customize}</b></p>
        <div class="row">
            <div class="col-xl-5">
                <Checkbox label={$msg.absRecords} bind:value={layerRecord} />
                <p class="text-muted">{$msg.overFullPeriod}</p>
                <Checkbox label={$msg.showAnomalies} bind:value={$showAnomalies} />
                <p class="text-muted">{$msg.anomaliesNote}</p>
                <Checkbox label={$msg.showRecords} bind:value={$labelRecordTemperatures} />
                <p class="text-muted">{$msg.recordsNote}</p>
            </div>
            <div class="col-xl">
                <div class="form-inline">
                    <Checkbox label={$msg.avgHighLow} bind:value={layerNormalRange} />
                    <p class="text-muted">
                    {$msg.avgHighLowInfo}
                    </p>
                    <Checkbox label={$msg.avgMedian} bind:value={layerNormal} />

                </div>
                <p class="text-muted">
                    {$msg.overPeriod}
                    <b>{$contextMinYear} - {$contextMaxYear - 1}</b>
                    .
                </p>

                <div class="form-inline">
                    <label class="text-muted my-1 mr-2">{$msg.changePeriod}</label>
                    <select bind:value={$contextRange} class="custom-select custom-select-sm">
                        {#each [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80] as yr}
                            <option value={yr}>{yr}</option>
                        {/each}
                    </select>
                    <label class="my-1 mr-1 ml-1 text-muted">{$msg.periodYearsFrom}</label>
                    <input
                        type="number"
                        class="form-control form-control-sm"
                        min={globalMinYear}
                        max={globalMaxYear - $contextRange}
                        bind:value={$contextMinYear} />
                </div>

                <div class="form-inline">
                    <label class="my-1 mr-2 text-muted">{$msg.smooth} &plusmn;</label>
                    <select
                        bind:value={$smoothNormalRangeWidth}
                        class="custom-select custom-select-sm">
                        {#each [0, 1, 2, 3, 4, 5, 7, 15] as dy}
                            <option value={dy}>{dy}</option>
                        {/each}
                    </select>
                    <label class="my-1 mr-1 ml-1 text-muted">
                        {$smoothNormalRangeWidth === 1 ? $msg.day : $msg.days}
                    </label>
                </div>

                <div class="form-inline">
                    <label class="my-1 mr-2 text-muted">Normalbereich:</label>
                    <select bind:value={$normalRange} class="custom-select custom-select-sm">
                        <option value={50}>Median (Tiefst- u. Höchstwert)</option>
                        <option value={35}>35pct. Tiefst - 65pct Höchst</option>
                        <option value={25}>25pct. Tiefst - 75pct Höchst</option>
                        <option value={100}>keiner</option>
                    </select>
                </div>
            </div>
        </div>

    </div>

</div>
 -->
