<script>
    import { scaleTime, scaleLinear } from 'd3-scale';
    import { timeMonth, timeDays } from 'd3-time';
    import { timeFormat } from 'd3-time-format';
    import { mean, quantileSorted, group, ascending, max, min } from 'd3-array';
    import {
        msg,
        innerWidth,
        chartWidth,
        minDate,
        maxDate,
        contextMinYear,
        contextMaxYear,
        normalRange,
        smoothNormalRangeWidth
    } from './stores';

    export let data = [];
    export let tMin = -29;
    export let tMax = 45;
    export let layers = [];

    $: dataSmooth =
        $smoothNormalRangeWidth > 0
            ? data.map((d, i) => {
                  return {
                      date: d.date,
                      dateRaw: d.dateRaw,
                      tMin: mean(
                          data
                              .slice(
                                  Math.max(0, i - $smoothNormalRangeWidth),
                                  i + $smoothNormalRangeWidth + 1
                              )
                              .map(d => d.tMin)
                      ),
                      tAvg: mean(
                          data
                              .slice(
                                  Math.max(0, i - $smoothNormalRangeWidth),
                                  i + $smoothNormalRangeWidth + 1
                              )
                              .map(d => d.tAvg)
                      ),
                      tMax: mean(
                          data
                              .slice(
                                  Math.max(0, i - $smoothNormalRangeWidth),
                                  i + $smoothNormalRangeWidth + 1
                              )
                              .map(d => d.tMax)
                      )
                  };
              })
            : data;

    $: padding = { top: 20, right: 5, bottom: 20, left: innerWidth < 400 ? 30 : 40 };

    $: xScale = scaleTime()
        .domain([$minDate, $maxDate])
        .range([padding.left, $chartWidth - padding.right]);

    $: xTicks = xScale.ticks(timeMonth);

    $: yScale = scaleLinear()
        .domain([tMin, tMax])
        .range([height - padding.bottom, padding.top]);

    $: yTicks = yScale.ticks(8);

    $: height = Math.max(
        450,
        $chartWidth * ($chartWidth > 800 ? 0.35 : $chartWidth > 500 ? 0.7 : 1)
    );

    $: format = (d, i) => $msg.monthLong[d.getMonth()];
    $: formatMobile = (d, i) => $msg.monthShort[d.getMonth()];

    const midMonth = d => {
        return new Date(
            d.getTime() + (new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()) - d) / 2
        );
    };

    const fmt = timeFormat('-%m-%d');

    let grouped;

    $: {
        const cache = group(dataSmooth, d => d.dateRaw.substr(4));

        grouped = timeDays($minDate, $maxDate).map(day => {
            const dayFmt = fmt(day);
            const groupedAll = cache.get(dayFmt);
            const grouped = groupedAll.filter(
                d =>
                    d.date.getFullYear() >= $contextMinYear &&
                    d.date.getFullYear() < $contextMaxYear
            );
            const tMinSorted = grouped.map(d => d.tMin).sort(ascending);
            const tAvgSorted = grouped.map(d => d.tAvg).sort(ascending);
            const tMaxSorted = grouped.map(d => d.tMax).sort(ascending);
            return {
                date: day,
                dateRaw: day.getFullYear() + dayFmt,
                grouped,
                tMin: quantileSorted(tMinSorted, $normalRange / 100),
                tMax: quantileSorted(tMaxSorted, 1 - $normalRange / 100),
                tMinAbs: min(groupedAll, d => d.tMin),
                tMaxAbs: max(groupedAll, d => d.tMax),
                tMinSorted,
                tAvgSorted,
                tMaxSorted
            };
        });
    }
</script>

<style>
    .chart,
    h2,
    p {
        width: 100%;
        max-width: 1600px;
        margin-left: auto;
        margin-right: auto;
    }

    svg {
        position: relative;
        width: 100%;
        overflow: visible;
    }

    .tick {
        font-size: 0.725em;
        font-weight: 200;
    }

    .tick line {
        stroke: #ccc;
        shape-rendering: crispEdges;
    }

    .tick text {
        fill: #666;
        font-weight: 500;
        font-size: 15px;
        text-anchor: start;
    }

    .x-axis .tick text {
        text-anchor: middle;
        dominant-baseline: text-after-edge;
    }

    .x-axis .tick text.year {
        font-size: 24px;
        font-weight: 300;
    }
    line.zero {
        shape-rendering: crispEdges;
        stroke: black;
        opacity: 0.5;
    }

    @media (max-width: 400px) {
        .tick text {
            font-size: 13px;
        }
    }
</style>

<svelte:window bind:innerWidth={$innerWidth} />

<div class="chart" bind:clientWidth={$chartWidth}>
    <svg {height}>
        <!-- y axis -->
        <g class="axis y-axis" transform="translate(0, {padding.top})">
            {#each yTicks as tick}
                <g
                    class="tick tick-{tick}"
                    transform="translate(0, {yScale(tick) - padding.bottom})">
                    <line x2="100%" />
                    <text y="-4">
                        {@html tick < 0 ? '&minus;' : ''}
                        {Math.abs(tick)}°C
                    </text>
                </g>
            {/each}
        </g>

        <!-- x axis -->
        <g class="axis x-axis">
            {#each xTicks as tick, i}
                <g class="tick tick-{tick}" transform="translate({xScale(tick)},{height})">
                    <line y1="-{height}" y2="-{padding.bottom}" x1="0" x2="0" />
                    {#if midMonth(tick) < $maxDate}
                        <g transform="translate({xScale(midMonth(tick)) - xScale(tick)},0)">
                            <text y="0">
                                {innerWidth > 400 ? format(tick, i) : formatMobile(tick, i)}
                            </text>
                            {#if (!i && tick.getMonth() < 10) || !tick.getMonth()}
                                <text class="year" y="-20">{tick.getFullYear()}</text>
                            {/if}
                        </g>
                    {/if}
                </g>
            {/each}
        </g>

        {#each layers as layer}
            <svelte:component this={layer} {data} {grouped} {xScale} {yScale} />
        {/each}

        <line class="zero" transform="translate(0,{yScale(0)})" x2="100%" />
    </svg>
</div>
