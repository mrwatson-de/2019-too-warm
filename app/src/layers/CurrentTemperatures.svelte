<script>
    export let xScale;
    export let yScale;
    export let data;
    export let grouped;
    import { timeFormat } from 'd3-time-format';

    import {
        msg,
        language,
        minDate,
        maxDate,
        showAnomalies,
        labelRecordTemperatures
    } from '../stores';
    import { clientPoint } from 'd3-selection';
    import Steps from './Steps.svelte';

    $: fmt = date =>
        $language === 'de'
            ? `${date.getDate()}. ${$msg.monthShort[date.getMonth()]}`
            : `${$msg.monthShort[date.getMonth()]} ${date.getDate()}`;

    const compFmt = timeFormat('%Y-%m-%d');

    let layer;
    let highlight;

    $: filteredData = data.filter(
        d => d.dateRaw >= compFmt($minDate) && d.dateRaw <= compFmt($maxDate)
    );

    $: currentTempData = filteredData
        .map(d => {
            if ($showAnomalies) {
                const m = grouped.find(e => e.dateRaw === d.dateRaw);
                // console.log(m);
                if (m) {
                    d.trendMin = m.tMin;
                    d.trendMax = m.tMax;
                    d.tMinAbs = m.tMinAbs;
                    d.tMaxAbs = m.tMaxAbs;
                    if (d.tMax > d.tMaxAbs || d.tMin < d.tMinAbs) {
                        d.labelMaxRecord = true;
                        d.labelMinRecord = true;
                    }
                }
            }
            return d;
        })
        .map((d, i) => {
            if ($labelRecordTemperatures) {
                if (d.tMax > d.tMaxAbs || d.tMin < d.tMinAbs) {
                    // check if we're a local max
                    filteredData.slice(Math.max(0, i - 7), i + 8).forEach(e => {
                        if (d != e && e.tMax > e.tMaxAbs && e.labelMaxRecord) {
                            // e is also a record
                            if (e.tMax >= d.tMax) {
                                d.labelMaxRecord = false;
                            }
                        }
                        if (d != e && e.tMin < e.tMinAbs && e.labelMinRecord) {
                            // e is also a record
                            if (e.tMin <= d.tMin) {
                                d.labelMinRecord = false;
                            }
                        }
                    });
                }
            }
            return d;
        });

    function handleMouseMove(event) {
        const [x, y] = clientPoint(layer, event);
        const date = xScale.invert(x);
        const temp = yScale.invert(y);
        highlight = temp >= yScale.domain()[0] && temp <= yScale.domain()[1] ? date : null;
    }

    function sameYear(date1, date2) {
        return date1.getFullYear() === date2.getFullYear();
    }
    function sameMonth(date1, date2) {
        return sameYear(date1, date2) && date1.getMonth() === date2.getMonth();
    }
    function sameDay(date1, date2) {
        return sameMonth(date1, date2) && date1.getDate() === date2.getDate();
    }
</script>

<style>
    circle {
        fill: var(--def-color);
    }
    line {
        stroke: var(--def-color);
        stroke-width: 2;
        shape-rendering: crispEdges;
    }
    circle.hotter,
    .record.high path,
    .record.high text {
        fill: var(--hotter-color);
    }
    circle.colder,
    .record.low path,
    .record.low text {
        fill: var(--colder-color);
    }
    circle.normal {
        fill: var(--normal-color);
    }
    line.hotter {
        stroke: var(--hotter-color);
    }
    line.colder {
        stroke: var(--colder-color);
    }
    line.normal {
        stroke: var(--normal-color);
    }
    g.highlight g.day {
        opacity: 0.15;
    }
    g.highlight g.day.sameMonth {
        opacity: 0.3;
    }
    g.record text {
        font-weight: 400;
        font-size: 13px;
        dominant-baseline: central;
    }
    g.highlight g.day.highlight {
        opacity: 1;
    }
    g.highlight g.day.highlight line {
        stroke: black;
    }
    g.highlight g.day.highlight circle {
        fill: black;
    }
    .skinny line {
        stroke-width: 1;
    }
    .skinny g.day.highlight line {
        stroke-width: 2;
    }

    text {
        pointer-events: none;
        text-anchor: middle;
        font-size: 14px;
        font-weight: 500;
    }
    text.date {
        opacity: 0.6;
    }
    text.min {
        dominant-baseline: text-before-edge;
    }
    text.avg {
        text-anchor: start;
        dominant-baseline: central;
    }
</style>

<svelte:window
    on:mousemove={handleMouseMove}
    on:touchmove={handleMouseMove}
    on:mouseout={() => (highlight = null)} />

<g bind:this={layer} class:highlight>
    {#each currentTempData as d}
        <g
            class="day"
            class:highlight={highlight && sameDay(highlight, d.date)}
            class:sameMonth={highlight && sameMonth(highlight, d.date)}
            transform="translate({xScale(d.date)},0)">
            {#if $showAnomalies}
                {#if d.tMin < d.trendMin}
                    <line
                        class="colder"
                        y1={yScale(d.tMin)}
                        y2={yScale(Math.min(d.tMax, d.trendMin))} />
                {/if}
                {#if d.tMax > d.trendMax}
                    <line
                        class="hotter"
                        y1={yScale(d.tMax)}
                        y2={yScale(Math.max(d.tMin, d.trendMax))} />
                {/if}
                {#if d.tMin < d.trendMax && d.tMax > d.trendMin}
                    <line
                        class="normal"
                        y1={yScale(Math.max(d.trendMin, d.tMin))}
                        y2={yScale(Math.min(d.trendMax, d.tMax))} />
                {/if}
            {:else}
                <line y1={yScale(d.tMin)} y2={yScale(d.tMax)} />
            {/if}

            <circle
                class:hotter={$showAnomalies && d.tAvg > d.trendMax}
                class:colder={$showAnomalies && d.tAvg < d.trendMin}
                class:normal={$showAnomalies && d.tAvg >= d.trendMin && d.tAvg <= d.trendMax}
                r={highlight && sameDay(highlight, d.date) ? 3 : 2}
                transform="translate(0,{yScale(d.tAvg)})" />
            {#if highlight && sameDay(highlight, d.date)}
                <text class="date" y={yScale(d.tMax) - 25}>{fmt(d.date)}</text>
                <text y={yScale(d.tMax) - 5}>{d.tMax}°C</text>
                <text class="min" y={yScale(d.tMin) + 5}>{d.tMin}°C</text>
                {#if yScale(d.tMin) - yScale(d.tMax) > 30}
                    <text class="avg" x="5" y={yScale(d.tAvg)}>{d.tAvg}°C</text>
                {/if}
            {/if}

            {#if $labelRecordTemperatures && !highlight}
                {#if d.tMax > d.tMaxAbs}
                    <g class="record high" transform="translate(0, {yScale(d.tMax) - 7})">
                        {#if d.labelMaxRecord}
                            <text y="-15">{d.tMax}</text>
                        {/if}
                        <path d="M0,0 L-4,-4 L 4,-4 Z" />
                    </g>
                {/if}
                {#if d.tMin < d.tMinAbs}
                    <g class="record low" transform="translate(0, {yScale(d.tMin) + 7})">
                        {#if d.labelMinRecord}
                            <text y="15">{d.tMin}</text>
                        {/if}
                        <path d="M0,0 L-4,4 L 4,4 Z" />
                    </g>
                {/if}
            {/if}
        </g>
    {/each}
</g>
