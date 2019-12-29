<script>
    import { scaleTime, scaleLinear } from 'd3-scale';
    import { timeMonth, timeDay, timeDays } from 'd3-time';
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
    let tMin = -29;
    let tMax = 45;
    export let layers = [];

    $: dataClean = data.filter(d => d.tMin > -999 && d.tMax > -999);

    $: dataSmooth =
        $smoothNormalRangeWidth > 0
            ? dataClean.map((d, i) => {
                  return {
                      date: d.date,
                      dateRaw: d.dateRaw,
                      tMin: mean(
                          dataClean
                              .slice(
                                  Math.max(0, i - $smoothNormalRangeWidth),
                                  i + $smoothNormalRangeWidth + 1
                              )
                              .map(d => d.tMin)
                      ),
                      tAvg: mean(
                          dataClean
                              .slice(
                                  Math.max(0, i - $smoothNormalRangeWidth),
                                  i + $smoothNormalRangeWidth + 1
                              )
                              .map(d => d.tAvg)
                      ),
                      tMax: mean(
                          dataClean
                              .slice(
                                  Math.max(0, i - $smoothNormalRangeWidth),
                                  i + $smoothNormalRangeWidth + 1
                              )
                              .map(d => d.tMax)
                      )
                  };
              })
            : dataClean;

    $: padding = { top: 20, right: 5, bottom: 30, left: innerWidth < 400 ? 30 : 40 };

    $: xScale = scaleTime()
        .domain([$minDate, $maxDate])
        .range([padding.left, $chartWidth - padding.right]);

    $: xTicks = xScale.ticks(timeMonth);

    $: yScale = scaleLinear()
        .domain([tMin, tMax])
        .range([height - padding.bottom, padding.top]);

    $: yTicks = yScale.ticks(6);

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
        const cache = group(dataClean, d => d.dateRaw.substr(4));
        const cacheSmooth = group(dataSmooth, d => d.dateRaw.substr(4));

        tMin = 99;
        tMax = -99;

        grouped = timeDays($minDate, timeDay.offset($maxDate, 1)).map(day => {
            const dayFmt = fmt(day);
            const groupedAll = cache.get(dayFmt).filter(d => d.date.getTime() < $minDate.getTime());
            const tMinAbs = min(groupedAll, d => d.tMin);
            const tMaxAbs = max(groupedAll, d => d.tMax);
            const grouped = cacheSmooth
                .get(dayFmt)
                .filter(
                    d =>
                        d.date.getFullYear() >= $contextMinYear &&
                        d.date.getFullYear() < $contextMaxYear
                );
            const tMinSorted = grouped.map(d => d.tMin).sort(ascending);
            const tAvgSorted = grouped.map(d => d.tAvg).sort(ascending);
            const tMaxSorted = grouped.map(d => d.tMax).sort(ascending);

            const dateRaw = day.getFullYear() + dayFmt;
            const cur = data.find(d => d.dateRaw === dateRaw);
            tMin = Math.min(tMin, tMinAbs - 5);
            tMax = Math.max(tMax, tMaxAbs + 5);
            if (cur) {
                tMin = Math.min(tMin, cur.tMin - 5);
                tMax = Math.max(tMax, cur.tMax + 5);
            }
            const tAvg = quantileSorted(tAvgSorted, 0.5);
            return {
                date: day,
                dateRaw,
                grouped,
                tMin: $normalRange < 100 ? quantileSorted(tMinSorted, $normalRange / 100) : tAvg,
                tAvg,
                tMax:
                    $normalRange < 100 ? quantileSorted(tMaxSorted, 1 - $normalRange / 100) : tAvg,
                tMinAbs,
                tMaxAbs,
                tMinSorted,
                tAvgSorted,
                tMaxSorted
            };
        });

        while (tMax - tMin < 40) {
            tMax++;
            tMin--;
        }
    }
</script>

<style>
    .chart,
    h2,
    p {
        width: 100%;
        margin-left: auto;
        margin-right: auto;
    }

    svg {
        position: relative;
        width: 100%;
        overflow: hidden;
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

    line.zero {
        shape-rendering: crispEdges;
        stroke: black;
        opacity: 0.25;
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
        <g>
            <!-- y axis -->
            <g class="axis y-axis">
                {#each yTicks as tick}
                    <g class="tick tick-{tick}" transform="translate(0, {yScale(tick)})">
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
                            <g transform="translate({xScale(midMonth(tick)) - xScale(tick)},-50)">
                                <text y="0">
                                    {innerWidth > 400 ? format(tick, i) : formatMobile(tick, i)}
                                </text>
                                {#if (!i && tick.getMonth() < 11) || !tick.getMonth()}
                                    <text class="year" y="20">{tick.getFullYear()}</text>
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
        </g>
    </svg>
</div>
