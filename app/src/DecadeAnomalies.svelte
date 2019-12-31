<script>
    import { scaleTime, scaleLinear } from 'd3-scale';
    import { timeMonth, timeDay, timeDays } from 'd3-time';
    import { timeFormat } from 'd3-time-format';
    import { median, mean, extent, quantileSorted, group, ascending, max, min } from 'd3-array';
    import {
        msg,
        contextMinYear,
        contextMaxYear,
        normalRange,
        contextRange,
        smoothNormalRangeWidth
    } from './stores';

    export let data = [];

    export let day = new Date(2019, 11, 18);
    const fmt = timeFormat('%Y-%m');
    $: dayFmt = fmt(day);

    $: minYear = Math.max(1950, dataClean[0].year);
    $: maxYear = dataClean[dataClean.length - 1].year;

    $: dataClean = data
        .filter(d => d.tMin > -999 && d.tMax > -999)
        .map(d => {
            d.year = d.date.getFullYear();
            d.decade = Math.floor(d.year/10)*10;
            d.yearMonth = fmt(d.date);
            return d;
        })
        .filter(d => d.year >= 1960 && d.year < 2020);

    $: byMonth = Array.from(group(dataClean, d => d.yearMonth))
        .map(([key, values]) => ({
                year: values[0].year,
                decade: values[0].decade,
                month: values[0].date.getMonth(),
                date: new Date(values[0].year, values[0].date.getMonth(), 1),
                tAvg: mean(values, d => d.tAvg)
        }));

    $: byMonthBase = byMonth
        .filter(d => d.year >= $contextMinYear && d.year < $contextMaxYear);

    $: monthlyNormalRange = [0,1,2,3,4,5,6,7,8,9,10,11].map(month => {
        const monthValues = byMonthBase.filter(d => d.month === month);
        return {
            tAvg: mean(monthValues, d => d.tAvg),
        };
    });

    $: monthlyNormalAvg = [0,1,2,3,4,5,6,7,8,9,10,11].map(month => {
        const monthValues = byMonthBase.filter(d => d.month === month);
        return mean(monthValues, d => d.tAvg);
    });

    $: byDecade = Array.from(group(byMonth, d => d.decade).values())
        .map(d => ({
            decade: d[0].decade,
            xScale: scaleTime().domain([new Date(d[0].decade, 0,1), new Date(d[0].decade+10, 0,0)]).range([0, width]),
            values: d
        }));


    let dtMin = 99;
    let dtMax = -99;

    $: {
        dtMin = 99;
        dtMax = -99;
        byMonth.forEach(d => {
            const dt = d.tAvg - monthlyNormalAvg[d.month];
            dtMin = Math.min(dtMin, dt);
            dtMax = Math.max(dtMax, dt);
        });
    }

    let localContextMin = $contextMinYear;
    $: localContextMax = localContextMin + $contextRange;

    $: {
        localContextMin = $contextMinYear;
    }

    $: contextYears = dataClean.filter(d => d.year >= localContextMin && d.year < localContextMax);
    $: normalLow = mean(contextYears, d => d.tMin);
    $: normalHigh = mean(contextYears, d => d.tMax);

    $: padding = { top: 40, right: 180, bottom: 30, left: width < 500 ? 40 : 60 };

    $: decadeH = width < 500 ? 70 : 90;

    $: yScale = scaleLinear()
        .domain([dtMin, dtMax])
        .range([decadeH-10, 0]);

    $: yTicks = yScale.ticks(6);

    const height = 300;
    let width = 400;

    const format = (d, i) => i ? formatMobile(d) : d.getFullYear();
    const formatMobile = (d, i) => `'${String(d.getFullYear()).substr(2)}`;

</script>

<style>
    svg {
        position: relative;
        width: 100%;
        overflow: hidden;
    }

    .tick line {
        stroke: #ccc;
        shape-rendering: crispEdges;
    }

    .tick text {
        fill: #666;
        font-weight: 500;
        font-size: 14px;
        text-anchor: start;
    }

    .x-axis .tick text {
        dominant-baseline: text-after-edge;
    }

    line.zero {
        stroke-width: 1;
        stroke: black;
        opacity: 0.5;
    }

    @media (max-width: 400px) {
        .tick text {
            font-size: 13px;
        }
    }

    .chart {
        max-width: 600px;
        margin-bottom: 20px;
    }

    .month line {
        stroke: #bbb;
        stroke-width: 3;
        shape-rendering: crispEdges;
    }


    @media (max-width: 500px) {
        .month line {
            stroke-width: 3;
        }
    }
    line.hotter {
        stroke: var(--hotter-color);
    }
    line.colder {
        stroke: var(--colder-color);
    }
</style>

<div class="chart" bind:clientWidth={width}>
    <svg height="{byDecade.length*decadeH+40}">
        {#each byDecade as decade,d}
        <g class="decade" transform="translate(0, {d*decadeH})">
            <!-- x axis -->
            <g class="axis x-axis" transform="translate(0,{decadeH-5})">
                {#each decade.xScale.ticks(8) as tick,i}
                    <g class="tick" transform="translate({decade.xScale(tick)}, 0)">
                        <text y="0">{(true ? formatMobile : format)(tick, i)}</text>
                    </g>
                {/each}
            </g>
            <!-- y axis -->
            <line class="zero" transform="translate(0,{yScale(0)})" x2="100%"/>
            <g class="values">
                {#each decade.values as d}
                <g class="month" transform="translate({decade.xScale(d.date)},0)">

                    {#if d.tAvg < monthlyNormalAvg[d.month]}
                        <line
                            class="colder"
                            y1={yScale(0)}
                            y2={yScale(d.tAvg - monthlyNormalAvg[d.month])} />
                    {/if}
                    {#if d.tAvg > monthlyNormalAvg[d.month]}
                        <line
                            class="hotter"
                            y1={yScale(0)}
                            y2={yScale(d.tAvg -monthlyNormalAvg[d.month])} />
                    {/if}


                </g>
                {/each}
            </g>
        </g>
        {/each}
    </svg>
</div>
